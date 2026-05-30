import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-brand-navy text-brand-off-white hover:bg-brand-navy/90 dark:bg-brand-green dark:text-brand-navy dark:hover:bg-brand-green-light',
  secondary: 'bg-app-surface text-app-text ring-1 ring-inset ring-app-border hover:bg-app-muted'
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
