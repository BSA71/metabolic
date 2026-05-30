import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AdminFood } from '../../types';
import { Card } from '../ui/Card';
import { EditFoodDrawer } from './EditFoodDrawer';

function formatServing(food: AdminFood) {
  return `${Number(food.servingSize)} ${food.servingUnit}`;
}

function formatMacros(food: AdminFood) {
  return `${Number(food.protein)}P / ${Number(food.carbs)}C / ${Number(food.fat)}F`;
}

function badgeClass(kind: 'verified' | 'ai' | 'global' | 'user') {
  if (kind === 'verified') return 'bg-emerald-50 text-emerald-700';
  if (kind === 'ai') return 'bg-violet-50 text-violet-700';
  if (kind === 'global') return 'bg-blue-50 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

export function FoodTable() {
  const [foods, setFoods] = useState<AdminFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const selectedFood = foods.find((food) => food.id === selectedFoodId);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api<AdminFood[]>('/api/admin/foods');
      setFoods(rows);
      setSelectedFoodId((current) => (current && rows.some((food) => food.id === current) ? current : null));
    } catch (err) {
      setFoods([]);
      setSelectedFoodId(null);
      setError(err instanceof Error ? err.message : 'Unable to load foods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFoods();
  }, [loadFoods]);

  function handleSaved(updated: AdminFood) {
    setFoods((current) => current.map((food) => (food.id === updated.id ? updated : food)));
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Food Database</h2>
            <p className="text-sm text-slate-500">Click a row to edit food details.</p>
          </div>
          <span className="text-sm text-slate-500">{foods.length} total</span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading foods...</p>}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Food</th>
                  <th className="py-3 pr-4 font-medium">Serving</th>
                  <th className="py-3 pr-4 font-medium">Calories</th>
                  <th className="py-3 pr-4 font-medium">Macros</th>
                  <th className="py-3 pr-4 font-medium">Source</th>
                  <th className="py-3 font-medium">Flags</th>
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
                      <td className="py-3 pr-4 text-slate-600">{formatServing(food)}</td>
                      <td className="py-3 pr-4 text-slate-600">{Math.round(Number(food.calories))}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatMacros(food)}</td>
                      <td className="py-3 pr-4 text-slate-600">{food.source}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(food.visibility === 'GLOBAL' ? 'global' : 'user')}`}>
                            {food.visibility}
                          </span>
                          {food.verified && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass('verified')}`}>
                              Verified
                            </span>
                          )}
                          {food.aiGenerated && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass('ai')}`}>
                              AI
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {foods.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No foods found.</p>}
          </div>
        )}
      </Card>

      <EditFoodDrawer
        open={Boolean(selectedFood)}
        food={selectedFood}
        onClose={() => setSelectedFoodId(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
