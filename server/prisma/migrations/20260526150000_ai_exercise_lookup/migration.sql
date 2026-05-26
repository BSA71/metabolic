CREATE TABLE "AiExerciseLookup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultSets" INTEGER,
    "defaultReps" INTEGER,
    "defaultDurationMinutes" INTEGER,
    "confidence" DECIMAL(5,2),
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "exerciseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiExerciseLookup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiExerciseLookup" ADD CONSTRAINT "AiExerciseLookup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiExerciseLookup" ADD CONSTRAINT "AiExerciseLookup_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
