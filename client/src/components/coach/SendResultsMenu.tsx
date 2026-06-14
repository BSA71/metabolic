import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

export function SendResultsMenu({
  disabled = false,
  sendingEmail = false,
  sendingSms = false,
  onSendEmail,
  onSendText
}: {
  disabled?: boolean;
  sendingEmail?: boolean;
  sendingSms?: boolean;
  onSendEmail: () => void | Promise<void>;
  onSendText: () => void | Promise<void>;
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

  const busy = disabled || sendingEmail || sendingSms;

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        aria-label="Send results"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Send results"
        disabled={busy}
        className="inline-flex min-h-[2.5rem] items-center justify-center px-3.5 py-2.5"
        onClick={() => setOpen((value) => !value)}
      >
        <Send className="h-[1.375rem] w-[1.375rem]" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 min-w-[9rem] rounded-2xl border border-app-border bg-app-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-app-text hover:bg-app-muted disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              void onSendEmail();
            }}
          >
            {sendingEmail ? 'Sending email…' : 'Send Email'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-app-text hover:bg-app-muted disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              void onSendText();
            }}
          >
            {sendingSms ? 'Sending text…' : 'Send Text'}
          </button>
        </div>
      )}
    </div>
  );
}
