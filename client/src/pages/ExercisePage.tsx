import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, isToday, todayKey } from '../services/api';
import type { ScheduledExercise } from '../types';
import { WeekDateStrip } from '../components/nutrition/WeekDateStrip';
import { ExerciseChecklist } from '../components/exercise/ExerciseChecklist';
import { ExerciseCopyMenu } from '../components/exercise/ExerciseCopyMenu';
import { AddExerciseDrawer } from '../components/exercise/AddExerciseDrawer';
import { EditExerciseDrawer } from '../components/exercise/EditExerciseDrawer';
import { Button } from '../components/ui/Button';

function dateFromParams(params: URLSearchParams) {
  const date = params.get('date');
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey();
}

export function ExercisePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = dateFromParams(searchParams);
  const [exercises, setExercises] = useState<ScheduledExercise[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduledExercise>();
  const [copyDate, setCopyDate] = useState('');
  const [copying, setCopying] = useState(false);

  const load = useCallback(async (date: string) => {
    setLoadError(null);
    try {
      const data = await api<ScheduledExercise[]>(`/api/daily-logs/${date}/exercises/ensure`, { method: 'POST' });
      setExercises(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load exercises.';
      try {
        const data = await api<ScheduledExercise[]>(`/api/daily-logs/${date}/exercises`);
        setExercises(data);
        setLoadError(data.length ? null : message);
      } catch {
        setExercises([]);
        setLoadError(message);
      }
    }
  }, []);

  useEffect(() => {
    void load(selectedDate);
  }, [selectedDate, load]);

  function selectDate(date: string) {
    setSearchParams(date === todayKey() ? {} : { date }, { replace: true });
  }

  async function copyFromPreviousDay() {
    setActionError(null);
    setCopying(true);
    try {
      await api(`/api/daily-logs/${selectedDate}/exercises/copy-from-previous-day`, { method: 'POST' });
      await load(selectedDate);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not copy from previous day');
    } finally {
      setCopying(false);
    }
  }

  async function copyFromDate() {
    if (!copyDate) return;
    setActionError(null);
    setCopying(true);
    try {
      await api(`/api/daily-logs/${selectedDate}/exercises/copy-from-date`, {
        method: 'POST',
        body: JSON.stringify({ sourceDate: copyDate })
      });
      await load(selectedDate);
      setCopyDate('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not copy from that date');
    } finally {
      setCopying(false);
    }
  }

  const doneCount = exercises.filter((item) => item.status === 'DONE').length;
  const progress = exercises.length ? Math.round((doneCount / exercises.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <h1 className="text-3xl font-bold">Exercise</h1>
        <p className="text-slate-500 sm:pt-1">Plan workouts by day, then check them off as you go.</p>
      </div>

      <WeekDateStrip selectedDate={selectedDate} onSelectDate={selectDate} />

      {exercises.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-semibold text-slate-900">
              {doneCount} of {exercises.length} done
            </p>
            {!isToday(selectedDate) && <p className="text-slate-400">{selectedDate}</p>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setAddOpen(true)}>Add exercise</Button>
        <ExerciseCopyMenu
          copyDate={copyDate}
          copying={copying}
          onCopyDateChange={setCopyDate}
          onCopyFromPreviousDay={copyFromPreviousDay}
          onCopyFromDate={copyFromDate}
        />
      </div>

      {(loadError || actionError) && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{actionError ?? loadError}</div>
      )}

      <ExerciseChecklist
        exercises={exercises}
        selectedDate={selectedDate}
        onChange={() => load(selectedDate)}
        onEdit={setEditItem}
      />

      <AddExerciseDrawer
        open={addOpen}
        date={selectedDate}
        onClose={() => setAddOpen(false)}
        onSaved={() => load(selectedDate)}
      />

      <EditExerciseDrawer
        open={Boolean(editItem)}
        item={editItem}
        onClose={() => setEditItem(undefined)}
        onSaved={() => load(selectedDate)}
      />
    </div>
  );
}
