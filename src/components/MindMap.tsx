import { useState, useRef } from 'react';
import { Download, Loader2, Sparkles, Box, Share2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MindMap as MindMapType } from '../types';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface MindMapProps {
  data: MindMapType;
  onNodeClick?: (node: string, branch: string) => void;
  isGenerating?: boolean;
}

const BRANCH_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

const W = 1100;
const H = 650;
const PADDING_LEFT = 120;
const DEPTH_SPACE = 280;
const NODE_V_SPACE = 80;

export default function MindMap({ data, onNodeClick, isGenerating }: MindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const zoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));
  const zoomReset = () => setZoom(1);

  /** Calculate positions for a horizontal tree */
  const totalLeafNodes = data.branches.reduce((acc, b) => acc + Math.max(1, b.nodes.length), 0);
  const treeHeight = Math.max(H, totalLeafNodes * NODE_V_SPACE);

  const downloadPNG = async () => {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      canvas.width = W * 2;
      canvas.height = treeHeight * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, W, treeHeight);
          ctx.drawImage(img, 0, 0, W, treeHeight);
          resolve();
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      });

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.center.replace(/\s+/g, '-')}-tree.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PNG yuklab olindi');
      }, 'image/png');
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setDownloading(false);
    }
  };

  const rootY = treeHeight / 2;
  const rootX = PADDING_LEFT;

  let currentLeafY = 0;

  return (
    <div className="relative w-full h-full overflow-auto bg-[#020617]/50 backdrop-blur-xl rounded-[3rem] border border-white/5 scrollbar-thin scrollbar-thumb-white/10">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-med-blue/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2">
        <button onClick={zoomIn} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-90" title="Kattalashtirish">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={zoomReset} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 text-[10px] font-black" title="Asliga qaytarish">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={zoomOut} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-90" title="Kichiklashtirish">
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}>
      <svg
        ref={svgRef}
        width={W}
        height={treeHeight}
        viewBox={`0 0 ${W} ${treeHeight}`}
        className="relative z-10"
      >
        <defs>
          <filter id="glass-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* ── DRAW CONNECTIONS & NODES ── */}
        {data.branches.map((branch, bIdx) => {
          const color = branch.color || BRANCH_COLORS[bIdx % BRANCH_COLORS.length];
          const branchChildrenCount = Math.max(1, branch.nodes.length);
          const startLeafY = currentLeafY;
          currentLeafY += branchChildrenCount * NODE_V_SPACE;

          const bX = rootX + DEPTH_SPACE;
          const bY = startLeafY + (branchChildrenCount * NODE_V_SPACE) / 2;

          return (
            <g key={`branch-group-${bIdx}`}>
              <path
                d={`M ${rootX} ${rootY} C ${rootX + DEPTH_SPACE/2} ${rootY}, ${rootX + DEPTH_SPACE/2} ${bY}, ${bX} ${bY}`}
                stroke={color}
                strokeWidth={4}
                fill="none"
                strokeOpacity={0.15}
                strokeDasharray="8 8"
              />

              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: bIdx * 0.1 }}>
                <rect
                  x={bX - 110} y={bY - 28}
                  width={220} height={56}
                  rx={20}
                  fill={color} fillOpacity={0.1}
                  stroke={color} strokeWidth={2}
                  filter="url(#glass-blur)"
                />
                <text
                  x={bX} y={bY}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="11" fontWeight="900"
                  className="pointer-events-none uppercase tracking-[0.2em]"
                >
                  {branch.label}
                </text>
              </motion.g>

              {branch.nodes.map((node, nIdx) => {
                const lX = bX + DEPTH_SPACE;
                const lY = startLeafY + (nIdx * NODE_V_SPACE) + NODE_V_SPACE/2;
                const pillWidth = Math.min(260, Math.max(140, node.length * 9 + 50));

                return (
                  <g key={`node-${bIdx}-${nIdx}`}>
                    <path
                      d={`M ${bX + 110} ${bY} C ${bX + 220} ${bY}, ${bX + 220} ${lY}, ${lX - pillWidth/2} ${lY}`}
                      stroke={color}
                      strokeWidth={1.5}
                      fill="none"
                      strokeOpacity={0.1}
                    />

                    <motion.g 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: 0.3 + (bIdx + nIdx) * 0.05 }}
                    >
                      <rect
                        x={lX - pillWidth/2} y={lY - 20}
                        width={pillWidth} height={40}
                        rx={20}
                        fill="#ffffff05"
                        stroke="#ffffff10"
                        strokeWidth={1}
                        className="cursor-pointer hover:fill-white/10 hover:stroke-white/30 transition-all duration-300"
                        onClick={() => onNodeClick?.(node, branch.label)}
                      />
                      <circle cx={lX - pillWidth/2 + 20} cy={lY} r={4} fill={color} />
                      <text
                        x={lX + 10} y={lY}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="white" fontSize="11" fontWeight="600"
                        className="pointer-events-none select-none opacity-80"
                      >
                        {node.length > 28 ? node.slice(0, 25) + '...' : node}
                      </text>
                    </motion.g>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ── ROOT NODE ── */}
        <motion.g initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <circle cx={rootX} cy={rootY} r={70} fill="#3B82F6" fillOpacity={0.15} stroke="#3B82F6" strokeWidth={2} />
          <circle cx={rootX} cy={rootY} r={60} fill="#3B82F6" className="shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
          <Sparkles className="w-10 h-10 text-white" x={rootX - 20} y={rootY - 20} />
          <text
            x={rootX} y={rootY + 95}
            textAnchor="middle"
            fill="white" fontSize="18" fontWeight="950"
            className="pointer-events-none uppercase tracking-[0.4em]"
          >
            {data.center}
          </text>
        </motion.g>
      </svg>
      </div>{/* close zoom wrapper */}

      {/* Tools Overlay */}
      <div className="absolute top-10 left-10 flex items-center gap-4">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-8 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-med-blue/10 border border-med-blue/20 flex items-center justify-center">
                <Box className="w-6 h-6 text-med-blue" />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-3 uppercase tracking-widest leading-none mb-1">Mavzu xaritasi</p>
                <h4 className="text-base font-bold text-white tracking-tight">Kardiologiya Ierarxiyasi</h4>
              </div>
           </div>
           <div className="h-10 w-px bg-white/10" />
           <button
            onClick={downloadPNG}
            disabled={downloading}
            className="h-12 px-6 bg-white/5 hover:bg-med-blue hover:text-black border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PNG Eksport
          </button>
        </div>
      </div>

      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617E6] backdrop-blur-md z-50">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-med-blue animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-med-blue animate-pulse" />
            </div>
            <p className="text-sm font-black text-white uppercase tracking-[0.5em] animate-pulse">Intellektual daraxt qurilmoqda...</p>
          </div>
        </div>
      )}
    </div>
  );
}
