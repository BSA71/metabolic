-- AlterTable
ALTER TABLE "User" ADD COLUMN "gender" TEXT,
ADD COLUMN "birthDate" DATE;

-- CreateTable
CREATE TABLE "BloodPanel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labDate" DATE NOT NULL,
    "labProvider" TEXT,
    "glucose" DECIMAL(10,2),
    "totalCholesterol" DECIMAL(10,2),
    "hdl" DECIMAL(10,2),
    "ldl" DECIMAL(10,2),
    "triglycerides" DECIMAL(10,2),
    "hemoglobinA1c" DECIMAL(10,2),
    "insulin" DECIMAL(10,2),
    "testosterone" DECIMAL(10,2),
    "notes" TEXT,
    "enteredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodPanelReferenceRange" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "lowMax" DECIMAL(10,2),
    "normalMin" DECIMAL(10,2) NOT NULL,
    "normalMax" DECIMAL(10,2) NOT NULL,
    "highMin" DECIMAL(10,2),
    "unit" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodPanelReferenceRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BloodPanel_userId_idx" ON "BloodPanel"("userId");

-- CreateIndex
CREATE INDEX "BloodPanel_userId_labDate_idx" ON "BloodPanel"("userId", "labDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BloodPanelReferenceRange_metricKey_gender_ageMin_ageMax_key" ON "BloodPanelReferenceRange"("metricKey", "gender", "ageMin", "ageMax");

-- AddForeignKey
ALTER TABLE "BloodPanel" ADD CONSTRAINT "BloodPanel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodPanel" ADD CONSTRAINT "BloodPanel_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed reference ranges aligned with mmv1/docs/5_BLOOD-PANELS.md
INSERT INTO "BloodPanelReferenceRange" (
    "id", "metricKey", "gender", "ageMin", "ageMax", "lowMax", "normalMin", "normalMax", "highMin", "unit", "description", "updatedAt"
) VALUES
-- Glucose (mg/dL)
('bprr_glucose_any_18', 'glucose', 'any', 18, 120, 69, 70, 99, 100, 'mg/dL', 'Measures blood sugar level. Primary indicator of diabetes risk and metabolic health.', CURRENT_TIMESTAMP),
-- Total cholesterol (mg/dL)
('bprr_total_cholesterol_any_18', 'total_cholesterol', 'any', 18, 120, 124, 125, 199, 200, 'mg/dL', 'Combined measure of all cholesterol in the blood. Used to assess cardiovascular risk.', CURRENT_TIMESTAMP),
-- HDL (mg/dL)
('bprr_hdl_m_18', 'hdl', 'm', 18, 120, 39, 40, 999, NULL, 'mg/dL', '"Good" cholesterol. Higher levels are protective against heart disease.', CURRENT_TIMESTAMP),
('bprr_hdl_f_18', 'hdl', 'f', 18, 120, 49, 50, 999, NULL, 'mg/dL', '"Good" cholesterol. Higher levels are protective against heart disease.', CURRENT_TIMESTAMP),
-- LDL (mg/dL)
('bprr_ldl_any_18', 'ldl', 'any', 18, 120, 49, 50, 129, 130, 'mg/dL', '"Bad" cholesterol. Elevated levels increase risk of plaque buildup in arteries.', CURRENT_TIMESTAMP),
-- Triglycerides (mg/dL)
('bprr_triglycerides_any_18', 'triglycerides', 'any', 18, 120, 39, 40, 149, 150, 'mg/dL', 'A type of fat in the blood. High levels are linked to heart disease and metabolic syndrome.', CURRENT_TIMESTAMP),
-- Hemoglobin A1C (%)
('bprr_hemoglobin_a1c_any_18', 'hemoglobin_a1c', 'any', 18, 120, 3.9, 4.0, 5.6, 5.7, '%', 'Average blood sugar over the past 2–3 months. Key marker for diabetes management.', CURRENT_TIMESTAMP),
-- Insulin (μIU/mL)
('bprr_insulin_any_18', 'insulin', 'any', 18, 120, 2.5, 2.6, 24.9, 25, 'μIU/mL', 'Hormone that regulates blood sugar. Elevated fasting insulin can signal insulin resistance.', CURRENT_TIMESTAMP),
-- Testosterone (ng/dL) — ranges from 5_BLOOD-PANELS.md §3.2
('bprr_testosterone_m_18_30', 'testosterone', 'm', 18, 30, 263, 264, 916, 917, 'ng/dL', 'Primary male sex hormone. Important for muscle mass, energy, mood, and metabolic function.', CURRENT_TIMESTAMP),
('bprr_testosterone_m_31_50', 'testosterone', 'm', 31, 50, 218, 219, 845, 846, 'ng/dL', 'Primary male sex hormone. Important for muscle mass, energy, mood, and metabolic function.', CURRENT_TIMESTAMP),
('bprr_testosterone_m_51', 'testosterone', 'm', 51, 120, 196, 197, 740, 741, 'ng/dL', 'Primary male sex hormone. Important for muscle mass, energy, mood, and metabolic function.', CURRENT_TIMESTAMP),
('bprr_testosterone_f_18_50', 'testosterone', 'f', 18, 50, 7, 8, 60, 61, 'ng/dL', 'Primary male sex hormone. Important for muscle mass, energy, mood, and metabolic function.', CURRENT_TIMESTAMP),
('bprr_testosterone_f_51', 'testosterone', 'f', 51, 120, 4, 5, 32, 33, 'ng/dL', 'Primary male sex hormone. Important for muscle mass, energy, mood, and metabolic function.', CURRENT_TIMESTAMP);
