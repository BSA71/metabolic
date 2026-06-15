import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { ReviewFood } from '../../types';
import { Card } from '../ui/Card';
import { ReviewFoodDrawer } from './ReviewFoodDrawer';

function formatServing(food: ReviewFood) {
  return `${Number(food.servingSize)} ${food.servingUnit}`;
}

function formatMacros(food: ReviewFood) {
  return `${Number(food.protein)}P / ${Number(food.carbs)}C / ${Number(food.fat)}F`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function FoodReviewQueue() {
  const [foods, setFoods] = useState<ReviewFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const selectedFood = foods.find((food) => food.id === selectedFoodId);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api<ReviewFood[]>('/api/admin/food-review');
      setFoods(rows);
      setSelectedFoodId((current) => (current && rows.some((food) => food.id === current) ? current : null));
    } catch (err) {
      setFoods([]);
      setSelectedFoodId(null);
      setError(err instanceof Error ? err.message : 'Unable to load review queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  function handleSaved(updated: ReviewFood) {
    setFoods((current) => current.map((food) => (food.id === updated.id ? updated : food)));
  }

  function handleResolved(foodId: string) {
    setFoods((current) => current.filter((food) => food.id !== foodId));
    setSelectedFoodId(null);
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">AI Review Queue</h2>
            <p className="text-sm text-slate-500">Click a row to review, edit, approve, or reject AI-generated foods.</p>
          </div>
          <span className="text-sm text-slate-500">{foods.length} pending</span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading review queue...</p>}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && foods.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">No AI-generated foods are waiting for review.</p>
        )}

        {!loading && !error && foods.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Food</th>
                  <th className="py-3 pr-4 font-medium">Original prompt</th>
                  <th className="py-3 pr-4 font-medium">Serving</th>
                  <th className="py-3 pr-4 font-medium">Calories</th>
                  <th className="py-3 pr-4 font-medium">Macros</th>
                  <th className="py-3 pr-4 font-medium">Submitted by</th>
                  <th className="py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => {
                  const selected = selectedFoodId === food.id;
                  return (
                    <tr
                      key={food.id}
                      tabIndex={0}
                      onClick={() => setSelectedFoodId(food.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedFoodId(food.id);
                        }
                      }}
                      className={`cursor-pointer border-b border-slate-100 transition last:border-0 ${
                        selected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{food.name}</div>
                        {food.brand && <div className="text-slate-500">{food.brand}</div>}
                      </td>
                      <td className="max-w-xs py-3 pr-4 text-slate-600">
                        <span className="line-clamp-2">{food.inputText ?? '—'}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatServing(food)}</td>
                      <td className="py-3 pr-4 text-slate-600">{Math.round(Number(food.calories))}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatMacros(food)}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {food.createdBy ? `${food.createdBy.firstName} ${food.createdBy.lastName}` : '—'}
                      </td>
                      <td className="py-3 text-slate-600">{formatDate(food.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ReviewFoodDrawer
        open={Boolean(selectedFood)}
        food={selectedFood}
        onClose={() => setSelectedFoodId(null)}
        onApproved={() => selectedFood && handleResolved(selectedFood.id)}
        onSaved={handleSaved}
        onRejected={() => selectedFood && handleResolved(selectedFood.id)}
      />
    </>
  );
}
