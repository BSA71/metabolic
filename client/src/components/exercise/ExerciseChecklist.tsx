import type { ScheduledExercise } from '../../types';
import { ExerciseCard } from './ExerciseCard';

export function ExerciseChecklist({
  exercises,
  selectedDate,
  onChange,
  onEdit
}: {
  exercises: ScheduledExercise[];
  selectedDate: string;
  onChange: () => void | Promise<void>;
  onEdit: (item: ScheduledExercise) => void;
}) {
  if (!exercises.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No exercises planned for this day. Add one or copy from another day.
      </div>
    );
  }

  const todo = exercises.filter((item) => item.status === 'PLANNED');
  const completed = exercises.filter((item) => item.status !== 'PLANNED');

  return (
    <div className="space-y-6">
      {todo.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">To do</h2>
          <div className="space-y-2">
            {todo.map((item) => (
              <ExerciseCard
                key={item.id}
                item={item}
                selectedDate={selectedDate}
                onChange={onChange}
                onEdit={() => onEdit(item)}
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Completed</h2>
          <div className="space-y-2">
            {completed.map((item) => (
              <ExerciseCard
                key={item.id}
                item={item}
                selectedDate={selectedDate}
                onChange={onChange}
                onEdit={() => onEdit(item)}
              />
            ))}
          </div>
        </section>
      )}

      {!todo.length && completed.length > 0 && (
        <p className="text-center text-sm text-emerald-700">All exercises done for this day.</p>
      )}
    </div>
  );
}
