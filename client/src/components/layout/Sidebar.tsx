import { Apple, Bot, Dumbbell, Gauge, LineChart, Settings, Target } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { AppUser } from '../../types';
import { isAdminRole } from '../../utils/roles';
import { BrandLogo } from '../brand/BrandLogo';

const links = [
  ['/', 'Dashboard', Gauge],
  ['/program', 'Program', Target],
  ['/nutrition', 'Nutrition', Apple],
  ['/exercise', 'Exercise', Dumbbell],
  ['/progress', 'Progress', LineChart],
  ['/assistant', 'AI Assistant', Bot],
  ['/admin', 'Admin', Settings]
] as const;

export function Sidebar({ user }: { user?: AppUser | null }) {
  const visibleLinks = links.filter(([to]) => to !== '/admin' || isAdminRole(user?.role));

  return (
    <aside className="hidden w-64 border-r border-app-border bg-app-surface p-5 lg:block">
      <div className="mb-8">
        <BrandLogo markSize={32} />
      </div>
      <nav className="space-y-1">
        {visibleLinks.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-app-text-muted hover:bg-app-muted hover:text-app-text'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
