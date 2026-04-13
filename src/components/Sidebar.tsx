import {
  LayoutGrid, Eye, Library, Map as MapIcon, BarChart3,
  Users, Bell, ClipboardList, LogOut, Dna, BookOpen,
  ShieldCheck, User as UserIcon, GraduationCap, Brain, DatabaseZap, Stethoscope
} from 'lucide-react';
import { Page, Role } from '../App';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  role: Role;
  onToggleRole: () => void;
}

const STUDENT_ITEMS = [
  { id: 'dashboard', label: 'Boshqaruv paneli', icon: LayoutGrid },
  { id: 'kg',        label: 'Akademik Kurslar', icon: BookOpen },
  { id: 'learn',     label: "Shaxsiy O'rganish (Hub)", icon: Brain },
  { id: 'vp',        label: 'Klinik Amaliyot',  icon: Stethoscope },
  { id: 'library',   label: 'Tadqiqot (Kutubxona)', icon: Library },
  { id: 'analytics', label: 'Tahlillar',        icon: BarChart3 },
];

const INSTRUCTOR_ITEMS = [
  { id: 'professor', label: 'Professor paneli',  icon: GraduationCap },
  { id: 'cohort',    label: 'Guruh holati',       icon: Users },
  { id: 'alerts',    label: 'Ogohlantirishlar',   icon: Bell, badge: 3 },
  { id: 'pulse',     label: 'Dars statistikasi',  icon: ClipboardList },
];

export default function Sidebar({ currentPage, onNavigate, role, onToggleRole }: SidebarProps) {
  const items = role === 'student' ? STUDENT_ITEMS : INSTRUCTOR_ITEMS;
  const section = role === 'student' ? 'ASOSIY' : 'PROFESSOR';

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border-custom flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-med-blue to-med-purple flex items-center justify-center shadow-lg shadow-med-blue/20">
          <Dna className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-text-1 font-heading">MedAI</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 overflow-y-auto py-4">
        <div className="space-y-3">
          <h3 className="px-4 text-[10px] font-bold text-text-3 uppercase tracking-[0.2em]">
            {section}
          </h3>
          <div className="space-y-1">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 group',
                  currentPage === item.id
                    ? 'active-sidebar-item'
                    : 'text-text-2 hover:text-text-1 hover:bg-bg-card/50 rounded-xl'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-colors',
                  currentPage === item.id ? 'text-med-blue' : 'text-text-3 group-hover:text-text-1'
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {'badge' in item && (item as any).badge && (
                  <span className="bg-med-red text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {(item as any).badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom: role toggle + user info */}
      <div className="p-6 border-t border-border-custom bg-bg-primary/30 space-y-4">
        <button
          onClick={onToggleRole}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border-custom bg-bg-card hover:bg-bg-secondary transition-all text-[10px] font-bold text-text-3 uppercase tracking-widest group"
        >
          {role === 'student'
            ? <ShieldCheck className="w-3 h-3 text-med-blue group-hover:scale-110 transition-transform" />
            : <UserIcon    className="w-3 h-3 text-med-purple group-hover:scale-110 transition-transform" />
          }
          {role === 'student' ? "O'qituvchiga o'tish" : 'Talabaga o\'tish'}
        </button>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center font-bold border text-sm',
              role === 'student'
                ? 'bg-med-blue/20 text-med-blue border-med-blue/20'
                : 'bg-med-purple/20 text-med-purple border-med-purple/20'
            )}>
              {role === 'student' ? 'AK' : 'PA'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-med-green border-2 border-bg-secondary rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-1 truncate">
              {role === 'student' ? 'Aziz Karimov' : 'Professor Aliev'}
            </p>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">
              {role === 'student' ? 'Talaba · 3-kurs' : "O'qituvchi"}
            </p>
          </div>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-3 hover:text-med-red hover:bg-med-red/10 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
