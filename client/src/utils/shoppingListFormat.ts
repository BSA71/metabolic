import type { GroceryListItem, ShoppingListResult } from '../types';

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

function pluralizeUnit(unit: string, quantity: number) {
  if (quantity === 1) return unit;
  if (unit.endsWith('s')) return unit;
  if (unit === 'serving') return 'servings';
  return `${unit}s`;
}

function formatOccurrences(count: number) {
  return count === 1 ? '1 planned meal' : `${count} planned meals`;
}

export function formatPlannedMealContext(item: GroceryListItem) {
  const quantity = formatQuantity(item.plannedQuantity);
  const unit = pluralizeUnit(item.plannedUnit.trim() || 'serving', item.plannedQuantity);

  return `Meal plan total: ${quantity} ${unit} of ${item.plannedName} (${formatOccurrences(item.occurrenceCount)} in this range)`;
}

function formatRangeLabel(result: ShoppingListResult) {
  if (result.startDate === result.endDate) return result.startDate;
  return `${result.startDate} to ${result.endDate}`;
}

export function formatShoppingListForShare(result: ShoppingListResult) {
  const title = result.storeName ? `Shopping list · ${result.storeName}` : 'Shopping list';
  const lines = [title, formatRangeLabel(result), ''];

  for (const section of result.sections) {
    lines.push(section.title);
    for (const item of section.items) {
      const location = result.storeName && item.storeLocation ? `, ${item.storeLocation}` : '';
      lines.push(`☐ ${item.groceryDescription}${location}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

export async function shareShoppingList(result: ShoppingListResult) {
  const text = formatShoppingListForShare(result);

  if (typeof navigator.share === 'function') {
    await navigator.share({
      title: result.storeName ? `Shopping list · ${result.storeName}` : 'Shopping list',
      text
    });
    return;
  }

  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
    return;
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}
