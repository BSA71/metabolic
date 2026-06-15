-- CreateEnum
CREATE TYPE "LevelStatus" AS ENUM ('LOCKED', 'PREVIEW', 'ACTIVE', 'COMPLETED');
CREATE TYPE "BadgeStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'EARNED');
CREATE TYPE "StreakStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'PRESERVED_BY_GRACE_DAY', 'RESET', 'RECOVERED');
CREATE TYPE "StreakType" AS ENUM ('FOOD_LOGGING_DAILY', 'DAILY_WIN', 'WATER_GOAL_DAILY', 'DAILY_CHECK_IN', 'WEEKLY_SNAPSHOT', 'WEEKLY_MEASUREMENTS', 'WEEKLY_PHOTOS', 'WEEKLY_REFLECTION', 'WEEKLY_FOCUS_GOAL');
CREATE TYPE "StreakEventType" AS ENUM ('COMPLETED', 'MISSED', 'GRACE_DAY_USED', 'RESET', 'RECOVERED');
CREATE TYPE "GamificationMealLogStatus" AS ENUM ('ATE_AS_PLANNED', 'ATE_SOMETHING_DIFFERENT', 'SKIPPED_MEAL', 'EXTRA_ITEM');
CREATE TYPE "MealCategory" AS ENUM ('DIFFERENT_HEALTHY_OPTION', 'RESTAURANT_MEAL', 'LARGER_PORTION', 'SWEET_TREAT', 'SNACK', 'ALCOHOL', 'OTHER');
CREATE TYPE "BadgeCategory" AS ENUM ('GETTING_STARTED', 'CONSISTENCY', 'HONEST_TRACKING', 'PROGRESS', 'HABIT');
CREATE TYPE "BadgeTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');
CREATE TYPE "DailyFoodLogStatus" AS ENUM ('IN_PROGRESS', 'COMPLETE');
CREATE TYPE "ProgressSnapshotStatus" AS ENUM ('DRAFT', 'COMPLETE');

-- CreateTable
CREATE TABLE "LevelDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "requirements" JSONB NOT NULL,
    "unlocks" JSONB NOT NULL,
    "completionMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserLevelProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "status" "LevelStatus" NOT NULL DEFAULT 'LOCKED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLevelProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "BadgeCategory" NOT NULL,
    "requirementType" TEXT NOT NULL,
    "requirementThreshold" INTEGER NOT NULL DEFAULT 1,
    "tier" "BadgeTier",
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "status" "BadgeStatus" NOT NULL DEFAULT 'LOCKED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streakType" "StreakType" NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "bestCount" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDate" TIMESTAMP(3),
    "graceDaysAvailable" INTEGER NOT NULL DEFAULT 1,
    "graceDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "status" "StreakStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StreakEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streakType" "StreakType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" "StreakEventType" NOT NULL,
    "relatedEntityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyFoodLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completionStatus" "DailyFoodLogStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "dailyWinEarned" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyFoodLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GamificationMealLog" (
    "id" TEXT NOT NULL,
    "dailyFoodLogId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "status" "GamificationMealLogStatus" NOT NULL,
    "actualFoodDescription" TEXT,
    "category" "MealCategory",
    "photoUrl" TEXT,
    "notes" TEXT,
    "loggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationMealLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "weight" DECIMAL(10,2),
    "measurements" JSONB,
    "extendedMeasurements" JSONB,
    "frontPhotoUrl" TEXT,
    "sidePhotoUrl" TEXT,
    "backPhotoUrl" TEXT,
    "notes" TEXT,
    "completionStatus" "ProgressSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "difficultyRating" TEXT,
    "frictionPoints" JSONB,
    "selectedFocusGoal" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelDefinition_order_key" ON "LevelDefinition"("order");
CREATE UNIQUE INDEX "UserLevelProgress_userId_levelId_key" ON "UserLevelProgress"("userId", "levelId");
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
CREATE UNIQUE INDEX "UserStreak_userId_streakType_key" ON "UserStreak"("userId", "streakType");
CREATE INDEX "StreakEvent_userId_streakType_eventDate_idx" ON "StreakEvent"("userId", "streakType", "eventDate");
CREATE UNIQUE INDEX "DailyFoodLog_dailyLogId_key" ON "DailyFoodLog"("dailyLogId");
CREATE UNIQUE INDEX "DailyFoodLog_userId_date_key" ON "DailyFoodLog"("userId", "date");
CREATE UNIQUE INDEX "GamificationMealLog_mealId_key" ON "GamificationMealLog"("mealId");
CREATE INDEX "ProgressSnapshot_userId_snapshotDate_idx" ON "ProgressSnapshot"("userId", "snapshotDate");
CREATE UNIQUE INDEX "WeeklyReflection_userId_weekStartDate_key" ON "WeeklyReflection"("userId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "UserLevelProgress" ADD CONSTRAINT "UserLevelProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLevelProgress" ADD CONSTRAINT "UserLevelProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "LevelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserStreak" ADD CONSTRAINT "UserStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StreakEvent" ADD CONSTRAINT "StreakEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyFoodLog" ADD CONSTRAINT "DailyFoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyFoodLog" ADD CONSTRAINT "DailyFoodLog_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GamificationMealLog" ADD CONSTRAINT "GamificationMealLog_dailyFoodLogId_fkey" FOREIGN KEY ("dailyFoodLogId") REFERENCES "DailyFoodLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GamificationMealLog" ADD CONSTRAINT "GamificationMealLog_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressSnapshot" ADD CONSTRAINT "ProgressSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyReflection" ADD CONSTRAINT "WeeklyReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
