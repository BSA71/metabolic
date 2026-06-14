-- CreateTable
CREATE TABLE "CoachCheckIn" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachCheckIn_coachId_startsAt_idx" ON "CoachCheckIn"("coachId", "startsAt");

-- CreateIndex
CREATE INDEX "CoachCheckIn_userId_startsAt_idx" ON "CoachCheckIn"("userId", "startsAt");

-- AddForeignKey
ALTER TABLE "CoachCheckIn" ADD CONSTRAINT "CoachCheckIn_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachCheckIn" ADD CONSTRAINT "CoachCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
