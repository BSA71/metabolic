import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import type { AppUser } from '../../types';

export function AppShell({ user }: { user?: AppUser | null }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1d21] flex flex-col transition-colors duration-200">
      <Topbar user={user} />
      <main className="flex-1 w-full mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}