import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Food } from '../../types';

export function FoodSearch({
  onSelect,
  dropUp = false
}: {
  onSelect: (food: Food) => void;
  dropUp?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError('');
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      api<Food[]>(`/api/foods?query=${encodeURIComponent(query.trim())}`)
        .then((rows) => {
          setResults(rows);
          setSearched(true);
        })
        .catch((err) => {
          setResults([]);
          setSearched(true);
          setError(err instanceof Error ? err.message : 'Food search failed');
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const showDropdown = query.trim().length >= 2 && (loading || searched || error);

  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-app-border bg-app-surface p-3 text-app-text placeholder:text-app-text-muted"
        placeholder="Search foods by name or alias"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {showDropdown && (
        <ul
          className={`absolute z-[100] max-h-48 w-full overflow-y-auto rounded-2xl border border-app-border bg-app-surface shadow-lg ${
            dropUp ? 'bottom-full mb-1' : 'mt-1'
          }`}
        >
          {loading && <li className="px-4 py-2 text-sm text-app-text-muted">Searching…</li>}
          {!loading && error && <li className="px-4 py-2 text-sm text-red-600">{error}</li>}
          {!loading && !error && results.length === 0 && (
            <li className="px-4 py-2 text-sm text-app-text-muted">No foods found. Try a shorter name like &quot;chicken&quot; or &quot;rice&quot;.</li>
          )}
          {!loading &&
            !error &&
            results.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-app-text hover:bg-app-muted"
                  onClick={() => {
                    onSelect(food);
                    setQuery('');
                    setResults([]);
                    setSearched(false);
                  }}
                >
                  <span className="font-medium">{food.name}</span>
                  <span className="ml-2 text-app-text-muted">{Math.round(Number(food.calories))} kcal</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
