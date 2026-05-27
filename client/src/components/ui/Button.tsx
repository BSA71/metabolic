import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-brand-dark dark:bg-brand-yellow text-white dark:text-brand-dark hover:opacity-90',
  secondary: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
} as const;

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
