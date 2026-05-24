import { Activity, Apple, Bot, Dumbbell, Gauge, LineChart, Settings, Target } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  ['/', 'Dashboard', Gauge], ['/program', 'Program', Target], ['/nutrition', 'Nutrition', Apple], ['/exercise', 'Exercise', Dumbbell], ['/progress', 'Progress', LineChart], ['/assistant', 'AI Assistant', Bot], ['/admin', 'Admin', Settings]
] as const;

export function Sidebar() {
  return <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block"><div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><Activity size={20} /></div><div><p className="font-bold">Metabolic</p><p className="text-xs text-slate-500">Command center</p></div></div><nav className="space-y-1">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={18} />{label}</NavLink>)}</nav></aside>;
}
