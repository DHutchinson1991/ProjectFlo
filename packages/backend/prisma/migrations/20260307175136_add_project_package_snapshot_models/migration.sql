-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "package_contents_snapshot" JSONB,
ADD COLUMN     "source_package_id" INTEGER;

-- CreateTable
CREATE TABLE "project_activity_moments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "source_package_moment_id" INTEGER,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_activity_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_event_day_subjects" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "project_event_day_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER,
    "source_package_subject_id" INTEGER,
    "role_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "real_name" TEXT,
    "category" "SubjectCategory" NOT NULL DEFAULT 'PEOPLE',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_event_day_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_location_slots" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "project_event_day_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER,
    "source_package_location_slot_id" INTEGER,
    "location_number" INTEGER NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "location_id" INTEGER,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_location_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_day_operators" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "project_event_day_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER,
    "source_package_operator_id" INTEGER,
    "contributor_id" INTEGER,
    "position_name" TEXT NOT NULL,
    "position_color" TEXT,
    "job_role_id" INTEGER,
    "hours" DECIMAL(4,1) NOT NULL DEFAULT 8,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_day_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_day_operator_equipment" (
    "id" SERIAL NOT NULL,
    "project_day_operator_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_day_operator_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_operator_activity_assignments" (
    "id" SERIAL NOT NULL,
    "project_day_operator_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_operator_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_subject_activity_assignments" (
    "id" SERIAL NOT NULL,
    "project_event_day_subject_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_subject_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_location_activity_assignments" (
    "id" SERIAL NOT NULL,
    "project_location_slot_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_location_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_activity_moments_project_id_idx" ON "project_activity_moments"("project_id");

-- CreateIndex
CREATE INDEX "project_activity_moments_project_activity_id_idx" ON "project_activity_moments"("project_activity_id");

-- CreateIndex
CREATE INDEX "project_event_day_subjects_project_id_idx" ON "project_event_day_subjects"("project_id");

-- CreateIndex
CREATE INDEX "project_event_day_subjects_project_event_day_id_idx" ON "project_event_day_subjects"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_event_day_subjects_project_activity_id_idx" ON "project_event_day_subjects"("project_activity_id");

-- CreateIndex
CREATE INDEX "project_event_day_subjects_role_template_id_idx" ON "project_event_day_subjects"("role_template_id");

-- CreateIndex
CREATE INDEX "project_location_slots_project_id_idx" ON "project_location_slots"("project_id");

-- CreateIndex
CREATE INDEX "project_location_slots_project_event_day_id_idx" ON "project_location_slots"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_location_slots_project_activity_id_idx" ON "project_location_slots"("project_activity_id");

-- CreateIndex
CREATE INDEX "project_location_slots_location_id_idx" ON "project_location_slots"("location_id");

-- CreateIndex
CREATE INDEX "project_day_operators_project_id_idx" ON "project_day_operators"("project_id");

-- CreateIndex
CREATE INDEX "project_day_operators_project_event_day_id_idx" ON "project_day_operators"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_day_operators_project_activity_id_idx" ON "project_day_operators"("project_activity_id");

-- CreateIndex
CREATE INDEX "project_day_operators_contributor_id_idx" ON "project_day_operators"("contributor_id");

-- CreateIndex
CREATE INDEX "project_day_operators_job_role_id_idx" ON "project_day_operators"("job_role_id");

-- CreateIndex
CREATE INDEX "project_day_operator_equipment_project_day_operator_id_idx" ON "project_day_operator_equipment"("project_day_operator_id");

-- CreateIndex
CREATE INDEX "project_day_operator_equipment_equipment_id_idx" ON "project_day_operator_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_day_operator_equipment_project_day_operator_id_equi_key" ON "project_day_operator_equipment"("project_day_operator_id", "equipment_id");

-- CreateIndex
CREATE INDEX "project_operator_activity_assignments_project_day_operator__idx" ON "project_operator_activity_assignments"("project_day_operator_id");

-- CreateIndex
CREATE INDEX "project_operator_activity_assignments_project_activity_id_idx" ON "project_operator_activity_assignments"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_operator_activity_assignments_project_day_operator__key" ON "project_operator_activity_assignments"("project_day_operator_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "project_subject_activity_assignments_project_event_day_subj_idx" ON "project_subject_activity_assignments"("project_event_day_subject_id");

-- CreateIndex
CREATE INDEX "project_subject_activity_assignments_project_activity_id_idx" ON "project_subject_activity_assignments"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_subject_activity_assignments_project_event_day_subj_key" ON "project_subject_activity_assignments"("project_event_day_subject_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "project_location_activity_assignments_project_location_slot_idx" ON "project_location_activity_assignments"("project_location_slot_id");

-- CreateIndex
CREATE INDEX "project_location_activity_assignments_project_activity_id_idx" ON "project_location_activity_assignments"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_location_activity_assignments_project_location_slot_key" ON "project_location_activity_assignments"("project_location_slot_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "projects_source_package_id_idx" ON "projects"("source_package_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_source_package_id_fkey" FOREIGN KEY ("source_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "project_activity_moments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "project_activity_moments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_day_subjects" ADD CONSTRAINT "project_event_day_subjects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_day_subjects" ADD CONSTRAINT "project_event_day_subjects_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_day_subjects" ADD CONSTRAINT "project_event_day_subjects_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_day_subjects" ADD CONSTRAINT "project_event_day_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_role_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operator_equipment" ADD CONSTRAINT "project_day_operator_equipment_project_day_operator_id_fkey" FOREIGN KEY ("project_day_operator_id") REFERENCES "project_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operator_equipment" ADD CONSTRAINT "project_day_operator_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_operator_activity_assignments" ADD CONSTRAINT "project_operator_activity_assignments_project_day_operator_fkey" FOREIGN KEY ("project_day_operator_id") REFERENCES "project_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_operator_activity_assignments" ADD CONSTRAINT "project_operator_activity_assignments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_subject_activity_assignments" ADD CONSTRAINT "project_subject_activity_assignments_project_event_day_sub_fkey" FOREIGN KEY ("project_event_day_subject_id") REFERENCES "project_event_day_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_subject_activity_assignments" ADD CONSTRAINT "project_subject_activity_assignments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_activity_assignments" ADD CONSTRAINT "project_location_activity_assignments_project_location_slo_fkey" FOREIGN KEY ("project_location_slot_id") REFERENCES "project_location_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_activity_assignments" ADD CONSTRAINT "project_location_activity_assignments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
