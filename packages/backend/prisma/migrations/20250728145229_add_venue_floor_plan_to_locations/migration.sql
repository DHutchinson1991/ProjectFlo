-- AlterTable
ALTER TABLE "locations_library" ADD COLUMN     "venue_floor_plan_data" JSONB,
ADD COLUMN     "venue_floor_plan_updated_at" TIMESTAMP(3),
ADD COLUMN     "venue_floor_plan_updated_by" INTEGER,
ADD COLUMN     "venue_floor_plan_version" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "locations_library" ADD CONSTRAINT "locations_library_venue_floor_plan_updated_by_fkey" FOREIGN KEY ("venue_floor_plan_updated_by") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
