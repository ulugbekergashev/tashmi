import { useEffect, useState } from 'react';
import { Flame, Trophy, Zap, AlertTriangle, RefreshCw, CheckCircle2, PlayCircle, Clock, Sparkles, TrendingUp, Calendar, ChevronRight, Library } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Page } from '../App';
import { Metric, PlanItem, SubjectProgress, Activity } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import DailyQueue from './DailyQueue';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const stats = useLiveQuery(() => db.user_stats.get('me'));

  const metrics: Metric[] = [
    { label: 'Streak', value: `🔥 ${stats?.streak || 0} kun` },
    { label: 'Umumiy ball', value: `${stats?.total_xp || 0} / ${((stats?.level || 1) * 1000)} XP` },
    { label: 'Eng kuchli', value: 'Kardio 87%' },
    { label: 'Xavf', value: '✓ PAST', status: 'PAST' },
  ];

  const plan: PlanItem[] = [
    { time: '09:00', title: 'Anatomiya kartalar', duration: '20 daq', status: 'completed', type: 'flashcards' },
    { time: '09:20', title: 'Virtual bemor — kardio', duration: '30 daq', status: 'active', type: 'vp' },
    { time: '09:50', title: 'Farmakologiya zaif mavzu', duration: '15 daq', status: 'pending', type: 'subject' },
    { time: '10:05', title: 'Ertangi darsga tayyorlov', duration: '10 daq', status: 'pending', type: 'prep' },
  ];

  const subjects: SubjectProgress[] = [
    { name: 'Anatomiya', progress: 82 },
    { name: 'Fiziologiya', progress: 61 },
    { name: 'Biokimyo', progress: 54 },
    { name: 'Patologiya', progress: 43, warning: true },
    { name: 'Farmakologiya', progress: 33, warning: true },
  ];

  const activities: Activity[] = [
    { time: 'Bugun', title: 'Virtual bemor #12 — Kardio', details: '74/100' },
    { time: 'Kecha', title: 'Kartalar — 15 ta', details: '87% to\'g\'ri' },
    { time: '3 kun oldin', title: 'Podcast — Beta-blokerlar', details: 'Tinglandi' },
  ];

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto py-6">
      {/* Header Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Xush kelibsiz, Doktor! <Sparkles className="w-8 h-8 text-med-yellow animate-pulse" />
          </h1>
          <p className="text-text-3 font-bold uppercase tracking-widest text-sm">Sizning shaxsiy tibbiy o'quv kabinetingiz</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-5 py-2 rounded-xl bg-white/5 border-white/10 text-text-3 font-black space-x-2">
            <Calendar className="w-4 h-4" /> <span>13-Aprel, 2024</span>
          </Badge>
          <div className="w-12 h-12 rounded-2xl bg-med-blue/10 flex items-center justify-center border border-med-blue/20">
            <TrendingUp className="w-6 h-6 text-med-blue" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl hover:border-white/10 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-med-blue/5 transition-colors" />
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
                    metric.label === 'Streak' ? "bg-orange-500/10 text-orange-500 shadow-orange-500/10" :
                    metric.label === 'Umumiy ball' ? "bg-yellow-500/10 text-yellow-500 shadow-yellow-500/10" :
                    metric.label === 'Eng kuchli' ? "bg-blue-500/10 text-blue-500 shadow-blue-500/10" : "bg-med-green/10 text-med-green shadow-med-green/10"
                  )}>
                    {metric.label === 'Streak' && <Flame className="w-6 h-6" />}
                    {metric.label === 'Umumiy ball' && <Trophy className="w-6 h-6" />}
                    {metric.label === 'Eng kuchli' && <Zap className="w-6 h-6" />}
                    {metric.label === 'Xavf' && <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <Badge className="bg-white/5 text-[10px] font-black text-text-3 border-white/5">+12%</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-3 uppercase tracking-[0.2em] mb-1">{metric.label}</p>
                  <div className={cn(
                    "text-3xl font-black",
                    metric.status === 'PAST' && "text-med-green",
                    metric.status === 'O\'RTA' && "text-med-yellow",
                    metric.status === 'YUQORI' && "text-med-red animate-pulse"
                  )}>
                    {metric.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Daily Queue (FSRS) */}
      <DailyQueue onNavigate={onNavigate} />

      {/* AI Plan */}
      <Card className="bg-white/[0.02] border-white/5 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3.5rem]">
        <CardHeader className="flex flex-row items-center justify-between py-10 px-12 bg-gradient-to-r from-med-blue/10 to-transparent border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.2rem] bg-med-blue flex items-center justify-center shadow-2xl shadow-med-blue/40">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-white">Bugungi Strategik Reja</CardTitle>
              <p className="text-[10px] font-black text-text-3 uppercase tracking-widest mt-1">AI Optimized Study Path</p>
            </div>
          </div>
          <Button variant="ghost" className="text-text-3 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
            <RefreshCw className="w-4 h-4" />
            Yangilash
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {plan.map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.4 }}
                className="flex items-center justify-between p-10 hover:bg-white/[0.02] transition-all group"
              >
                <div className="flex items-center gap-10">
                  <div className="w-20 text-sm text-text-3 font-black tracking-widest">{item.time}</div>
                  <div className={cn(
                    "w-4 h-4 rounded-full ring-8 transition-all duration-500",
                    item.status === 'completed' ? "bg-med-green ring-med-green/10" : 
                    item.status === 'active' ? "bg-med-blue ring-med-blue/10 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" : 
                    "bg-white/10 ring-white/5"
                  )}></div>
                  <div className="space-y-1">
                    <div className={cn(
                      "text-xl font-bold transition-all",
                      item.status === 'completed' ? "text-text-3 line-through" : "text-white"
                    )}>
                      {item.title}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-text-3 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      {item.duration}
                    </div>
                  </div>
                </div>
                <div>
                  {item.status === 'completed' ? (
                    <div className="flex items-center gap-2 text-med-green text-xs font-black uppercase tracking-widest bg-med-green/10 px-6 py-3 rounded-2xl border border-med-green/20">
                      <CheckCircle2 className="w-4 h-4" />
                      Bajarildi
                    </div>
                  ) : (
                    <Button 
                      onClick={() => onNavigate(item.type === 'vp' ? 'vp' : 'learn')}
                      className="flex items-center gap-3 bg-med-blue hover:bg-blue-600 text-[#020617] px-8 h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-med-blue/30 transition-all active:scale-90"
                    >
                      <PlayCircle className="w-5 h-5 fill-current" />
                      Boshlash
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-2 pb-20">
        {/* Progress */}
        <Card className="lg:col-span-3 bg-white/[0.02] border-white/5 rounded-[3rem] p-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black text-white">Akademik Progress</CardTitle>
            <Library className="w-5 h-5 text-text-3" />
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {subjects.map((subject, i) => (
              <div 
                key={i} 
                className="space-y-3 cursor-pointer group"
                onClick={() => onNavigate('learn')}
              >
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-text-2 group-hover:text-white transition-colors">{subject.name}</span>
                  <div className="flex items-center gap-2">
                    {subject.warning && <AlertTriangle className="w-4 h-4 text-med-red animate-pulse" />}
                    <span className={cn("font-black text-sm", subject.warning ? "text-med-red" : "text-white")}>
                      {subject.progress}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={cn(
                      "h-full rounded-full shadow-lg",
                      subject.progress > 70 ? "bg-med-blue shadow-med-blue/20" : subject.progress > 40 ? "bg-med-yellow shadow-med-yellow/20" : "bg-med-red shadow-med-red/20"
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/5 rounded-[3rem] p-4">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">So'nggi Faollik</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
              {activities.map((activity, i) => (
                <div key={i} className="relative pl-12 group cursor-pointer">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#020617] border-4 border-med-blue group-hover:scale-125 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                  <p className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-1">{activity.time}</p>
                  <p className="text-lg font-bold text-white group-hover:text-med-blue transition-colors leading-tight">{activity.title}</p>
                  <p className="text-xs font-medium text-text-3 mt-1">{activity.details}</p>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-12 py-6 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-3 hover:text-white hover:bg-white/5">
              To'liq o'tmishni ko'rish <ChevronRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
