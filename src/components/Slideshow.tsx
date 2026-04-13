import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';
import { Presentation, SlideLayout } from '../types';
import { cn } from '../lib/utils';

interface SlideshowProps {
  data: Presentation;
}

/* ══════════════════════════════════════════════════════════
   SLIDE BACKGROUNDS — har bir layout o'z rangiga ega
══════════════════════════════════════════════════════════ */
const BG: Record<string, string> = {
  hero:          'from-[#0a0f2e] via-[#0d1540] to-[#060b1f]',
  insight:       'from-[#130a2e] via-[#1a0d40] to-[#0a0620]',
  'case-study':  'from-[#1a0810] via-[#220a14] to-[#0f0508]',
  warning:       'from-[#1a0808] via-[#220a0a] to-[#0f0404]',
  stat:          'from-[#050f28] via-[#071535] to-[#02091a]',
  timeline:      'from-[#0c110a] via-[#111708] to-[#070b04]',
  definition:    'from-[#070d28] via-[#0a1232] to-[#040919]',
  comparison:    'from-[#080d20] via-[#0c1228] to-[#050918]',
  grid:          'from-[#060c22] via-[#091232] to-[#040918]',
  list:          'from-[#070d22] via-[#0b1230] to-[#050918]',
};

const ACCENT: Record<string, { primary: string; secondary: string; glow: string; dot: string }> = {
  hero:          { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(59,130,246,0.15)', dot: '#3b82f6' },
  insight:       { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168,85,247,0.15)',  dot: '#a855f7' },
  'case-study':  { primary: '#ef4444', secondary: '#f87171', glow: 'rgba(239,68,68,0.15)',   dot: '#ef4444' },
  warning:       { primary: '#ef4444', secondary: '#fca5a5', glow: 'rgba(239,68,68,0.2)',    dot: '#ef4444' },
  stat:          { primary: '#06b6d4', secondary: '#67e8f9', glow: 'rgba(6,182,212,0.15)',   dot: '#06b6d4' },
  timeline:      { primary: '#22c55e', secondary: '#86efac', glow: 'rgba(34,197,94,0.12)',   dot: '#22c55e' },
  definition:    { primary: '#3b82f6', secondary: '#93c5fd', glow: 'rgba(59,130,246,0.15)', dot: '#3b82f6' },
  comparison:    { primary: '#8b5cf6', secondary: '#c4b5fd', glow: 'rgba(139,92,246,0.15)', dot: '#8b5cf6' },
  grid:          { primary: '#0ea5e9', secondary: '#7dd3fc', glow: 'rgba(14,165,233,0.15)', dot: '#0ea5e9' },
  list:          { primary: '#6366f1', secondary: '#a5b4fc', glow: 'rgba(99,102,241,0.15)', dot: '#6366f1' },
};

function getAccent(layout: SlideLayout = 'list') {
  return ACCENT[layout] ?? ACCENT.list;
}
function getBg(layout: SlideLayout = 'list') {
  return BG[layout] ?? BG.list;
}

/* ══════════════════════════════════════════════════════════
   LAYOUT RENDERERS
══════════════════════════════════════════════════════════ */

/* HERO — title slayd */
function HeroSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.hero }) {
  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* dekorativ doira */}
      <div
        className="absolute -right-24 -top-24 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent.primary} 0%, transparent 70%)` }}
      />
      <div
        className="absolute -left-16 bottom-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: accent.secondary }}
      />

      {/* kichik badge */}
      <div className="pt-14 px-16 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-[0.15em]"
          style={{ borderColor: `${accent.primary}40`, color: accent.secondary, background: `${accent.primary}12` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent.primary }} />
          Tibbiy Taqdimot
        </motion.div>
      </div>

      {/* asosiy matn */}
      <div className="flex-1 flex flex-col justify-center px-16 pb-8 gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-[56px] leading-[1.08] font-black text-white tracking-tight max-w-3xl"
        >
          {slide.content[0]}
        </motion.h1>
        {slide.content[1] && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-medium max-w-xl leading-relaxed"
            style={{ color: accent.secondary }}
          >
            {slide.content[1]}
          </motion.p>
        )}
        {/* gorizontal chiziq */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="h-0.5 w-24 origin-left rounded-full"
          style={{ background: accent.primary }}
        />
      </div>
    </div>
  );
}

