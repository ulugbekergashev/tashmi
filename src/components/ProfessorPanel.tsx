import { useState, useRef } from 'react';
import {
  FileText, Link2, Type, Upload, X, Plus, ChevronRight,
  Mic, Library, ListChecks, Map as MapIcon, UserCircle, Layout,
  Brain, Loader2, Sparkles, BookOpen, Play
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  generateFlashcards, generateMindMap, generateQuiz,
  generateAudioPodcast, generateVirtualPatient, generatePodcastFromMaterial
} from '../services/gemini';
import { Flashcard, MindMap as MindMapType, AudioPodcast, VirtualPatient, Quiz } from '../types';
import FlashcardStudy from './FlashcardStudy';
import MindMap from './MindMap';
import QuizModule from './QuizModule';
import AudioPlayer from './AudioPlayer';
import PatientChat from './PatientChat';

type UploadTab = 'file' | 'url' | 'text';
type Tool = 'overview' | 'podcast' | 'flashcards' | 'quiz' | 'mindmap' | 'patient';

interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'url' | 'text';
  subject: string;
  topic: string;
  content: string;
}

interface GeneratedContent {
  flashcards: Flashcard[];
  mindMap: MindMapType | null;
  podcast: AudioPodcast | null;
  patient: VirtualPatient | null;
  quiz: Quiz | null;
}

interface ProfessorPanelProps {
  onBack: () => void;
}

const TOOLS: { id: Tool; label: string; icon: any; badge?: string }[] = [
  { id: 'overview',   label: "Umumiy ko'rinish", icon: Layout },
  { id: 'podcast',    label: 'Audio Podcast',    icon: Mic,        badge: 'Beta' },
  { id: 'flashcards', label: 'Flashcards',       icon: Library },
  { id: 'quiz',       label: 'Testlar',          icon: ListChecks },
  { id: 'mindmap',    label: 'Bilimlar xaritasi',icon: MapIcon },
  { id: 'patient',    label: 'Virtual Bemor',    icon: UserCircle },
];

const SUBJECTS = ['Anatomiya', 'Fiziologiya', 'Biokimyo', 'Patologiya', 'Farmakologiya', 'Terapiya', 'Jarrohlik'];

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

