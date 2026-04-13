import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Lock, Check, Play, BookOpen, Star, Target, Crown, Navigation, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { calculateLevelProgress } from '../lib/xp';

interface KnowledgeMapProps {
  onNavigate?: (page: string, topic?: string) => void;
}

type NodeState = 'completed' | 'active' | 'locked';

interface SyllabusNode {
  id: string;
  title: string;
  topic: string; // The query parameter passed to LearningModule
  category: string;
  state: NodeState;
  score: number; // 0 to 3 stars
  description: string;
  xpReward: number;
}

// Dummy Curriculum Map for Cardiology Track
const CURRICULUM: SyllabusNode[] = [
  { id: 'c1', title: 'Yurak Anatomiyasi', topic: 'Yurak Anatomiyasi', category: 'Fundamental', state: 'completed', score: 3, description: 'Yurakning tuzilishi, kameralar, klapanlar va qon ta\'minoti (koronar qon tomirlar) anatomiyasini o\'rganing.', xpReward: 150 },
  { id: 'c2', title: 'Fiziologiya & Gemodinamika', topic: 'Yurak Fiziologiyasi', category: 'Fundamental', state: 'completed', score: 2, description: 'Yurak sikli, qon bosimi shakllanishi, sistola va diastola, shuningdek yurak urishi hajmini tahlil qilish.', xpReward: 200 },
  { id: 'c3', title: 'EKG Asoslari', topic: 'Elektr tizimi va EKG', category: 'Diagnostika', state: 'active', score: 0, description: 'Yurak urishini boshqaruvchi elektr o\'tkazuvchanligi tizimi va EKG qoidalari, to\'lqinlarni o\'qish.', xpReward: 350 },
  { id: 'c4', title: 'Yurak yetishmovchiligi', topic: 'Yurak yetishmovchiligi', category: 'Patologiya', state: 'locked', score: 0, description: 'Surunkali yurak yetishmovchiligi turlari, uning sabablari va kompensator mexanizmlarni ko\'rib chiqamiz.', xpReward: 400 },
  { id: 'c5', title: 'Ishemik Kasallik', topic: 'YUI va Miokard infarkti', category: 'Klinik', state: 'locked', score: 0, description: 'Stenokardiya va Miokard infarkti simptomlari, diagnostikasi va dastlabki tez yordam algoritmlari.', xpReward: 500 },
  { id: 'c6', title: 'Ritm buzulishlari', topic: 'Aritmiyalar', category: 'Klinik', state: 'locked', score: 0, description: 'Fibrilatsiya, taxikardiya va bradikardiya. Hayot uchun xavfli bo\'lgan holatlarga reaksiyalar.', xpReward: 450 },
  { id: 'c7', title: 'Kardiologik Farmakologiya', topic: 'Kardiologiya farmakologiyasi', category: 'Farmakologiya', state: 'locked', score: 0, description: 'Beta blokatorlar, kalsiy kanal blokatorlari, diuretiklar va ularning ta\'sir mexanizmlari.', xpReward: 300 },
  { id: 'c8', title: 'Qopqoq nuqsonlari', topic: 'Klapanniy porok', category: 'Patologiya', state: 'locked', score: 0, description: 'Stenoz va yetishmovchilik, auskultatsiyada farqlash ko\'nikmalari.', xpReward: 300 },
  { id: 'c9', title: 'Gipertoniya', topic: 'Arterial Gipertenziya', category: 'Klinik', state: 'locked', score: 0, description: 'Gipertoniya darajalari, asoratlari va zamonaviy davolash yo\'riqnomalari.', xpReward: 400 },
  { id: 'c10', title: 'Yakuniy Case: Reanimatsiya', topic: 'Reanimatsiya ACLS', category: 'Kritik qutqaruv', state: 'locked', score: 0, description: 'Real reanimatsiya stsenariylarida ACLS protokolini qo\'llash va defibrilatsiya qarorlari.', xpReward: 1000 },
];