/* LIST — standart ro'yxat */
function ListSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.list }) {
  return (
    <div className="flex flex-col h-full px-16 py-12 gap-8 relative overflow-hidden">
      <div
        className="absolute right-0 top-0 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: accent.primary }}
      />
      {/* sarlavha */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{slide.title}</h2>
        <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: accent.primary }} />
      </motion.div>

      {/* elementlar */}
      <div className="flex-1 flex flex-col justify-center gap-3 min-h-0">
        {slide.content.map((item: string, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, ease: 'easeOut' }}
            className="flex items-start gap-4 group"
          >
            <div
              className="flex-shrink-0 mt-1 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
              style={{ background: `${accent.primary}20`, color: accent.secondary, border: `1px solid ${accent.primary}35` }}
            >
              {i + 1}
            </div>
            <p className="text-[17px] font-semibold text-white/80 leading-snug group-hover:text-white transition-colors">
              {item}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* DEFINITION — ta'rif */
function DefinitionSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.definition }) {
  return (
    <div className="flex flex-col h-full px-16 py-12 gap-8 relative overflow-hidden">
      <div
        className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: accent.primary }}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight">{slide.title}</h2>
        <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: accent.primary }} />
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* asosiy ta'rif bloki */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent.primary}18 0%, ${accent.primary}06 100%)`,
            border: `1px solid ${accent.primary}35`,
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: accent.primary }}
          />
          <p className="text-[22px] font-bold text-white leading-snug pl-2">{slide.content[0]}</p>
        </motion.div>

        {/* qo'shimcha bandlar */}
        {slide.content.slice(1).map((item: string, i: number) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="text-[16px] italic leading-relaxed"
            style={{ color: `${accent.secondary}99` }}
          >
            {item}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

/* STAT — katta raqamlar */
function StatSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.stat }) {
  const items = slide.content.map((item: string) => {
    if (item.includes(':')) {
      const [label, val] = item.split(':').map((s: string) => s.trim());
      return { label, val };
    }
    return { label: '', val: item };
  });

  return (
    <div className="flex flex-col h-full px-16 py-12 gap-8 relative overflow-hidden">
      <div
        className="absolute -right-24 top-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: accent.primary }}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight">{slide.title}</h2>
        <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: accent.primary }} />
      </motion.div>

      <div className={cn(
        'flex-1 grid gap-6 items-center',
        items.length <= 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
      )}>
        {items.map(({ label, val }: { label: string; val: string }, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 160 }}
            className="flex flex-col items-center justify-center text-center p-8 rounded-2xl gap-3"
            style={{
              background: `linear-gradient(135deg, ${accent.primary}14 0%, ${accent.primary}05 100%)`,
              border: `1px solid ${accent.primary}25`,
            }}
          >
            <div
              className="text-[52px] font-black leading-none tracking-tight"
              style={{ color: accent.secondary }}
            >
              {val}
            </div>
            {label && (
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* GRID — 4 ta karta */
function GridSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.grid }) {
  return (
    <div className="flex flex-col h-full px-16 py-12 gap-8 relative overflow-hidden">
      <div
        className="absolute -left-16 bottom-0 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: accent.primary }}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight">{slide.title}</h2>
        <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: accent.primary }} />
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {slide.content.slice(0, 4).map((item: string, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09 }}
            className="p-6 rounded-2xl flex flex-col gap-3"
            style={{
              background: `linear-gradient(135deg, ${accent.primary}12 0%, ${accent.primary}04 100%)`,
              border: `1px solid ${accent.primary}20`,
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
              style={{ background: `${accent.primary}25`, color: accent.secondary }}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <p className="text-[15px] font-semibold text-white/80 leading-snug">{item}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* COMPARISON — ikki tomon taqqoslash */
function ComparisonSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.comparison }) {
  const half = Math.ceil(slide.content.length / 2);
  const left = slide.content.slice(0, half);
  const right = slide.content.slice(half);

  return (
    <div className="flex flex-col h-full px-16 py-12 gap-8 relative overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight">{slide.title}</h2>
        <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: accent.primary }} />
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
        {[left, right].map((col: string[], ci: number) => (
          <motion.div
            key={ci}
            initial={{ opacity: 0, x: ci === 0 ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ci * 0.1 }}
            className="flex flex-col gap-3 p-6 rounded-2xl"
            style={{
              background: `linear-gradient(160deg, ${accent.primary}${ci === 0 ? '14' : '08'} 0%, transparent 100%)`,
              border: `1px solid ${accent.primary}${ci === 0 ? '35' : '18'}`,
            }}
          >
            <div
              className="text-[10px] font-black uppercase tracking-[0.2em] pb-3 border-b"
              style={{ color: accent.secondary, borderColor: `${accent.primary}25` }}
            >
              {ci === 0 ? '01' : '02'}
            </div>
            {col.map((item: string, i: number) => (
              <p key={i} className="text-[15px] font-semibold text-white/75 leading-snug">{item}</p>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* TIMELINE — bosqichlar */
function TimelineSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.timeline }) {
  return (
    <div className="flex flex-col h-full px-16 py-12 gap-8 relative overflow-hidden">
      <div
        className="absolute right-0 bottom-0 w-64 h-64 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: accent.primary }}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight">{slide.title}</h2>
        <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: accent.primary }} />
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-0 min-h-0">
        {slide.content.map((item: string, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.09 }}
            className="flex items-stretch gap-5"
          >
            {/* vertical line + dot */}
            <div className="flex flex-col items-center gap-0 w-5 flex-shrink-0">
              <div
                className="w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 mt-4"
                style={{
                  background: `${accent.primary}20`,
                  borderColor: accent.primary,
                  boxShadow: `0 0 12px ${accent.primary}40`,
                }}
              />
              {i < slide.content.length - 1 && (
                <div className="w-px flex-1" style={{ background: `${accent.primary}25` }} />
              )}
            </div>
            {/* content */}
            <div className="pb-4 flex-1">
              <p className="text-[16px] font-semibold text-white/80 leading-snug pt-3">{item}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* WARNING — ogohlantirish */
function WarningSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.warning }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-16 gap-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-15 blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 50%, ${accent.primary} 0%, transparent 60%)` }}
      />

      {/* ikon */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `${accent.primary}15`,
          border: `2px solid ${accent.primary}40`,
          boxShadow: `0 0 40px ${accent.primary}30`,
        }}
      >
        <span className="text-4xl">⚠️</span>
      </motion.div>

      {/* matn */}
      <div className="flex flex-col items-center gap-4 text-center max-w-2xl">
        {slide.content.map((item: string, i: number) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={i === 0 ? 'text-[30px] font-black text-white leading-tight' : 'text-lg text-white/55 leading-relaxed'}
          >
            {item}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

/* INSIGHT — quote */
function InsightSlide({ slide, accent }: { slide: any; accent: typeof ACCENT.insight }) {
  return (
    <div className="flex flex-col h-full px-16 py-14 gap-8 relative overflow-hidden">
      <div
        className="absolute -left-8 -top-8 text-[200px] font-black leading-none opacity-6 select-none"
        style={{ color: accent.primary }}
      >
        "
      </div>
      <div
        className="absolute -right-8 -bottom-8 text-[200px] font-black leading-none opacity-6 select-none rotate-180"
        style={{ color: accent.primary }}
      >
        "
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div
          className="w-12 h-1 rounded-full"
          style={{ background: accent.primary }}
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold text-white leading-snug italic max-w-2xl"
        >
          "{slide.content[0]}"
        </motion.p>
        {slide.content.slice(1).map((item: string, i: number) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="text-sm font-bold uppercase tracking-[0.2em]"
            style={{ color: `${accent.secondary}80` }}
          >
            {item}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

/* CASE-STUDY — klinik holat */
function CaseStudySlide({ slide, accent }: { slide: any; accent: typeof ACCENT['case-study'] }) {
  return (
    <div className="flex h-full relative overflow-hidden">
      {/* chap — case */}
      <div
        className="flex-1 flex flex-col px-14 py-12 gap-6 border-r"
        style={{ borderColor: `${accent.primary}20` }}
      >
        <div>
          <div
            className="text-[9px] font-black uppercase tracking-[0.3em] mb-2"
            style={{ color: accent.secondary }}
          >
            Klinik Holat
          </div>
          <div className="h-0.5 w-8 rounded-full" style={{ background: accent.primary }} />
        </div>
        <p className="text-[17px] font-semibold text-white/80 leading-relaxed flex-1">{slide.content[0]}</p>
      </div>

      {/* o'ng — xulosa */}
      <div
        className="flex-1 flex flex-col px-14 py-12 gap-6"
        style={{ background: `${accent.primary}06` }}
      >
        <div>
          <div
            className="text-[9px] font-black uppercase tracking-[0.3em] mb-2"
            style={{ color: '#22c55e' }}
          >
            Tibbiy Xulosa
          </div>
          <div className="h-0.5 w-8 rounded-full bg-emerald-500" />
        </div>
        <p className="text-[17px] font-semibold text-white/80 leading-relaxed flex-1">
          {slide.content[1] || slide.content[0]}
        </p>
        {slide.content.slice(2).map((item: string, i: number) => (
          <p key={i} className="text-sm text-white/35 italic border-t border-white/5 pt-3">{item}</p>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE SHELL — branding, slide number, footer
══════════════════════════════════════════════════════════ */
function SlideShell({
  slide, index, total, layoutKey,
}: { slide: any; index: number; total: number; layoutKey: SlideLayout }) {
  const accent = getAccent(layoutKey);
  const bgGrad = getBg(layoutKey);

  const renderContent = () => {
    switch (layoutKey) {
      case 'hero':        return <HeroSlide slide={slide} accent={accent} />;
      case 'insight':     return <InsightSlide slide={slide} accent={accent} />;
      case 'grid':        return <GridSlide slide={slide} accent={accent} />;
      case 'case-study':  return <CaseStudySlide slide={slide} accent={accent} />;
      case 'stat':        return <StatSlide slide={slide} accent={accent} />;
      case 'comparison':  return <ComparisonSlide slide={slide} accent={accent} />;
      case 'timeline':    return <TimelineSlide slide={slide} accent={accent} />;
      case 'warning':     return <WarningSlide slide={slide} accent={accent} />;
      case 'definition':  return <DefinitionSlide slide={slide} accent={accent} />;
      default:            return <ListSlide slide={slide} accent={accent} />;
    }
  };

  return (
    <div className={cn('w-full h-full flex flex-col bg-gradient-to-br relative', bgGrad)}>
      {/* subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(${accent.primary}50 1px, transparent 1px), linear-gradient(90deg, ${accent.primary}50 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* slide number top-right */}
      <div className="absolute top-5 right-6 flex items-center gap-2 z-10">
        <span
          className="text-[10px] font-black tabular-nums"
          style={{ color: `${accent.primary}60` }}
        >
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      {/* content */}
      <div className="flex-1 min-h-0 relative">
        {renderContent()}
      </div>

      {/* footer */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-16 py-4 border-t"
        style={{ borderColor: `${accent.primary}12` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black text-white"
            style={{ background: accent.primary }}
          >
            M
          </div>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">MedAI</span>
        </div>
        <span className="text-[10px] font-medium text-white/15">{slide.title}</span>
        <div
          className="text-[9px] font-black uppercase tracking-[0.2em]"
          style={{ color: `${accent.primary}50` }}
        >
          Elite Medical
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   THUMBNAIL BAR
══════════════════════════════════════════════════════════ */
function ThumbBar({
  slides, current, onSelect,
}: { slides: any[]; current: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-1 py-1">
      {slides.map((s, i) => {
        const accent = getAccent(s.layout);
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              'flex-shrink-0 w-20 aspect-video rounded-lg border overflow-hidden transition-all duration-200 relative',
              i === current
                ? 'scale-105 shadow-lg'
                : 'opacity-50 hover:opacity-80',
            )}
            style={{ borderColor: i === current ? accent.primary : 'rgba(255,255,255,0.06)', outline: i === current ? `2px solid ${accent.primary}` : 'none' }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br"
              style={{ background: `linear-gradient(135deg, #0a0f2e, #060b1f)` }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `${accent.primary}10` }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-1">
              <div className="text-[6px] font-bold text-white/60 truncate leading-tight">{s.title}</div>
              <div
                className="text-[5px] font-black uppercase tracking-wider mt-0.5"
                style={{ color: accent.primary }}
              >
                {s.layout ?? 'list'}
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: i === current ? accent.primary : 'transparent' }}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function Slideshow({ data }: SlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const total = data.slides.length;

  const prev = useCallback(() => setCurrent(p => Math.max(0, p - 1)), []);
  const next = useCallback(() => setCurrent(p => Math.min(total - 1, p + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev(); }
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey) setFullscreen(f => !f);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, fullscreen]);

  const slide = data.slides[current];
  const layoutKey: SlideLayout = slide.layout ?? 'list';
  const accent = getAccent(layoutKey);

  const wrapper = (
    <div className={cn('flex flex-col gap-3', fullscreen && 'h-screen w-screen p-4 bg-[#050810]')}>
      {/* ── MAIN SLIDE ── */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden shadow-2xl',
          fullscreen ? 'flex-1' : 'aspect-video w-full',
        )}
        style={{ boxShadow: `0 0 60px ${accent.glow}, 0 25px 50px rgba(0,0,0,0.6)` }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <SlideShell slide={slide} index={current} total={total} layoutKey={layoutKey} />
          </motion.div>
        </AnimatePresence>

        {/* prev / next overlay buttons */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/60 disabled:opacity-0 transition-all z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          disabled={current === total - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/60 disabled:opacity-0 transition-all z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* fullscreen button */}
        <button
          onClick={() => setFullscreen(f => !f)}
          className="absolute top-4 right-14 w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white hover:bg-black/50 transition-all z-20"
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all z-20"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-10">
          <motion.div
            className="h-full"
            style={{ background: accent.primary }}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
      </div>

      {/* ── THUMBNAIL BAR ── */}
      {!fullscreen && (
        <div className="flex items-center gap-3">
          <ThumbBar slides={data.slides} current={current} onSelect={setCurrent} />
          <div className="flex-shrink-0 flex items-center gap-1 ml-auto">
            <span className="text-[10px] font-black text-white/20 tabular-nums">
              {current + 1} / {total}
            </span>
          </div>
        </div>
      )}

      {/* fullscreen thumbnails (bottom bar) */}
      {fullscreen && (
        <div className="flex-shrink-0 pb-1">
          <ThumbBar slides={data.slides} current={current} onSelect={setCurrent} />
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return <div className="fixed inset-0 z-[100]">{wrapper}</div>;
  }

  return wrapper;
}
