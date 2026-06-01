-- CreateTable
CREATE TABLE "NutritionPlanTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'GLOBAL',
    "calorieTarget" DECIMAL(10,2) NOT NULL,
    "proteinTarget" DECIMAL(10,2) NOT NULL,
    "carbTarget" DECIMAL(10,2) NOT NULL,
    "fatTarget" DECIMAL(10,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionPlanTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTemplateMeal" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "mealNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "plannedTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTemplateMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTemplateMealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "calories" DECIMAL(10,2) NOT NULL,
    "protein" DECIMAL(10,2) NOT NULL,
    "carbs" DECIMAL(10,2) NOT NULL,
    "fat" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTemplateMealItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Program" ADD COLUMN "defaultNutritionTemplateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTemplateMeal_templateId_mealNumber_key" ON "NutritionTemplateMeal"("templateId", "mealNumber");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_defaultNutritionTemplateId_fkey" FOREIGN KEY ("defaultNutritionTemplateId") REFERENCES "NutritionPlanTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionPlanTemplate" ADD CONSTRAINT "NutritionPlanTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTemplateMeal" ADD CONSTRAINT "NutritionTemplateMeal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionPlanTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTemplateMealItem" ADD CONSTRAINT "NutritionTemplateMealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "NutritionTemplateMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTemplateMealItem" ADD CONSTRAINT "NutritionTemplateMealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;
