import { ArrowLeft, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';
import type { AppUser } from '../../types';
import { BrandLogo } from '../brand/BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { TopbarGamification } from './TopbarGamification';

export function Topbar({ user }: { user?: AppUser | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-app-border bg-app-surface/90 px-4 py-3 backdrop-blur transition-colors duration-200">
      <div className="flex items-center gap-4 min-w-0 justify-self-start">
        {!isDashboard && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-app-muted text-app-text-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <BrandLogo showTagline={isDashboard} markSize={36} to="/" />
      </div>

      <div className="justify-self-center min-w-0 w-full max-w-xl md:max-w-2xl px-1 overflow-hidden">
        <TopbarGamification />
      </div>

      <div className="flex items-center gap-3 justify-self-end">
        {user && (
          <span className="text-sm font-medium hidden md:block text-app-text-muted">
            Hi, {user.firstName}
          </span>
        )}

        <ThemeToggle />

        <button
          className="flex items-center gap-2 rounded-xl bg-app-muted hover:bg-app-border/60 text-app-text px-3 py-2 text-sm font-medium transition-colors"
          onClick={() => logout()}
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
