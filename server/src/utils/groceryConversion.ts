const PORTION_UNITS =
  'cup|cups|c|tbsp|tablespoon|tablespoons|tbs|tsp|teaspoon|teaspoons|oz|ounce|ounces|g|gram|grams|ml|lb|lbs|pound|pounds|fl\\s*oz|slice|slices|piece|pieces|clove|cloves';

const PORTION_PREFIX = new RegExp(
  `^\\s*(\\d+\\s*\\/\\s*\\d+|\\d+\\.?\\d*|½|¼|¾)\\s*(${PORTION_UNITS})\\s+(?:of\\s+)?`,
  'i'
);

const PORTION_FROM_NAME = new RegExp(
  `^(\\d+\\s*\\/\\s*\\d+|\\d+\\.?\\d*|½|¼|¾)\\s*(${PORTION_UNITS})\\b`,
  'i'
);

const VOLUME_UNITS = new Set([
  'cup',
  'cups',
  'c',
  'tbsp',
  'tablespoon',
  'tablespoons',
  'tbs',
  'tsp',
  'teaspoon',
  'teaspoons',
  'fl oz',
  'floz',
  'fluid ounce',
  'fluid ounces',
  'pint',
  'pints',
  'pt',
  'quart',
  'quarts',
  'qt',
  'gallon',
  'gallons',
  'gal',
  'ml',
  'milliliter',
  'milliliters',
  'l',
  'liter',
  'liters'
]);

const COUNT_UNITS = new Set([
  'each',
  'piece',
  'pieces',
  'item',
  'items',
  'whole',
  'count',
  'medium',
  'large',
  'small',
  'slice',
  'slices',
  'clove',
  'cloves'
]);

function parseFraction(value: string) {
  const trimmed = value.trim();
  if (trimmed === '½') return 0.5;
  if (trimmed === '¼') return 0.25;
  if (trimmed === '¾') return 0.75;
  if (trimmed.includes('/')) {
    const [numerator, denominator] = trimmed.split('/').map(Number);
    return denominator ? numerator / denominator : Number(trimmed);
  }
  return Number(trimmed);
}

export function stripPortionFromName(name: string) {
  let cleaned = name.trim();
  while (PORTION_PREFIX.test(cleaned)) {
    cleaned = cleaned.replace(PORTION_PREFIX, '').trim();
  }
  return cleaned || name.trim();
}

function parsePortionFromName(name: string) {
  const match = name.trim().match(PORTION_FROM_NAME);
  if (!match) return null;

  return {
    amount: parseFraction(match[1]),
    unit: match[2].replace(/\s+/g, ' ')
  };
}

function normalizeUnit(unit: string) {
  return unit.toLowerCase().trim().replace(/\./g, '').replace(/\s+/g, ' ');
}

function isServingUnit(unit: string) {
  const normalized = normalizeUnit(unit);
  return normalized === 'serving' || normalized === 'servings' || normalized === 'serving(s)';
}

function resolvePlannedAmount(name: string, quantity: number, unit: string) {
  const cleanName = stripPortionFromName(name);

  if (isServingUnit(unit)) {
    const portion = parsePortionFromName(name);
    if (portion) {
      return {
        amount: quantity * portion.amount,
        unit: portion.unit,
        cleanName
      };
    }
  }

  return { amount: quantity, unit, cleanName };
}

function toCups(quantity: number, unit: string) {
  const normalized = normalizeUnit(unit);
  if (!normalized || isServingUnit(normalized)) return null;

  switch (normalized) {
    case 'cup':
    case 'cups':
    case 'c':
      return quantity;
    case 'tbsp':
    case 'tablespoon':
    case 'tablespoons':
    case 'tbs':
      return quantity / 16;
    case 'tsp':
    case 'teaspoon':
    case 'teaspoons':
      return quantity / 48;
    case 'fl oz':
    case 'floz':
    case 'fluid ounce':
    case 'fluid ounces':
      return quantity / 8;
    case 'pint':
    case 'pints':
    case 'pt':
      return quantity * 2;
    case 'quart':
    case 'quarts':
    case 'qt':
      return quantity * 4;
    case 'gallon':
    case 'gallons':
    case 'gal':
      return quantity * 16;
    case 'ml':
    case 'milliliter':
    case 'milliliters':
      return quantity / 236.588;
    case 'l':
    case 'liter':
    case 'liters':
      return quantity * 4.227;
    case 'oz':
    case 'ounce':
    case 'ounces':
      return quantity / 8;
    default:
      return null;
  }
}

