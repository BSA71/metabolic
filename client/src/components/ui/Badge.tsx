import { clsx } from 'clsx';

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'blue' | 'yellow' | 'red' }) {
  const tones = { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-700', blue: 'bg-blue-100 text-blue-700', yellow: 'bg-yellow-100 text-yellow-800', red: 'bg-red-100 text-red-700' };
  return <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>;
}
