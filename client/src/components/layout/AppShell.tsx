import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { AppUser } from '../../types';

export function AppShell({ user }: { user?: AppUser | null }) {
  return (
    <div className="min-h-screen bg-app-bg text-app-text lg:flex">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1">
        <Topbar user={user} />
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
