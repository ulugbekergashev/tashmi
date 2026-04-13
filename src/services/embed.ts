/**
 * Embedding service.
 * Primary: Google text-embedding-004 via @google/genai (if VITE_GOOGLE_API_KEY set).
 * Fallback: client-side hashed bag-of-words (768-dim) for cosine retrieval.
 *
 * Both produce 768-dim vectors so the rest of the pipeline is uniform.
 */

const DIM = 768;
const GOOGLE_KEY = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

/* ─────────────────────────── Hashed BoW fallback ─────────────────────────── */

const STOPWORDS = new Set([
  'va', 'bilan', 'ham', 'uchun', 'lekin', 'agar', 'qachon', 'qayer', 'kim', 'nima',
  'bu', "o'sha", 'shu', 'qanday', 'qaysi', 'a', 'an', 'the', 'and', 'or', 'but', 'if',
  'is', 'are', 'was', 'were', 'be', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function hashedBoW(text: string): number[] {
  const v = new Array(DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return v;
  // Unigrams + bigrams
  for (let i = 0; i < tokens.length; i++) {
    v[hashStr(tokens[i]) % DIM] += 1;
    if (i + 1 < tokens.length) v[hashStr(tokens[i] + ' ' + tokens[i + 1]) % DIM] += 0.5;
  }
  // L2 normalize
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map(x => x / norm);
}

/* ─────────────────────────── Google embeddings ─────────────────────────── */

async function googleEmbed(texts: string[]): Promise<number[][]> {
  // Use REST API directly to avoid pulling the SDK heavyweight
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${GOOGLE_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map(t => ({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: t.slice(0, 9000) }] },
        })),
      }),
    }
  );
  if (!resp.ok) throw new Error(`Google embed failed: ${resp.status}`);
  const data = await resp.json();
  return data.embeddings.map((e: any) => e.values as number[]);
}

/* ─────────────────────────── Public API ─────────────────────────── */

export async function embed(texts: string[]): Promise<number[][]> {
  if (GOOGLE_KEY) {
    try {
      // Batch in groups of 100
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += 100) {
        out.push(...(await googleEmbed(texts.slice(i, i + 100))));
      }
      return out;
    } catch (e) {
      console.warn('[embed] Google API failed, using hashed BoW fallback', e);
    }
  }
  return texts.map(hashedBoW);
}

export async function embedOne(text: string): Promise<number[]> {
  return (await embed([text]))[0];
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export const EMBED_DIM = DIM;