function toPounds(quantity: number, unit: string) {
  const normalized = normalizeUnit(unit);
  switch (normalized) {
    case 'lb':
    case 'lbs':
    case 'pound':
    case 'pounds':
      return quantity;
    case 'oz':
    case 'ounce':
    case 'ounces':
      return quantity / 16;
    case 'g':
    case 'gram':
    case 'grams':
      return quantity / 453.592;
    case 'kg':
    case 'kilogram':
    case 'kilograms':
      return quantity * 2.205;
    default:
      return null;
  }
}

function toFluidOunces(quantity: number, unit: string) {
  const cups = toCups(quantity, unit);
  if (cups !== null) return cups * 8;
  const pounds = toPounds(quantity, unit);
  if (pounds !== null && /oil|vinegar|dressing|sauce/.test(unit)) return null;
  return null;
}

function isLiquidFood(name: string) {
  return /milk|juice|water|broth|stock|cream|coffee|tea|wine|vinegar|oil|sauce|dressing|beverage|drink|soda|beer|yogurt|kefir|smoothie/.test(
    name.toLowerCase()
  );
}

function isLikelyLiquid(name: string, unit: string) {
  if (isLiquidFood(name)) return true;
  return VOLUME_UNITS.has(normalizeUnit(unit));
}

function formatLiquidPackages(cups: number, cleanName: string) {
  if (cups <= 0) return cleanName;
  if (cups <= 4) return `1 quart ${cleanName}`;
  if (cups <= 8) return `1 half gallon ${cleanName}`;
  if (cups <= 16) return `1 gallon ${cleanName}`;

  const gallons = Math.ceil(cups / 16);
  return `${gallons} gallon${gallons === 1 ? '' : 's'} ${cleanName}`;
}

function formatWeightPackages(pounds: number, cleanName: string) {
  const rounded = Math.max(0.5, Math.ceil(pounds * 2) / 2);
  if (rounded === 1) return `1 lb ${cleanName}`;
  return `${rounded} lb ${cleanName}`;
}

function formatEggPackages(amount: number, unit: string) {
  const normalized = normalizeUnit(unit);
  let eggCount = Math.max(1, Math.ceil(amount));

  if (normalized === 'dozen' || normalized === 'dozens') {
    eggCount = Math.max(1, Math.ceil(amount * 12));
  }

  if (eggCount >= 12) {
    const dozens = Math.ceil(eggCount / 12);
    return dozens === 1 ? '1 dozen eggs' : `${dozens} dozen eggs`;
  }

  return eggCount === 1 ? '1 egg' : `${eggCount} eggs`;
}

function formatCountPackages(amount: number, cleanName: string) {
  const count = Math.max(1, Math.ceil(amount));
  if (count === 1) return cleanName;
  return `${count} ${cleanName}`;
}

function formatBreadPackages(slices: number, cleanName: string) {
  const loaves = Math.max(1, Math.ceil(slices / 12));
  if (loaves === 1) return `1 loaf ${cleanName}`;
  return `${loaves} loaves ${cleanName}`;
}

function formatOilPackage(amount: number, unit: string, cleanName: string) {
  const flOz = toFluidOunces(amount, unit);
  if (flOz !== null && flOz > 0) {
    return flOz <= 8 ? `1 bottle ${cleanName}` : `1 bottle ${cleanName}`;
  }
  return `1 bottle ${cleanName}`;
}

function formatDryGoods(cups: number, cleanName: string, name: string) {
  const pounds = Math.max(1, Math.ceil(cups / 2));
  const container = /bean|lentil|chickpea/.test(name.toLowerCase()) ? 'can(s)' : 'lb bag';
  return `${pounds} ${container} ${cleanName}`;
}

function formatProduce(amount: number, unit: string, cleanName: string, name: string) {
  const lower = name.toLowerCase();
  const pounds = toPounds(amount, unit);

  if (pounds !== null) {
    return formatWeightPackages(pounds, cleanName);
  }

  const cups = toCups(amount, unit);
  if (cups !== null && !COUNT_UNITS.has(normalizeUnit(unit))) {
    if (/spinach|lettuce|greens|kale|arugula/.test(lower)) {
      const bags = Math.max(1, Math.ceil(cups / 4));
      return bags === 1 ? `1 bag ${cleanName}` : `${bags} bags ${cleanName}`;
    }
    return formatWeightPackages(Math.max(0.5, Math.ceil(cups / 2)), cleanName);
  }

  if (/banana|apple|avocado|onion|garlic|lemon|lime|orange|potato/.test(lower)) {
    return formatCountPackages(amount, cleanName);
  }

  return formatCountPackages(Math.max(1, Math.ceil(amount)), cleanName);
}

