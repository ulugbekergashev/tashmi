import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Mic, Headphones, Music, Sparkles, MessageSquare 
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ScriptLine {
  speaker: string;
  text: string;
}

interface AudioPlayerProps {
  title: string;
  script?: ScriptLine[];
  onLineChange?: (index: number) => void;
}


export default function AudioPlayer({ title, script = [], onLineChange }: AudioPlayerProps) {
  const safeScript = Array.isArray(script) ? script : [];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const scriptRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Cancel any ongoing speech when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (scriptRefs.current[currentIndex]) {
      scriptRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  const getVoiceForSpeaker = (speaker: string) => {
    if (!speaker || typeof speaker !== 'string') return voices[0] || null;
    const isMentor = speaker === 'MENTOR' || speaker === 'SARDOR';
    const localVoices = voices.filter(v => v.localService);
    const sorted = localVoices.length > 1 ? localVoices : voices;
    
    if (sorted.length === 0) return null;
    
    if (isMentor) {
      return sorted.find(v => v.name.includes('Google') && v.name.includes('UK')) || sorted[0];
    } else {
      return sorted.find(v => v.name.includes('Google') && v.name.includes('US')) || sorted[1] || sorted[0];
    }
  };

  const playLine = (index: number) => {
    if (safeScript.length === 0 || index >= safeScript.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    const line = safeScript[index];
    if (!line || !line.text) return;
    
    const utterance = new SpeechSynthesisUtterance(String(line.text));
    
    const voice = getVoiceForSpeaker(line.speaker);
    if (voice) utterance.voice = voice;
    
    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = playbackRate;
    
    utterance.onstart = () => {
      setCurrentIndex(index);
      onLineChange?.(index);
    };

    utterance.onend = () => {
      if (isPlaying) {
        playLine(index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech error:", e);
      setIsPlaying(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isPlaying) {
      playLine(currentIndex);
    } else {
      window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackRate]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextLine = () => {
    if (currentIndex < safeScript.length - 1) {
      setCurrentIndex(i => i + 1);
      if (isPlaying) playLine(currentIndex + 1);
    }
  };

  const prevLine = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      if (isPlaying) playLine(currentIndex - 1);
    }
  };

  const handleVolumeChange = (v: number[]) => {
    setVolume(v[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="h-full flex gap-6 overflow-hidden">
      {/* LEFT: SCRIPT SIDEBAR */}
      <div className="w-[400px] flex flex-col min-h-0 bg-white/[0.01] border-r border-white/5">
         <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Music className="w-4 h-4 text-med-blue" />
              <span className="text-[11px] font-black text-text-3 uppercase tracking-widest">Ssenariy</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold border-white/10 uppercase">Sinxron</Badge>
         </div>
         <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-8 pb-32">
               {safeScript.map((line, i) => (
                 <div 
                   key={i} 
                   ref={el => scriptRefs.current[i] = el}
                   className={cn(
                     "p-6 rounded-[2rem] transition-all duration-500 flex gap-4 items-start group relative border cursor-pointer",
                     i === currentIndex 
                       ? "bg-med-blue/10 border-med-blue/30 shadow-xl" 
                       : "bg-white/[0.01] border-transparent hover:bg-white/[0.03]"
                   )}
                   onClick={() => {
                     setCurrentIndex(i);
                     if (isPlaying) playLine(i);
                   }}
                 >
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                     i === currentIndex ? "bg-med-blue text-black border-med-blue" : "bg-white/5 text-text-3 border-white/5"
                   )}>
                     {line?.speaker === 'MENTOR' || line?.speaker === 'SARDOR' ? <Mic className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                   </div>
                   <div className="space-y-1">
                      <div className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        i === currentIndex ? "text-med-blue" : "text-text-3"
                      )}>
                        {typeof line?.speaker === 'string' ? line.speaker : 'SPEAKER'}
                      </div>
                      <p className={cn(
                        "text-sm leading-relaxed transition-colors",
                        i === currentIndex ? "text-white font-bold" : "text-text-2 group-hover:text-text-1"
                      )}>
                        {typeof line?.text === 'string' ? line.text : ''}
                      </p>
                   </div>
                 </div>
               ))}
            </div>
         </ScrollArea>
      </div>

      {/* RIGHT: MAIN PLAYER STUDIO */}
      <div className="flex-1 flex flex-col p-6 relative overflow-y-auto overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-med-blue/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto w-full relative z-10">
           <Card className="w-full bg-white/[0.02] border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl backdrop-blur-3xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-med-blue/5 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                 <div className="space-y-2">
                    <Badge className="bg-med-blue/10 text-med-blue border-med-blue/20 px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                       AI Audio Studio
                    </Badge>
                    <h1 className="text-2xl font-black text-white leading-tight font-heading tracking-tight">{typeof title === 'string' ? title : "Podcast"}</h1>
                    <div className="flex items-center justify-center gap-4 text-text-3 font-bold uppercase tracking-widest text-[10px]">
                       <span className="flex items-center gap-1.5"><Mic className="w-3 h-3 text-med-blue" /> Prof. Sitora</span>
                       <span className="w-1 h-1 rounded-full bg-white/20" />
                       <span className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3 text-med-purple" /> Dr. Akmal</span>
                    </div>
                 </div>

                 {/* Waveform */}
                 <div className="h-16 flex items-center justify-center gap-1 w-full px-4">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={isPlaying ? {
                          height: [8, Math.random() * 50 + 10, 8],
                          opacity: [0.4, 1, 0.4]
                        } : { height: 8, opacity: 0.2 }}
                        transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.4, delay: i * 0.02 }}
                        className={cn(
                          "w-1.5 rounded-full",
                          i > 12 && i < 28 ? "bg-med-blue shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-white/10"
                        )}
                      />
                    ))}
                 </div>

                 <div className="flex items-center justify-center gap-8">
                    <Button variant="ghost" size="icon" onClick={prevLine} disabled={currentIndex === 0} className="w-12 h-12 rounded-xl hover:bg-white/5">
                      <SkipBack className="w-6 h-6" />
                    </Button>
                    <Button 
                      onClick={togglePlay}
                      className={cn(
                        "w-20 h-20 rounded-[1.5rem] text-white shadow-xl flex items-center justify-center transition-all active:scale-95 group relative overflow-hidden",
                        isPlaying ? "bg-med-red hover:bg-red-600" : "bg-med-blue hover:bg-blue-600"
                      )}
                    >
                      {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-10 h-10 ml-1 fill-current" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextLine} disabled={safeScript.length === 0 || currentIndex === safeScript.length - 1} className="w-12 h-12 rounded-xl hover:bg-white/5">
                      <SkipForward className="w-6 h-6" />
                    </Button>
                 </div>

                 {/* Progress + Speed */}
                 <div className="w-full flex items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black text-text-3 uppercase tracking-widest">
                         <span>{safeScript.length > 0 ? Math.round(((currentIndex + 1) / safeScript.length) * 100) : 0}%</span>
                         <span>{safeScript.length > 0 ? currentIndex + 1 : 0} / {safeScript.length}</span>
                       </div>
                       <Slider
                         value={[currentIndex]}
                         max={Math.max(0, safeScript.length - 1)}
                         step={1}
                         onValueChange={(v) => {
                            setCurrentIndex(v[0]);
                            if (isPlaying) playLine(v[0]);
                         }}
                       />
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
                       {[1, 1.5, 2].map(speed => (
                         <button 
                           key={speed}
                           onClick={() => setPlaybackRate(speed)}
                           className={cn(
                             "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all",
                             playbackRate === speed ? "bg-med-blue text-black" : "text-text-3 hover:text-white"
                           )}
                         >
                           {speed}x
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </Card>

           {/* Volume bar */}
           <div className="w-full flex items-center justify-between px-4">
              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-5 py-3 rounded-2xl">
                 <button onClick={toggleMute} className="text-text-3 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                 </button>
                 <div className="w-24">
                    <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} />
                 </div>
                 <span className="text-[9px] font-bold text-text-3 uppercase tracking-widest flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5" /> HD Audio
                 </span>
              </div>
              <div className="flex items-center gap-2 text-med-green text-[10px] font-bold">
                 <div className="w-2 h-2 rounded-full bg-med-green animate-pulse" /> Live
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
