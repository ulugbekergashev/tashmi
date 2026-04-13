import { useState, useRef, useEffect } from 'react';
import {
  UserCircle, Send, Activity, Thermometer, Heart, Droplets,
  AlertCircle, CheckCircle2, RotateCcw, FlaskConical, BookOpen, Loader2,
  Stethoscope, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { VirtualPatient } from '../types';
import { generateVirtualPatient, chatWithPatient, evaluateDiagnosis, generateTestResult, EvaluationResult, generateDDx, DDxItem } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface VirtualPatientModuleProps {
  onNavigate?: (page: string) => void;
}

const TEST_ORDERS = [
  { label: 'EKG', icon: '❤️' },
  { label: 'Troponin', icon: '🩸' },
  { label: 'Qon tahlili', icon: '🔬' },
  { label: 'ExoKG', icon: '📡' },
  { label: 'MRT', icon: '🧲' },
];

const STEP_LABELS = ['Anamnez', 'Tekshiruv', 'Differentsial', 'Davo'];

export default function VirtualPatientModule({ onNavigate }: VirtualPatientModuleProps) {
  const [selectedPatient, setSelectedPatient] = useState<VirtualPatient | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string, isTest?: boolean }[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [orderedTests, setOrderedTests] = useState<Set<string>>(new Set());
  const [orderingTest, setOrderingTest] = useState<string | null>(null);
  const [ddx, setDdx] = useState<DDxItem[]>([]);
  const [isUpdatingDdx, setIsUpdatingDdx] = useState(false);
  const ddxTriggerRef = useRef<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // helper to refresh DDx
  const refreshDdx = async (
    patient: import('../types').VirtualPatient,
    history: typeof chatHistory,
    tests: Set<string>
  ) => {
    setIsUpdatingDdx(true);
    try {
      const result = await generateDDx(patient, history, Array.from(tests));
      setDdx(result);
    } catch {
      // silent — DDx is optional
    } finally {
      setIsUpdatingDdx(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  // Derive completed steps
  const userMsgs = chatHistory.filter(m => m.role === 'user' && !m.isTest).length;
  const completedSteps = [
    userMsgs >= 3,
    orderedTests.size > 0,
    userMsgs >= 6,
    diagnosis.length > 0,
  ];

  const handleStartCase = async (topic: string) => {
    setIsGenerating(true);
    setEvaluation(null);
    setDiagnosis('');
    setOrderedTests(new Set());
    setDdx([]);
    try {
      const patient = await generateVirtualPatient(topic, undefined, { complexity: 'clinical', depth: 'summary', focus: 'all', language: 'uz' });
      setSelectedPatient(patient);
      setChatHistory([{ role: 'model', text: patient.opening }]);
    } catch {
      toast.error("Bemor yaratishda xatolik");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedPatient || isTyping) return;
    const userMsg = message;
    setMessage('');
    const newHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsTyping(true);
    try {
      const response = await chatWithPatient(selectedPatient, chatHistory, userMsg);
      const updated = [...newHistory, { role: 'model' as const, text: response || "..." }];
      setChatHistory(updated);
      // Refresh DDx every 3 user messages
      const userCount = updated.filter(m => m.role === 'user' && !(m as any).isTest).length;
      ddxTriggerRef.current = userCount;
      if (userCount > 0 && userCount % 3 === 0) {
        refreshDdx(selectedPatient, updated, orderedTests);
      }
    } catch {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setIsTyping(false);
    }
  };

  const handleOrderTest = async (testLabel: string) => {
    if (!selectedPatient || orderedTests.has(testLabel)) return;
    setOrderingTest(testLabel);
    setChatHistory(prev => [...prev, {
      role: 'user',
      text: `📋 ${testLabel} buyurdim`,
      isTest: true
    }]);
    try {
      const result = await generateTestResult(selectedPatient, testLabel);
      const newHistory: typeof chatHistory = [
        ...chatHistory,
        { role: 'user', text: `📋 ${testLabel} buyurdim`, isTest: true },
        { role: 'model', text: `🔬 ${testLabel} natijasi:\n${result}`, isTest: true },
      ];
      setChatHistory(newHistory);
      const newTests = new Set([...orderedTests, testLabel]);
      setOrderedTests(newTests);
      // Always refresh DDx after a test
      refreshDdx(selectedPatient, newHistory, newTests);
    } catch {
      toast.error("Test natijasini olishda xatolik");
    } finally {
      setOrderingTest(null);
    }
  };

  const handleEvaluate = async () => {
    if (!diagnosis.trim() || !selectedPatient) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateDiagnosis(selectedPatient, chatHistory, diagnosis);
      setEvaluation(result);
    } catch {
      toast.error("Baholashda xatolik");
    } finally {
      setIsEvaluating(false);
    }
  };

  /* ──── LOADING ──── */
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-med-blue/20 border-t-med-blue rounded-full animate-spin" />
        <p className="text-text-2">Bemor tayyorlanmoqda...</p>
      </div>
    );
  }

  /* ──── CASE SELECTION ──── */
  if (!selectedPatient) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Virtual bemor tanlash</h1>
          <p className="text-text-2">Klinik ko'nikmalaringizni real holatlarda sinab ko'ring.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 14, age: 58, gender: '♂', topic: "Ko'krak og'rig'i", diff: 3 },
            { id: 15, age: 34, gender: '♀', topic: 'Bosh aylanishi', diff: 2 },
            { id: 16, age: 72, gender: '♂', topic: 'Oyoq shishi', diff: 4 },
          ].map(c => (
            <Card key={c.id} className="bg-bg-card border-border-custom hover:border-med-blue transition-all duration-200 group card-hover">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-text-3">
                    <UserCircle className="w-8 h-8" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">#{c.id}</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{c.age} yosh {c.gender}</h3>
                  <p className="text-sm text-text-2">{c.topic}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className={cn('w-1.5 h-1.5 rounded-full', s <= c.diff ? 'bg-med-yellow' : 'bg-border-custom')} />
                  ))}
                </div>
                <button
                  onClick={() => handleStartCase(c.topic)}
                  className="w-full py-2.5 bg-bg-secondary hover:bg-med-blue text-text-1 hover:text-white rounded-lg text-sm font-medium transition-all active:scale-95"
                >
                  Boshlash
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-med-blue/5 border-med-blue/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-med-blue/20 flex items-center justify-center text-med-blue">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-med-blue uppercase tracking-wider">Tavsiya etilgan</p>
                <p className="text-text-1">Zaif joyingiz uchun: Farmakologiya aralash case</p>
              </div>
            </div>
            <button
              onClick={() => handleStartCase('Farmakologiya')}
              className="px-6 py-2 bg-med-blue text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors active:scale-95"
            >
              Boshlash #17 →
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ──── EVALUATION RESULT SCREEN ──── */
  if (evaluation) {
    const metrics = [
      { label: 'Anamnez', value: evaluation.breakdown.anamnesis },
      { label: 'Tekshiruv', value: evaluation.breakdown.examination },
      { label: 'Diagnoz', value: evaluation.breakdown.diagnosis },
      { label: 'Davo', value: evaluation.breakdown.treatment },
      { label: 'Xavfsizlik', value: evaluation.breakdown.safety },
    ];
    const totalScore = metrics.reduce((s, m) => s + m.value, 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto py-8 space-y-8"
      >
        {/* Score header */}
        <div className="text-center p-8 bg-bg-card rounded-2xl border border-border-custom space-y-2">
          <p className="text-xs font-bold text-med-blue uppercase tracking-widest">Umumiy ball</p>
          <div className="text-6xl font-bold text-text-1">
            {totalScore}
            <span className="text-2xl text-text-3 font-normal"> / 100</span>
          </div>
          <div className="h-3 bg-bg-secondary rounded-full overflow-hidden mt-4">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                totalScore >= 70 ? 'bg-med-green' : totalScore >= 40 ? 'bg-med-blue' : 'bg-med-yellow'
              )}
              style={{ width: `${totalScore}%` }}
            />
          </div>
        </div>

        {/* 5 metrics */}
        <div className="space-y-4 p-6 bg-bg-card rounded-2xl border border-border-custom">
          {metrics.map(m => (
            <div key={m.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-text-3">{m.label}</span>
                <span className="text-text-1">{m.value}/20</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    m.value >= 15 ? 'bg-med-green' : m.value >= 8 ? 'bg-med-blue' : 'bg-med-yellow'
                  )}
                  style={{ width: `${(m.value / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI feedback */}
        <div className="p-5 bg-bg-secondary rounded-2xl border border-border-custom space-y-2">
          <div className="flex items-center gap-2 text-med-blue">
            <BookOpen className="w-4 h-4" />
            <p className="text-xs font-bold uppercase">AI fikri:</p>
          </div>
          <p className="text-sm text-text-2 leading-relaxed">{evaluation.feedback}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setSelectedPatient(null); setEvaluation(null); setDiagnosis(''); setChatHistory([]); setOrderedTests(new Set()); setDdx([]); }}
            className="flex-1 py-3 bg-bg-secondary border border-border-custom rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-bg-card transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Qayta urinish
          </button>
          {evaluation.weak_topic && (
            <button
              onClick={() => { onNavigate?.('learn'); toast.info(`"${evaluation.weak_topic}" mavzusi ochilmoqda`); }}
              className="flex-1 py-3 bg-med-blue hover:bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Zaif mavzuni o'rganish
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ──── CHAT SCREEN (3-column grid) ──── */
  return (
    <div
      className="h-[calc(100vh-140px)]"
      style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: '16px' }}
    >
      {/* ── LEFT: Patient info (220px) ── */}
      <div className="flex flex-col gap-4 overflow-hidden">
        <Card className="bg-bg-card border-border-custom flex-shrink-0">
          <CardContent className="p-4 space-y-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-med-blue/20 flex items-center justify-center text-med-blue font-bold text-lg shrink-0">
                {selectedPatient.patient.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{selectedPatient.patient.name}</p>
                <p className="text-[11px] text-text-3">{selectedPatient.patient.age} yosh, {selectedPatient.patient.gender}</p>
              </div>
            </div>

            {/* Vitals */}
            <div className="space-y-2 pt-1 border-t border-border-custom">
              {[
                { icon: Activity,     label: 'AQ',   value: '130/80' },
                { icon: Heart,        label: 'YU',   value: '78 urish' },
                { icon: Thermometer,  label: 'T°',   value: '36.6°C' },
                { icon: Droplets,     label: 'SpO2', value: '97%' },
              ].map(v => (
                <div key={v.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-text-3">
                    <v.icon className="w-3.5 h-3.5" />
                    <span>{v.label}</span>
                  </div>
                  <span className="font-mono text-text-1 text-[11px]">{v.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ordered tests list */}
        {orderedTests.size > 0 && (
          <Card className="bg-bg-card border-border-custom">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Buyurilgan testlar
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              {Array.from(orderedTests).map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-med-green">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── CENTER: Chat (flex) ── */}
      <div className="flex flex-col gap-3 min-w-0 overflow-hidden">
        <Card className="flex-1 bg-bg-card border-border-custom flex flex-col overflow-hidden">
          {/* Chat messages — native scroll so ref.scrollTop works */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="space-y-3">
              {chatHistory.map((chat, i) => (
                <div
                  key={i}
                  className={cn('flex', chat.role === 'user' ? 'justify-end' : 'items-start gap-2')}
                >
                  {chat.role === 'model' && (
                    <div className="w-7 h-7 rounded-full bg-med-blue/20 flex items-center justify-center text-med-blue shrink-0 mt-1">
                      <UserCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                      chat.role === 'user'
                        ? 'bg-[#1E3A5F] text-text-1 rounded-tr-none'
                        : 'bg-[#1A2235] text-text-1 rounded-tl-none border border-border-custom',
                      chat.isTest && 'border border-med-blue/20 font-mono text-xs whitespace-pre-wrap'
                    )}
                  >
                    {chat.text}
                  </div>
                </div>
              ))}
              {(isTyping || orderingTest) && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-med-blue/20 flex items-center justify-center text-med-blue shrink-0">
                    <UserCircle className="w-4 h-4" />
                  </div>
                  <div className="bg-[#1A2235] border border-border-custom px-4 py-3 rounded-2xl rounded-tl-none">
                    {orderingTest ? (
                      <span className="text-xs text-text-3 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {orderingTest} tahlil qilinmoqda...
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        {[0, 1, 2].map(d => (
                          <div
                            key={d}
                            className="w-1.5 h-1.5 bg-text-3 rounded-full animate-bounce"
                            style={{ animationDelay: `${d * 0.2}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border-custom bg-bg-secondary/50">
            <div className="flex gap-2">
              <Input
                placeholder="Bemorga savol bering..."
                className="bg-bg-card border-border-custom h-11 text-sm"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !message.trim()}
                className="w-11 h-11 bg-med-blue hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* ── RIGHT: Checklist + Order + Diagnosis (260px) ── */}
      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* Steps checklist */}
        <Card className="bg-bg-card border-border-custom">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
              Bosqichlar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {STEP_LABELS.map((step, i) => (
              <div key={step} className="flex items-center gap-2.5 text-xs">
                <div className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all',
                  completedSteps[i]
                    ? 'bg-med-green border-med-green text-white'
                    : 'border-border-custom'
                )}>
                  {completedSteps[i] && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <span className={completedSteps[i] ? 'text-med-green font-medium' : 'text-text-3'}>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DDx Panel */}
        <Card className="bg-bg-card border-border-custom">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-text-3 uppercase tracking-widest flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5" />
              Diff. Tashxis (DDx)
              {isUpdatingDdx && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
              {!isUpdatingDdx && selectedPatient && chatHistory.length >= 2 && (
                <button
                  onClick={() => refreshDdx(selectedPatient, chatHistory, orderedTests)}
                  className="ml-auto text-text-3 hover:text-med-blue transition-colors"
                  title="DDx yangilash"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {ddx.length === 0 ? (
              <p className="text-[10px] text-text-3 italic text-center py-2">
                {chatHistory.length < 2
                  ? 'Suhbat boshlansin...'
                  : isUpdatingDdx
                  ? 'Yangilanmoqda...'
                  : 'Test buyuring yoki ↔ bosing'}
              </p>
            ) : (
              ddx.map((item, i) => (
                <motion.div
                  key={item.diagnosis}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-text-1 truncate max-w-[140px]" title={item.diagnosis}>
                      {i + 1}. {item.diagnosis}
                    </span>
                    <span className={cn(
                      'font-bold shrink-0',
                      item.probability >= 60 ? 'text-med-red' :
                      item.probability >= 35 ? 'text-med-yellow' : 'text-text-3'
                    )}>{item.probability}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.probability}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        item.probability >= 60 ? 'bg-med-red' :
                        item.probability >= 35 ? 'bg-med-yellow' : 'bg-text-3'
                      )}
                    />
                  </div>
                  <p className="text-[9px] text-text-3 italic truncate" title={item.key_finding}>
                    💡 {item.key_finding}
                  </p>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Order tests */}
        <Card className="bg-bg-card border-border-custom">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-text-3 uppercase tracking-widest flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5" />
              Tekshiruvlar buyurish
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {TEST_ORDERS.map(t => (
              <button
                key={t.label}
                onClick={() => handleOrderTest(t.label)}
                disabled={orderedTests.has(t.label) || orderingTest !== null}
                className={cn(
                  'w-full py-2 px-3 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition-all border',
                  orderedTests.has(t.label)
                    ? 'bg-med-green/10 border-med-green/20 text-med-green cursor-default'
                    : orderingTest === t.label
                    ? 'bg-med-blue/10 border-med-blue/20 text-med-blue cursor-wait'
                    : 'bg-bg-secondary border-border-custom hover:border-med-blue hover:text-med-blue text-text-2 active:scale-95'
                )}
              >
                <span>{t.icon}</span>
                <span className="flex-1">{t.label}</span>
                {orderedTests.has(t.label) && <CheckCircle2 className="w-3 h-3" />}
                {orderingTest === t.label && <Loader2 className="w-3 h-3 animate-spin" />}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Diagnosis input / Evaluate */}
        <Card className="bg-bg-card border-border-custom flex-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
              Tashxis va davo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <textarea
              placeholder="Tashxis va davo rejasini yozing..."
              className="w-full h-28 bg-bg-secondary border border-border-custom rounded-xl p-3 text-xs focus:outline-none focus:border-med-blue transition-colors resize-none text-text-1"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !diagnosis.trim()}
              className="w-full py-3 bg-med-green hover:bg-green-600 text-white rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isEvaluating ? <><Loader2 className="w-3 h-3 animate-spin" />Baholanmoqda...</> : 'Yakunlash va Baholash'}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
