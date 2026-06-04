import {
  GamificationMealLogStatus,
  MealItemType,
  MealStatus,
  type Meal,
  type MealItem
} from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { toDateKey } from '../utils/dates.js';
import { ensureDailyFoodLog } from '../services/gamificationService.js';
import { recordFoodLogDay } from './progressionEngine.js';

type MealWithItems = Meal & { items: MealItem[] };

export function mealIsLogged(meal: MealWithItems, hasGamificationLog: boolean): boolean {
  if (hasGamificationLog) return true;
  if (
    meal.status === MealStatus.EATEN_AS_PLANNED ||
    meal.status === MealStatus.MODIFIED ||
    meal.status === MealStatus.SKIPPED
  ) {
    return true;
  }
  const planned = meal.items.filter((item) => item.type === MealItemType.PLANNED);
  const actual = meal.items.filter((item) => item.type === MealItemType.ACTUAL);
  if (actual.length === 0) return false;
  if (planned.length === 0) return true;
  const linkedCount = actual.filter((item) => item.linkedPlannedItemId).length;
  return linkedCount >= planned.length;
}

function gamificationStatusForMeal(meal: MealWithItems): GamificationMealLogStatus | null {
  if (meal.status === MealStatus.SKIPPED) return GamificationMealLogStatus.SKIPPED_MEAL;
  if (meal.status === MealStatus.EATEN_AS_PLANNED) return GamificationMealLogStatus.ATE_AS_PLANNED;
  const hasActual = meal.items.some((item) => item.type === MealItemType.ACTUAL);
  if (meal.status === MealStatus.MODIFIED || hasActual) {
    return GamificationMealLogStatus.ATE_SOMETHING_DIFFERENT;
  }
  const planned = meal.items.filter((item) => item.type === MealItemType.PLANNED);
  const linked = meal.items.filter(
    (item) => item.type === MealItemType.ACTUAL && item.linkedPlannedItemId
  );
  if (planned.length > 0 && linked.length >= planned.length) {
    return GamificationMealLogStatus.ATE_AS_PLANNED;
  }
  return null;
}

export async function syncGamificationMealLogForMeal(userId: string, mealId: string) {
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId },
    include: { dailyLog: true, items: true, gamificationLog: true }
  });
  if (!meal) return;

  const status = gamificationStatusForMeal(meal);
  if (!status) return;

  const foodLog = await ensureDailyFoodLog(userId, toDateKey(meal.dailyLog.date));

  await prisma.gamificationMealLog.upsert({
    where: { mealId },
    create: {
      dailyFoodLogId: foodLog.id,
      mealId,
      status,
      loggedAt: new Date()
    },
    update: {
      status,
      loggedAt: new Date()
    }
  });
}

export async function countMealsLogged(userId: string): Promise<number> {
  const meals = await prisma.meal.findMany({
    where: { userId },
    include: { items: true, gamificationLog: { select: { id: true } } }
  });

  return meals.filter((meal) => mealIsLogged(meal, Boolean(meal.gamificationLog))).length;
}

/** Run after any meal log action (gamification buttons, checkboxes, mark eaten, add food). */
export async function notifyMealActivity(userId: string, mealId: string) {
  await syncGamificationMealLogForMeal(userId, mealId);

  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId },
    include: { dailyLog: true }
  });
  if (!meal) return [];

  const celebrations = await recordFoodLogDay(userId, meal.dailyLogId, meal.dailyLog.date);
  return celebrations;
}
