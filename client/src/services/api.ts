import { getIdToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Network request failed');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? response.statusText);
  }
  return response.json();
}

export const todayKey = () => new Date().toISOString().slice(0, 10);
