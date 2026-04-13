import { useState } from 'react';
import { Check, X, ChevronRight, Trophy, AlertCircle, RefreshCw, Lightbulb, FileText, Info, Target, Sparkles, Brain } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Quiz } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { awardXP } from '../lib/db';
import { XP_RUBRIC } from '../lib/xp';
import { toast } from 'sonner';

interface QuizModuleProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export default function QuizModule({ quiz, onComplete, onBack }: QuizModuleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
  const percentage = Math.round((score / quiz.questions.length) * 100);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
      awardXP(50).then(res => {
        if (res?.leveledUp) {
          toast.success(`Tabriklaymiz! Siz ${res.level}-darajaga ko'tarildingiz!`);
        }
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      setShowResults(true);
      awardXP(200).then(res => {
        if (res?.leveledUp) {
          toast.success(`Tabriklaymiz! Siz ${res.level}-darajaga ko'tarildingiz!`);
        }
      });
      onComplete(score);
    }
  };

  if (showResults) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto py-12 space-y-12 text-center"
      >
        <div className="text-center space-y-8">
          <div className="w-24 h-24 bg-med-yellow/15 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-med-yellow/20 relative">
            <Trophy className="w-12 h-12 text-med-yellow" />
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-med-yellow animate-bounce" />
          </div>
          <div className="space-y-3">
             <h2 className="text-5xl font-black text-white tracking-tight">Imtihon Yakunlandi</h2>
             <p className="text-text-3 font-bold uppercase tracking-[0.3em] text-sm">Medical Examination Report</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-12">
           <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-4 text-center">
              <div className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2">To'g'ri Javoblar</div>
              <div className="text-6xl font-black text-white">{score} <span className="text-2xl text-text-3">/ {quiz.questions.length}</span></div>
           </div>
           
           <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-4 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-med-blue/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 relative z-10">Medical Accuracy</div>
              <div className="text-6xl font-black text-med-blue relative z-10">{Math.round(percentage)}%</div>
           </div>

           <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-4 text-center">
              <div className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2">Bilim Darajasi</div>
              <div className="text-3xl font-black text-white uppercase tracking-tighter">
                {percentage > 80 ? 'Ekspert' : percentage > 50 ? 'O\'rta' : 'Qayta O\'qi'}
              </div>
           </div>
        </div>

        <div className="flex gap-6 px-12 pt-8">
          <Button variant="outline" onClick={onBack} className="flex-1 h-16 rounded-2xl border-white/10 text-text-2 hover:bg-white/5 text-lg font-bold">Dashboardga qaytish</Button>
          <Button 
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setShowResults(false);
              setSelectedOption(null);
              setIsAnswered(false);
            }}
            className="flex-1 h-16 bg-med-blue hover:bg-blue-600 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-med-blue/40"
          >
            <RefreshCw className="w-6 h-6" /> Qayta urinish
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col py-8 px-10 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 pb-20">
      <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-[2rem] border border-white/5 mb-10">
        <Button variant="ghost" onClick={onBack} size="sm" className="text-text-3 hover:text-white px-6 h-12 rounded-xl border border-white/5">
          <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Orqaga
        </Button>
        <div className="flex-1 max-w-xl px-12">
           <div className="flex items-center justify-between text-[11px] font-black text-text-3 uppercase tracking-[0.2em] mb-3">
             <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Savol {currentIndex + 1} / {quiz.questions.length}</span>
             <span className="text-med-blue">Hozirgi Score: {score}</span>
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
        <div className="px-6 py-2 rounded-xl bg-med-blue/10 border border-med-blue/20 text-[10px] font-black text-med-blue uppercase tracking-widest whitespace-nowrap">
          Elite Exam Profile
        </div>
      </div>

      <div className="flex flex-col max-w-5xl mx-auto w-full space-y-8">
            
            <div className="space-y-4 relative">
              <div className="w-12 h-12 bg-med-blue/10 rounded-2xl flex items-center justify-center text-med-blue mb-3">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black leading-[1.2] text-white tracking-tight font-heading">
                {currentQuestion.question}
              </h3>
              
              {currentQuestion.hint && !isAnswered && (
                 <div className="pt-4">
                   <button 
                     onClick={() => setShowHint(!showHint)}
                     className="flex items-center gap-3 text-xs font-black text-med-blue uppercase tracking-widest hover:opacity-80 p-4 bg-med-blue/5 border border-med-blue/20 rounded-2xl transition-all"
                   >
                     <Lightbulb className="w-4 h-4" />
                     {showHint ? 'Yashirish' : 'Klinik yordamchi eslatmani ko\'rish'}
                   </button>
                   <AnimatePresence>
                     {showHint && (
                       <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 10 }}
                         className="mt-4 p-8 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/20 text-orange-200 text-lg italic leading-relaxed shadow-inner"
                       >
                         💡 {currentQuestion.hint}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isCorrect = isAnswered && option === currentQuestion.correctAnswer;
                const isWrong = isAnswered && isSelected && option !== currentQuestion.correctAnswer;

                return (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswered}
                    className={cn(
                      "group relative w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between overflow-hidden",
                      isSelected ? "border-med-blue bg-med-blue/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10",
                      isCorrect && "border-med-green bg-med-green/10 text-med-green",
                      isWrong && "border-med-red bg-med-red/10 text-med-red"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10 w-full pr-6">
                       <div className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm transition-colors border",
                         isSelected ? "bg-med-blue text-black border-med-blue" : "bg-white/5 text-text-3 border-white/10"
                       )}>
                         {String.fromCharCode(65 + i)}
                       </div>
                       <span className="text-base font-bold leading-snug">{option}</span>
                    </div>
                    
                    <div className="relative z-10 shrink-0">
                      {isCorrect && <Check className="w-8 h-8 text-med-green animate-in zoom-in" />}
                      {isWrong && <X className="w-8 h-8 text-med-red animate-in zoom-in" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-[10px] font-black text-text-3 uppercase tracking-widest">
                   <FileText className="w-3.5 h-3.5" /> Reference Source
                 </div>
                 <p className="text-sm font-bold text-white/50">{currentQuestion.source || 'Medical Archive: Study Studio'}</p>
               </div>

               <div className="flex gap-4">
                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "px-8 py-4 rounded-2xl border flex items-center gap-4 mr-4",
                        selectedOption === currentQuestion.correctAnswer 
                          ? "bg-med-green/5 border-med-green/20 text-med-green" 
                          : "bg-med-red/5 border-med-red/20 text-med-red"
                      )}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-bold truncate max-w-[200px]">{currentQuestion.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                 {!isAnswered ? (
                   <Button 
                     onClick={handleCheck} 
                     disabled={!selectedOption}
                     className="bg-med-blue hover:bg-med-blue/90 text-white rounded-[2rem] px-16 h-16 text-lg font-black shadow-2xl shadow-med-blue/30 disabled:opacity-30 transition-all active:scale-95"
                   >
                     Tekshirish
                   </Button>
                 ) : (
                   <Button 
                     onClick={handleNext}
                     className="bg-med-blue hover:bg-med-blue/90 text-white rounded-[2rem] px-16 h-16 text-lg font-black flex items-center gap-4 shadow-2xl shadow-med-blue/30 active:scale-95"
                   >
                     {currentIndex < quiz.questions.length - 1 ? 'Keyingi Savol' : 'Natijani ko\'rish'}
                     <ChevronRight className="w-6 h-6" />
                   </Button>
                 )}
               </div>
            </div>
        </div>
    </div>
  );
}
