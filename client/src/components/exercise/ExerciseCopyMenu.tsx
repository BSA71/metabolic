import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';

export function ExerciseCopyMenu({
  copyDate,
  copying,
  onCopyDateChange,
  onCopyFromPreviousDay,
  onCopyFromDate
}: {
  copyDate: string;
  copying: boolean;
  onCopyDateChange: (date: string) => void;
  onCopyFromPreviousDay: () => void | Promise<void>;
  onCopyFromDate: () => void | Promise<void>;
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

  return (
    <div ref={rootRef} className="relative">
      <Button variant="secondary" disabled={copying} onClick={() => setOpen((value) => !value)}>
        Copy plan…
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Copy exercises</p>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={copying}
            onClick={() => {
              setOpen(false);
              void onCopyFromPreviousDay();
            }}
          >
            From previous day
          </button>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <label className="block text-sm text-slate-600">
              From a specific date
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={copyDate}
                onChange={(event) => onCopyDateChange(event.target.value)}
              />
            </label>
            <Button
              variant="secondary"
              className="mt-2 w-full"
              disabled={copying || !copyDate}
              onClick={() => {
                setOpen(false);
                void onCopyFromDate();
              }}
            >
              Copy from date
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
