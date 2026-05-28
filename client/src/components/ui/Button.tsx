import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-brand text-brand-foreground hover:bg-brand-deep shadow-sm',
  secondary:
    'bg-app-surface text-app-text ring-1 ring-inset ring-app-border hover:bg-app-muted'
} as const;

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
