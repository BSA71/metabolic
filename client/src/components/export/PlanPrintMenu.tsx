import { useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';

export function PlanPrintMenu({
  printing = null,
  disabled = false,
  onPrintDay,
  onPrintWeek
}: {
  printing?: 'day' | 'week' | null;
  disabled?: boolean;
  onPrintDay: () => void;
  onPrintWeek: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const busy = disabled || printing !== null;

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        aria-label="Print plan"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Print plan"
        disabled={busy}
        className="inline-flex min-h-[2.5rem] items-center justify-center px-3.5 py-2.5"
        onClick={() => setOpen((value) => !value)}
      >
        <Printer className="h-[1.375rem] w-[1.375rem]" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 min-w-[7.5rem] rounded-2xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              onPrintDay();
            }}
          >
            Day
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              void onPrintWeek();
            }}
          >
            {printing === 'week' ? 'Printing…' : 'Week'}
          </button>
        </div>
      )}
    </div>
  );
}
