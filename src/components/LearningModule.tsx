import { useState, useRef, useEffect } from 'react';
import {
  Search, Sparkles, Library, Map as MapIcon, Mic, UserCircle,
  ChevronRight, RotateCcw, FileText, Layout, Play, Brain,
  ListChecks, HelpCircle, ArrowLeft, ArrowRight, Upload, X, File, Plus, MoreVertical, Clock, Book, Dna, Presentation as PresentationIcon, Target
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { generateFlashcards, generateMindMap, generateAudioPodcast, generateVirtualPatient, generateQuiz, generatePresentation } from '../services/gemini';
import { Flashcard, MindMap as MindMapType, AudioPodcast, VirtualPatient, Quiz, Presentation } from '../types';
import MindMap from './MindMap';
import PatientChat from './PatientChat';
import FlashcardStudy from './FlashcardStudy';
import QuizModule from './QuizModule';
import AudioPlayer from './AudioPlayer';
import Slideshow from './Slideshow';
import { ingestFile } from '../services/ingest';
import GenerationOptionsModal from './GenerationOptionsModal';
import { GenerationConfig } from '../types';

type Tool = 'flashcards' | 'quiz' | 'mindmap' | 'podcast' | 'patient' | 'overview';

interface LearningModuleProps {
  initialTopic?: string;
}

export default function LearningModule({ initialTopic }: LearningModuleProps) {
  const [subject, setSubject] = useState('Anatomiya');
  const [topic, setTopic] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [config, setConfig] = useState<GenerationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<{
    flashcards: Flashcard[];
    mindMap: MindMapType | null;
    podcast: AudioPodcast | null;
    patient: VirtualPatient | null;
    quiz: Quiz | null;
    presentation: Presentation | null;
  } | null>(null);

  const [activeTool, setActiveTool] = useState<Tool>('overview');
  const [showFlashcardStudy, setShowFlashcardStudy] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  // Auto-connect from Roadmap
  useEffect(() => {
    if (initialTopic && !data && !isLoading) {
      setTopic(initialTopic);
      setTimeout(() => handleGenerate(initialTopic), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingSteps = [
    'Mavzu tahlil qilinmoqda',
    'Fayl mazmuni tahlil qilinmoqda...',
    'Kartalar va o\'quv slaydlari tuzilmoqda...',
    'Mind map va simulyatsiya loyihalanmoqda...',
    'Audio podcast generatsiya qilinmoqda',
  ];

  /* ── File upload ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsParsing(true);
    const toastId = toast.loading(`${file.name} tahlil qilinmoqda...`);
    
    try {
      const result = await ingestFile(file);
      setMaterialText(result.fullText);
      setUploadedFileName(file.name);
      if (!topic) setTopic(file.name.replace(/\.[^.]+$/, ''));
      toast.success(`"${file.name}" yuklandi va tahlil qilindi`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Faylni tahlil qilishda xatolik yuz berdi', { id: toastId });
    } finally {
      setIsParsing(false);
      // reset so same file can be re-selected
      e.target.value = '';
    }
  };

  const clearFile = () => {
    setMaterialText('');
    setUploadedFileName('');
  };

  /* ── Generate ── */
  const handleGenerateClick = (manualTopic?: string) => {
    const currentTopic = manualTopic || topic;
    if (!currentTopic) {
      toast.error('Iltimos, mavzuni kiriting');
      return;
    }
    if (manualTopic) setTopic(manualTopic);
    setShowOptions(true);
  };

  const startGeneration = async (generationConfig: GenerationConfig) => {
    setShowOptions(false);
    setConfig(generationConfig);
    const q = topic;
    setIsLoading(true);
    setLoadingStep(0);
    setData(null);
    setActiveTool('overview');

    try {
      const stepInterval = setInterval(() => {
        setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 2000);

      const ctx = materialText || undefined;
      const [flashcards, mindMap, podcast, patient, quiz, presentation] = await Promise.all([
        generateFlashcards(subject, q, ctx, generationConfig),
        generateMindMap(subject, q, ctx, generationConfig),
        generateAudioPodcast(q, ctx),
        generateVirtualPatient(q, ctx, generationConfig),
        generateQuiz(subject, q, ctx, generationConfig),
        generatePresentation(q, ctx, generationConfig),
      ]);

      clearInterval(stepInterval);
      setData({ flashcards, mindMap, podcast, patient, quiz, presentation });
    } catch (error) {
      console.error(error);
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Loading screen ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-10">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 border-4 border-med-blue/10 border-t-med-blue rounded-full"
          />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-med-blue" />
        </div>
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold font-heading">Gemini siz uchun notebook tayyorlamoqda...</h2>
          <div className="space-y-3 text-left w-72 mx-auto">
            {loadingSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={cn(
                  'w-3 h-3 rounded-full transition-all duration-500',
                  loadingStep > i ? 'bg-med-green scale-110' : loadingStep === i ? 'bg-med-blue animate-pulse scale-125' : 'bg-border-custom'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  loadingStep > i ? 'text-med-green' : loadingStep === i ? 'text-text-1' : 'text-text-3'
                )}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Initial / search screen ── */
  /* ── NotebookLM Style View (Empty State) ── */
  if (!data) {
    return (
      <>
        <div className="max-w-[1400px] mx-auto h-full flex flex-col min-h-0 pb-10 space-y-12">
        
        {/* Minimal Hero Search Section */}
        <section className="flex flex-col items-center justify-center pt-20 pb-16 space-y-8 text-center bg-gradient-to-b from-med-blue/5 to-transparent rounded-[3rem] border border-med-blue/10">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold font-heading">Sizning AI Bloknotingiz</h1>
            <p className="text-text-3 text-lg max-w-xl mx-auto">
              Tibbiy manbalarni yuklang yoki mavzu yozing. AI darslik, savol-javoblar va podkastlarni taxt qilib beradi.
            </p>
          </div>
          
          <div className="w-full max-w-[700px] flex gap-3 px-6">
             <div className="flex-1 relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-3 group-focus-within:text-med-blue transition-colors" />
               <Input
                 placeholder="Mavzuni kiritib Enterni bosing ёки fayl yuklang..."
                 className="w-full h-16 pl-14 pr-14 bg-bg-card border-2 border-border-custom rounded-2xl text-lg focus-visible:ring-med-blue focus-visible:border-med-blue transition-all shadow-xl"
                 value={topic}
                 onChange={e => setTopic(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleGenerateClick()}
               />
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".txt,.pdf,.docx,.doc,.md"
                 className="hidden"
                 onChange={handleFileUpload}
               />
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${uploadedFileName ? 'text-med-green bg-med-green/10' : 'text-text-3 hover:text-text-1 hover:bg-bg-secondary'}`}
                 title={uploadedFileName || "Fayl yuklash"}
               >
                 {uploadedFileName ? <File className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
               </button>
             </div>
             <Button
               onClick={() => handleGenerateClick()}
               className="bg-med-blue hover:bg-blue-600 text-white px-8 h-16 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-med-blue/20 shrink-0"
             >
               Yaratish
             </Button>
          </div>
        </section>

        {/* Recent Notebooks Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold font-heading">Yaqinda o'rganilgan darslar</h2>
            <Button variant="ghost" className="text-text-3 hover:text-med-blue font-bold px-4">Hammasini ko'rish</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Create New Card */}
            <Card 
              className="group h-[240px] border-2 border-dashed border-border-custom bg-transparent hover:border-med-blue/40 hover:bg-med-blue/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 rounded-[2rem]"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center group-hover:bg-med-blue/10 group-hover:scale-110 transition-all">
                <Plus className="w-8 h-8 text-text-3 group-hover:text-med-blue" />
              </div>
              <span className="font-bold text-text-3 group-hover:text-med-blue">Yangi bloknot yaratish</span>
            </Card>

            {/* Mock Recent Notebooks */}
            {[
              { title: "Yurak yetishmovchiligi", color: "bg-emerald-500", icon: Brain, sources: 3, date: "12-aprel" },
              { title: "O'pka patologiyasi", color: "bg-sky-500", icon: FileText, sources: 1, date: "10-aprel" },
              { title: "Gematologiya asoslari", color: "bg-rose-500", icon: Dna, sources: 7, date: "Kecha" },
              { title: "Nevrologik tekshiruv", color: "bg-amber-500", icon: MapIcon, sources: 2, date: "Bugun" },
            ].map((nb, i) => (
              <Card 
                key={i} 
                className="group h-[240px] bg-bg-card border border-border-custom hover:border-med-blue/40 transition-all cursor-pointer rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm hover:shadow-xl"
                onClick={() => handleGenerateClick(nb.title)}
              >
                <div className={`h-24 ${nb.color}/20 flex items-center justify-center relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${nb.color} opacity-10`} />
                  <nb.icon className={`w-10 h-10 ${nb.color.replace('bg-', 'text-')}`} />
                  <button className="absolute top-4 right-4 p-2 text-text-3 hover:text-text-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-med-blue transition-colors line-clamp-2">{nb.title}</h3>
                  <div className="flex items-center justify-between text-[11px] font-bold text-text-3 uppercase tracking-widest border-t border-border-custom pt-4">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {nb.date}</span>
                    <span className="flex items-center gap-1.5"><Book className="w-3 h-3" /> {nb.sources} manba</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Suggested Resources / Fantaziya */}
        <section className="pt-8 space-y-6">
          <h2 className="text-2xl font-bold font-heading px-2">Tavsiya etilgan qo'llanmalar</h2>
          <div className="flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-none">
            {[
              { title: "Harrison's Internal Medicine", author: "Dan Longo", year: "2023", icon: "📚" },
              { title: "Lancet: Cardiology Review", author: "Multiple Authors", year: "2024", icon: "🔬" },
              { title: "Oxford Handbook of Clinical Med", author: "Ian Wilkinson", year: "2022", icon: "📘" },
              { title: "MedAI: Cardiovascular Guide", author: "AI Generated", year: "2024", icon: "🤖" },
            ].map((book, i) => (
              <div key={i} className="min-w-[300px] p-6 bg-bg-card border border-border-custom rounded-3xl flex items-center gap-4 hover:bg-bg-secondary transition-colors cursor-pointer shadow-sm">
                <div className="text-3xl">{book.icon}</div>
                <div>
                  <h4 className="font-bold text-sm">{book.title}</h4>
                  <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">{book.author} • {book.year}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        </div>
        <GenerationOptionsModal 
          isOpen={showOptions} 
          onClose={() => setShowOptions(false)} 
          onConfirm={startGeneration}
          topic={topic}
        />
      </>
    );
  }

  /* ── Omni-Dashboard View (STUDIO) ── */
  const menuItems = [
    { id: 'overview', label: 'Umumiy', icon: Layout },
    { id: 'slides', label: 'Slaydlar', icon: PresentationIcon },
    { id: 'mindmap', label: 'Mind Map', icon: MapIcon },
    { id: 'podcast', label: 'Audio', icon: Mic },
    { id: 'flashcards', label: 'Kartalar', icon: Library },
    { id: 'quiz', label: 'Test', icon: ListChecks },
    { id: 'patient', label: 'Bemor', icon: UserCircle },
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#020617] h-[calc(100vh-130px)] rounded-[3rem] border border-white/5 mx-2 mb-2 shadow-2xl">
      
      {/* STUDIO SIDEBAR */}
      <aside className="w-20 md:w-64 flex flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-3xl shrink-0">
        <div className="p-6 border-b border-white/5 space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-med-blue flex items-center justify-center shadow-lg shadow-med-blue/20">
               <Brain className="w-5 h-5 text-white" />
             </div>
             <div className="hidden md:block overflow-hidden">
               <h3 className="text-white font-bold text-sm truncate">{topic}</h3>
               <p className="text-[10px] text-text-3 font-bold uppercase tracking-widest leading-none">Notebook Studio</p>
             </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTool === item.id;
            const hasData = (item.id === 'overview') || 
                            (item.id === 'slides' && data?.presentation) ||
                            (item.id === 'mindmap' && data?.mindMap) ||
                            (item.id === 'podcast' && data?.podcast) ||
                            (item.id === 'flashcards' && data?.flashcards) ||
                            (item.id === 'quiz' && data?.quiz) ||
                            (item.id === 'patient' && data?.patient);

            if (!hasData) return null;

            return (
              <button
                key={item.id}
                onClick={() => { setActiveTool(item.id as Tool); setShowFlashcardStudy(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group",
                  isActive 
                    ? "bg-med-blue text-white shadow-lg shadow-med-blue/20" 
                    : "text-text-3 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-text-3 group-hover:text-med-blue")} />
                <span className="hidden md:block font-bold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
           <Button 
             variant="ghost" 
             onClick={() => { setData(null); clearFile(); }} 
             className="w-full h-12 rounded-xl text-text-3 hover:text-red-400 hover:bg-red-400/5 group"
           >
             <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
             <span className="hidden md:block">Yangi mavzu</span>
           </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative p-8 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {activeTool === 'overview' && (
              <div className="space-y-16 max-w-6xl mx-auto py-12 px-6">
                {/* Executive Summary Hero */}
                <div className="relative p-16 rounded-[5rem] bg-white/[0.02] border border-white/10 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl group">
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-med-blue/5 blur-[150px] rounded-full -mr-64 -mt-64 group-hover:bg-med-blue/10 transition-colors duration-1000" />
                   <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-med-purple/5 blur-[150px] rounded-full -ml-48 -mb-48" />
                   
                   <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-med-blue flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                            <Sparkles className="w-7 h-7 text-white" />
                         </div>
                         <Badge segment="top" className="bg-white/5 text-text-3 border-white/10 px-6 py-2 rounded-xl backdrop-blur-xl text-xs font-black uppercase tracking-[0.2em]">Konspektiv Tahlil</Badge>
                      </div>

                      <div className="space-y-4">
                         <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase">{topic}</h1>
                         <p className="text-text-2 text-2xl max-w-4xl leading-relaxed font-semibold opacity-90">
                           Ushbu intellektual o'quv notebooki {uploadedFileName ? `"${uploadedFileName}"` : 'kiritilgan manba'} asosida 
                           chuqur tibbiy tahlil qilinib, strategik o'quv rejasiga aylantirildi.
                         </p>
                      </div>
                      
                      <div className="flex gap-6 pt-6">
                         <Button onClick={() => setActiveTool('slides')} className="bg-white text-black hover:scale-105 active:scale-95 transition-all rounded-[1.5rem] h-16 px-10 font-black text-lg gap-3 shadow-2xl shadow-white/10">
                            <PresentationIcon className="w-6 h-6" /> Slaydlarni o'rganish
                         </Button>
                         <Button onClick={() => setActiveTool('flashcards')} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all rounded-[1.5rem] h-16 px-10 font-black text-lg gap-3">
                            <Brain className="w-6 h-6 text-med-blue" /> Xotira mashqi
                         </Button>
                      </div>
                   </div>
                </div>

                {/* Grid Stats Elevated */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   {[
                     { label: 'O\'quv Kartalari', val: data?.flashcards.length, icon: Library, color: 'text-med-blue', bg: 'bg-med-blue/10' },
                     { label: 'Klinik Testlar', val: data?.quiz?.questions.length, icon: ListChecks, color: 'text-med-green', bg: 'bg-med-green/10' },
                     { label: 'Struktura', val: data?.mindMap?.branches?.length || '3', icon: MapIcon, color: 'text-med-purple', bg: 'bg-med-purple/10' },
                     { label: 'Audio Epizod', val: '1', icon: Mic, color: 'text-med-yellow', bg: 'bg-med-yellow/10' },
                   ].map((s, i) => (
                     <div key={i} className="group p-10 rounded-[3.5rem] bg-white/[0.01] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all flex flex-col items-center text-center space-y-6">
                        <div className={cn("w-16 h-16 rounded-[1.75rem] flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                           <s.icon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                           <div className="text-4xl font-black text-white">{s.val || 0}</div>
                           <div className="text-[10px] font-black text-text-3 uppercase tracking-[0.3em]">{s.label}</div>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Roadmap & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                   <div className="lg:col-span-3 space-y-8">
                      <div className="flex items-center gap-4 px-2">
                         <Target className="w-7 h-7 text-med-blue" />
                         <h3 className="text-2xl font-black text-white uppercase tracking-tighter">O'rganish Strategiyasi</h3>
                      </div>
                      <div className="space-y-4">
                         {[
                           { title: 'Dastlabki Vizualizatsiya', desc: 'Mind map orqali mavzuning murakkab ierarxiyasini o\'zlashtiring', tool: 'mindmap', icon: MapIcon },
                           { title: 'Audio Assimilatsiya', desc: 'Podcast yordamida klinik tushunchalarni tinglab o\'rganing', tool: 'podcast', icon: Mic },
                           { title: 'Amaliy Simulyatsiya', desc: 'Virtual bemor bilan gaplashib, bilimlaringizni sinovdan o\'tkazing', tool: 'patient', icon: UserCircle },
                         ].map((item, i) => (
                           <div 
                             key={i} 
                             onClick={() => setActiveTool(item.tool as Tool)}
                             className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-med-blue/30 hover:bg-med-blue/5 transition-all cursor-pointer flex items-center justify-between group"
                           >
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-text-3 group-hover:text-med-blue group-hover:bg-med-blue/20 transition-all">
                                    <item.icon className="w-7 h-7" />
                                 </div>
                                 <div className="space-y-1">
                                    <h4 className="text-xl font-black text-white tracking-tight">{item.title}</h4>
                                    <p className="text-text-3 font-medium">{item.desc}</p>
                                 </div>
                              </div>
                              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                 <ChevronRight className="w-6 h-6" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="lg:col-span-2 space-y-8">
                      <div className="flex items-center gap-4 px-2">
                         <Dna className="w-7 h-7 text-med-purple" />
                         <h3 className="text-2xl font-black text-white uppercase tracking-tighter">AI Insights</h3>
                      </div>
                      <Card className="bg-[#0F172A] border border-white/10 rounded-[4rem] p-10 space-y-10 h-full shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-med-purple/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                         
                         <div className="space-y-4">
                            <Badge className="bg-med-purple/10 text-med-purple border-med-purple/20 px-4 py-1 uppercase text-[9px] font-black tracking-widest">Medical Hack</Badge>
                            <p className="text-2xl font-bold text-white leading-relaxed italic">
                               "Ushbu mavzuning 70% savollari aynan patofiziologiya va diagnostika kriteriyalari atrofida aylanadi."
                            </p>
                         </div>

                         <div className="space-y-6 pt-10 border-t border-white/5">
                            <div className="flex items-center justify-between">
                               <span className="text-[11px] font-black text-text-3 uppercase tracking-widest">Mavzu darajasi</span>
                               <Badge className="bg-med-red/10 text-med-red border-med-red/20 px-3 py-1 font-black uppercase text-[10px]">Professional</Badge>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between text-[11px] font-black text-text-3 uppercase tracking-widest">
                                  <span>O'zlashtirish kutilmasi</span>
                                  <span className="text-white">92%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                   <div className="h-full bg-med-blue w-[92%] shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                         </div>

                         <div className="p-6 bg-white/[0.03] rounded-[2.5rem] border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                               <Sparkles className="w-4 h-4 text-med-yellow" />
                               <span className="text-[10px] font-black text-med-yellow uppercase tracking-[0.2em]">Strategik tavsiya</span>
                            </div>
                            <p className="text-sm text-text-3 font-medium leading-relaxed">
                               Ertaga ertalabki podcast epizodini tinglaganingizdan so'ng, flashcardlarni bir bor takrorlashingiz xotirada 40% ko'proq qolishini ta'minlaydi.
                            </p>
                         </div>
                      </Card>
                   </div>
                </div>
              </div>
            )}

            {activeTool === 'slides' && data.presentation && (
              <div className="h-full flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white">Slaydlar Studio</h2>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-text-3 px-4 py-1.5 rounded-full">Elite Medical Presentation</Badge>
                </div>
                <Slideshow data={data.presentation} />
              </div>
            )}

            {activeTool === 'mindmap' && data.mindMap && (
              <div className="h-full flex flex-col space-y-8 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="text-3xl font-black text-white">Hierarchical Tree Map</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-med-blue animate-pulse" />
                    <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Dinamik tuzilma</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-[3rem] p-4 relative overflow-hidden shadow-inner">
                  <MindMap 
                    data={data.mindMap}
                    onNodeClick={(node) => setActiveTool('flashcards')}
                  />
                </div>
              </div>
            )}

            {activeTool === 'flashcards' && data.flashcards && (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  <FlashcardStudy cards={data.flashcards} onBack={() => setActiveTool('overview')} onComplete={() => setActiveTool('overview')} />
                </div>
              </div>
            )}

        {activeTool === 'quiz' && data.quiz && (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  <QuizModule quiz={data.quiz} onComplete={() => {}} onBack={() => setActiveTool('overview')} />
                </div>
              </div>
            )}

            {activeTool === 'patient' && data.patient && (
              <div className="h-full flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white">Virtual Klinika</h2>
                  <Badge className="bg-med-red/20 text-med-red border-med-red/20">Critical Patient Case</Badge>
                </div>
                <div className="flex-1 min-h-0 border border-white/5 rounded-[3.5rem] overflow-hidden bg-white/[0.01]">
                   <PatientChat patient={data.patient} onBack={() => setActiveTool('overview')} />
                </div>
              </div>
            )}

            {activeTool === 'podcast' && data.podcast && (
              <div className="h-full w-full rounded-[3rem] overflow-hidden border border-white/5 bg-white/[0.02]">
                <AudioPlayer title={data.podcast.title} script={data.podcast.script} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FLOATING SOCRATIC TUTOR (Integrated) */}
      <AnimatePresence>
        {!isTutorOpen && (
          <motion.button 
            initial={{ scale: 0, rotate: -20 }} 
            animate={{ scale: 1, rotate: 0 }} 
            exit={{ scale: 0, rotate: 20 }}
            onClick={() => setIsTutorOpen(true)}
            className="fixed bottom-10 right-10 w-20 h-20 bg-med-blue rounded-[2.5rem] shadow-2xl shadow-med-blue/40 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-[60] group border-4 border-[#020617]"
          >
            <Brain className="w-10 h-10 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-med-red rounded-full border-4 border-[#020617] flex items-center justify-center text-[10px] font-black">1</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTutorOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.95 }} 
            animate={{ opacity: 1, x: 0, scale: 1 }} 
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className="fixed top-32 bottom-32 right-10 w-[450px] bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 shadow-3xl rounded-[3rem] overflow-hidden flex flex-col z-[70] shadow-blue-900/40"
          >
            <div className="p-8 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-med-blue flex items-center justify-center shadow-lg shadow-med-blue/30 relative">
                  <Brain className="w-7 h-7 text-white" />
                  <span className="absolute top-0 right-0 w-4 h-4 bg-med-green rounded-full border-4 border-[#0F172A]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Study AI Tutor</h3>
                  <p className="text-[10px] text-text-3 font-bold uppercase tracking-widest leading-none mt-1">Kontekst: {topic}</p>
                </div>
              </div>
              <button onClick={() => setIsTutorOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-text-2" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-med-blue/20 flex items-center justify-center shrink-0">
                   <Sparkles className="w-5 h-5 text-med-blue" />
                 </div>
                 <div className="p-5 bg-white/5 border border-white/5 text-lg text-text-2 rounded-3xl rounded-tl-none leading-relaxed shadow-sm italic">
                   "Salom! Men sizning <strong>{topic}</strong> bo'yicha shaxsiy repetitoringizman. 
                   Hozirgi barcha o'quv materiallari mening xotiramda. Qaysi qismda qiynalyapsiz?"
                 </div>
               </div>
            </div>

            <div className="p-8 bg-white/5 border-t border-white/5">
               <div className="relative">
                 <input 
                   placeholder="Savolingizni yozing..." 
                   className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-lg focus:outline-none focus:ring-1 focus:ring-med-blue pr-16 text-white"
                 />
                 <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-med-blue hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-colors shadow-lg">
                   <ArrowRight className="w-5 h-5" />
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GenerationOptionsModal 
        isOpen={showOptions} 
        onClose={() => setShowOptions(false)} 
        onConfirm={startGeneration}
        topic={topic}
      />
    </div>
  );
}