function formatFromResolvedAmount(name: string, amount: number, unit: string, cleanName: string) {
  const lower = name.toLowerCase();
  const normalizedUnit = normalizeUnit(unit);

  if (/egg/.test(lower)) {
    return formatEggPackages(amount, unit);
  }

  if (/bread|baguette|sourdough|bagel|muffin|roll|bun|toast/.test(lower) && (normalizedUnit === 'slice' || normalizedUnit === 'slices')) {
    return formatBreadPackages(amount, cleanName);
  }

  if (/oil|vinegar|dressing/.test(lower) && (VOLUME_UNITS.has(normalizedUnit) || normalizedUnit.includes('oz'))) {
    return formatOilPackage(amount, unit, cleanName);
  }

  if (/cheese|butter|cream cheese/.test(lower)) {
    const pounds = toPounds(amount, unit);
    if (pounds !== null) {
      return formatWeightPackages(pounds, cleanName);
    }
  }

  if (/chicken|turkey|beef|steak|salmon|fish|shrimp|pork|sausage|bacon|ground/.test(lower)) {
    const pounds = toPounds(amount, unit) ?? (isServingUnit(unit) ? amount * 0.25 : null);
    if (pounds !== null) {
      return formatWeightPackages(pounds, cleanName);
    }
  }

  if (/rice|oats|pasta|quinoa|bean|lentil|flour|sugar|cereal/.test(lower)) {
    const cups = toCups(amount, unit);
    if (cups !== null) return formatDryGoods(cups, cleanName, name);
    const pounds = toPounds(amount, unit);
    if (pounds !== null) return formatWeightPackages(pounds, cleanName);
  }

  if (/spinach|lettuce|broccoli|asparagus|pepper|tomato|onion|garlic|avocado|banana|apple|berry|fruit|veget|carrot|celery|zucchini|mushroom|cucumber/.test(lower)) {
    return formatProduce(amount, unit, cleanName, name);
  }

  const cups = toCups(amount, unit);
  if (cups !== null && isLikelyLiquid(name, unit)) {
    return formatLiquidPackages(cups, cleanName);
  }

  const pounds = toPounds(amount, unit);
  if (pounds !== null) {
    return formatWeightPackages(pounds, cleanName);
  }

  if (COUNT_UNITS.has(normalizedUnit)) {
    return formatCountPackages(amount, cleanName);
  }

  if (cups !== null) {
    return formatLiquidPackages(cups, cleanName);
  }

  return `${amount} ${unit} ${cleanName}`.trim();
}

export function formatGroceryDescription(name: string, quantity: number, unit: string) {
  const resolved = resolvePlannedAmount(name, quantity, unit);
  return formatFromResolvedAmount(name, resolved.amount, resolved.unit, resolved.cleanName);
}

export function isPoorGroceryDescription(
  description: string,
  item: { name: string; quantity: number; unit: string }
) {
  const lower = description.toLowerCase();
  const rawFallback = `${item.quantity} ${item.unit} ${item.name}`.trim().toLowerCase();
  if (lower === rawFallback) return true;

  if (/grocery portion\(s\)/i.test(description)) return true;

  if (/\d+\s+(carton|cartons|package|packages|can\(s\)|lb bag)\s+.*\b(\d+\s*(cup|cups|tbsp|tsp|oz|g|ml|lb|serving))/i.test(description)) {
    return true;
  }

  if (/^\d+\s+cartons?\s+/i.test(description) && isServingUnit(item.unit)) {
    return true;
  }

  const resolved = resolvePlannedAmount(item.name, item.quantity, item.unit);
  if (isServingUnit(item.unit) && parsePortionFromName(item.name)) {
    const expected = formatGroceryDescription(item.name, item.quantity, item.unit).toLowerCase();
    if (lower !== expected && (/^\d+\s+(grocery portion|carton|serving)/i.test(description) || /^\d+\.?\d*\s+cup(s)?\s+/i.test(description))) {
      return true;
    }
  }

  return false;
}
