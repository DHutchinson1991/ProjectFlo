-- Phase 2: Dual-owner schedule tables (inquiry + project)
-- Add inquiry_id to 7 Project* tables, make project_id nullable
-- Add source_package_id + package_contents_snapshot to inquiries

-- AlterTable: inquiries
ALTER TABLE "inquiries" ADD COLUMN "package_contents_snapshot" JSONB,
ADD COLUMN "source_package_id" INTEGER;

-- AlterTable: project_activities
ALTER TABLE "project_activities" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable: project_activity_moments
ALTER TABLE "project_activity_moments" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable: project_day_operators
ALTER TABLE "project_day_operators" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable: project_event_day_subjects
ALTER TABLE "project_event_day_subjects" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable: project_event_days
ALTER TABLE "project_event_days" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable: project_films
ALTER TABLE "project_films" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable: project_location_slots
ALTER TABLE "project_location_slots" ADD COLUMN "inquiry_id" INTEGER,
ALTER COLUMN "project_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "inquiries_source_package_id_idx" ON "inquiries"("source_package_id");

-- CreateIndex
CREATE INDEX "project_activities_inquiry_id_idx" ON "project_activities"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_activity_moments_inquiry_id_idx" ON "project_activity_moments"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_day_operators_inquiry_id_idx" ON "project_day_operators"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_event_day_subjects_inquiry_id_idx" ON "project_event_day_subjects"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_event_days_inquiry_id_idx" ON "project_event_days"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_films_inquiry_id_idx" ON "project_films"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_location_slots_inquiry_id_idx" ON "project_location_slots"("inquiry_id");

-- CreateUnique (ProjectFilm inquiry + film)
CREATE UNIQUE INDEX "project_films_inquiry_id_film_id_key" ON "project_films"("inquiry_id", "film_id");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_source_package_id_fkey" FOREIGN KEY ("source_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_days" ADD CONSTRAINT "project_event_days_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "project_activity_moments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_day_subjects" ADD CONSTRAINT "project_event_day_subjects_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Check constraints: ensure exactly one owner per row
ALTER TABLE "project_event_days" ADD CONSTRAINT "chk_event_day_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE "project_activities" ADD CONSTRAINT "chk_activity_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "chk_moment_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE "project_event_day_subjects" ADD CONSTRAINT "chk_subject_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE "project_location_slots" ADD CONSTRAINT "chk_location_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE "project_day_operators" ADD CONSTRAINT "chk_operator_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE "project_films" ADD CONSTRAINT "chk_film_owner" CHECK (num_nonnulls(project_id, inquiry_id) = 1);
