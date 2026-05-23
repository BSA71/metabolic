import type { Exercise } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function TodayExercise({ exercises }: { exercises: Exercise[] }) {
  return <Card><h2 className="mb-4 text-lg font-bold">Today's Exercises</h2><div className="space-y-3">{exercises.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><p className="font-semibold">{item.exercise.name}</p><p className="text-sm text-slate-500">{item.sets ? `${item.sets} sets x ${item.reps ?? '-'} reps` : `${item.durationMinutes ?? 0} min`}</p></div><Badge tone={item.status === 'DONE' ? 'green' : 'blue'}>{item.status}</Badge></div>)}</div></Card>;
}
