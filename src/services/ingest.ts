/**
 * Material ingestion: PDF | DOCX | URL | text → chunks ready for embedding.
 * Uses dynamic imports for heavy parsers to keep main bundle small.
 */
import { db, MaterialRow, ChunkRow } from '../lib/db';

export interface IngestResult {
  materialId: number;
  chunkIds: number[];
  totalChars: number;
  fullText: string;
}

const CHUNK_SIZE = 800;     // approx tokens (×4 chars)
const CHUNK_OVERLAP = 100;

/** Split text into ~CHUNK_SIZE-token chunks at paragraph boundaries. */
export function chunkText(text: string, page?: number): { text: string; page?: number }[] {
  const chunks: { text: string; page?: number }[] = [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);

  let buf = '';
  const maxChars = CHUNK_SIZE * 4;
  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length > maxChars) {
      if (buf.length) chunks.push({ text: buf.trim(), page });
      // overlap: carry last sentence
      const tail = buf.slice(-CHUNK_OVERLAP * 4);
      buf = tail + '\n\n' + p;
    } else {
      buf = buf ? buf + '\n\n' + p : p;
    }
  }
  if (buf.trim().length > 30) chunks.push({ text: buf.trim(), page });
  return chunks;
}

export async function ingestText(
  title: string,
  text: string,
  type: 'text' | 'pdf' | 'docx' | 'url' = 'text',
  source_url?: string,
  filename?: string,
  pageMap?: { page: number; text: string }[]
): Promise<IngestResult> {
  const matId = await db.materials.add({
    title,
    type,
    source_url,
    filename,
    full_text: text,
    created_at: Date.now(),
  } as MaterialRow);

  // Chunk per page if pageMap provided, else from full text
  const allChunks: { text: string; page?: number }[] = [];
  if (pageMap && pageMap.length > 0) {
    for (const pm of pageMap) {
      allChunks.push(...chunkText(pm.text, pm.page));
    }
  } else {
    allChunks.push(...chunkText(text));
  }

  const chunkRows: ChunkRow[] = allChunks.map(c => ({
    material_id: matId as number,
    page: c.page,
    text: c.text,
    token_count: Math.ceil(c.text.length / 4),
  }));

  const chunkIds: number[] = [];
  for (const row of chunkRows) {
    chunkIds.push(await db.chunks.add(row) as number);
  }

  return { materialId: matId as number, chunkIds, totalChars: text.length, fullText: text };
}

export async function ingestPDF(file: File): Promise<IngestResult> {
  const pdfjs: any = await import('pdfjs-dist');
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pageMap: { page: number; text: string }[] = [];
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const pageText = tc.items.map((it: any) => it.str).join(' ');
    pageMap.push({ page: i, text: pageText });
    fullText += `\n\n[Page ${i}]\n${pageText}`;
  }
  return ingestText(file.name, fullText.trim(), 'pdf', undefined, file.name, pageMap);
}

export async function ingestDOCX(file: File): Promise<IngestResult> {
  const mammoth: any = await import('mammoth');
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return ingestText(file.name, value, 'docx', undefined, file.name);
}

export async function ingestURL(url: string): Promise<IngestResult> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`URL fetch failed: ${r.status}`);
  const html = await r.text();
  // Basic readability via DOMParser
  let cleanText = html;
  try {
    const { Readability } = await import('@mozilla/readability');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const article = new Readability(doc as any).parse();
    cleanText = article?.textContent || html.replace(/<[^>]+>/g, ' ');
  } catch {
    cleanText = html.replace(/<[^>]+>/g, ' ');
  }
  return ingestText(url, cleanText.replace(/\s+/g, ' ').trim(), 'url', url);
}

export async function ingestFile(file: File): Promise<IngestResult> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return ingestPDF(file);
  if (ext === 'docx' || ext === 'doc') return ingestDOCX(file);
  // Plain text fallback
  const text = await file.text();
  return ingestText(file.name, text, 'text', undefined, file.name);
}
