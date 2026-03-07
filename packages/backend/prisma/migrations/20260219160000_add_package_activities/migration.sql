-- CreateTable
CREATE TABLE "package_activities" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "package_event_day_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration_minutes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_activities_package_id_idx" ON "package_activities"("package_id");

-- CreateIndex
CREATE INDEX "package_activities_package_event_day_id_idx" ON "package_activities"("package_event_day_id");

-- AddForeignKey
ALTER TABLE "package_activities" ADD CONSTRAINT "package_activities_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_activities" ADD CONSTRAINT "package_activities_package_event_day_id_fkey" FOREIGN KEY ("package_event_day_id") REFERENCES "package_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
