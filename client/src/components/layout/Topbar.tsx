import { LogOut } from 'lucide-react';
import { logout } from '../../services/auth';
import type { AppUser } from '../../types';

export function Topbar({ user }: { user?: AppUser | null }) {
  return <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur"><div><p className="text-sm text-slate-500">Today</p><h1 className="text-xl font-bold">Welcome{user ? `, ${user.firstName}` : ''}</h1></div><button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => logout()}><LogOut size={16} />Logout</button></header>;
}
