import type { Exercise } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function ExerciseCard({ item, onChange }: { item: Exercise; onChange: () => void }) {
  async function markDone() { await api(`/api/scheduled-exercises/${item.id}/mark-done`, { method: 'POST' }); onChange(); }
  async function skip() { await api(`/api/scheduled-exercises/${item.id}/skip`, { method: 'POST' }); onChange(); }
  return <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold">{item.exercise.name}</h3><p className="text-sm text-slate-500">{item.sets ? `${item.sets} sets x ${item.reps ?? '-'} reps` : `${item.durationMinutes ?? 0} minutes`}</p></div><Badge tone={item.status === 'DONE' ? 'green' : 'blue'}>{item.status}</Badge></div><div className="mt-4 flex gap-2"><Button onClick={markDone}>Mark done</Button><button onClick={skip} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Skip</button></div></Card>;
}
