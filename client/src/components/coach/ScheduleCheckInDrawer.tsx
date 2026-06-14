import { useEffect, useMemo, useState } from 'react';
import { api, toDateKey } from '../../services/api';
import type { CoachCheckIn, CoachCalendarEvent, CoachClient } from '../../types';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

function clientName(client: CoachClient) {
  return `${client.firstName} ${client.lastName}`;
}

function toLocalDateFromIso(iso: string) {
  return toDateKey(new Date(iso));
}

function toLocalTimeInput(iso?: string) {
  if (!iso) return '09:00';
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toStartsAtIso(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error('Enter a valid date and time.');
  }
  return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString();
}

export function ScheduleCheckInDrawer({
  open,
  clients,
  initialDate,
  initialUserId = '',
  editingEvent = null,
  onClose,
  onSaved
}: {
  open: boolean;
  clients: CoachClient[];
  initialDate: string;
  initialUserId?: string;
  editingEvent?: CoachCalendarEvent | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [userId, setUserId] = useState(initialUserId);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(30);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => clientName(a).localeCompare(clientName(b))),
    [clients]
  );

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingEvent?.checkInId) {
      setUserId(editingEvent.userId);
      setDate(editingEvent.startsAt ? toLocalDateFromIso(editingEvent.startsAt) : editingEvent.date);
      setTime(toLocalTimeInput(editingEvent.startsAt));
      setDurationMinutes(editingEvent.durationMinutes === 60 ? 60 : 30);
      setNotes(editingEvent.detail ?? '');
      return;
    }
    setUserId(initialUserId || sortedClients[0]?.id || '');
    setDate(initialDate);
    setTime('09:00');
    setDurationMinutes(30);
    setNotes('');
  }, [editingEvent, initialDate, initialUserId, open, sortedClients]);

  async function save() {
    if (!userId) {
      setError('Choose a client first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        userId,
        startsAt: toStartsAtIso(date, time),
        durationMinutes,
        notes: notes.trim() || null
      };
      if (editingEvent?.checkInId) {
        await api<CoachCheckIn>(`/api/coach/check-ins/${editingEvent.checkInId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        await api<CoachCheckIn>('/api/coach/check-ins', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save check-in');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editingEvent?.checkInId) return;
    if (!window.confirm('Cancel this check-in?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/coach/check-ins/${editingEvent.checkInId}`, { method: 'DELETE' });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete check-in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer open={open} title={editingEvent ? 'Edit check-in' : 'Schedule check-in'} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-app-text-muted">
          Book a 30-minute or 1-hour check-in with an assigned client. It will appear on your coach calendar.
        </p>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Client</span>
          <select
            className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          >
            {sortedClients.map((client) => (
              <option key={client.id} value={client.id}>
                {clientName(client)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Date</span>
            <input
              type="date"
              className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Time</span>
            <input
              type="time"
              className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Duration</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="check-in-duration"
              checked={durationMinutes === 30}
              onChange={() => setDurationMinutes(30)}
            />
            30 minutes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="check-in-duration"
              checked={durationMinutes === 60}
              onChange={() => setDurationMinutes(60)}
            />
            1 hour
          </label>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Notes</span>
          <textarea
            className="min-h-[5rem] w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
            value={notes}
            placeholder="Optional agenda or meeting link"
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="flex-1" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : editingEvent ? 'Save changes' : 'Schedule check-in'}
          </Button>
          {editingEvent?.checkInId && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void remove()}>
              Cancel check-in
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
