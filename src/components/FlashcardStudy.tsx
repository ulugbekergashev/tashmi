import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, X, Trophy, AlertCircle, RotateCcw, BookOpen, 
  Info, Zap, FileText, Sparkles, TrendingUp, Target, Brain,
  Keyboard
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Flashcard } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { reviewCard, type SrsRating } from '../lib/srs';
import { upsertMastery, awardXP } from '../lib/db';
import { XP_RUBRIC } from '../lib/xp';
import { toast } from 'sonner';

interface FlashcardStudyProps {
  cards: Flashcard[];
  cardIds?: number[];
  concept?: string;
  onComplete: (stats: { known: number; unknown: number }) => void;
  onBack: () => void;
}

type Rating = 'unknown' | 'hard' | 'known' | 'easy';

const RATING_TO_SRS: Record<Rating, SrsRating> = {
  unknown: 1,
  hard: 2,
  known: 3,
  easy: 4,
};

const RATING_TO_MASTERY_DELTA: Record<Rating, number> = {
  unknown: -0.12,
  hard: -0.04,
  known: +0.08,
  easy: +0.15,
};

const RATINGS: { label: string; rating: Rating; color: string; icon: any }[] = [
  {
    label: 'Mutloq Bilmadim',
    rating: 'unknown',
    color: 'med-red',
    icon: X,
  },
  {
    label: 'Qiyin Bo\'ldi',
    rating: 'hard',
    color: 'med-yellow',
    icon: AlertCircle,
  },
  {
    label: 'Esladim',
    rating: 'known',
    color: 'med-blue',
    icon: Target,
  },
  {
    label: 'Oson Jiddiy',
    rating: 'easy',
    color: 'med-green',
    icon: Zap,
  },
];

function getDifficultyStyle(d: number) {
  if (d === 1) return { label: 'Oson', cls: 'text-med-green border-med-green/30 bg-med-green/10' };
  if (d === 2) return { label: "O'rtacha", cls: 'text-med-yellow border-med-yellow/30 bg-med-yellow/10' };
  return { label: 'Qiyin', cls: 'text-med-red border-med-red/30 bg-med-red/10' };
}

