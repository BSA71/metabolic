import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { todayKey } from '../../services/api';
import type { ScheduledExercise } from '../../types';
import { formatExportDate, formatShortDayLabel } from '../../utils/exportFormat';
import {
  fetchExercisesForDates,
  formatWeekExportLabel,
  getWeekRange,
  parseExportRange,
  weekHasExercises,
  type DayExercises
} from '../../utils/planExportData';
import { PrintExportLayout } from '../../components/export/PrintExportLayout';
import { formatExercisePlan, printExercisePlan, printExerciseWeekPlan } from '../../utils/printExercisePlan';

function dateFromParams(params: URLSearchParams) {
  const date = params.get('date');
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey();
}

function ExerciseExportRow({ item }: { item: ScheduledExercise }) {
  return (
    <li className="flex gap-3 border-t border-slate-200 px-4 py-3 first:border-t-0">
      <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{item.exercise.name}</p>
            {item.exercise.bodyPart && (
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.exercise.bodyPart}</p>
            )}
          </div>
          <p className="text-sm text-slate-600">{formatExercisePlan(item)}</p>
        </div>
        {item.exercise.description && <p className="mt-1 text-xs text-slate-500">{item.exercise.description}</p>}
      </div>
    </li>
  );
}

function WeekDayPreview({ day }: { day: DayExercises }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-3">
      <p className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
        {formatShortDayLabel(day.date)}
      </p>
      {day.exercises.length === 0 ? (
        <p className="mt-3 text-xs italic text-slate-400">No exercises planned</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {day.exercises.map((item) => (
            <li key={item.id}>
              <p className="text-xs font-semibold text-slate-900">{item.exercise.name}</p>
              <p className="text-xs text-slate-500">{formatExercisePlan(item)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ExerciseExportPage() {
  const [searchParams] = useSearchParams();
  const range = parseExportRange(searchParams);
  const date = dateFromParams(searchParams);
  const week = useMemo(() => getWeekRange(date), [date]);
  const weekLabel = formatWeekExportLabel(week.startDate);

  const [exercises, setExercises] = useState<ScheduledExercise[]>([]);
  const [weekDays, setWeekDays] = useState<DayExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const load = range === 'week'
      ? fetchExercisesForDates(week.dates, controller.signal).then((days) => {
          if (controller.signal.aborted) return;
          setWeekDays(days);
          setExercises([]);
        })
      : fetchExercisesForDates([date], controller.signal).then((days) => {
          if (controller.signal.aborted) return;
          setExercises(days[0]?.exercises ?? []);
          setWeekDays([]);
        });

    load
      .catch((err) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setExercises([]);
        setWeekDays([]);
        setError(err instanceof Error ? err.message : 'Could not load exercise plan.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [range, date, week.dates]);

  const backParams = new URLSearchParams();
  if (date !== todayKey()) backParams.set('date', date);
  const backTo = backParams.size ? `/exercise?${backParams.toString()}` : '/exercise';

  const hasContent = range === 'week' ? weekHasExercises(weekDays) : exercises.length > 0;
  const title = range === 'week' ? 'Weekly exercise plan' : 'Exercise plan';
  const subtitle = range === 'week' ? `${weekLabel} · landscape print` : formatExportDate(date);

  return (
    <PrintExportLayout
      title={title}
      subtitle={subtitle}
      backTo={backTo}
      backLabel="Back to exercise"
      wide={range === 'week'}
      printDisabled={loading || Boolean(error) || !hasContent}
      onPrint={() => {
        if (range === 'week') {
          printExerciseWeekPlan(weekDays, weekLabel);
          return;
        }
        printExercisePlan(exercises, date);
      }}
    >
      {loading && <p className="text-sm text-slate-500">Loading plan…</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && !hasContent && (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {range === 'week' ? 'No exercises planned for this week yet.' : 'No exercises planned for this day.'}
        </p>
      )}

      {!loading && !error && range === 'day' && exercises.length > 0 && (
        <section>
          <p className="mb-3 text-sm text-slate-600">
            {exercises.length} exercise{exercises.length === 1 ? '' : 's'} planned
          </p>
          <ul className="overflow-hidden rounded-xl border border-slate-200">
            {exercises.map((item) => (
              <ExerciseExportRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      {!loading && !error && range === 'week' && hasContent && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((day) => (
            <WeekDayPreview key={day.date} day={day} />
          ))}
        </div>
      )}
    </PrintExportLayout>
  );
}
