const SHOPPING_LIST_STORE_KEY = 'metabolic-shopping-list-store';

export function readSavedSupermarket() {
  try {
    return localStorage.getItem(SHOPPING_LIST_STORE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function saveSupermarket(name: string) {
  try {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(SHOPPING_LIST_STORE_KEY, trimmed);
      return;
    }
    localStorage.removeItem(SHOPPING_LIST_STORE_KEY);
  } catch {
    // Ignore storage failures in private browsing or restricted contexts.
  }
}
