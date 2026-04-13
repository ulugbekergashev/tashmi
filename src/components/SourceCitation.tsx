import { useState } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { Citation } from '../lib/db';

interface Props {
  index: number;
  citation: Citation;
}

export default function SourceCitation({ index, citation }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block align-baseline">
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-5 h-5 -mt-2 ml-0.5 rounded-md text-[10px] font-bold bg-med-blue/15 text-med-blue border border-med-blue/30 hover:bg-med-blue hover:text-white transition-all align-super"
        aria-label={`Manba ${index}: ${citation.source_title}`}
      >
        {index}
      </button>
      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-72 p-3 rounded-xl bg-bg-secondary border border-med-blue/30 shadow-2xl text-left">
          <div className="flex items-start gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-med-blue shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-1 truncate">{citation.source_title}</p>
              {citation.page && <p className="text-[10px] text-text-3">Sahifa {citation.page}</p>}
            </div>
          </div>
          <p className="text-xs text-text-2 italic leading-relaxed line-clamp-5">"{citation.quote}"</p>
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-med-blue hover:underline"
              onClick={e => e.stopPropagation()}
            >
              Manbaga o'tish <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </span>
  );
}

/** Utility to render text with [^N] placeholders → CitationBadges. */
export function renderWithCitations(text: string, citations: Citation[]) {
  const parts: (string | { idx: number })[] = [];
  const re = /\[\^(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ idx: parseInt(m[1], 10) });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{p}</span>;
    const c = citations[p.idx - 1];
    if (!c) return <span key={i}>[^{p.idx}]</span>;
    return <SourceCitation key={i} index={p.idx} citation={c} />;
  });
}
