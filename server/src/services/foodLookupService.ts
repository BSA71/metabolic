import { FoodSource, Visibility, MealItemType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { getAiProvider } from './aiService.js';
import { addMealItem } from './nutritionService.js';
import { n } from '../utils/numbers.js';

export async function lookupFood(userId: string, inputText: string) {
  const query = inputText.trim();
  const food = await prisma.food.findFirst({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { aliases: { some: { alias: { contains: query, mode: 'insensitive' } } } }
      ],
      AND: [{ OR: [{ visibility: 'GLOBAL' }, { ownerUserId: userId }] }]
    }
  });
  if (food) return { source: 'existing', food, estimate: null };

  const estimate = await getAiProvider().lookupFood(query);
  const lookup = await prisma.aiFoodLookup.create({ data: { userId, inputText: query, ...estimate } });
  return { source: 'ai', lookup, estimate };
}

export async function acceptFoodLookup(userId: string, lookupId: string, mealId?: string, type: MealItemType = MealItemType.ACTUAL) {
  return prisma.$transaction(async (tx) => {
    const lookup = await tx.aiFoodLookup.findFirstOrThrow({ where: { id: lookupId, userId } });
    const food = await tx.food.create({
      data: {
        name: lookup.normalizedFoodName,
        servingSize: 1,
        servingUnit: 'serving',
        calories: lookup.calories,
        protein: lookup.protein,
        carbs: lookup.carbs,
        fat: lookup.fat,
        source: FoodSource.AI,
        visibility: Visibility.USER,
        ownerUserId: userId,
        createdById: userId,
        aiGenerated: true,
        verified: false
      }
    });
    await tx.aiFoodLookup.update({ where: { id: lookupId }, data: { accepted: true, foodId: food.id } });
    if (mealId) {
      await addMealItem(userId, mealId, {
        foodId: food.id,
        type,
        nameSnapshot: food.name,
        quantity: 1,
        unit: food.servingUnit,
        calories: n(food.calories),
        protein: n(food.protein),
        carbs: n(food.carbs),
        fat: n(food.fat)
      });
    }
    return food;
  });
}
