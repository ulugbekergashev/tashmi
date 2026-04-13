import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, GraduationCap, Microscope, Layers, Zap, Info } from 'lucide-react';
import { Button } from './ui/button';
import { GenerationConfig, Complexity } from '../types';
import { cn } from '../lib/utils';

interface GenerationOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: GenerationConfig) => void;
  topic: string;
}

export default function GenerationOptionsModal({ isOpen, onClose, onConfirm, topic }: GenerationOptionsModalProps) {
  const [complexity, setComplexity] = useState<Complexity>('clinical');
  const [depth, setDepth] = useState<'summary' | 'deep'>('summary');
  const [focus, setFocus] = useState('all');

  const handleConfirm = () => {
    onConfirm({
      complexity,
      depth,
      focus,
      language: 'uz'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-bg-card border border-border-custom rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-med-blue/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-med-blue" />
              </div>
              <h2 className="text-xl font-bold font-heading">Notebook sozlamalari</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-8 space-y-8">
            {/* Complexity Section */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-text-3 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Murakkablik darajasi
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'basics', label: 'Asoslar', icon: BookOpen, desc: 'Talabalar uchun' },
                  { id: 'clinical', label: 'Klinik', icon: GraduationCap, desc: 'Standart (shifokor)' },
                  { id: 'specialist', label: 'Ekspert', icon: Microscope, desc: 'Chuqur tahlil' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setComplexity(item.id as Complexity)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left",
                      complexity === item.id 
                        ? "border-med-blue bg-med-blue/5 ring-4 ring-med-blue/10" 
                        : "border-border-custom hover:border-text-3 bg-bg-secondary"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 mb-2", complexity === item.id ? "text-med-blue" : "text-text-3")} />
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-[10px] text-text-3">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Depth Section */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-text-3 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" /> Ma'lumot hajmi
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'summary', label: 'Tezkor xulosa', desc: 'Eng muhim nuqtalar' },
                  { id: 'deep', label: 'Chuqur o\'rganish', desc: 'Batafsil tushuntirish' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDepth(item.id as any)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left",
                      depth === item.id 
                        ? "border-med-emerald bg-med-emerald/5 ring-4 ring-med-emerald/10" 
                        : "border-border-custom hover:border-text-3 bg-bg-secondary"
                    )}
                  >
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-[10px] text-text-3">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Section */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-text-3 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" /> Fokus (ixtiyoriy)
              </label>
              <div className="relative">
                <textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Masalan: 'faqat patogenezga e'tibor berilsin' yoki 'davolash usullari ko'proq bo'lsin'"
                  className="w-full h-24 p-4 rounded-2xl bg-bg-secondary border-2 border-border-custom focus:border-med-blue outline-none text-sm transition-all resize-none"
                />
              </div>
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-[10px] text-orange-500 leading-relaxed font-medium">
                  Maslahat: NotebookLM dan farqli o'laroq, bizda klinik ko'rsatmalarga (guidelines) asoslangan holda generatsiya qilish imkoniyati mavjud.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 pt-0">
            <Button 
              onClick={handleConfirm}
              className="w-full h-14 rounded-2xl bg-med-blue hover:bg-med-blue/90 text-white font-bold text-lg shadow-xl shadow-med-blue/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Notebookni yaratish
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
