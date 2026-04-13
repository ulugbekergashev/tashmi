import { useState, useRef, useEffect } from 'react';
import { 
  UserCircle, Send, Activity, Thermometer, Heart,
  RotateCcw, Clipboard, Book, Search, 
  Microscope, PlusCircle, Trash2, Brain, Pill, Save, Sparkles,
  ChevronLeft, Stethoscope
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { VirtualPatient } from '../types';
import { chatWithPatient, evaluateDiagnosis } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { awardXP } from '../lib/db';

interface PatientChatProps {
  patient: VirtualPatient;
  onBack: () => void;
}

export default function PatientChat({ patient, onBack }: PatientChatProps) {
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [suspectedDiagnoses, setSuspectedDiagnoses] = useState<string[]>([]);
  const [newSuspect, setNewSuspect] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatHistory([{ role: 'model', text: patient.opening }]);
  }, [patient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;
    const userMsg = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const response = await chatWithPatient(patient, chatHistory, userMsg);
      setChatHistory(prev => [...prev, { role: 'model', text: response || '...' }]);
    } catch {
      toast.error('Xabar yuborishda xatolik');
    } finally {
      setIsTyping(false);
    }
  };

  const handleEvaluate = async () => {
    const finalDiagnosis = `Tashxis: ${diagnosis}\nEslatmalar: ${notes}\nDDx: ${suspectedDiagnoses.join(', ')}`;
    setIsEvaluating(true);
    try {
      const result = await evaluateDiagnosis(patient, chatHistory, finalDiagnosis);
      setEvaluation(result);
      if (result?.score) {
        awardXP(result.score * 2).then(res => {
          if (res?.leveledUp) toast.success(`Tabriklaymiz! Siz ${res.level}-darajaga ko'tarildingiz!`);
        });
      }
    } catch {
      toast.error('Baholashda xatolik');
    } finally {
      setIsEvaluating(false);
    }
  };

  const addSuspect = () => {
    if (newSuspect.trim() && !suspectedDiagnoses.includes(newSuspect.trim())) {
      setSuspectedDiagnoses(prev => [...prev, newSuspect.trim()]);
      setNewSuspect('');
    }
  };

  if (evaluation) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center p-10 bg-gradient-to-br from-med-blue/20 to-med-purple/10 rounded-[3rem] border border-white/10">
            <p className="text-[11px] font-black text-med-blue uppercase tracking-[0.4em] mb-3">Elite Clinical Score</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-8xl font-black text-white">{evaluation.score}</span>
              <span className="text-2xl text-text-3">/ 100</span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Anamnez', value: evaluation.breakdown?.anamnesis ?? 0, color: 'bg-med-blue' },
              { label: 'Klinik Tafakkur', value: evaluation.breakdown?.examination ?? 0, color: 'bg-med-purple' },
              { label: 'Differensial', value: evaluation.breakdown?.differential ?? 0, color: 'bg-med-yellow' },
              { label: "Tashxis To'g'riligi", value: evaluation.breakdown?.treatment ?? 0, color: 'bg-med-green' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-text-3">
                  <span>{item.label}</span><span className="text-white">{item.value}/25</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(item.value / 25) * 100}%` }}
                    transition={{ duration: 1.2, delay: i * 0.1 }}
                    className={cn('h-full rounded-full', item.color)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="flex items-center gap-2 text-med-blue mb-3"><Sparkles className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Professor Feedback</span></div>
            <p className="text-sm text-text-2 italic leading-relaxed">"{evaluation.feedback}"</p>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => { setEvaluation(null); setDiagnosis(''); setChatHistory([]); setNotes(''); setSuspectedDiagnoses([]); }}
              className="flex-1 h-14 bg-med-blue hover:bg-blue-600 rounded-2xl font-black">
              <RotateCcw className="w-5 h-5 mr-2" /> Qayta boshlash
            </Button>
            <Button variant="outline" onClick={onBack} className="flex-1 h-14 rounded-2xl border-white/10 font-black text-text-2">
              Chiqish
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* LEFT: CHAT — main area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
        {/* Chat header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-text-3" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-med-blue/20 border border-med-blue/30 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-med-blue" />
          </div>
          <div>
            <p className="font-black text-white text-sm">{patient.patient.name}</p>
            <p className="text-[10px] text-text-3 uppercase tracking-widest">{patient.patient.age} yosh • {patient.patient.gender}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-med-green animate-pulse" />
            <span className="text-[10px] font-bold text-med-green uppercase tracking-widest">Live Case</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence>
            {chatHistory.map((chat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex flex-col max-w-[80%]', chat.role === 'user' ? 'ml-auto items-end' : 'items-start')}
              >
                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 mb-1.5', chat.role === 'user' ? 'text-med-blue' : 'text-med-green')}>
                  {chat.role === 'user' ? '👨‍⚕️ Doktor (Siz)' : '🤒 Bemor'}
                </span>
                <div className={cn(
                  'px-5 py-4 rounded-3xl text-sm leading-relaxed',
                  chat.role === 'user'
                    ? 'bg-med-blue text-black font-bold rounded-tr-sm'
                    : 'bg-white/[0.05] text-white border border-white/10 rounded-tl-sm'
                )}>
                  {chat.text}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-med-green px-2">🤒 Bemor...</span>
                <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-3xl rounded-tl-sm flex gap-1.5">
                  {[0, 0.15, 0.3].map(d => <div key={d} className="w-2 h-2 rounded-full bg-med-green animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] shrink-0">
          <div className="flex gap-3">
            <Input
              placeholder="Bemorga savol bering..."
              className="flex-1 h-12 bg-white/5 border-white/10 rounded-2xl text-sm font-medium"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping || !message.trim()}
              className="w-12 h-12 bg-med-blue hover:bg-blue-600 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-30 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: SIDEBAR — patient info + notes */}
      <div className="w-80 shrink-0 flex flex-col border-l border-white/5 bg-white/[0.01]">
        {/* Tab switcher */}
        <div className="flex border-b border-white/5 shrink-0">
          {(['info', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors',
                activeTab === tab ? 'text-med-blue border-b-2 border-med-blue' : 'text-text-3 hover:text-white'
              )}
            >
              {tab === 'info' ? '📋 Bemor' : '📝 Qaydlar'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {activeTab === 'info' ? (
            <div className="p-4 space-y-4">
              {/* Vitals */}
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-text-3 uppercase tracking-widest mb-3">Ko'rsatkichlar</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'BP', val: '130/80', unit: 'mmHg', icon: Activity, color: 'text-med-blue' },
                    { label: 'HR', val: '78', unit: 'bpm', icon: Heart, color: 'text-med-red' },
                    { label: 'Temp', val: '36.6', unit: '°C', icon: Thermometer, color: 'text-med-yellow' },
                    { label: 'SpO2', val: '98', unit: '%', icon: Pill, color: 'text-med-green' },
                  ].map((v, i) => (
                    <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                      <div className="flex items-center gap-1 mb-1">
                        <v.icon className={cn('w-3 h-3', v.color)} />
                        <span className="text-[8px] font-black uppercase text-text-3">{v.label}</span>
                      </div>
                      <span className="text-base font-black text-white">{v.val}</span>
                      <span className="text-[9px] text-text-3 ml-1">{v.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DDx */}
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                <p className="text-[9px] font-black text-text-3 uppercase tracking-widest">Suspected DDx</p>
                <div className="flex gap-2">
                  <Input
                    value={newSuspect}
                    onChange={e => setNewSuspect(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSuspect()}
                    placeholder="Differential..."
                    className="h-9 text-xs bg-white/5 border-white/10 rounded-xl"
                  />
                  <button onClick={addSuspect} className="h-9 w-9 shrink-0 bg-med-purple/80 rounded-xl flex items-center justify-center text-white hover:bg-med-purple">
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  <AnimatePresence>
                    {suspectedDiagnoses.map((ddx, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/5 rounded-xl group">
                        <span className="text-xs text-text-1 font-bold truncate">{ddx}</span>
                        <button onClick={() => setSuspectedDiagnoses(prev => prev.filter((_, j) => j !== i))}
                          className="p-1 text-med-red opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {suspectedDiagnoses.length === 0 && (
                    <p className="text-[9px] text-text-3 text-center py-3 opacity-50">Tashxislar yo'q</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 h-full flex flex-col">
              <textarea
                placeholder="Simptomlar va klinik topilmalar..."
                className="flex-1 min-h-[200px] bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-text-1 focus:outline-none focus:border-med-blue resize-none font-medium"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <div className="space-y-2">
                <p className="text-[9px] font-black text-text-3 uppercase tracking-widest">Yakuniy tashxis</p>
                <Input
                  placeholder="Masalan: Miokard Infarkti"
                  className="h-11 text-sm font-bold bg-white/5 border-white/10 rounded-xl"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                />
                <Button
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !diagnosis.trim()}
                  className="w-full h-12 bg-med-green hover:bg-green-600 text-black rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-30"
                >
                  {isEvaluating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Baholanmoqda...
                    </div>
                  ) : (
                    <><Stethoscope className="w-4 h-4 mr-2" />Tekshiruvni Yakunlash</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
