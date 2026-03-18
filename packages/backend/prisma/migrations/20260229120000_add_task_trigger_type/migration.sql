-- CreateEnum
CREATE TYPE "task_trigger_type" AS ENUM ('always', 'per_film', 'per_event_day', 'per_crew_member', 'per_location', 'per_activity');

-- DropIndex
DROP INDEX "workflow_templates_name_key";

-- AlterTable
ALTER TABLE "contributor_job_roles" ADD COLUMN     "is_unmanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "film_timeline_tracks_v2" ADD COLUMN     "is_unmanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "service_packages" ADD COLUMN     "workflow_template_id" INTEGER;

-- AlterTable
ALTER TABLE "task_library" ADD COLUMN     "trigger_type" "task_trigger_type" NOT NULL DEFAULT 'always';

-- AlterTable
ALTER TABLE "workflow_templates" ADD COLUMN     "brand_id" INTEGER,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "workflow_template_tasks" (
    "id" SERIAL NOT NULL,
    "workflow_template_id" INTEGER NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "phase" "project_phase" NOT NULL,
    "override_hours" DECIMAL(8,2),
    "override_assignee_role" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_template_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_task_overrides" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "task_generation_rule_id" INTEGER,
    "task_library_id" INTEGER,
    "action" TEXT NOT NULL DEFAULT 'include',
    "override_name" TEXT,
    "override_hours" DECIMAL(8,2),
    "override_assignee_role" TEXT,
    "phase" "project_phase",
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_task_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_template_tasks_workflow_template_id_idx" ON "workflow_template_tasks"("workflow_template_id");

-- CreateIndex
CREATE INDEX "workflow_template_tasks_workflow_template_id_phase_idx" ON "workflow_template_tasks"("workflow_template_id", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_template_tasks_workflow_template_id_task_library_i_key" ON "workflow_template_tasks"("workflow_template_id", "task_library_id");

-- CreateIndex
CREATE INDEX "package_task_overrides_package_id_idx" ON "package_task_overrides"("package_id");

-- CreateIndex
CREATE INDEX "service_packages_workflow_template_id_idx" ON "service_packages"("workflow_template_id");

-- CreateIndex
CREATE INDEX "workflow_templates_brand_id_idx" ON "workflow_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_brand_id_name_key" ON "workflow_templates"("brand_id", "name");

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template_tasks" ADD CONSTRAINT "workflow_template_tasks_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template_tasks" ADD CONSTRAINT "workflow_template_tasks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_task_overrides" ADD CONSTRAINT "package_task_overrides_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
