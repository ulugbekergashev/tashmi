/**
 * PubMed E-utilities + Wikipedia REST API.
 * No auth needed. Lightweight in-memory cache (resets on reload).
 */

export interface PubMedHit {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year?: string;
  abstract: string;
  url: string;
}

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const cache = new Map<string, PubMedHit[]>();

export async function searchPubMed(query: string, maxResults = 5): Promise<PubMedHit[]> {
  const key = query.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  // Step 1: esearch → ids
  const esearch = await fetch(
    `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&term=${encodeURIComponent(query)}`
  );
  if (!esearch.ok) throw new Error('PubMed esearch failed');
  const sj = await esearch.json();
  const ids: string[] = sj?.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  // Step 2: esummary for metadata
  const esum = await fetch(
    `${PUBMED_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`
  );
  const sumJ = await esum.json();
  const docs = sumJ?.result || {};

  // Step 3: efetch for abstracts (XML; we'll parse minimally)
  const efetch = await fetch(
    `${PUBMED_BASE}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&id=${ids.join(',')}`
  );
  const xml = await efetch.text();
  const abstractMap = parseAbstractsXML(xml);

  const hits: PubMedHit[] = ids.map(id => {
    const d = docs[id] || {};
    const authors = (d.authors || []).map((a: any) => a.name).slice(0, 4);
    return {
      pmid: id,
      title: d.title || 'Untitled',
      authors,
      journal: d.fulljournalname || d.source || '',
      year: (d.pubdate || '').split(' ')[0],
      abstract: abstractMap.get(id) || '',
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
    };
  });

  cache.set(key, hits);
  return hits;
}

function parseAbstractsXML(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  // Simple regex parse (PubMed XML is consistent enough for this)
  const articles = xml.split('<PubmedArticle>').slice(1);
  for (const art of articles) {
    const pmidM = art.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const absM = art.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    if (pmidM && absM) {
      out.set(pmidM[1], decodeXML(absM[1]).replace(/<[^>]+>/g, ' ').trim());
    } else if (pmidM) {
      out.set(pmidM[1], '');
    }
  }
  return out;
}

function decodeXML(s: string) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/* ─────────────────────────── Wikipedia ─────────────────────────── */

export interface WikiHit {
  title: string;
  extract: string;
  url: string;
  lang: string;
}

export async function searchWikipedia(query: string, lang: 'uz' | 'en' = 'uz'): Promise<WikiHit | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const r = await fetch(url);
    if (!r.ok) {
      if (lang === 'uz') return searchWikipedia(query, 'en');
      return null;
    }
    const j = await r.json();
    if (j.type === 'disambiguation') return null;
    return {
      title: j.title,
      extract: j.extract || '',
      url: j.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      lang,
    };
  } catch {
    return null;
  }
}
