import { FoodSource, Role, UserStatus, Visibility } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export type AdminUserUpdate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: Role;
  status?: UserStatus;
};

export type AdminFoodUpdate = {
  name?: string;
  brand?: string | null;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  source?: FoodSource;
  visibility?: Visibility;
  verified?: boolean;
};

export function serializeAdminFood(food: Awaited<ReturnType<typeof listAdminFoods>>[number]) {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    servingSize: Number(food.servingSize),
    servingUnit: food.servingUnit,
    calories: Number(food.calories),
    protein: Number(food.protein),
    carbs: Number(food.carbs),
    fat: Number(food.fat),
    source: food.source,
    visibility: food.visibility,
    aiGenerated: food.aiGenerated,
    verified: food.verified,
    createdAt: food.createdAt.toISOString()
  };
}

export function serializeReviewFood(food: Awaited<ReturnType<typeof listAdminFoodReviewQueue>>[number]) {
  const lookup = food.lookups[0];
  return {
    ...serializeAdminFood(food),
    inputText: lookup?.inputText ?? null,
    confidence: lookup?.confidence != null ? Number(lookup.confidence) : null,
    createdBy: food.createdBy
      ? {
          id: food.createdBy.id,
          firstName: food.createdBy.firstName,
          lastName: food.createdBy.lastName,
          email: food.createdBy.email
        }
      : null
  };
}

export async function listAdminUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function listAdminFoods() {
  return prisma.food.findMany({ orderBy: [{ name: 'asc' }] });
}

export async function listAdminFoodReviewQueue() {
  return prisma.food.findMany({
    where: { aiGenerated: true, verified: false },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      lookups: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateAdminUser(id: string, data: AdminUserUpdate) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data });

    if (data.role) {
      await tx.userOrganization.updateMany({
        where: { userId: id },
        data: { role: data.role }
      });
    }

    return user;
  });
}

export async function updateAdminFood(id: string, data: AdminFoodUpdate) {
  return prisma.food.update({ where: { id }, data });
}

export async function approveAdminFood(id: string, data?: AdminFoodUpdate) {
  const food = await prisma.food.findUnique({ where: { id } });
  if (!food?.aiGenerated) throw new Error('Food is not eligible for AI review');
  if (food.verified) throw new Error('Food is already verified');

  return prisma.food.update({
    where: { id },
    data: {
      ...data,
      verified: true,
      source: FoodSource.VERIFIED,
      visibility: data?.visibility ?? Visibility.GLOBAL
    }
  });
}

export async function rejectAdminFood(id: string) {
  const food = await prisma.food.findUnique({ where: { id } });
  if (!food?.aiGenerated) throw new Error('Food is not eligible for AI review');
  if (food.verified) throw new Error('Verified foods cannot be rejected');

  return prisma.food.delete({ where: { id } });
}
