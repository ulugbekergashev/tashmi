import { useEffect, useState } from 'react';
import { Brain, Clock, Sparkles, ChevronRight, Flame } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Page } from '../App';
import { db, getDailyReviewCount, getWeakConcepts, MasteryRow } from '../lib/db';
import { motion } from 'motion/react';

interface DailyQueueProps {
  onNavigate: (page: Page) => void;
}

export default function DailyQueue({ onNavigate }: DailyQueueProps) {
  const [counts, setCounts] = useState<{ due: number; new: number }>({ due: 0, new: 0 });
  const [weak, setWeak] = useState<MasteryRow[]>([]);
  const [reviewsToday, setReviewsToday] = useState(0);

  useEffect(() => {
    (async () => {
      const c = await getDailyReviewCount();
      setCounts(c);
      setWeak(await getWeakConcepts(3));

      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const todayCount = await db.reviews.where('reviewed_at').above(dayStart.getTime()).count();
      setReviewsToday(todayCount);
    })();
  }, []);

  const total = counts.due + counts.new;
  const estMinutes = Math.max(1, Math.round(total * 0.4));

  return (
    <Card className="bg-gradient-to-br from-med-blue/10 via-bg-card to-bg-card border-med-blue/20 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-med-blue/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-med-blue" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-1">Bugungi navbat</h3>
              <p className="text-xs text-text-3 font-medium">FSRS algoritmiga asoslangan</p>
            </div>
          </div>
          {reviewsToday > 0 && (
            <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              <span className="text-xs font-bold">{reviewsToday} bajarildi</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-3 rounded-xl bg-bg-secondary border border-border-custom text-center">
            <p className="text-2xl font-bold text-med-blue">{counts.due}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-3 mt-1">Takror</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-3 rounded-xl bg-bg-secondary border border-border-custom text-center">
            <p className="text-2xl font-bold text-med-green">{counts.new}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-3 mt-1">Yangi</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-3 rounded-xl bg-bg-secondary border border-border-custom text-center">
            <p className="text-2xl font-bold text-text-1 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-text-3" />
              {estMinutes}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-text-3 mt-1">Daqiqa</p>
          </motion.div>
        </div>

        {weak.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-text-3 font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Zaif konseptlar — Sokratik tutor uchun
            </p>
            {weak.map(w => (
              <button
                key={w.id}
                onClick={() => onNavigate('tutor')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-med-red/5 border border-med-red/15 hover:bg-med-red/10 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-med-red animate-pulse" />
                  <span className="text-sm font-bold text-text-1">{w.concept}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-med-red font-bold">{Math.round(w.mastery * 100)}%</span>
                  <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-text-1 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onNavigate('learn')}
          disabled={total === 0}
          className="w-full bg-med-blue hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-med-blue/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {total > 0 ? `Boshlash · ${total} ta karta` : 'Bugungi navbat tayyor emas'}
          {total > 0 && <ChevronRight className="w-4 h-4" />}
        </button>
      </CardContent>
    </Card>
  );
}
