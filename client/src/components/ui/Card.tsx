import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#22262b] p-5 shadow-sm', className)} {...props} />;
}
