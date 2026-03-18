-- CreateTable
CREATE TABLE "package_event_day_locations" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER,
    "location_id" INTEGER NOT NULL,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_event_day_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_event_day_locations_package_id_idx" ON "package_event_day_locations"("package_id");

-- CreateIndex
CREATE INDEX "package_event_day_locations_event_day_template_id_idx" ON "package_event_day_locations"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_event_day_locations_package_activity_id_idx" ON "package_event_day_locations"("package_activity_id");

-- CreateIndex
CREATE INDEX "package_event_day_locations_location_id_idx" ON "package_event_day_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_event_day_locations_package_id_event_day_template_id_location_id_key" ON "package_event_day_locations"("package_id", "event_day_template_id", "location_id");

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
