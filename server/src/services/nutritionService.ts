import { MealItemType, MealStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { parseDateParam } from '../utils/dates.js';
import { recalculateDailyLogTotals, recalculateMealTotals } from './totalsService.js';

export async function getMealsForDate(userId: string, date: string) {
  const day = parseDateParam(date);
  const log = await prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: day } } });
  if (!log) return [];
  return prisma.meal.findMany({ where: { dailyLogId: log.id }, include: { items: true }, orderBy: { mealNumber: 'asc' } });
}

export async function createMeal(userId: string, date: string, data: { name: string; mealNumber: number }) {
  const day = parseDateParam(date);
  const log = await prisma.dailyLog.findUniqueOrThrow({ where: { userId_date: { userId, date: day } } });
  return prisma.meal.create({ data: { dailyLogId: log.id, userId, mealNumber: data.mealNumber, name: data.name } });
}

export async function markMealEatenAsPlanned(userId: string, mealId: string) {
  return prisma.$transaction(async (tx) => {
    const meal = await tx.meal.findFirstOrThrow({ where: { id: mealId, userId }, include: { items: true } });
    const planned = meal.items.filter((item) => item.type === MealItemType.PLANNED);
    await tx.mealItem.deleteMany({ where: { mealId, type: MealItemType.ACTUAL } });
    if (planned.length) {
      await tx.mealItem.createMany({
        data: planned.map((item) => ({
          mealId,
          foodId: item.foodId,
          type: MealItemType.ACTUAL,
          nameSnapshot: item.nameSnapshot,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat
        }))
      });
    }
    await tx.meal.update({ where: { id: mealId }, data: { status: MealStatus.EATEN_AS_PLANNED } });
    await recalculateMealTotals(mealId, tx);
    await tx.meal.update({ where: { id: mealId }, data: { status: MealStatus.EATEN_AS_PLANNED } });
    return recalculateDailyLogTotals(meal.dailyLogId, tx);
  });
}

export async function addMealItem(userId: string, mealId: string, data: Record<string, unknown>, txClient?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const execute = async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    const meal = await tx.meal.findFirstOrThrow({ where: { id: mealId, userId } });
    const item = await tx.mealItem.create({
      data: {
        mealId,
        foodId: (data.foodId as string | undefined) ?? null,
        type: (data.type as MealItemType | undefined) ?? MealItemType.ACTUAL,
        nameSnapshot: String(data.nameSnapshot ?? data.name ?? 'Food'),
        quantity: Number(data.quantity ?? 1),
        unit: String(data.unit ?? 'serving'),
        calories: Number(data.calories ?? 0),
        protein: Number(data.protein ?? 0),
        carbs: Number(data.carbs ?? 0),
        fat: Number(data.fat ?? 0)
      }
    });
    await recalculateMealTotals(mealId, tx);
    await recalculateDailyLogTotals(meal.dailyLogId, tx);
    return item;
  };
  if (txClient) return execute(txClient);
  return prisma.$transaction(execute);
}

export async function updateMealItem(userId: string, itemId: string, data: Record<string, unknown>) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.mealItem.findUniqueOrThrow({ where: { id: itemId }, include: { meal: true } });
    if (existing.meal.userId !== userId) throw new Error('Not found');
    const item = await tx.mealItem.update({
      where: { id: itemId },
      data: {
        nameSnapshot: data.nameSnapshot ? String(data.nameSnapshot) : undefined,
        quantity: data.quantity === undefined ? undefined : Number(data.quantity),
        unit: data.unit ? String(data.unit) : undefined,
        calories: data.calories === undefined ? undefined : Number(data.calories),
        protein: data.protein === undefined ? undefined : Number(data.protein),
        carbs: data.carbs === undefined ? undefined : Number(data.carbs),
        fat: data.fat === undefined ? undefined : Number(data.fat)
      }
    });
    await recalculateMealTotals(existing.mealId, tx);
    await recalculateDailyLogTotals(existing.meal.dailyLogId, tx);
    return item;
  });
}

export async function deleteMealItem(userId: string, itemId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.mealItem.findUniqueOrThrow({ where: { id: itemId }, include: { meal: true } });
    if (existing.meal.userId !== userId) throw new Error('Not found');
    await tx.mealItem.delete({ where: { id: itemId } });
    await recalculateMealTotals(existing.mealId, tx);
    return recalculateDailyLogTotals(existing.meal.dailyLogId, tx);
  });
}
