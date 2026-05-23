import type { Exercise } from '../../types';
import { ExerciseCard } from './ExerciseCard';

export function ExerciseChecklist({ exercises, onChange }: { exercises: Exercise[]; onChange: () => void }) {
  return <div className="space-y-4">{exercises.map((item) => <ExerciseCard key={item.id} item={item} onChange={onChange} />)}</div>;
}