export default function FlashcardStudy({ cards, cardIds, concept, onComplete, onBack }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [ratings, setRatings] = useState<(Rating | null)[]>(new Array(cards.length).fill(null));
  const [stats, setStats] = useState({ unknown: 0, hard: 0, known: 0, easy: 0 });
  const [showResults, setShowResults] = useState(false);
  const [flipStartedAt, setFlipStartedAt] = useState<number>(Date.now());

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const diff = getDifficultyStyle(currentCard.difficulty);

  const retention = useMemo(() => {
    const total = stats.unknown + stats.hard + stats.known + stats.easy;
    if (total === 0) return 0;
    const score = (stats.easy * 1.0) + (stats.known * 0.8) + (stats.hard * 0.3) + (stats.unknown * 0);
    return Math.round((score / total) * 100);
  }, [stats]);

  const handleRate = (rating: Rating) => {
    const newRatings = [...ratings];
    newRatings[currentIndex] = rating;
    setRatings(newRatings);

    const newStats = { ...stats, [rating]: stats[rating] + 1 };
    setStats(newStats);

    const cardId = cardIds?.[currentIndex];
    if (cardId) {
      reviewCard(cardId, RATING_TO_SRS[rating], Date.now() - flipStartedAt).catch(err =>
        console.error('[srs] reviewCard failed', err)
      );
    }
    const conceptKey = concept || currentCard.source;
    if (conceptKey) {
      upsertMastery(conceptKey, RATING_TO_MASTERY_DELTA[rating]).catch(() => {});
    }

    // Award XP
    if (rating === 'known' || rating === 'easy') {
      const amount = rating === 'easy' ? XP_RUBRIC.FLASHCARD_EASY : XP_RUBRIC.FLASHCARD_GOOD;
      awardXP(amount).then(res => {
        if (res?.leveledUp) {
          toast.success(`Tabriklaymiz! Siz ${res.level}-darajaga ko'tarildingiz!`, {
            description: "Yangi bilim darajasi zabt etildi.",
            duration: 5000,
          });
        }
      });
    }

    setFlipStartedAt(Date.now());

    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      }, 200);
    } else {
      setShowResults(true);
      onComplete({
        known: newStats.known + newStats.easy,
        unknown: newStats.unknown + newStats.hard,
      });
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setDirection(1);
    setRatings(new Array(cards.length).fill(null));
    setStats({ unknown: 0, hard: 0, known: 0, easy: 0 });
    setShowResults(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResults) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1' || e.key === 'ArrowLeft') {
          handleRate('unknown');
        } else if (e.key === '2' || e.key === 'ArrowDown') {
          handleRate('hard');
        } else if (e.key === '3' || e.key === 'ArrowUp') {
          handleRate('known');
        } else if (e.key === '4' || e.key === 'ArrowRight') {
          handleRate('easy');
        }
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex(prev => prev - 1);
        setIsFlipped(false);
      } else if (e.key === 'ArrowRight' && currentIndex < cards.length - 1 && ratings[currentIndex] !== null) {
        setDirection(1);
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, showResults, ratings]);

  const weakCards = cards.filter((_, i) => ratings[i] === 'unknown' || ratings[i] === 'hard');

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto py-12 space-y-12"
      >
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-med-yellow/15 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-med-yellow/20 relative">
            <Trophy className="w-12 h-12 text-med-yellow" />
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-med-yellow animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white">Sessiya Tahlili</h2>
            <p className="text-text-3 font-bold uppercase tracking-widest text-sm">Spaced Repetition Yakunlandi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-med-blue">
                 <TrendingUp className="w-6 h-6" />
                 <h4 className="font-black text-sm uppercase tracking-widest">Retention Predictor</h4>
              </div>
              <div className="text-5xl font-black text-white">{retention}%</div>
              <p className="text-xs text-text-3 leading-relaxed">Kelajakda ushbu mavzuni xotirada saqlash ehtimolligi.</p>
           </div>
           
           <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-med-green">
                 <Brain className="w-6 h-6" />
                 <h4 className="font-black text-sm uppercase tracking-widest">Mastery Gain</h4>
              </div>
              <div className="text-5xl font-black text-white">+{Math.round((stats.easy * 15 + stats.known * 8) / 10)}%</div>
              <p className="text-xs text-text-3 leading-relaxed">Sizning ushbu mavzu bo'yicha umumiy bilim darajangiz oshishi.</p>
           </div>

           <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-med-purple">
                 <Target className="w-6 h-6" />
                 <h4 className="font-black text-sm uppercase tracking-widest">Task Done</h4>
              </div>
              <div className="text-5xl font-black text-white">{cards.length}</div>
              <p className="text-xs text-text-3 leading-relaxed">Jami o'rganilgan va takrorlangan tibbiy kartalar soni.</p>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {RATINGS.map(item => (
            <div key={item.rating} className={cn('p-6 rounded-3xl border text-center space-y-2 bg-white/[0.02]', `border-${item.color}/20 text-${item.color}`)}>
              <p className="text-4xl font-black">{stats[item.rating]}</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{item.label}</p>
            </div>
          ))}
        </div>

        {weakCards.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-black flex items-center gap-3 text-white text-xl">
              <AlertCircle className="w-6 h-6 text-med-red" />
              Qayta ko'rib chiqish tavsiya etiladi ({weakCards.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
              {weakCards.map((card, i) => (
                <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] group hover:border-med-red/30 transition-all">
                  <p className="text-lg font-bold text-white leading-relaxed">{card.question}</p>
                  <p className="text-[10px] text-text-3 mt-3 font-black uppercase tracking-widest italic">{card.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6 pt-6">
          <Button variant="outline" onClick={onBack} className="flex-1 h-16 rounded-2xl border-white/10 text-text-2 hover:bg-white/5 text-lg font-bold">Yopish</Button>
          <Button onClick={handleReset} className="flex-1 h-16 bg-med-blue hover:bg-blue-600 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-med-blue/40">
            <RotateCcw className="w-6 h-6" /> Qayta O'rganish
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-[2rem] border border-white/5">
        <Button variant="ghost" onClick={onBack} className="text-text-3 hover:text-white px-6 h-12 rounded-xl border border-white/5">
          <ChevronLeft className="w-4 h-4 mr-2" /> Orqaga
        </Button>
        <div className="flex-1 max-w-md px-10">
           <div className="flex items-center justify-between text-[11px] font-black text-text-3 uppercase tracking-[0.2em] mb-2">
             <span>Card {currentIndex + 1} / {cards.length}</span>
             <span className="text-med-blue">{Math.round(progress)}% Progress</span>
           </div>
           <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-med-blue"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
           </div>
        </div>
        <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors">
          <X className="w-5 h-5 text-text-3" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: direction * 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: direction * -100, scale: 1.1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[380px] flip-card cursor-pointer select-none perspective-[3000px] group/card"
          onClick={() => setIsFlipped(f => !f)}
        >
          <div className={cn(
            'flip-card-inner w-full h-full transition-transform duration-[800ms] preserve-3d cubic-bezier-[0.34,1.56,0.64,1]', 
            isFlipped && 'flipped'
          )}>
            <Card className="flip-card-front absolute inset-0 bg-[#0F172A] border-2 border-white/10 rounded-[2.5rem] flex flex-col p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden backface-hidden group-hover/card:border-med-blue/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-med-blue/[0.03] to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-med-blue/5 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-med-blue/10 flex items-center justify-center text-med-blue">
                     <BookOpen className="w-5 h-5" />
                   </div>
                   <p className="text-xs font-black text-med-blue uppercase tracking-[0.2em]">Tibbiy Savol</p>
                </div>
                <Badge className={cn('text-[11px] border font-black px-4 py-1 rounded-full', diff.cls)}>{diff.label} Daraja</Badge>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-2 overflow-y-auto overflow-x-hidden">
                <h3 className="text-xl font-black text-center leading-[1.4] text-white tracking-tight break-words w-full">
                  {currentCard.question}
                </h3>
              </div>

              {currentCard.hint && (
                <div 
                  className="mb-8 relative z-10"
                  onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-2xl bg-white/5 hover:bg-med-blue/10 text-xs font-black uppercase tracking-[0.2em] text-text-3 hover:text-med-blue border border-white/5 transition-all"
                  >
                    <Info className="w-4 h-4 mr-2" /> {showHint ? 'Yashirish' : 'Hintni Ko\'rish'}
                  </Button>
                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="mt-3 p-5 rounded-2xl bg-med-blue/5 border border-med-blue/10 text-base text-med-blue/80 italic font-medium"
                      >
                        💡 {currentCard.hint}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-3 text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mt-auto">
                <Zap className="w-4 h-4 text-med-yellow" /> Javobni Ko'rish Uchun Bosing
              </div>
            </Card>

            <Card className="flip-card-back absolute inset-0 bg-[#0F172A] border-[3px] border-med-blue/20 rounded-[2.5rem] flex flex-col p-8 shadow-[0_50px_100px_-20px_rgba(59,130,246,0.2)] overflow-hidden backface-hidden rotate-y-180">
              <div className="absolute inset-0 bg-gradient-to-tl from-med-green/[0.03] to-transparent" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-med-green/5 blur-[100px] rounded-full -ml-32 -mb-32" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-med-green/10 flex items-center justify-center text-med-green">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black text-med-green uppercase tracking-[0.2em]">Aniqlangan Javob</p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-med-green flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#020617] shadow-lg shadow-med-green/20">
                  Tasdiqlandi
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-4 space-y-4 py-2 overflow-y-auto overflow-x-hidden">
                <p className="text-lg leading-[1.4] text-white font-black text-center tracking-tight break-words w-full">
                  {currentCard.answer}
                </p>
                
                <div className="flex items-center justify-center gap-4 w-full px-12 opacity-50 shrink-0 mt-auto">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-[10px] font-black text-text-3 uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Reference: {currentCard.source || 'Medical Archive'}
                  </span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
              </div>

              <div className="mt-auto flex justify-center relative z-10">
                <div className="px-8 py-3 rounded-2xl bg-med-blue/10 border border-med-blue/20 text-[11px] font-black text-med-blue uppercase tracking-[0.2em]">
                  Endi javob sifatini tanlang
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-2 px-10">
        {ratings.map((rating, i) => (
          <div
            key={i}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === currentIndex ? 'w-12 bg-med-blue shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
              rating ? `w-3 bg-med-${RATINGS.find(r => r.rating === rating)?.color.split('-')[1]}` : 'w-2 bg-white/5'
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 px-4 h-24">
        {RATINGS.map(btn => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.rating}
              onClick={e => { e.stopPropagation(); handleRate(btn.rating); }}
              className={cn(
                'group relative flex flex-col items-center justify-center rounded-[2rem] transition-all duration-300 border-2 overflow-hidden backdrop-blur-3xl shadow-lg active:scale-95',
                `border-${btn.color}/20 bg-${btn.color}/5 hover:bg-${btn.color} hover:border-${btn.color} hover:shadow-${btn.color}/40`
              )}
            >
              <Icon className={cn('w-6 h-6 mb-2 transition-colors', `text-${btn.color} group-hover:text-black`)} />
              <span className={cn('text-[10px] font-black uppercase tracking-widest transition-colors', `text-${btn.color} group-hover:text-black`)}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
