WITH ranked_assignments AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
    ) AS row_number
  FROM "CoachAssignment"
)
DELETE FROM "CoachAssignment"
WHERE id IN (
  SELECT id
  FROM ranked_assignments
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "CoachAssignment_userId_key" ON "CoachAssignment"("userId");
