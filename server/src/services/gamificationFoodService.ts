import {
  GamificationMealLogStatus,
  MealCategory,
  MealStatus,
  type GamificationMealLogStatus as MealLogStatus
} from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { markMealEatenAsPlanned, addMealItem } from './nutritionService.js';
import { ensureDailyFoodLog } from './gamificationService.js';
import { notifyMealActivity } from '../gamification/mealActivity.js';
import { parseDateParam } from '../utils/dates.js';
import { toDateKey } from '../utils/dates.js';

const statusToMealStatus: Record<GamificationMealLogStatus, MealStatus> = {
  ATE_AS_PLANNED: MealStatus.EATEN_AS_PLANNED,
  ATE_SOMETHING_DIFFERENT: MealStatus.MODIFIED,
  SKIPPED_MEAL: MealStatus.SKIPPED,
  EXTRA_ITEM: MealStatus.UNPLANNED
};

export async function logMealGamification(
  userId: string,
  mealId: string,
  data: {
    status: MealLogStatus;
    actualFoodDescription?: string;
    category?: MealCategory;
    photoUrl?: string;
    notes?: string;
    foodItem?: Record<string, unknown>;
  }
) {
  const meal = await prisma.meal.findFirstOrThrow({
    where: { id: mealId, userId },
    include: { dailyLog: true }
  });

  const foodLog = await ensureDailyFoodLog(userId, toDateKey(meal.dailyLog.date));

  if (data.status === GamificationMealLogStatus.ATE_AS_PLANNED) {
    await markMealEatenAsPlanned(userId, mealId);
  } else if (data.status === GamificationMealLogStatus.SKIPPED_MEAL) {
    await prisma.meal.update({
      where: { id: mealId },
      data: { status: MealStatus.SKIPPED }
    });
  } else if (data.status === GamificationMealLogStatus.ATE_SOMETHING_DIFFERENT) {
    await prisma.meal.update({ where: { id: mealId }, data: { status: MealStatus.MODIFIED } });
    if (data.foodItem) {
      await addMealItem(userId, mealId, { ...data.foodItem, type: 'ACTUAL' });
    }
  }

  await prisma.gamificationMealLog.upsert({
    where: { mealId },
    create: {
      dailyFoodLogId: foodLog.id,
      mealId,
      status: data.status,
      actualFoodDescription: data.actualFoodDescription,
      category: data.category,
      photoUrl: data.photoUrl,
      notes: data.notes,
      loggedAt: new Date()
    },
    update: {
      status: data.status,
      actualFoodDescription: data.actualFoodDescription,
      category: data.category,
      photoUrl: data.photoUrl,
      notes: data.notes,
      loggedAt: new Date()
    }
  });

  await prisma.meal.update({
    where: { id: mealId },
    data: { status: statusToMealStatus[data.status] ?? MealStatus.MODIFIED }
  });

  return notifyMealActivity(userId, mealId);
}

export async function addExtraFood(
  userId: string,
  date: string,
  data: {
    mealId?: string;
    nameSnapshot: string;
    actualFoodDescription?: string;
    category?: MealCategory;
    notes?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    quantity?: number;
    unit?: string;
  }
) {
  const day = parseDateParam(date);
  const log = await prisma.dailyLog.findUniqueOrThrow({
    where: { userId_date: { userId, date: day } }
  });

  let mealId = data.mealId;
  if (!mealId) {
    const meal = await prisma.meal.findFirst({
      where: { dailyLogId: log.id },
      orderBy: { mealNumber: 'desc' }
    });
    if (meal) {
      mealId = meal.id;
    } else {
      const created = await prisma.meal.create({
        data: {
          dailyLogId: log.id,
          userId,
          mealNumber: 1,
          name: 'Additional food',
          status: MealStatus.UNPLANNED
        }
      });
      mealId = created.id;
    }
  }

  await addMealItem(userId, mealId, {
    type: 'ACTUAL',
    nameSnapshot: data.nameSnapshot,
    calories: data.calories ?? 0,
    protein: data.protein ?? 0,
    carbs: data.carbs ?? 0,
    fat: data.fat ?? 0,
    quantity: data.quantity ?? 1,
    unit: data.unit ?? 'serving'
  });

  const foodLog = await ensureDailyFoodLog(userId, date);

  await prisma.gamificationMealLog.upsert({
    where: { mealId },
    create: {
      dailyFoodLogId: foodLog.id,
      mealId,
      status: GamificationMealLogStatus.EXTRA_ITEM,
      actualFoodDescription: data.actualFoodDescription ?? data.nameSnapshot,
      category: data.category,
      notes: data.notes,
      loggedAt: new Date()
    },
    update: {
      status: GamificationMealLogStatus.EXTRA_ITEM,
      actualFoodDescription: data.actualFoodDescription ?? data.nameSnapshot,
      category: data.category,
      notes: data.notes,
      loggedAt: new Date()
    }
  });

  return notifyMealActivity(userId, mealId);
}
