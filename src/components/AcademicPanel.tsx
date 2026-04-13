import { useState } from 'react';
import { Users, Bell, Zap, Download, MessageSquare, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface AcademicPanelProps {
  initialTab?: string;
}

export default function AcademicPanel({ initialTab = 'cohort' }: AcademicPanelProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const students = [
    { name: 'Aziz Karimov', scores: { anat: 92, fiz: 87, biok: 71, patol: 68, farm: 55, ichki: 42 } },
    { name: 'Ma\'mura Rahimova', scores: { anat: 45, fiz: 38, biok: 29, patol: 22, farm: 18, ichki: 15 }, warning: true },
    { name: 'Shoxrux Yusupov', scores: { anat: 78, fiz: 72, biok: 65, patol: 60, farm: 54, ichki: 48 } },
    { name: 'Dilnoza Alieva', scores: { anat: 88, fiz: 82, biok: 75, patol: 72, farm: 68, ichki: 60 } },
    { name: 'Jahongir Ergashev', scores: { anat: 62, fiz: 58, biok: 52, patol: 48, farm: 42, ichki: 38 }, caution: true },
  ];

  const getColor = (score: number) => {
    if (score >= 80) return 'bg-med-green/80';
    if (score >= 50) return 'bg-med-yellow/80';
    return 'bg-med-red/80';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Akademik tahlil</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-bg-card border-border-custom">Guruh: 2-guruh, 28 talaba</Badge>
          <Badge variant="outline" className="bg-bg-card border-border-custom">O'rtacha: 63%</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-bg-secondary border border-border-custom p-1 h-12 gap-1">
          <TabsTrigger value="cohort" className="data-[state=active]:bg-bg-card data-[state=active]:text-med-blue gap-2 px-6">
            <Users className="w-4 h-4" />
            Guruh holati
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-bg-card data-[state=active]:text-med-blue gap-2 px-6">
            <Bell className="w-4 h-4" />
            Ogohlantirishlar
          </TabsTrigger>
          <TabsTrigger value="pulse" className="data-[state=active]:bg-bg-card data-[state=active]:text-med-blue gap-2 px-6">
            <Zap className="w-4 h-4" />
            Dars pulse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cohort" className="mt-8 space-y-6">
          <Card className="bg-bg-card border-border-custom">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">ISITIB XARITASI</CardTitle>
              <button className="flex items-center gap-2 text-xs font-bold text-text-3 hover:text-text-1 transition-colors">
                <Download className="w-4 h-4" />
                Eksport CSV
              </button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-text-3 uppercase text-[10px] tracking-widest border-b border-border-custom">
                      <th className="pb-4 font-bold">Talaba</th>
                      <th className="pb-4 font-bold text-center">Anat</th>
                      <th className="pb-4 font-bold text-center">Fiz</th>
                      <th className="pb-4 font-bold text-center">Biok</th>
                      <th className="pb-4 font-bold text-center">Patol</th>
                      <th className="pb-4 font-bold text-center">Farm</th>
                      <th className="pb-4 font-bold text-center">Ichki</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom">
                    {students.map((student, i) => (
                      <tr key={i} className="group hover:bg-bg-secondary/50 transition-colors">
                        <td className="py-4 font-medium flex items-center gap-2">
                          {student.name}
                          {student.warning && <AlertCircle className="w-3 h-3 text-med-red" />}
                        </td>
                        {Object.values(student.scores).map((score, j) => (
                          <td key={j} className="py-4 text-center">
                            <div className={cn(
                              "w-10 h-10 mx-auto rounded flex items-center justify-center text-xs font-bold text-white transition-transform group-hover:scale-110",
                              getColor(score)
                            )}>
                              {score}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-bg-card border-l-4 border-l-med-red border-border-custom">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-med-red text-white">KRITIK</Badge>
                  <span className="text-xs text-text-3">Xavf: 0.84</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Ma'mura Rahimova</h3>
                  <ul className="mt-2 space-y-1 text-sm text-text-2">
                    <li>• Kirish 60% kamaydi</li>
                    <li>• To'g'ri javoblar: 71% → 44%</li>
                  </ul>
                </div>
                <button className="w-full py-2 bg-bg-secondary border border-border-custom hover:border-med-blue rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  Xabar yozish
                </button>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-l-4 border-l-med-yellow border-border-custom">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-med-yellow text-white">DIQQAT</Badge>
                  <span className="text-xs text-text-3">Xavf: 0.64</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Jahongir Ergashev</h3>
                  <ul className="mt-2 space-y-1 text-sm text-text-2">
                    <li>• Farmakologiya bo'yicha past natija</li>
                    <li>• Oxirgi 3 kun faol emas</li>
                  </ul>
                </div>
                <button className="w-full py-2 bg-bg-secondary border border-border-custom hover:border-med-blue rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  Xabar yozish
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pulse" className="mt-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-bg-card border-border-custom">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Dars pulse (real vaqt)</CardTitle>
                  <p className="text-xs text-text-3">Dars: Kardiovaskulyar tizim</p>
                </div>
                <Badge className="bg-med-green text-white">Ulangan: 24/28</Badge>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium">1-savol: Systole/diastole?</p>
                    <span className="text-xs text-text-3">24 javob</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-2">A: 120/80 mmHg</span>
                        <span className="text-med-green font-bold">68% ✓</span>
                      </div>
                      <Progress value={68} className="h-2 bg-bg-secondary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-2">C: 140/90 mmHg</span>
                        <span className="text-text-3">20%</span>
                      </div>
                      <Progress value={20} className="h-2 bg-bg-secondary" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium">2-savol: Frank-Starling qonuni?</p>
                    <span className="text-xs text-text-3">22 javob</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-2">A: Stretch vs Force</span>
                        <span className="text-med-red font-bold">42% ✓</span>
                      </div>
                      <Progress value={42} className="h-2 bg-bg-secondary" />
                      <p className="text-[10px] text-med-red font-bold uppercase mt-1">⚠ Past natija! Qayta tushuntiring.</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-2">B: Heart rate vs Output</span>
                        <span className="text-text-3">56%</span>
                      </div>
                      <Progress value={56} className="h-2 bg-bg-secondary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-custom">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Dars faolligi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button className="w-full py-4 bg-med-blue hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <Plus className="w-5 h-5" />
                  Savol yuborish
                </button>
                <button className="w-full py-4 bg-bg-secondary border border-border-custom hover:border-med-blue rounded-xl font-bold text-text-1 transition-all">
                  Darsdan chiqish
                </button>
                <div className="pt-4 space-y-2">
                  <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Tavsiya etilgan:</p>
                  <div className="p-3 bg-med-yellow/5 border border-med-yellow/20 rounded-lg">
                    <p className="text-xs text-med-yellow font-medium">Talabalar "Frank-Starling" mavzusida qiynalishmoqda. AI tushuntirish materialini tayyorladi.</p>
                    <button className="mt-2 text-[10px] font-bold text-med-yellow underline">Materialni ko'rish</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