export default function ProfessorPanel({ onBack }: ProfessorPanelProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [showFlashcardStudy, setShowFlashcardStudy] = useState(false);
  const [showPatientChat, setShowPatientChat] = useState(false);

  // Upload modal state
  const [uploadTab, setUploadTab] = useState<UploadTab>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Anatomiya');
  const [uploadTopic, setUploadTopic] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeMaterial = materials.find(m => m.id === activeMaterialId) ?? null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!uploadTopic) setUploadTopic(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUploadAndGenerate = async () => {
    if (!uploadTopic.trim()) { toast.error("Mavzu nomini kiriting"); return; }

    let content = '';
    let materialName = uploadTopic;
    let materialType: Material['type'] = 'text';

    if (uploadTab === 'file') {
      if (!selectedFile) { toast.error("Fayl tanlang"); return; }
      try {
        content = await readFileAsText(selectedFile);
        materialName = selectedFile.name;
        materialType = selectedFile.name.endsWith('.pdf') ? 'pdf' : 'docx';
      } catch {
        // Binary file: use filename as hint
        content = `Fayl nomi: ${selectedFile.name}. Fan: ${uploadSubject}. Mavzu: ${uploadTopic}.`;
        materialName = selectedFile.name;
        materialType = 'pdf';
      }
    } else if (uploadTab === 'url') {
      if (!urlInput.trim()) { toast.error("URL kiriting"); return; }
      content = `URL: ${urlInput}. Fan: ${uploadSubject}. Mavzu: ${uploadTopic}.`;
      materialName = urlInput;
      materialType = 'url';
    } else {
      if (!textInput.trim()) { toast.error("Matn kiriting"); return; }
      content = textInput;
      materialType = 'text';
    }

    setIsUploading(true);
    try {
      // Generate all content in parallel
      const [flashcards, mindMap, podcast, patient, quiz] = await Promise.all([
        generateFlashcards(uploadSubject, uploadTopic, content),
        generateMindMap(uploadSubject, uploadTopic),
        content.length > 200
          ? generatePodcastFromMaterial(uploadTopic, content).catch(() => generateAudioPodcast(uploadTopic))
          : generateAudioPodcast(uploadTopic),
        generateVirtualPatient(uploadTopic),
        generateQuiz(uploadSubject, uploadTopic, content),
      ]);

      const newMaterial: Material = {
        id: Date.now().toString(),
        name: materialName,
        type: materialType,
        subject: uploadSubject,
        topic: uploadTopic,
        content,
      };

      setMaterials(prev => [...prev, newMaterial]);
      setActiveMaterialId(newMaterial.id);
      setGeneratedContent({ flashcards, mindMap, podcast: podcast as AudioPodcast, patient, quiz });
      setActiveTool('overview');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUrlInput('');
      setTextInput('');
      setUploadTopic('');
      toast.success("Material muvaffaqiyatli yuklandi va tahlil qilindi!");
    } catch (err) {
      console.error(err);
      toast.error("Generatsiya qilinmadi. Qayta urinib ko'ring.");
    } finally {
      setIsUploading(false);
    }
  };

  const getTypeIcon = (type: Material['type']) => {
    if (type === 'url') return '🔗';
    if (type === 'text') return '✏️';
    return '📄';
  };

  /* ─────────── UPLOAD MODAL ─────────── */
  const UploadModal = (
    <AnimatePresence>
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false); }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg"
          >
            <div className="flex items-center justify-between p-6 border-b border-border-custom">
              <h3 className="text-lg font-bold">Material qo'shish</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-text-3 hover:text-text-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-bg-secondary rounded-xl">
                {([
                  { id: 'file' as UploadTab, label: 'PDF / DOCX', icon: FileText },
                  { id: 'url'  as UploadTab, label: 'URL',        icon: Link2 },
                  { id: 'text' as UploadTab, label: 'Matn',       icon: Type },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setUploadTab(tab.id)}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all',
                      uploadTab === tab.id ? 'bg-med-blue text-white shadow-sm' : 'text-text-3 hover:text-text-1'
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* File drop zone */}
              {uploadTab === 'file' && (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
                    isDragging ? 'border-med-blue bg-med-blue/10' : 'border-border-custom hover:border-med-blue/50 bg-bg-secondary/50'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.doc"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {selectedFile ? (
                    <>
                      <div className="text-2xl">📄</div>
                      <p className="text-sm font-bold text-med-blue">{selectedFile.name}</p>
                      <p className="text-xs text-text-3">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-text-3" />
                      <p className="text-sm text-text-2">Faylni bu yerga tashlang</p>
                      <p className="text-xs text-text-3">yoki <span className="text-med-blue font-bold">Kompyuterdan tanlash</span></p>
                    </>
                  )}
                </div>
              )}

              {/* URL input */}
              {uploadTab === 'url' && (
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                  <Input
                    placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                    className="pl-10 bg-bg-secondary border-border-custom h-12"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                  />
                </div>
              )}

              {/* Text input */}
              {uploadTab === 'text' && (
                <textarea
                  placeholder="Mavzu mazmunini to'g'ridan-to'g'ri kiriting..."
                  className="w-full h-36 bg-bg-secondary border border-border-custom rounded-xl p-3 text-sm focus:outline-none focus:border-med-blue transition-colors resize-none text-text-1"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                />
              )}

              {/* Subject + Topic */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fan</label>
                  <Select value={uploadSubject} onValueChange={setUploadSubject}>
                    <SelectTrigger className="bg-bg-secondary border-border-custom h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-border-custom">
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Mavzu nomi</label>
                  <Input
                    placeholder="Masalan: Yurak anatomiyasi"
                    className="bg-bg-secondary border-border-custom h-11"
                    value={uploadTopic}
                    onChange={e => setUploadTopic(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1 rounded-xl border-border-custom">
                Bekor qilish
              </Button>
              <Button
                onClick={handleUploadAndGenerate}
                disabled={isUploading}
                className="flex-1 bg-med-blue hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />AI tahlil qilmoqda...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />Yuklash</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ─────────── MAIN LAYOUT ─────────── */
  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {UploadModal}

      {/* ── Left Sidebar ── */}
      <aside className="w-80 flex flex-col gap-6 shrink-0">
        <Card className="bg-bg-card border-border-custom flex flex-col h-full shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-border-custom bg-bg-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-1">Professor paneli</h2>
              <button
                onClick={onBack}
                className="text-xs text-med-blue hover:text-blue-400 font-bold transition-colors"
              >
                ← Talabaga o'tish
              </button>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-med-blue/10 hover:bg-med-blue/20 border border-med-blue/20 hover:border-med-blue/40 rounded-xl text-sm font-bold text-med-blue transition-all"
            >
              <Plus className="w-4 h-4" />
              Yangi material yuklash
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-6">
              {/* Sources */}
              <div className="space-y-2">
                <p className="px-2 text-[10px] font-bold text-text-3 uppercase tracking-widest">Manbalar</p>
                {materials.length === 0 ? (
                  <div className="px-2 py-4 text-xs text-text-3 text-center">
                    Hali hech qanday material yuklanmagan
                  </div>
                ) : (
                  <div className="space-y-1">
                    {materials.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setActiveMaterialId(m.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                          activeMaterialId === m.id
                            ? "active-sidebar-item"
                            : "text-text-2 hover:bg-bg-secondary hover:text-text-1"
                        )}
                      >
                        <span className="text-base shrink-0">{getTypeIcon(m.type)}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{m.topic}</p>
                          <p className="text-[10px] text-text-3 truncate">{m.subject}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notebook Guide */}
              {generatedContent && (
                <div className="space-y-2">
                  <p className="px-2 text-[10px] font-bold text-text-3 uppercase tracking-widest">Notebook Guide</p>
                  <div className="space-y-1">
                    {TOOLS.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
                          activeTool === tool.id
                            ? "active-sidebar-item"
                            : "text-text-2 hover:bg-bg-secondary hover:text-text-1"
                        )}
                      >
                        <tool.icon className={cn("w-4 h-4", activeTool === tool.id ? "text-med-blue" : "text-text-3 group-hover:text-text-1")} />
                        <span className="flex-1 text-left">{tool.label}</span>
                        {tool.badge && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-med-blue/30 text-med-blue bg-med-blue/5">
                            {tool.badge}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Advice */}
              {activeMaterial && (
                <div className="p-4 bg-med-blue/5 rounded-2xl border border-med-blue/10 space-y-2">
                  <div className="flex items-center gap-2 text-med-blue">
                    <Brain className="w-4 h-4" />
                    <p className="text-[10px] font-bold uppercase">AI Maslahati</p>
                  </div>
                  <p className="text-xs text-text-2 leading-relaxed">
                    Bugun <strong>{activeMaterial.topic}</strong> bo'yicha flashcardlarni takrorlashni va
                    virtual bemor bilan suhbatlashishni tavsiya qilamiz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        <Card className="h-full bg-bg-card border-border-custom shadow-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border-custom flex items-center justify-between bg-bg-secondary/10">
            <h2 className="text-xl font-bold font-heading">
              {activeTool === 'overview'   ? "Umumiy ko'rinish"
               : activeTool === 'podcast'  ? 'Audio Podcast'
               : activeTool === 'flashcards' ? 'Flashcards'
               : activeTool === 'quiz'     ? 'Testlar'
               : activeTool === 'mindmap'  ? 'Bilimlar xaritasi'
               : 'Virtual Bemor'}
            </h2>
            <Badge variant="outline" className="bg-med-purple/10 text-med-purple border-med-purple/20">
              Professor Studio
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-8">
              {/* ── No material yet ── */}
              {!generatedContent && (
                <div className="flex flex-col items-center justify-center h-[50vh] space-y-6 text-center">
                  <div className="w-20 h-20 bg-med-blue/10 rounded-3xl flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-med-blue" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Material yuklang</h3>
                    <p className="text-text-2 max-w-md">
                      PDF, DOCX, URL yoki matn kiriting. AI avtomatik ravishda flashcardlar,
                      testlar, mind map va podcast tayyorlaydi.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-med-blue hover:bg-blue-600 rounded-xl px-8 h-12 font-bold flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Yangi material yuklash
                  </Button>
                </div>
              )}

              {/* ── Overview ── */}
              {generatedContent && activeTool === 'overview' && (
                <AnimatePresence mode="wait">
                  <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="grid grid-cols-2 gap-5">
                      {[
                        { id: 'podcast'    as Tool, icon: Mic,        color: 'med-purple', title: 'Audio Podcast',    sub: 'Mavzu bo\'yicha suhbat', btn: 'Eshitishni boshlash' },
                        { id: 'flashcards' as Tool, icon: Library,    color: 'med-blue',   title: 'Flashcards',       sub: `${generatedContent.flashcards.length} ta karta tayyor`, btn: "O'rganishni boshlash" },
                        { id: 'quiz'       as Tool, icon: ListChecks, color: 'med-green',  title: 'Testlar',          sub: `${generatedContent.quiz?.questions.length ?? 0} ta MCQ`, btn: 'Testni boshlash' },
                        { id: 'mindmap'    as Tool, icon: MapIcon,    color: 'med-yellow', title: 'Bilimlar xaritasi',sub: 'Vizual xarita', btn: "Xaritani ko'rish" },
                        { id: 'patient'    as Tool, icon: UserCircle, color: 'med-red',    title: 'Virtual Bemor',    sub: 'Material asosida klinik case', btn: 'Bemorlarga o\'tish' },
                      ].map(item => (
                        <Card
                          key={item.id}
                          className="bg-bg-secondary/50 border-border-custom p-6 space-y-4 hover:border-med-blue/30 transition-all cursor-pointer group card-hover"
                          onClick={() => { setActiveTool(item.id); setShowFlashcardStudy(false); setShowPatientChat(false); }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-${item.color}/10 flex items-center justify-center text-${item.color}`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-text-1">{item.title}</h3>
                          </div>
                          <p className="text-sm text-text-3">{item.sub}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-med-blue group-hover:translate-x-1 transition-transform">
                            {item.btn} <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold">Mavzu qisqacha mazmuni</h3>
                      <div className="p-5 bg-bg-secondary/30 rounded-2xl border border-border-custom leading-relaxed text-text-2 text-sm">
                        <strong>{activeMaterial?.topic ?? 'Bu mavzu'}</strong> bo'yicha tayyorlangan ushbu notebook sizga
                        fanlararo aloqalarni, klinik qo'llash usullarini va amaliy ko'nikmalarni rivojlantirishga yordam beradi.
                        Chap tarafdagi "Notebook Guide" orqali kerakli vositani tanlang.
                      </div>
                    </div>

                    {/* AI advice */}
                    <div className="p-5 bg-med-blue/5 rounded-2xl border border-med-blue/10 flex gap-4">
                      <Brain className="w-5 h-5 text-med-blue shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-med-blue uppercase tracking-wider">AI Maslahati</p>
                        <p className="text-sm text-text-2 leading-relaxed">
                          Bugun <strong>{activeMaterial?.topic}</strong> bo'yicha flashcardlarni takrorlashni
                          tavsiya qilamiz. So'ngra virtual bemor bilan suhbatlashib, nazariyani amaliyotda sinab ko'ring.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* ── Podcast ── */}
              {generatedContent && activeTool === 'podcast' && generatedContent.podcast && (
                <motion.div key="podcast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
                  {generatedContent.podcast.audioBase64 ? (
                    <AudioPlayer audioBase64={generatedContent.podcast.audioBase64} title={generatedContent.podcast.title} />
                  ) : (
                    <div className="p-8 text-center bg-bg-secondary/50 rounded-3xl border border-border-custom space-y-3">
                      <Mic className="w-10 h-10 text-text-3 mx-auto" />
                      <p className="text-text-2">Audio generatsiya qilinmadi.</p>
                    </div>
                  )}
                  <div className="space-y-5">
                    <h3 className="text-xl font-bold">{generatedContent.podcast.title}</h3>
                    {generatedContent.podcast.script.map((line, i) => (
                      <div key={i} className="space-y-1">
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          (['MENTOR', 'SARDOR'] as string[]).includes(line.speaker as string) ? "text-med-blue" : "text-med-green"
                        )}>
                          {line.speaker}
                        </p>
                        <p className="text-text-2 italic text-lg leading-relaxed">"{line.text}"</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Flashcards ── */}
              {generatedContent && activeTool === 'flashcards' && (
                <motion.div key="flashcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {!showFlashcardStudy ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-text-2">{generatedContent.flashcards.length} ta karta tayyorlandi.</p>
                        <Button onClick={() => setShowFlashcardStudy(true)} className="bg-med-blue hover:bg-blue-600 rounded-xl px-8 font-bold flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          O'rganishni boshlash
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedContent.flashcards.map((card, i) => (
                          <Card key={i} className="bg-bg-secondary/30 border-border-custom p-5 space-y-3 card-hover hover:border-med-blue/30 transition-all">
                            <p className="text-[10px] font-bold text-text-3 uppercase">Karta {i + 1}</p>
                            <p className="text-sm font-bold line-clamp-2">{card.question}</p>
                            <Badge variant="outline" className="text-[10px] border-med-blue/20 text-med-blue">
                              {card.difficulty === 1 ? 'Oson' : card.difficulty === 2 ? "O'rtacha" : 'Qiyin'}
                            </Badge>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <FlashcardStudy
                      cards={generatedContent.flashcards}
                      onBack={() => setShowFlashcardStudy(false)}
                      onComplete={() => setShowFlashcardStudy(false)}
                    />
                  )}
                </motion.div>
              )}

              {/* ── Quiz ── */}
              {generatedContent && activeTool === 'quiz' && generatedContent.quiz && (
                <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <QuizModule quiz={generatedContent.quiz} onBack={() => setActiveTool('overview')} />
                </motion.div>
              )}

              {/* ── Mind Map ── */}
              {generatedContent && activeTool === 'mindmap' && generatedContent.mindMap && (
                <motion.div key="mindmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <MindMap
                    data={generatedContent.mindMap}
                    onNodeClick={(node, branch) => {
                      toast.info(`"${node}" bo'yicha flashcardlar generatsiya qilinmoqda...`);
                      generateFlashcards(activeMaterial?.subject ?? 'Anatomiya', node)
                        .then(cards => {
                          setGeneratedContent(prev => prev ? { ...prev, flashcards: cards } : prev);
                          setActiveTool('flashcards');
                          toast.success(`"${node}" — ${cards.length} ta karta tayyor!`);
                        })
                        .catch(() => toast.error("Xatolik yuz berdi"));
                    }}
                  />
                </motion.div>
              )}

              {/* ── Virtual Patient ── */}
              {generatedContent && activeTool === 'patient' && generatedContent.patient && (
                <motion.div key="patient" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {!showPatientChat ? (
                    <div className="max-w-2xl mx-auto space-y-8">
                      <Card className="bg-bg-secondary/50 border-border-custom overflow-hidden">
                        <div className="aspect-video bg-bg-primary flex items-center justify-center relative">
                          <UserCircle className="w-32 h-32 text-med-blue/20" />
                          <div className="absolute bottom-6 left-6">
                            <h3 className="text-2xl font-bold">
                              {generatedContent.patient.patient.name}, {generatedContent.patient.patient.age} yosh
                            </h3>
                            <p className="text-sm text-text-3 uppercase font-bold">{generatedContent.patient.patient.gender}</p>
                          </div>
                        </div>
                        <CardContent className="p-8 space-y-6">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-text-3 uppercase tracking-widest">Asosiy shikoyat</p>
                            <p className="text-xl italic text-text-1">"{generatedContent.patient.patient.complaint}"</p>
                          </div>
                          <Button
                            onClick={() => setShowPatientChat(true)}
                            className="w-full h-14 bg-med-blue hover:bg-blue-600 text-white rounded-2xl font-bold text-lg"
                          >
                            Suhbatni boshlash
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="h-[600px]">
                      <PatientChat patient={generatedContent.patient} onBack={() => setShowPatientChat(false)} />
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
