import { PrismaClient, MealItemType, MealStatus, ProgramStatus, Role, UserStatus } from '@prisma/client';
import { startOfUtcDay } from '../src/utils/dates.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.smsMessage.deleteMany();
  await prisma.aiFoodLookup.deleteMany();
  await prisma.exerciseLog.deleteMany();
  await prisma.scheduledExercise.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.mealItem.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.programMetric.deleteMany();
  await prisma.program.deleteMany();
  await prisma.foodAlias.deleteMany();
  await prisma.food.deleteMany();
  await prisma.coachAssignment.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({ data: { firebaseUid: 'seed-super-admin', email: 'admin@metabolic.local', firstName: 'Metabolic', lastName: 'Admin', phone: '+15550000001', role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE } });
  const user = await prisma.user.create({ data: { firebaseUid: 'seed-user', email: 'user@metabolic.local', firstName: 'Jordan', lastName: 'Rivera', phone: '+15550000002', role: Role.USER, status: UserStatus.ACTIVE } });
  const org = await prisma.organization.create({ data: { name: 'Metabolic HQ' } });
  await prisma.userOrganization.createMany({ data: [{ userId: admin.id, organizationId: org.id, role: Role.SUPER_ADMIN }, { userId: user.id, organizationId: org.id, role: Role.USER }] });

  const foods = await Promise.all([
    ['Chicken breast', 6, 'oz', 280, 52, 0, 6, ['grilled chicken', 'chicken'] ],
    ['White rice', 1, 'cup', 205, 4, 45, 0, ['rice'] ],
    ['Greek yogurt', 1, 'cup', 140, 24, 8, 0, ['yogurt'] ],
    ['Blueberries', 1, 'cup', 85, 1, 21, 0, ['berries'] ],
    ['Eggs', 2, 'each', 140, 12, 1, 10, ['egg'] ],
    ['Salmon', 6, 'oz', 360, 39, 0, 22, ['fish'] ],
    ['Sweet potato', 1, 'medium', 112, 2, 26, 0, ['potato'] ],
    ['Whey protein', 1, 'scoop', 120, 25, 3, 2, ['protein shake'] ],
    ['Avocado', 0.5, 'each', 160, 2, 9, 15, ['avocado'] ],
    ['Banana', 1, 'each', 105, 1, 27, 0, ['banana'] ]
  ].map(async ([name, servingSize, servingUnit, calories, protein, carbs, fat, aliases]) => {
    const food = await prisma.food.create({ data: { name: String(name), servingSize: Number(servingSize), servingUnit: String(servingUnit), calories: Number(calories), protein: Number(protein), carbs: Number(carbs), fat: Number(fat), visibility: 'GLOBAL', source: 'VERIFIED', verified: true, createdById: admin.id } });
    await prisma.foodAlias.createMany({ data: (aliases as string[]).map((alias) => ({ foodId: food.id, alias })) });
    return food;
  }));

  const today = startOfUtcDay();
  const program = await prisma.program.create({ data: { userId: user.id, organizationId: org.id, name: 'Metabolic Reset', status: ProgramStatus.ACTIVE, startDate: today, targetEndDate: new Date(today.getTime() + 16 * 7 * 86400000) } });
  await prisma.programMetric.createMany({ data: [
    { programId: program.id, metricType: 'WEIGHT', startValue: 230.00, currentValue: 230.00, goalValue: 163.76, unit: 'lbs' },
    { programId: program.id, metricType: 'BODY_FAT', startValue: 46.00, currentValue: 46.00, goalValue: 15.00, unit: '%' },
    { programId: program.id, metricType: 'LEAN_TISSUE_MASS', startValue: 124.20, currentValue: 124.20, goalValue: 139.20, unit: 'lbs' },
    { programId: program.id, metricType: 'FAT_MASS', startValue: 105.80, currentValue: 105.80, goalValue: 24.56, unit: 'lbs' },
    { programId: program.id, metricType: 'CALORIES', startValue: 2200, currentValue: 2200, goalValue: 2050, unit: 'kcal' },
    { programId: program.id, metricType: 'PROTEIN', startValue: 190, currentValue: 190, goalValue: 205, unit: 'g' }
  ] });

  const log = await prisma.dailyLog.create({ data: { programId: program.id, userId: user.id, date: today, weight: 230, bodyFat: 46, waist: 42, calorieTarget: 2200, proteinTarget: 190, carbTarget: 190, fatTarget: 70, mealsPlanned: 5, exercisesPlanned: 4 } });
  const mealDefs = [
    [1, 'Breakfast', '07:30', [foods[4], foods[3]], MealStatus.EATEN_AS_PLANNED],
    [2, 'Snack', '10:30', [foods[2]], MealStatus.PLANNED],
    [3, 'Lunch', '12:30', [foods[0], foods[1]], MealStatus.MODIFIED],
    [4, 'Snack', '15:30', [foods[7], foods[9]], MealStatus.UPCOMING],
    [5, 'Dinner', '18:30', [foods[5], foods[6], foods[8]], MealStatus.PLANNED]
  ] as const;
  for (const [mealNumber, name, plannedTime, mealFoods, status] of mealDefs) {
    const plannedCalories = mealFoods.reduce((s, f) => s + Number(f.calories), 0);
    const plannedProtein = mealFoods.reduce((s, f) => s + Number(f.protein), 0);
    const plannedCarbs = mealFoods.reduce((s, f) => s + Number(f.carbs), 0);
    const plannedFat = mealFoods.reduce((s, f) => s + Number(f.fat), 0);
    const meal = await prisma.meal.create({ data: { dailyLogId: log.id, userId: user.id, mealNumber, name, plannedTime, status, plannedCalories, plannedProtein, plannedCarbs, plannedFat, actualCalories: status === MealStatus.PLANNED || status === MealStatus.UPCOMING ? 0 : plannedCalories, actualProtein: status === MealStatus.PLANNED || status === MealStatus.UPCOMING ? 0 : plannedProtein, actualCarbs: status === MealStatus.PLANNED || status === MealStatus.UPCOMING ? 0 : plannedCarbs, actualFat: status === MealStatus.PLANNED || status === MealStatus.UPCOMING ? 0 : plannedFat } });
    await prisma.mealItem.createMany({ data: mealFoods.map((food) => ({ mealId: meal.id, foodId: food.id, type: MealItemType.PLANNED, nameSnapshot: food.name, quantity: 1, unit: food.servingUnit, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat })) });
    if (status === MealStatus.EATEN_AS_PLANNED || status === MealStatus.MODIFIED) {
      await prisma.mealItem.createMany({ data: mealFoods.map((food) => ({ mealId: meal.id, foodId: food.id, type: MealItemType.ACTUAL, nameSnapshot: food.name, quantity: 1, unit: food.servingUnit, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat })) });
    }
  }

  const exercises = await Promise.all([
    prisma.exercise.create({ data: { name: 'Morning walk', category: 'Cardio', defaultDurationMinutes: 30 } }),
    prisma.exercise.create({ data: { name: 'Goblet squat', category: 'Strength', bodyPart: 'Legs', defaultSets: 3, defaultReps: 10 } }),
    prisma.exercise.create({ data: { name: 'Push-up', category: 'Strength', bodyPart: 'Chest', defaultSets: 3, defaultReps: 8 } }),
    prisma.exercise.create({ data: { name: 'Mobility flow', category: 'Recovery', defaultDurationMinutes: 15 } })
  ]);
  for (const [index, exercise] of exercises.entries()) {
    const scheduled = await prisma.scheduledExercise.create({ data: { programId: program.id, userId: user.id, exerciseId: exercise.id, scheduledDate: today, sets: exercise.defaultSets, reps: exercise.defaultReps, durationMinutes: exercise.defaultDurationMinutes, status: index === 0 ? 'DONE' : 'PLANNED' } });
    if (index === 0) await prisma.exerciseLog.create({ data: { scheduledExerciseId: scheduled.id, userId: user.id, completed: true, completedAt: new Date(), actualDurationMinutes: 30, difficulty: 'NORMAL' } });
  }

  await prisma.dailyLog.update({ where: { id: log.id }, data: { caloriesActual: 710, proteinActual: 69, carbsActual: 67, fatActual: 16, mealsCompleted: 2, exercisesCompleted: 1, complianceScore: 33 } });
  await prisma.programTemplate.create({ data: { name: 'Fat Loss Foundation', description: 'Balanced macro plan with five meals and daily movement.', defaultCalories: 2200, defaultProtein: 190, defaultCarbs: 190, defaultFat: 70, defaultMealCount: 5 } });
  await prisma.mealTemplate.create({ data: { userId: user.id, name: 'Chicken and Rice Lunch', description: 'Simple high-protein lunch template.' } });
  await prisma.exerciseTemplate.create({ data: { name: 'Daily Movement Checklist', description: 'Walk, squat, push, mobility.' } });
}

main().finally(async () => prisma.$disconnect());