export default function KnowledgeMap({ onNavigate }: KnowledgeMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('c3');
  const stats = useLiveQuery(() => db.user_stats.get('me'));
  
  const selectedNode = CURRICULUM.find(n => n.id === selectedNodeId);
  const currentXPProgress = stats ? calculateLevelProgress(stats.total_xp) : 0;

  const getCatColor = (cat: string) => {
    switch(cat) {
      case 'Fundamental': return 'text-med-blue bg-med-blue/10 border-med-blue/20';
      case 'Diagnostika': return 'text-med-purple bg-med-purple/10 border-med-purple/20';
      case 'Patologiya': return 'text-med-yellow bg-med-yellow/10 border-med-yellow/20';
      case 'Farmakologiya': return 'text-med-green bg-med-green/10 border-med-green/20';
      case 'Klinik': return 'text-med-red bg-med-red/10 border-med-red/20';
      case 'Kritik qutqaruv': return 'text-[goldenrod] bg-[goldenrod]/10 border-[goldenrod]/20';
      default: return 'text-text-2 bg-bg-secondary border-border-custom';
    }
  };

  const getCatHex = (cat: string) => {
    switch(cat) {
      case 'Fundamental': return '#3B82F6';
      case 'Diagnostika': return '#8B5CF6';
      case 'Patologiya': return '#F59E0B';
      case 'Farmakologiya': return '#10B981';
      case 'Klinik': return '#EF4444';
      case 'Kritik qutqaruv': return '#FACC15';
      default: return '#4B5563';
    }
  };

  // Utility to generate a winding path X offset
  const getOffset = (index: number) => {
    const period = 4; // nodes per full wave
    const wave = Math.sin((index * Math.PI * 2) / period);
    return wave * 180; // max 180px deviation left or right
  };

  return (
    <div className="h-full flex gap-6 overflow-hidden max-w-[1200px] mx-auto w-full py-4">
      
      {/* LEFT: Gamified Scrolling Roadmap */}
      <div className="flex-1 bg-bg-card border-2 border-border-custom hover:border-border-custom/80 transition-colors rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header Block */}
        <div className="p-6 border-b border-border-custom bg-bg-secondary/40 shrink-0 z-10 flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-2 bg-med-red/10 text-med-red border-med-red/20">Modul 1</Badge>
            <h1 className="text-2xl font-bold font-heading">Kardiologiya Maktabi</h1>
            <p className="text-xs text-text-3 mt-1">Noldan to Klinik amaliyotgacha bo'lgan to'liq daraja</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 justify-end text-med-yellow">
              <Crown className="w-5 h-5" />
              <span className="font-bold text-xl">{stats?.level || 1}</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-text-3 tracking-widest">Hozirgi Daraja</p>
          </div>
        </div>

        {/* Scrollable Path Wrapper */}
        <div className="flex-1 overflow-y-auto relative p-10 pb-32 scrollbar-none">
          {/* We draw the winding background line by connecting offsets */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-bg-secondary/50" />
          
          <svg className="absolute w-full h-full inset-0 pointer-events-none" style={{ minHeight: `${CURRICULUM.length * 150}px` }}>
             {/* Dynamic path generating cubic bezier between each node */}
             {CURRICULUM.map((node, i) => {
                if (i === CURRICULUM.length - 1) return null;
                const next = CURRICULUM[i + 1];
                
                // Assuming starting Y is 50, each gap is 150
                const y1 = 50 + i * 150;
                const y2 = 50 + (i + 1) * 150;
                
                // Real layout happens via CSS translate, but for SVG we pretend center is w/2
                // Wait, precise SVG winding lines are hard to match to flex. 
                // We'll use a simpler straight dashed line for the central trunk and nodes pop off to the sides.
                return null;
             })}
          </svg>

          {/* Nodes */}
          <div className="relative pt-6 space-y-[90px] flex flex-col items-center">
            {/* The Trunk Line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-2 -translate-x-1/2 bg-bg-secondary rounded-full overflow-hidden">
               <div className="bg-gradient-to-b from-med-blue via-med-purple to-transparent w-full h-[35%]" />
            </div>

            {CURRICULUM.map((node, i) => {
              const xOffset = getOffset(i);
              const isSelected = selectedNodeId === node.id;
              
              let StatusIcon = node.state === 'completed' ? Check : node.state === 'locked' ? Lock : Star;
              
              return (
                <div key={node.id} className="relative z-10 w-full flex justify-center">
                  <motion.div 
                    style={{ x: xOffset }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                  >
                    <button
                      onClick={() => setSelectedNodeId(node.id)}
                      className={cn(
                        "group relative flex items-center gap-4 transition-all duration-300",
                        node.state === 'locked' ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      {/* Left/Right Text depending on offset */}
                      {xOffset > 0 && (
                        <div className="absolute right-full mr-6 text-right w-48 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity">
                          <p className="text-xs font-bold text-text-1">{node.title}</p>
                          <p className="text-[10px] text-text-3 uppercase">{node.category}</p>
                        </div>
                      )}

                      {/* Main Node Bubble */}
                      <div className={cn(
                        "relative w-20 h-20 rounded-full flex items-center justify-center p-1 transition-all shadow-xl group-hover:scale-105 active:scale-95",
                        isSelected ? "ring-4 ring-white/20 bg-bg-primary" : "bg-bg-card",
                        node.state === 'active' ? "ring-4 ring-med-blue ring-offset-4 ring-offset-bg-card animate-pulse shadow-med-blue/30" : "",
                      )}>
                        
                        {/* Circular Progress Ring (Simulated) */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="36" fill="none" strokeWidth="4" className="stroke-bg-secondary" />
                          {node.state === 'completed' && (
                            <circle cx="40" cy="40" r="36" fill="none" strokeWidth="4" strokeDasharray="226" strokeDashoffset="0" className={cn('stroke-med-green')} />
                          )}
                          {node.state === 'active' && (
                            <circle cx="40" cy="40" r="36" fill="none" strokeWidth="4" strokeDasharray="226" strokeDashoffset="150" className={cn('stroke-med-blue', 'transition-all duration-1000')} />
                          )}
                        </svg>

                        {/* Inner Circle filled with solid custom color */}
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: node.state === 'locked' ? '#374151' : getCatHex(node.category) }}
                        >
                          <StatusIcon className="w-6 h-6" />
                        </div>
                        
                        {/* Selected Indicator Arrow */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div 
                              initial={{ scale: 0 }} 
                              animate={{ scale: 1 }} 
                              exit={{ scale: 0 }}
                              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-border-custom"
                            >
                              <Target className="w-4 h-4 text-bg-primary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Left/Right Text depending on offset */}
                      {xOffset <= 0 && (
                        <div className="absolute left-full ml-6 text-left w-48 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity">
                          <p className="text-xs font-bold text-text-1">{node.title}</p>
                          <p className="text-[10px] text-text-3 uppercase">{node.category}</p>
                        </div>
                      )}
                    </button>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Selected Milestone Details Sidebar */}
      <AnimatePresence mode="wait">
        {selectedNode ? (
          <motion.div 
            key={selectedNode.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-[400px] shrink-0 bg-bg-card border-2 border-border-custom rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-20`} style={{ backgroundColor: getCatHex(selectedNode.category) }} />

            <div className="flex-1 space-y-6 relative z-10">
              <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-widest", getCatColor(selectedNode.category))}>
                {selectedNode.category}
              </Badge>
              
              <h2 className="text-3xl font-bold font-heading">{selectedNode.title}</h2>
              <p className="text-text-2 text-sm leading-relaxed">
                {selectedNode.description}
              </p>

              {/* Progress Summary */}
              <div className="p-5 border border-border-custom bg-bg-secondary/50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-3 font-bold">Holati:</span>
                  {selectedNode.state === 'completed' ? (
                    <span className="text-med-green font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Yakunlangan</span>
                  ) : selectedNode.state === 'locked' ? (
                    <span className="text-text-3 font-bold flex items-center gap-1"><Lock className="w-4 h-4" /> Qulflangan</span>
                  ) : (
                    <span className="text-med-blue font-bold flex items-center gap-1"><Play className="w-4 h-4" /> O'rganishda...</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-3 font-bold">Mukofot (XP):</span>
                  <span className="text-text-1 font-bold">+{selectedNode.xpReward} XP</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-3 font-bold">Mahorat darajasi:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <Crown key={s} className={cn("w-5 h-5", selectedNode.score >= s ? "text-med-yellow" : "text-bg-primary")} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Preview List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-3 uppercase tracking-widest">Dars tarkibi</h3>
                <ul className="space-y-2">
                  {[
                    "Kengaytirilgan teoriya",
                    "Spaced Repetition kartalar",
                    "Virtual Qahramon maslahatlari",
                    "O'zlashtirish uchun test"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-text-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-med-blue/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-6 border-t border-border-custom relative z-10 space-y-3">
              {selectedNode.state === 'locked' ? (
                <div className="flex flex-col items-center gap-2 p-4 bg-bg-secondary rounded-2xl text-center">
                  <Lock className="w-6 h-6 text-text-3" />
                  <p className="text-xs text-text-2">Bu modulni ochish uchun avvalgi mavzularni yakunlashingiz kerak.</p>
                </div>
              ) : (
                <>
                  <Button 
                    className="w-full h-14 bg-med-blue hover:bg-blue-600 rounded-2xl font-bold text-lg"
                    onClick={() => {
                      if (onNavigate) {
                        toast.success(`"${selectedNode.topic}" sahifasiga o'tyapmiz...`);
                        setTimeout(() => onNavigate('learn', selectedNode.topic), 500);
                      } else {
                        toast.error("Navigatsiya tizimi bog'lanmagan!");
                      }
                    }}
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {selectedNode.state === 'completed' ? "Takrorlash" : "O'rganishni boshlash"}
                  </Button>
                  <p className="text-[10px] text-center text-text-3 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    Omni-Dashboard da ochiladi <ArrowRight className="w-3 h-3" />
                  </p>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="w-[400px] shrink-0 bg-bg-card border-2 border-border-custom rounded-3xl shadow-lg flex items-center justify-center border-dashed">
            <p className="text-text-3">Malumot ko'rish uchun mavzuni tanlang</p>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
