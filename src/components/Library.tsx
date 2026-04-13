/**
 * Material Kutubxonasi — FASL 1
 * - PubMed qidiruvi + ingest
 * - PDF/DOCX/URL/Matn yuklash → chunklash → embed → Dexie
 * - Barcha materiallar ro'yxati (material_id, chunk soni, tur)
 * - Material o'chirish
 */

import { useState, useRef, useEffect } from 'react';
import {
  Search, FileText, Link2, Type, Upload, Trash2, DatabaseZap,
  BookOpen, ExternalLink, RefreshCw, Loader2, CheckCircle2,
  ChevronDown, ChevronUp, Plus, X, FlaskConical, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, MaterialRow } from '../lib/db';
import { ingestFile, ingestURL, ingestText } from '../services/ingest';
import { backfillEmbeddings } from '../lib/rag';
import { searchPubMed, PubMedHit } from '../services/pubmed';

type UploadTab = 'file' | 'url' | 'text';

interface MaterialWithChunks extends MaterialRow {
  chunkCount: number;
}

export default function Library() {
  const [materials, setMaterials] = useState<MaterialWithChunks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadTab, setUploadTab] = useState<UploadTab>('file');
  const [showUpload, setShowUpload] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PubMed state
  const [pubmedQuery, setPubmedQuery] = useState('');
  const [pubmedResults, setPubmedResults] = useState<PubMedHit[]>([]);
  const [isPubmedLoading, setIsPubmedLoading] = useState(false);
  const [ingestingPmid, setIngestingPmid] = useState<string | null>(null);
  const [ingestedPmids, setIngestedPmids] = useState<Set<string>>(new Set());
  const [expandedPmid, setExpandedPmid] = useState<string | null>(null);

  // Load materials from Dexie
  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const mats = await db.materials.toArray();
      const withCounts = await Promise.all(
        mats.map(async (m) => {
          const count = await db.chunks.where('material_id').equals(m.id!).count();
          return { ...m, chunkCount: count };
        })
      );
      // Newest first
      withCounts.sort((a, b) => b.created_at - a.created_at);
      setMaterials(withCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // ── File upload ──────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleIngestFile = async () => {
    if (!selectedFile) return;
    setIsIngesting(true);
    try {
      const result = await ingestFile(selectedFile);
      toast.success(`✅ "${selectedFile.name}" yuklandi — ${result.chunkIds.length} ta chunk`);
      await backfillEmbeddings(result.materialId);
      setSelectedFile(null);
      setShowUpload(false);
      await loadMaterials();
    } catch (e: any) {
      toast.error(`Xatolik: ${e?.message || e}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestURL = async () => {
    if (!urlInput.trim()) return;
    setIsIngesting(true);
    try {
      const result = await ingestURL(urlInput.trim());
      toast.success(`✅ URL yuklandi — ${result.chunkIds.length} ta chunk`);
      await backfillEmbeddings(result.materialId);
      setUrlInput('');
      setShowUpload(false);
      await loadMaterials();
    } catch (e: any) {
      toast.error(`URL xatolik: ${e?.message || e}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestText = async () => {
    if (!textInput.trim() || !textTitle.trim()) {
      toast.error('Sarlavha va matn kiriting');
      return;
    }
    setIsIngesting(true);
    try {
      const result = await ingestText(textTitle, textInput, 'text');
      toast.success(`✅ Matn yuklandi — ${result.chunkIds.length} ta chunk`);
      await backfillEmbeddings(result.materialId);
      setTextInput('');
      setTextTitle('');
      setShowUpload(false);
      await loadMaterials();
    } catch (e: any) {
      toast.error(`Xatolik: ${e?.message || e}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // ── PubMed ───────────────────────────────────────────────────────────────
  const handlePubMedSearch = async () => {
    if (!pubmedQuery.trim()) return;
    setIsPubmedLoading(true);
    setPubmedResults([]);
    try {
      const hits = await searchPubMed(pubmedQuery.trim(), 6);
      setPubmedResults(hits);
      if (hits.length === 0) toast.info("Natija topilmadi");
    } catch (e: any) {
      toast.error(`PubMed xatolik: ${e?.message || e}`);
    } finally {
      setIsPubmedLoading(false);
    }
  };

  const handleIngestPubMed = async (hit: PubMedHit) => {
    setIngestingPmid(hit.pmid);
    try {
      const fullText = `${hit.title}\n\nMualliflar: ${hit.authors.join(', ')}\nJurnal: ${hit.journal} (${hit.year})\n\nAbstract:\n${hit.abstract}`;
      const result = await ingestText(hit.title, fullText, 'url', hit.url);
      await backfillEmbeddings(result.materialId);
      setIngestedPmids(prev => new Set([...prev, hit.pmid]));
      toast.success(`✅ PubMed: "${hit.title.slice(0, 50)}..." yuklandi`);
      await loadMaterials();
    } catch (e: any) {
      toast.error(`PubMed ingest xatolik: ${e?.message || e}`);
    } finally {
      setIngestingPmid(null);
    }
  };

  // ── Delete material ──────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await db.chunks.where('material_id').equals(id).delete();
      await db.materials.delete(id);
      toast.success('Material o\'chirildi');
      await loadMaterials();
    } catch {
      toast.error('O\'chirishda xatolik');
    }
  };

  const TYPE_ICON: Record<string, string> = {
    pdf: '📄', docx: '📝', url: '🔗', text: '✏️',
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Bilimlar Kutubxonasi</h1>
          <p className="text-text-3 text-sm mt-1">
            Materiallarni yuklang — Sokratik Tutor va RAG avtomatik foydalanadi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-med-blue/10 text-med-blue border-med-blue/30">
            <DatabaseZap className="w-3 h-3 mr-1" />
            {materials.length} ta material
          </Badge>
          <Button
            onClick={() => setShowUpload(v => !v)}
            className="bg-med-blue hover:bg-blue-600 rounded-xl px-5 h-10 font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Material qo'shish
          </Button>
        </div>
      </div>

      {/* Upload panel */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-bg-card border-border-custom shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Yangi material yuklash</CardTitle>
                  <button onClick={() => setShowUpload(false)} className="text-text-3 hover:text-text-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-bg-secondary rounded-xl mt-3">
                  {([
                    { id: 'file' as UploadTab, label: 'PDF / DOCX', icon: FileText },
                    { id: 'url'  as UploadTab, label: 'URL',        icon: Link2 },
                    { id: 'text' as UploadTab, label: 'Matn',       icon: Type },
                  ]).map(tab => (
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
              </CardHeader>

              <CardContent className="space-y-4">
                {/* FILE */}
                {uploadTab === 'file' && (
                  <>
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
                        isDragging ? 'border-med-blue bg-med-blue/10' : 'border-border-custom hover:border-med-blue/50 bg-bg-secondary/50'
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.md"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); e.target.value = ''; }}
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
                          <p className="text-sm text-text-2">PDF yoki DOCX faylni tashlang</p>
                          <p className="text-xs text-text-3">yoki <span className="text-med-blue font-bold">Tanlash</span></p>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={handleIngestFile}
                      disabled={!selectedFile || isIngesting}
                      className="w-full bg-med-blue hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      {isIngesting ? <><Loader2 className="w-4 h-4 animate-spin" />Yuklanmoqda...</> : <><Sparkles className="w-4 h-4" />Yuklash va RAG'ga qo'shish</>}
                    </Button>
                  </>
                )}

                {/* URL */}
                {uploadTab === 'url' && (
                  <>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                      <Input
                        placeholder="https://pubmed.ncbi.nlm.nih.gov/..., Wikipedia, yoki boshqa URL"
                        className="pl-10 bg-bg-secondary border-border-custom h-12"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleIngestURL()}
                      />
                    </div>
                    <Button
                      onClick={handleIngestURL}
                      disabled={!urlInput.trim() || isIngesting}
                      className="w-full bg-med-blue hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      {isIngesting ? <><Loader2 className="w-4 h-4 animate-spin" />Yuklanmoqda...</> : <><Sparkles className="w-4 h-4" />URL yukla</>}
                    </Button>
                  </>
                )}

                {/* TEXT */}
                {uploadTab === 'text' && (
                  <>
                    <Input
                      placeholder="Sarlavha (masalan: Miokard infarkti — Toshkent tibbiyoti 2024)"
                      className="bg-bg-secondary border-border-custom h-11"
                      value={textTitle}
                      onChange={e => setTextTitle(e.target.value)}
                    />
                    <textarea
                      placeholder="Matnni to'g'ridan-to'g'ri yozing yoki joylashtiring..."
                      className="w-full h-40 bg-bg-secondary border border-border-custom rounded-xl p-3 text-sm focus:outline-none focus:border-med-blue transition-colors resize-none text-text-1"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                    />
                    <Button
                      onClick={handleIngestText}
                      disabled={!textInput.trim() || !textTitle.trim() || isIngesting}
                      className="w-full bg-med-blue hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      {isIngesting ? <><Loader2 className="w-4 h-4 animate-spin" />Yuklanmoqda...</> : <><Sparkles className="w-4 h-4" />Matn yukla</>}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PubMed Search */}
      <Card className="bg-bg-card border-border-custom shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-med-red/5 to-transparent border-b border-border-custom">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-med-red/20 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-med-red" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">PubMed Qidiruvchi</CardTitle>
              <p className="text-xs text-text-3 mt-0.5">Ilmiy maqolalar → RAG'ga qo'shish</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Search bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
              <Input
                placeholder="Masalan: myocardial infarction treatment, beta blockers..."
                className="pl-10 bg-bg-secondary border-border-custom h-12 focus-visible:ring-med-red/40"
                value={pubmedQuery}
                onChange={e => setPubmedQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePubMedSearch()}
              />
            </div>
            <Button
              onClick={handlePubMedSearch}
              disabled={isPubmedLoading || !pubmedQuery.trim()}
              className="h-12 px-6 bg-med-red hover:bg-red-700 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-med-red/20"
            >
              {isPubmedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Qidirish
            </Button>
          </div>

          {/* Suggested queries */}
          {pubmedResults.length === 0 && !isPubmedLoading && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider py-1">Tavsiya:</span>
              {[
                'myocardial infarction pathophysiology',
                'hypertension management guidelines',
                'diabetes mellitus treatment',
                'antibiotic resistance mechanisms',
                'heart failure prognosis',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setPubmedQuery(q); }}
                  className="px-3 py-1 bg-bg-secondary border border-border-custom rounded-full text-xs text-text-2 hover:border-med-red/50 hover:text-med-red transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {isPubmedLoading && (
            <div className="flex items-center justify-center py-8 gap-3 text-text-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">PubMed'dan qidirilmoqda...</span>
            </div>
          )}

          <AnimatePresence>
            {pubmedResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
                  {pubmedResults.length} ta natija
                </p>
                {pubmedResults.map((hit, i) => {
                  const ingested = ingestedPmids.has(hit.pmid);
                  const ingesting = ingestingPmid === hit.pmid;
                  const expanded = expandedPmid === hit.pmid;
                  return (
                    <motion.div
                      key={hit.pmid}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        ingested ? 'bg-med-green/5 border-med-green/30' : 'bg-bg-secondary border-border-custom hover:border-med-red/30'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-1 leading-snug line-clamp-2">
                            {hit.title}
                          </p>
                          <p className="text-[11px] text-text-3 mt-1">
                            {hit.authors.slice(0, 3).join(', ')}{hit.authors.length > 3 ? ' va b.' : ''} · {hit.journal} · {hit.year}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={hit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-3 hover:text-med-blue transition-colors"
                            title="PubMed'da ochish"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <Button
                            onClick={() => handleIngestPubMed(hit)}
                            disabled={ingested || ingesting}
                            size="sm"
                            className={cn(
                              'h-7 px-3 text-xs font-bold rounded-lg transition-all',
                              ingested
                                ? 'bg-med-green/20 text-med-green border-med-green/30 cursor-default'
                                : 'bg-med-red hover:bg-red-700 text-white shadow-sm'
                            )}
                          >
                            {ingesting ? <Loader2 className="w-3 h-3 animate-spin" /> :
                             ingested ? <><CheckCircle2 className="w-3 h-3 mr-1" />Qo'shildi</> :
                             <><Plus className="w-3 h-3 mr-1" />RAG'ga qo'sh</>}
                          </Button>
                        </div>
                      </div>

                      {hit.abstract && (
                        <>
                          <button
                            onClick={() => setExpandedPmid(expanded ? null : hit.pmid)}
                            className="mt-2 flex items-center gap-1 text-[10px] text-text-3 hover:text-text-1 transition-colors"
                          >
                            Abstract {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <AnimatePresence>
                            {expanded && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 text-xs text-text-2 leading-relaxed overflow-hidden"
                              >
                                {hit.abstract}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Materials list */}
      <Card className="bg-bg-card border-border-custom shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border-custom">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-med-blue" />
            <CardTitle className="text-base font-bold">Yuklangan materiallar</CardTitle>
            <Badge variant="outline" className="text-xs border-border-custom">
              {materials.reduce((s, m) => s + m.chunkCount, 0)} ta chunk
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMaterials}
            className="text-text-3 hover:text-text-1"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-text-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Yuklanmoqda...</span>
            </div>
          ) : materials.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-bg-secondary rounded-2xl flex items-center justify-center mx-auto">
                <DatabaseZap className="w-8 h-8 text-text-3" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-2">Hali material yo'q</p>
                <p className="text-xs text-text-3 mt-1">
                  PDF, URL, yoki PubMed maqolasini qo'shing — Sokratik Tutor avtomatik foydalanadi
                </p>
              </div>
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-med-blue hover:bg-blue-600 rounded-xl px-6 font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Birinchi materialni qo'shing
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border-custom">
              {materials.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-bg-secondary/30 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[m.type] || '📄'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-1 truncate max-w-[420px]">
                        {m.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-text-3">
                        <span className="uppercase font-bold">{m.type}</span>
                        <span>•</span>
                        <span>{m.chunkCount} chunk</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleDateString('uz-UZ')}</span>
                        {m.source_url && (
                          <>
                            <span>•</span>
                            <a
                              href={m.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-med-blue hover:underline flex items-center gap-1"
                            >
                              Manba <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className={cn(
                      'text-[10px]',
                      m.chunkCount > 0 ? 'text-med-green border-med-green/30 bg-med-green/10' : 'text-text-3 border-border-custom'
                    )}>
                      {m.chunkCount > 0 ? '✓ RAG tayyor' : 'Embed kerak'}
                    </Badge>
                    <button
                      onClick={() => handleDelete(m.id!)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-3 hover:text-med-red hover:bg-med-red/10 transition-all"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-gradient-to-br from-med-blue/5 to-med-purple/5 border-med-blue/20">
        <CardContent className="p-6">
          <p className="text-xs font-bold text-med-blue uppercase tracking-widest mb-4">
            Qanday ishlaydi?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', icon: '📥', title: 'Material yuklash', desc: 'PDF, URL yoki PubMed maqolasi' },
              { step: '2', icon: '🔪', title: 'Chunklash', desc: 'Matn ~800 token bo\'laklarga bo\'linadi' },
              { step: '3', icon: '🧬', title: 'Vektorlashtirish', desc: 'Har bir chunk 768-dim vektor sifatida saqlanadi' },
              { step: '4', icon: '🎯', title: 'RAG qidiruvi', desc: 'Sokratik Tutor savol bersa, mos chunklarni topadi' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-med-blue/20 flex items-center justify-center text-xs font-bold text-med-blue shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-1">{s.icon} {s.title}</p>
                  <p className="text-[11px] text-text-3 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
