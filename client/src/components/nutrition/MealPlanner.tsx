import type { Meal } from '../../types';
import { MealCard } from './MealCard';

export function MealPlanner({ meals, onChange, onAskAi }: { meals: Meal[]; onChange: () => void; onAskAi: (mealId: string) => void }) {
  return <div className="space-y-4">{meals.map((meal) => <MealCard key={meal.id} meal={meal} onChange={onChange} onAskAi={onAskAi} />)}</div>;
}
