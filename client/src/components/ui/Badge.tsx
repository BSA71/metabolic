import { clsx } from 'clsx';

export function Badge({
  children,
  tone = 'slate'
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'green' | 'blue' | 'yellow' | 'red';
}) {
  const tones = {
    slate: 'bg-app-muted text-app-text-muted',
    green: 'bg-brand-green/15 text-brand-green dark:bg-brand-green-light/15 dark:text-brand-green-light',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
    yellow: 'bg-brand-gold/20 text-brand-navy dark:text-brand-gold',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
  };
  return (
    <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  );
}
