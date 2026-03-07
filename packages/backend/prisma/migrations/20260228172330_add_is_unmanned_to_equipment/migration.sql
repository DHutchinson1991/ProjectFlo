-- DropForeignKey
ALTER TABLE "wedding_type_activities" DROP CONSTRAINT "wedding_type_activities_wedding_type_id_fkey";

-- DropForeignKey
ALTER TABLE "wedding_type_activity_moments" DROP CONSTRAINT "wedding_type_activity_moments_wedding_type_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "wedding_types" DROP CONSTRAINT "wedding_types_brand_id_fkey";

-- AlterTable
ALTER TABLE "contributors" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "crew_color" TEXT,
ADD COLUMN     "is_crew" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "is_unmanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "film_timeline_tracks_v2" ADD COLUMN     "contributor_id" INTEGER;

-- AlterTable
ALTER TABLE "package_film_scene_schedules" ADD COLUMN     "package_activity_id" INTEGER;

-- AlterTable
ALTER TABLE "project_film_scene_schedules" ADD COLUMN     "project_activity_id" INTEGER;

-- AlterTable
ALTER TABLE "service_packages" ADD COLUMN     "wedding_type_id" INTEGER;

-- AlterTable
ALTER TABLE "wedding_type_activities" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "wedding_type_activity_moments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "wedding_types" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "wedding_type_locations" (
    "id" SERIAL NOT NULL,
    "wedding_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_type_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_type_subjects" (
    "id" SERIAL NOT NULL,
    "wedding_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject_type" TEXT,
    "typical_count" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_type_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_type_activity_locations" (
    "id" SERIAL NOT NULL,
    "wedding_type_activity_id" INTEGER NOT NULL,
    "wedding_type_location_id" INTEGER NOT NULL,
    "location_sequence_index" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes_at_location" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_type_activity_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_type_activity_subjects" (
    "id" SERIAL NOT NULL,
    "wedding_type_activity_id" INTEGER NOT NULL,
    "wedding_type_subject_id" INTEGER NOT NULL,
    "presence_percentage" INTEGER,
    "is_primary_focus" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_type_activity_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_activity_moments" (
    "id" SERIAL NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_activity_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_day_operators" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "contributor_id" INTEGER,
    "package_activity_id" INTEGER,
    "position_name" TEXT NOT NULL,
    "position_color" TEXT,
    "job_role_id" INTEGER,
    "hours" DECIMAL(4,1) NOT NULL DEFAULT 8,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_day_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_day_operator_equipment" (
    "id" SERIAL NOT NULL,
    "package_day_operator_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_day_operator_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_event_day_subjects" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER,
    "role_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL DEFAULT 'PEOPLE',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_event_day_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activities" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "project_event_day_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration_minutes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_activity_assignments" (
    "id" SERIAL NOT NULL,
    "package_day_operator_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_activity_assignments" (
    "id" SERIAL NOT NULL,
    "package_event_day_subject_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_location_slots" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "location_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_location_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_activity_assignments" (
    "id" SERIAL NOT NULL,
    "package_location_slot_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_versions" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wedding_type_locations_wedding_type_id_idx" ON "wedding_type_locations"("wedding_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_type_locations_wedding_type_id_order_index_key" ON "wedding_type_locations"("wedding_type_id", "order_index");

-- CreateIndex
CREATE INDEX "wedding_type_subjects_wedding_type_id_idx" ON "wedding_type_subjects"("wedding_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_type_subjects_wedding_type_id_order_index_key" ON "wedding_type_subjects"("wedding_type_id", "order_index");

-- CreateIndex
CREATE INDEX "wedding_type_activity_locations_wedding_type_activity_id_idx" ON "wedding_type_activity_locations"("wedding_type_activity_id");

-- CreateIndex
CREATE INDEX "wedding_type_activity_locations_wedding_type_location_id_idx" ON "wedding_type_activity_locations"("wedding_type_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_type_activity_locations_wedding_type_activity_id_we_key" ON "wedding_type_activity_locations"("wedding_type_activity_id", "wedding_type_location_id");

-- CreateIndex
CREATE INDEX "wedding_type_activity_subjects_wedding_type_activity_id_idx" ON "wedding_type_activity_subjects"("wedding_type_activity_id");

-- CreateIndex
CREATE INDEX "wedding_type_activity_subjects_wedding_type_subject_id_idx" ON "wedding_type_activity_subjects"("wedding_type_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_type_activity_subjects_wedding_type_activity_id_wed_key" ON "wedding_type_activity_subjects"("wedding_type_activity_id", "wedding_type_subject_id");

-- CreateIndex
CREATE INDEX "package_activity_moments_package_activity_id_idx" ON "package_activity_moments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_activity_moments_package_activity_id_order_index_key" ON "package_activity_moments"("package_activity_id", "order_index");

-- CreateIndex
CREATE INDEX "package_day_operators_package_id_idx" ON "package_day_operators"("package_id");

-- CreateIndex
CREATE INDEX "package_day_operators_event_day_template_id_idx" ON "package_day_operators"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_day_operators_contributor_id_idx" ON "package_day_operators"("contributor_id");

-- CreateIndex
CREATE INDEX "package_day_operators_package_activity_id_idx" ON "package_day_operators"("package_activity_id");

-- CreateIndex
CREATE INDEX "package_day_operators_job_role_id_idx" ON "package_day_operators"("job_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_day_operators_package_id_event_day_template_id_posi_key" ON "package_day_operators"("package_id", "event_day_template_id", "position_name");

-- CreateIndex
CREATE INDEX "package_day_operator_equipment_package_day_operator_id_idx" ON "package_day_operator_equipment"("package_day_operator_id");

-- CreateIndex
CREATE INDEX "package_day_operator_equipment_equipment_id_idx" ON "package_day_operator_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_day_operator_equipment_package_day_operator_id_equi_key" ON "package_day_operator_equipment"("package_day_operator_id", "equipment_id");

-- CreateIndex
CREATE INDEX "package_event_day_subjects_package_id_idx" ON "package_event_day_subjects"("package_id");

-- CreateIndex
CREATE INDEX "package_event_day_subjects_event_day_template_id_idx" ON "package_event_day_subjects"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_event_day_subjects_package_activity_id_idx" ON "package_event_day_subjects"("package_activity_id");

-- CreateIndex
CREATE INDEX "package_event_day_subjects_role_template_id_idx" ON "package_event_day_subjects"("role_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_event_day_subjects_package_id_event_day_template_id_key" ON "package_event_day_subjects"("package_id", "event_day_template_id", "name");

-- CreateIndex
CREATE INDEX "project_activities_project_id_idx" ON "project_activities"("project_id");

-- CreateIndex
CREATE INDEX "project_activities_project_event_day_id_idx" ON "project_activities"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_activities_package_activity_id_idx" ON "project_activities"("package_activity_id");

-- CreateIndex
CREATE INDEX "operator_activity_assignments_package_day_operator_id_idx" ON "operator_activity_assignments"("package_day_operator_id");

-- CreateIndex
CREATE INDEX "operator_activity_assignments_package_activity_id_idx" ON "operator_activity_assignments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "operator_activity_assignments_package_day_operator_id_packa_key" ON "operator_activity_assignments"("package_day_operator_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "subject_activity_assignments_package_event_day_subject_id_idx" ON "subject_activity_assignments"("package_event_day_subject_id");

-- CreateIndex
CREATE INDEX "subject_activity_assignments_package_activity_id_idx" ON "subject_activity_assignments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_activity_assignments_package_event_day_subject_id_p_key" ON "subject_activity_assignments"("package_event_day_subject_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "package_location_slots_package_id_idx" ON "package_location_slots"("package_id");

-- CreateIndex
CREATE INDEX "package_location_slots_event_day_template_id_idx" ON "package_location_slots"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_location_slots_package_id_event_day_template_id_loc_key" ON "package_location_slots"("package_id", "event_day_template_id", "location_number");

-- CreateIndex
CREATE INDEX "location_activity_assignments_package_location_slot_id_idx" ON "location_activity_assignments"("package_location_slot_id");

-- CreateIndex
CREATE INDEX "location_activity_assignments_package_activity_id_idx" ON "location_activity_assignments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_activity_assignments_package_location_slot_id_pack_key" ON "location_activity_assignments"("package_location_slot_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "package_versions_package_id_idx" ON "package_versions"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_versions_package_id_version_number_key" ON "package_versions"("package_id", "version_number");

-- CreateIndex
CREATE INDEX "contributors_is_crew_idx" ON "contributors"("is_crew");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_contributor_id_idx" ON "film_timeline_tracks_v2"("contributor_id");

-- CreateIndex
CREATE INDEX "package_film_scene_schedules_package_activity_id_idx" ON "package_film_scene_schedules"("package_activity_id");

-- CreateIndex
CREATE INDEX "project_film_scene_schedules_project_activity_id_idx" ON "project_film_scene_schedules"("project_activity_id");

-- CreateIndex
CREATE INDEX "service_packages_wedding_type_id_idx" ON "service_packages"("wedding_type_id");

-- AddForeignKey
ALTER TABLE "film_timeline_tracks_v2" ADD CONSTRAINT "film_timeline_tracks_v2_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "wedding_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_types" ADD CONSTRAINT "wedding_types_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_activities" ADD CONSTRAINT "wedding_type_activities_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "wedding_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_activity_moments" ADD CONSTRAINT "wedding_type_activity_moments_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "wedding_type_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_locations" ADD CONSTRAINT "wedding_type_locations_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "wedding_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_subjects" ADD CONSTRAINT "wedding_type_subjects_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "wedding_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_activity_locations" ADD CONSTRAINT "wedding_type_activity_locations_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "wedding_type_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_activity_locations" ADD CONSTRAINT "wedding_type_activity_locations_wedding_type_location_id_fkey" FOREIGN KEY ("wedding_type_location_id") REFERENCES "wedding_type_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_activity_subjects" ADD CONSTRAINT "wedding_type_activity_subjects_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "wedding_type_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_type_activity_subjects" ADD CONSTRAINT "wedding_type_activity_subjects_wedding_type_subject_id_fkey" FOREIGN KEY ("wedding_type_subject_id") REFERENCES "wedding_type_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_activity_moments" ADD CONSTRAINT "package_activity_moments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operator_equipment" ADD CONSTRAINT "package_day_operator_equipment_package_day_operator_id_fkey" FOREIGN KEY ("package_day_operator_id") REFERENCES "package_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operator_equipment" ADD CONSTRAINT "package_day_operator_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_subjects" ADD CONSTRAINT "package_event_day_subjects_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_subjects" ADD CONSTRAINT "package_event_day_subjects_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_subjects" ADD CONSTRAINT "package_event_day_subjects_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_subjects" ADD CONSTRAINT "package_event_day_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_role_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_activity_assignments" ADD CONSTRAINT "operator_activity_assignments_package_day_operator_id_fkey" FOREIGN KEY ("package_day_operator_id") REFERENCES "package_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_activity_assignments" ADD CONSTRAINT "operator_activity_assignments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_activity_assignments" ADD CONSTRAINT "subject_activity_assignments_package_event_day_subject_id_fkey" FOREIGN KEY ("package_event_day_subject_id") REFERENCES "package_event_day_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_activity_assignments" ADD CONSTRAINT "subject_activity_assignments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_location_slots" ADD CONSTRAINT "package_location_slots_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_location_slots" ADD CONSTRAINT "package_location_slots_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_activity_assignments" ADD CONSTRAINT "location_activity_assignments_package_location_slot_id_fkey" FOREIGN KEY ("package_location_slot_id") REFERENCES "package_location_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_activity_assignments" ADD CONSTRAINT "location_activity_assignments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_versions" ADD CONSTRAINT "package_versions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "package_event_day_locations_package_id_event_day_template_id_lo" RENAME TO "package_event_day_locations_package_id_event_day_template_i_key";

-- RenameIndex
ALTER INDEX "wedding_type_activity_moments_wedding_type_activity_id_order_" RENAME TO "wedding_type_activity_moments_wedding_type_activity_id_orde_key";

-- ======================================
-- Seed: Locations for All Wedding Types
-- (Moved from migration 20260228150000 - tables created above)
-- ======================================

-- Locations for Traditional British Wedding (Wedding Type ID 1)
INSERT INTO "wedding_type_locations" ("wedding_type_id", "name", "location_type", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (1, 'Bride''s Getting Ready', 'getting_ready', 1, false, NOW(), NOW()),
    (1, 'Ceremony Venue', 'ceremony', 2, true, NOW(), NOW()),
    (1, 'Reception Hall', 'reception', 3, true, NOW(), NOW());

-- Locations for Indian Wedding (Wedding Type ID 2)
INSERT INTO "wedding_type_locations" ("wedding_type_id", "name", "location_type", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (2, 'Mehendi Venue', 'mehendi', 1, false, NOW(), NOW()),
    (2, 'Sangeet Venue', 'sangeet', 2, false, NOW(), NOW()),
    (2, 'Ceremony Venue', 'ceremony', 3, true, NOW(), NOW()),
    (2, 'Reception Hall', 'reception', 4, true, NOW(), NOW());

-- Locations for Pakistani Wedding (Wedding Type ID 3)
INSERT INTO "wedding_type_locations" ("wedding_type_id", "name", "location_type", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (3, 'Preparation Area', 'getting_ready', 1, false, NOW(), NOW()),
    (3, 'Ceremony Venue', 'ceremony', 2, true, NOW(), NOW()),
    (3, 'Walima Venue', 'reception', 3, true, NOW(), NOW());

-- Locations for Registry Office + Celebration (Wedding Type ID 4)
INSERT INTO "wedding_type_locations" ("wedding_type_id", "name", "location_type", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (4, 'Registry Office', 'ceremony', 1, true, NOW(), NOW()),
    (4, 'Celebration Venue', 'reception', 2, true, NOW(), NOW());

-- Locations for Garden/Intimate Wedding (Wedding Type ID 5)
INSERT INTO "wedding_type_locations" ("wedding_type_id", "name", "location_type", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (5, 'Garden Ceremony Area', 'ceremony', 1, true, NOW(), NOW()),
    (5, 'Cocktail Garden', 'photos', 2, false, NOW(), NOW()),
    (5, 'Garden Games Area', 'fun', 3, false, NOW(), NOW()),
    (5, 'Dining Area', 'reception', 4, true, NOW(), NOW());

-- ======================================
-- Seed: Subjects for All Wedding Types
-- ======================================

-- Subjects for Traditional British Wedding (Wedding Type ID 1)
INSERT INTO "wedding_type_subjects" ("wedding_type_id", "name", "subject_type", "typical_count", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (1, 'Bride', 'couple', 1, 1, true, NOW(), NOW()),
    (1, 'Groom', 'couple', 1, 2, true, NOW(), NOW()),
    (1, 'Bridesmaids', 'wedding_party', 3, 3, false, NOW(), NOW()),
    (1, 'Groomsmen', 'wedding_party', 3, 4, false, NOW(), NOW()),
    (1, 'Family', 'family', NULL, 5, false, NOW(), NOW()),
    (1, 'Guests', 'guests', NULL, 6, false, NOW(), NOW());

-- Subjects for Indian Wedding (Wedding Type ID 2)
INSERT INTO "wedding_type_subjects" ("wedding_type_id", "name", "subject_type", "typical_count", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (2, 'Bride', 'couple', 1, 1, true, NOW(), NOW()),
    (2, 'Groom', 'couple', 1, 2, true, NOW(), NOW()),
    (2, 'Bride''s Family', 'family', NULL, 3, false, NOW(), NOW()),
    (2, 'Groom''s Family', 'family', NULL, 4, false, NOW(), NOW()),
    (2, 'Wedding Party', 'wedding_party', NULL, 5, false, NOW(), NOW()),
    (2, 'Guests', 'guests', NULL, 6, false, NOW(), NOW());

-- Subjects for Pakistani Wedding (Wedding Type ID 3)
INSERT INTO "wedding_type_subjects" ("wedding_type_id", "name", "subject_type", "typical_count", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (3, 'Bride', 'couple', 1, 1, true, NOW(), NOW()),
    (3, 'Groom', 'couple', 1, 2, true, NOW(), NOW()),
    (3, 'Wedding Party', 'wedding_party', NULL, 3, false, NOW(), NOW()),
    (3, 'Family', 'family', NULL, 4, false, NOW(), NOW()),
    (3, 'Guests', 'guests', NULL, 5, false, NOW(), NOW());

-- Subjects for Registry Office + Celebration (Wedding Type ID 4)
INSERT INTO "wedding_type_subjects" ("wedding_type_id", "name", "subject_type", "typical_count", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (4, 'Bride', 'couple', 1, 1, true, NOW(), NOW()),
    (4, 'Groom', 'couple', 1, 2, true, NOW(), NOW()),
    (4, 'Close Family', 'family', NULL, 3, false, NOW(), NOW()),
    (4, 'Guests', 'guests', NULL, 4, false, NOW(), NOW());

-- Subjects for Garden/Intimate Wedding (Wedding Type ID 5)
INSERT INTO "wedding_type_subjects" ("wedding_type_id", "name", "subject_type", "typical_count", "order_index", "is_primary", "created_at", "updated_at")
VALUES
    (5, 'Bride', 'couple', 1, 1, true, NOW(), NOW()),
    (5, 'Groom', 'couple', 1, 2, true, NOW(), NOW()),
    (5, 'Close Family', 'family', NULL, 3, false, NOW(), NOW()),
    (5, 'Close Friends', 'guests', NULL, 4, false, NOW(), NOW());
