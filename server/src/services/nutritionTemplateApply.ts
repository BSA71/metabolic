import { MealItemType, MealStatus, type Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { n } from '../utils/numbers.js';

const templateInclude = {
  meals: {
    orderBy: { mealNumber: 'asc' as const },
    include: { items: { orderBy: { createdAt: 'asc' as const } } }
  }
} satisfies Prisma.NutritionPlanTemplateInclude;

export async function applyTemplateMealsToLog(
  tx: Prisma.TransactionClient,
  templateId: string,
  dailyLogId: string,
  userId: string
) {
  const template = await tx.nutritionPlanTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: templateInclude
  });

  await tx.meal.deleteMany({ where: { dailyLogId } });

  for (const templateMeal of template.meals) {
    const plannedTotals = templateMeal.items.reduce(
      (sum, item) => ({
        calories: sum.calories + n(item.calories),
        protein: sum.protein + n(item.protein),
        carbs: sum.carbs + n(item.carbs),
        fat: sum.fat + n(item.fat)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    await tx.meal.create({
      data: {
        dailyLogId,
        userId,
        mealNumber: templateMeal.mealNumber,
        name: templateMeal.name,
        plannedTime: templateMeal.plannedTime,
        status: MealStatus.PLANNED,
        plannedCalories: plannedTotals.calories,
        plannedProtein: plannedTotals.protein,
        plannedCarbs: plannedTotals.carbs,
        plannedFat: plannedTotals.fat,
        items: templateMeal.items.length
          ? {
              create: templateMeal.items.map((item) => ({
                foodId: item.foodId,
                type: MealItemType.PLANNED,
                nameSnapshot: item.nameSnapshot,
                quantity: item.quantity,
                unit: item.unit,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat
              }))
            }
          : undefined
      }
    });
  }

  await tx.dailyLog.update({
    where: { id: dailyLogId },
    data: {
      calorieTarget: template.calorieTarget,
      proteinTarget: template.proteinTarget,
      carbTarget: template.carbTarget,
      fatTarget: template.fatTarget,
      mealsPlanned: template.meals.length
    }
  });
}

export async function applyDefaultTemplateToNewLog(
  tx: Prisma.TransactionClient,
  program: { id: string; defaultNutritionTemplateId: string | null },
  dailyLogId: string,
  userId: string
) {
  if (!program.defaultNutritionTemplateId) return false;
  await applyTemplateMealsToLog(tx, program.defaultNutritionTemplateId, dailyLogId, userId);
  return true;
}

export async function applyDefaultTemplateToNewLogOutsideTx(
  program: { id: string; defaultNutritionTemplateId: string | null },
  dailyLogId: string,
  userId: string
) {
  if (!program.defaultNutritionTemplateId) return false;
  await prisma.$transaction(async (tx) => {
    await applyTemplateMealsToLog(tx, program.defaultNutritionTemplateId!, dailyLogId, userId);
  });
  return true;
}
