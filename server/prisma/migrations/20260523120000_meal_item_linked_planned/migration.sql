-- AlterTable
ALTER TABLE "MealItem" ADD COLUMN "linkedPlannedItemId" TEXT;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_linkedPlannedItemId_fkey" FOREIGN KEY ("linkedPlannedItemId") REFERENCES "MealItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
