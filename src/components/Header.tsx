import { Search, Bell, User } from 'lucide-react';
import { Input } from './ui/input';

export default function Header() {
  return (
    <header className="h-[60px] bg-bg-primary border-bottom border-border-custom px-6 flex items-center justify-between shrink-0">
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
        <Input 
          placeholder="Mavzularni qidirish..." 
          className="bg-bg-secondary border-border-custom pl-10 h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-2 hover:text-text-1 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-med-red rounded-full border-2 border-bg-primary"></span>
        </button>
        <div className="h-8 w-[1px] bg-border-custom"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-1">Aziz Karimov</p>
            <p className="text-xs text-text-3">3-kurs talabasi</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-bg-card border border-border-custom flex items-center justify-center">
            <User className="w-5 h-5 text-text-2" />
          </div>
        </div>
      </div>
    </header>
  );
}
