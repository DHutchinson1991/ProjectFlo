/*
  Warnings:

  - The values [COVERAGE_BASED,PRODUCTION] on the enum `ComponentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ComponentType_new" AS ENUM ('COVERAGE_LINKED', 'EDIT');
ALTER TABLE "component_library" ALTER COLUMN "type" TYPE "ComponentType_new" USING ("type"::text::"ComponentType_new");
ALTER TABLE "task_generation_rules" ALTER COLUMN "component_type" TYPE "ComponentType_new" USING ("component_type"::text::"ComponentType_new");
ALTER TYPE "ComponentType" RENAME TO "ComponentType_old";
ALTER TYPE "ComponentType_new" RENAME TO "ComponentType";
DROP TYPE "ComponentType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PricingModifierType" ADD VALUE 'TIMELINE_COMPLEXITY';
ALTER TYPE "PricingModifierType" ADD VALUE 'COVERAGE_COMPLEXITY';
ALTER TYPE "PricingModifierType" ADD VALUE 'COMPONENT_DEPENDENCY';
ALTER TYPE "PricingModifierType" ADD VALUE 'DELIVERABLE_OVERRIDE';

-- AlterTable
ALTER TABLE "component_library" ADD COLUMN     "average_actual_duration" DECIMAL(8,2),
ADD COLUMN     "computed_task_count" INTEGER,
ADD COLUMN     "computed_total_hours" DECIMAL(8,2),
ADD COLUMN     "last_used_at" TIMESTAMP(3),
ADD COLUMN     "performance_score" DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN     "usage_count" INTEGER DEFAULT 0,
ADD COLUMN     "workflow_template_id" INTEGER;

-- AlterTable
ALTER TABLE "coverage_scenes" ADD COLUMN     "workflow_template_id" INTEGER;

-- AlterTable
ALTER TABLE "deliverables" ADD COLUMN     "workflow_template_id" INTEGER;

-- AlterTable
ALTER TABLE "editing_styles" ADD COLUMN     "workflow_template_id" INTEGER;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "workflow_template_id" INTEGER;

-- CreateTable
CREATE TABLE "timeline_layers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "color_hex" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_components" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "layer_id" INTEGER NOT NULL,
    "start_time_seconds" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "timeline_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_dependencies" (
    "id" SERIAL NOT NULL,
    "parent_component_id" INTEGER NOT NULL,
    "dependent_component_id" INTEGER NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'REQUIRED',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER,

    CONSTRAINT "component_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_usage_analytics" (
    "id" SERIAL NOT NULL,
    "component_id" INTEGER NOT NULL,
    "used_in_deliverable_id" INTEGER,
    "used_in_build_id" INTEGER,
    "usage_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actual_duration_seconds" INTEGER,
    "estimated_duration_seconds" INTEGER,
    "variance_percentage" DECIMAL(5,2),
    "user_id" INTEGER,

    CONSTRAINT "component_usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_editing_sessions" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_end" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "timeline_editing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_change_log" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "component_id" INTEGER,
    "change_type" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_by_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" INTEGER,

    CONSTRAINT "timeline_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" SERIAL NOT NULL,
    "workflow_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_generation_rules" (
    "id" SERIAL NOT NULL,
    "workflow_stage_id" INTEGER NOT NULL,
    "task_template_id" INTEGER NOT NULL,
    "component_type" "ComponentType",
    "coverage_scene_id" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "auto_assign_to_role" TEXT,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_generation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_task_log" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_generation_rule_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_task_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "timeline_layers_name_key" ON "timeline_layers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_components_deliverable_id_layer_id_start_time_seco_key" ON "timeline_components"("deliverable_id", "layer_id", "start_time_seconds");

-- CreateIndex
CREATE UNIQUE INDEX "component_dependencies_parent_component_id_dependent_compon_key" ON "component_dependencies"("parent_component_id", "dependent_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_editing_sessions_deliverable_id_user_id_session_st_key" ON "timeline_editing_sessions"("deliverable_id", "user_id", "session_start");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_name_key" ON "workflow_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_workflow_template_id_order_index_key" ON "workflow_stages"("workflow_template_id", "order_index");

-- AddForeignKey
ALTER TABLE "coverage_scenes" ADD CONSTRAINT "coverage_scenes_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_styles" ADD CONSTRAINT "editing_styles_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_library" ADD CONSTRAINT "component_library_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_components" ADD CONSTRAINT "timeline_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_components" ADD CONSTRAINT "timeline_components_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_components" ADD CONSTRAINT "timeline_components_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_components" ADD CONSTRAINT "timeline_components_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "timeline_layers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_dependencies" ADD CONSTRAINT "component_dependencies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_dependencies" ADD CONSTRAINT "component_dependencies_dependent_component_id_fkey" FOREIGN KEY ("dependent_component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_dependencies" ADD CONSTRAINT "component_dependencies_parent_component_id_fkey" FOREIGN KEY ("parent_component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_analytics" ADD CONSTRAINT "component_usage_analytics_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_analytics" ADD CONSTRAINT "component_usage_analytics_used_in_build_id_fkey" FOREIGN KEY ("used_in_build_id") REFERENCES "builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_analytics" ADD CONSTRAINT "component_usage_analytics_used_in_deliverable_id_fkey" FOREIGN KEY ("used_in_deliverable_id") REFERENCES "deliverables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_analytics" ADD CONSTRAINT "component_usage_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "timeline_editing_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_workflow_stage_id_fkey" FOREIGN KEY ("workflow_stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_task_log" ADD CONSTRAINT "generated_task_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_task_log" ADD CONSTRAINT "generated_task_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
