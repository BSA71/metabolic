-- AlterEnum
ALTER TYPE "MetricType" ADD VALUE IF NOT EXISTS 'HIPS';
ALTER TYPE "MetricType" ADD VALUE IF NOT EXISTS 'CHEST';

-- CreateTable
CREATE TABLE "ProgramProgressPhotoSet" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "frontUrl" TEXT,
    "sideUrl" TEXT,
    "backUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramProgressPhotoSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramProgressPhotoSet_programId_date_key" ON "ProgramProgressPhotoSet"("programId", "date");

-- AddForeignKey
ALTER TABLE "ProgramProgressPhotoSet" ADD CONSTRAINT "ProgramProgressPhotoSet_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
