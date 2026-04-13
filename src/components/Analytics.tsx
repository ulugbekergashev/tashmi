import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { BarChart3, TrendingUp, Target, Brain, Clock, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Analytics() {
  const stats = [
    { label: 'O\'rtacha ball', value: '84%', icon: Target, color: 'text-med-blue', bg: 'bg-med-blue/10' },
    { label: 'O\'rganilgan mavzular', value: '128', icon: Brain, color: 'text-med-purple', bg: 'bg-med-purple/10' },
    { label: 'O\'quv vaqti', value: '42s', icon: Clock, color: 'text-med-green', bg: 'bg-med-green/10' },
    { label: 'Kunlik streak', value: '12 kun', icon: TrendingUp, color: 'text-med-yellow', bg: 'bg-med-yellow/10' },
  ];

  const subjectPerformance = [
    { name: 'Anatomiya', score: 92, trend: '+5%' },
    { name: 'Fiziologiya', score: 78, trend: '+12%' },
    { name: 'Biokimyo', score: 65, trend: '-2%' },
    { name: 'Patologiya', score: 84, trend: '+8%' },
    { name: 'Farmakologiya', score: 55, trend: '+15%' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shaxsiy tahlillar</h1>
          <p className="text-sm text-text-3">Sizning o'quv natijalaringiz va o'sish dinamikangiz</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-bg-card border border-border-custom rounded-xl text-xs font-bold text-text-2 hover:text-text-1 transition-all">
            Haftalik
          </button>
          <button className="px-4 py-2 bg-med-blue text-white rounded-xl text-xs font-bold shadow-lg shadow-med-blue/20 transition-all">
            Oylik
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-bg-card border-border-custom">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-bold text-text-1">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart Placeholder */}
        <Card className="lg:col-span-2 bg-bg-card border-border-custom">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">O'zlashtirish dinamikasi</CardTitle>
            <BarChart3 className="w-5 h-5 text-text-3" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2 pt-10 px-4">
              {[60, 45, 75, 50, 90, 65, 80].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="w-full relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn(
                        "w-full rounded-t-lg transition-all group-hover:brightness-110",
                        i === 4 ? "bg-med-blue" : "bg-med-blue/20"
                      )}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge className="bg-bg-secondary border-border-custom text-[10px]">{height}%</Badge>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-text-3 uppercase tracking-tighter">
                    {['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        <Card className="bg-bg-card border-border-custom">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Fanlar bo'yicha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjectPerformance.map((subject, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-2 font-medium">{subject.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold",
                      subject.trend.startsWith('+') ? "text-med-green" : "text-med-red"
                    )}>
                      {subject.trend}
                    </span>
                    <span className="font-bold text-text-1">{subject.score}%</span>
                  </div>
                </div>
                <Progress value={subject.score} className="h-1.5 bg-bg-secondary" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weak Points */}
      <Card className="bg-bg-card border-border-custom border-l-4 border-l-med-red">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-med-red" />
            E'tibor talab qiladigan mavzular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Krebbs sikli', subject: 'Biokimyo', risk: 'YUQORI' },
              { title: 'Beta-blokerlar', subject: 'Farmakologiya', risk: 'O\'RTA' },
              { title: 'Yurak klapanlari', subject: 'Anatomiya', risk: 'PAST' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-bg-secondary/50 rounded-xl border border-border-custom flex items-center justify-between group hover:border-med-red/30 transition-all cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-text-1">{item.title}</p>
                  <p className="text-[10px] text-text-3 font-bold uppercase tracking-widest">{item.subject}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-med-red transition-colors" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
