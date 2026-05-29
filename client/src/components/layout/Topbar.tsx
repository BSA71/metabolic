import { LogOut } from 'lucide-react';
import { logout } from '../../services/auth';
import type { AppUser } from '../../types';
import { ThemeToggle } from './ThemeToggle';

export function Topbar({ user }: { user?: AppUser | null }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-app-border bg-app-surface/90 px-4 py-3 backdrop-blur">
      <div>
        <p className="text-sm text-app-text-muted">Today</p>
        <h1 className="text-xl font-bold">Welcome{user ? `, ${user.firstName}` : ''}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          className="flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm transition hover:bg-app-muted"
          onClick={() => logout()}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
