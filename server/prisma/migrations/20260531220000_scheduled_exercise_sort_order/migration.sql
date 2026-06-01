-- AlterTable
ALTER TABLE "ScheduledExercise" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill sort order from creation time within each user/day
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "scheduledDate"
      ORDER BY "createdAt" ASC
    ) - 1 AS rn
  FROM "ScheduledExercise"
)
UPDATE "ScheduledExercise" AS se
SET "sortOrder" = ranked.rn
FROM ranked
WHERE se.id = ranked.id;
