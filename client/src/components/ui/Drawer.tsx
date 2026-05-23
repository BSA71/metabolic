import { clsx } from 'clsx';

export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className={clsx('fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none')}><div className={clsx('absolute inset-0 bg-slate-950/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} /><aside className={clsx('absolute right-0 top-0 h-full w-full max-w-md bg-white p-6 shadow-2xl transition-transform', open ? 'translate-x-0' : 'translate-x-full')}><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose}>Close</button></div>{children}</aside></div>;
}
