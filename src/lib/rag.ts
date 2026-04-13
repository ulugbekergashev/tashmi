/**
 * RAG retrieval over Dexie chunks.
 * Cosine similarity + MMR (Maximal Marginal Relevance) for diversification.
 */
import { db, ChunkRow, Citation } from './db';
import { embed, embedOne, cosine } from '../services/embed';

export interface RetrievedChunk {
  chunk: ChunkRow;
  material_title: string;
  page?: number;
  score: number;
}

/** Backfill embeddings for any chunk that doesn't have them yet. */
export async function backfillEmbeddings(materialId?: number) {
  const where = materialId
    ? db.chunks.where('material_id').equals(materialId)
    : db.chunks.toCollection();
  const chunks = await where.toArray();
  const missing = chunks.filter(c => !c.embedding || c.embedding.length === 0);
  if (missing.length === 0) return;
  const vecs = await embed(missing.map(m => m.text));
  for (let i = 0; i < missing.length; i++) {
    await db.chunks.update(missing[i].id!, { embedding: vecs[i] });
  }
}

/** Top-k retrieval with MMR diversification. */
export async function retrieve(query: string, k = 6, lambda = 0.6): Promise<RetrievedChunk[]> {
  const allChunks = await db.chunks.toArray();
  if (allChunks.length === 0) return [];

  // Ensure all have embeddings
  const need = allChunks.filter(c => !c.embedding || c.embedding.length === 0);
  if (need.length > 0) {
    const vecs = await embed(need.map(c => c.text));
    for (let i = 0; i < need.length; i++) {
      need[i].embedding = vecs[i];
      await db.chunks.update(need[i].id!, { embedding: vecs[i] });
    }
  }

  const qvec = await embedOne(query);
  const scored = allChunks.map(c => ({
    chunk: c,
    score: cosine(qvec, c.embedding || []),
  }));
  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, Math.min(scored.length, k * 4));

  // MMR
  const selected: typeof candidates = [];
  while (selected.length < k && candidates.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const sim = c.score;
      let div = 0;
      for (const s of selected) {
        div = Math.max(div, cosine(c.chunk.embedding || [], s.chunk.embedding || []));
      }
      const mmr = lambda * sim - (1 - lambda) * div;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIdx = i;
      }
    }
    selected.push(candidates[bestIdx]);
    candidates.splice(bestIdx, 1);
  }

  // Hydrate material titles
  const matIds = Array.from(new Set(selected.map(s => s.chunk.material_id)));
  const mats = await db.materials.bulkGet(matIds);
  const titleById = new Map<number, string>();
  mats.forEach(m => m && titleById.set(m.id!, m.title));

  return selected.map(s => ({
    chunk: s.chunk,
    score: s.score,
    page: s.chunk.page,
    material_title: titleById.get(s.chunk.material_id) || 'Unknown',
  }));
}

/** Format retrieved chunks as a context block for an LLM prompt. */
export function formatContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => `[#${i + 1}] (${c.material_title}${c.page ? `, p.${c.page}` : ''})\n${c.chunk.text}`)
    .join('\n\n---\n\n');
}

/** Build inline citations array from chunks (so the LLM can reference [#N]). */
export function chunksToCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map(c => ({
    chunk_id: c.chunk.id,
    source_title: c.material_title,
    page: c.page,
    quote: c.chunk.text.slice(0, 220),
  }));
}
