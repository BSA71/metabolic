import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';
import type { AppUser } from '../../types';
import { useEffect, useState } from 'react';

export function Topbar({ user }: { user?: AppUser | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check initial theme from document class
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#22262b]/90 px-4 py-3 backdrop-blur transition-colors duration-200">
      <div className="flex items-center gap-4">
        {!isDashboard && (
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark dark:bg-brand-yellow text-brand-yellow dark:text-brand-dark font-bold shadow-sm">
            M
          </div>
          <h1 className="text-xl font-bold dark:text-white hidden sm:block">Metabolic</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {user && <span className="text-sm font-medium hidden md:block text-slate-600 dark:text-slate-300">Hi, {user.firstName}</span>}
        
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <button 
          className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm font-medium transition-colors" 
          onClick={() => logout()}
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}