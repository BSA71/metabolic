CREATE TABLE "ProgramMetricSnapshot" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgramMetricSnapshotValue" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "currentValue" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "ProgramMetricSnapshotValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgramMetricSnapshot_programId_date_key" ON "ProgramMetricSnapshot"("programId", "date");
CREATE UNIQUE INDEX "ProgramMetricSnapshotValue_snapshotId_metricType_key" ON "ProgramMetricSnapshotValue"("snapshotId", "metricType");

ALTER TABLE "ProgramMetricSnapshot" ADD CONSTRAINT "ProgramMetricSnapshot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramMetricSnapshotValue" ADD CONSTRAINT "ProgramMetricSnapshotValue_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ProgramMetricSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
