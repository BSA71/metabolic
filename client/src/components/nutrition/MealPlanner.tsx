import type { Meal } from '../../types';
import { MealCard } from './MealCard';

export function MealPlanner({
  meals,
  selectedDate,
  onChange,
  onEditPlan,
  onLogActual
}: {
  meals: Meal[];
  selectedDate: string;
  onChange: () => void;
  onEditPlan: (mealId: string) => void;
  onLogActual: (mealId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          selectedDate={selectedDate}
          onChange={onChange}
          onEditPlan={onEditPlan}
          onLogActual={onLogActual}
        />
      ))}
    </div>
  );
}
