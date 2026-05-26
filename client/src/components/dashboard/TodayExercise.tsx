import { useNavigate } from 'react-router-dom';
import type { Exercise } from '../../types';
import { todayKey } from '../../services/api';
import { ExerciseCard } from '../exercise/ExerciseCard';
import { Card } from '../ui/Card';

export function TodayExercise({
  exercises,
  onChange
}: {
  exercises: Exercise[];
  onChange: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const selectedDate = todayKey();
  const todo = exercises.filter((item) => item.status === 'PLANNED');
  const completed = exercises.filter((item) => item.status !== 'PLANNED');

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Today&apos;s Exercises</h2>
      {!exercises.length ? (
        <p className="text-sm text-slate-500">No exercises planned today.</p>
      ) : (
        <div className="space-y-4">
          {todo.length > 0 && (
            <div className="space-y-2">
              {todo.map((item) => (
                <ExerciseCard
                  key={item.id}
                  item={item}
                  selectedDate={selectedDate}
                  onChange={onChange}
                  onEdit={() => navigate('/exercise')}
                />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              {completed.map((item) => (
                <ExerciseCard
                  key={item.id}
                  item={item}
                  selectedDate={selectedDate}
                  onChange={onChange}
                  onEdit={() => navigate('/exercise')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
