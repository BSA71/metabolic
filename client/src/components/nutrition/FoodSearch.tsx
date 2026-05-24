import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Food } from '../../types';

export function FoodSearch({ onSelect }: { onSelect: (food: Food) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api<Food[]>(`/api/foods?query=${encodeURIComponent(query.trim())}`).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-slate-200 p-3"
        placeholder="Search foods"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
          {results.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => { onSelect(food); setQuery(''); setResults([]); }}
              >
                <span className="font-medium">{food.name}</span>
                <span className="ml-2 text-slate-500">{Math.round(Number(food.calories))} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
