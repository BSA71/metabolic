ALTER TABLE "User"
ADD COLUMN "coachCode" TEXT,
ADD COLUMN "coachRequestedAt" TIMESTAMP(3),
ADD COLUMN "defaultNutritionTemplateId" TEXT,
ADD COLUMN "defaultExerciseTemplateId" TEXT;

CREATE UNIQUE INDEX "User_coachCode_key" ON "User"("coachCode");

ALTER TABLE "User"
ADD CONSTRAINT "User_defaultNutritionTemplateId_fkey"
FOREIGN KEY ("defaultNutritionTemplateId") REFERENCES "NutritionPlanTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_defaultExerciseTemplateId_fkey"
FOREIGN KEY ("defaultExerciseTemplateId") REFERENCES "ExerciseTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
