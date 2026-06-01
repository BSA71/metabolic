-- AlterTable
ALTER TABLE "ExerciseTemplate" ADD COLUMN "createdById" TEXT;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN "defaultExerciseTemplateId" TEXT;

-- CreateTable
CREATE TABLE "ExerciseTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sets" INTEGER,
    "reps" INTEGER,
    "durationMinutes" INTEGER,
    "distance" DECIMAL(10,2),
    "weight" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseTemplateItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExerciseTemplate" ADD CONSTRAINT "ExerciseTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_defaultExerciseTemplateId_fkey" FOREIGN KEY ("defaultExerciseTemplateId") REFERENCES "ExerciseTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseTemplateItem" ADD CONSTRAINT "ExerciseTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExerciseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseTemplateItem" ADD CONSTRAINT "ExerciseTemplateItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
