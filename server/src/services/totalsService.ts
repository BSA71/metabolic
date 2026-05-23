import type { Prisma, PrismaClient } from '@prisma/client';
import { MealStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { n, round } from '../utils/numbers.js';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function recalculateMealTotals(mealId: string, tx: PrismaExecutor = prisma) {
  const items = await tx.mealItem.findMany({ where: { mealId, type: 'ACTUAL' } });
  const totals = items.reduce(
    (sum, item) => ({
      calories: sum.calories + n(item.calories),
      protein: sum.protein + n(item.protein),
      carbs: sum.carbs + n(item.carbs),
      fat: sum.fat + n(item.fat)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return tx.meal.update({
    where: { id: mealId },
    data: {
      actualCalories: totals.calories,
      actualProtein: totals.protein,
      actualCarbs: totals.carbs,
      actualFat: totals.fat,
      status: items.length ? MealStatus.MODIFIED : undefined
    }
  });
}

export async function recalculateDailyLogTotals(dailyLogId: string, tx: PrismaExecutor = prisma) {
  const [meals, exercises] = await Promise.all([
    tx.meal.findMany({ where: { dailyLogId } }),
    tx.dailyLog.findUnique({ where: { id: dailyLogId }, include: { program: true } }).then((log) =>
      log ? tx.scheduledExercise.findMany({ where: { programId: log.programId, scheduledDate: log.date } }) : []
    )
  ]);

  const totals = meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + n(meal.actualCalories),
      protein: sum.protein + n(meal.actualProtein),
      carbs: sum.carbs + n(meal.actualCarbs),
      fat: sum.fat + n(meal.actualFat)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const completedMeals = meals.filter((meal) => ['EATEN_AS_PLANNED', 'MODIFIED'].includes(meal.status)).length;
  const completedExercises = exercises.filter((exercise) => exercise.status === 'DONE').length;
  const log = await tx.dailyLog.findUnique({ where: { id: dailyLogId } });
  const calorieScore = log && n(log.calorieTarget) > 0 ? Math.min(totals.calories / n(log.calorieTarget), 1) : 0;
  const proteinScore = log && n(log.proteinTarget) > 0 ? Math.min(totals.protein / n(log.proteinTarget), 1) : 0;
  const complianceScore = round(((calorieScore + proteinScore) / 2) * 100, 1);

  return tx.dailyLog.update({
    where: { id: dailyLogId },
    data: {
      caloriesActual: totals.calories,
      proteinActual: totals.protein,
      carbsActual: totals.carbs,
      fatActual: totals.fat,
      mealsPlanned: meals.length,
      mealsCompleted: completedMeals,
      exercisesPlanned: exercises.length,
      exercisesCompleted: completedExercises,
      complianceScore
    }
  });
}
