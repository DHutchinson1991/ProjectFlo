/*
  Warnings:

  - You are about to drop the `component_library` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "component_coverage" DROP CONSTRAINT "component_coverage_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_dependencies" DROP CONSTRAINT "component_dependencies_dependent_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_dependencies" DROP CONSTRAINT "component_dependencies_parent_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_library" DROP CONSTRAINT "component_library_workflow_template_id_fkey";

-- DropForeignKey
ALTER TABLE "component_music_options" DROP CONSTRAINT "component_music_options_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_usage_analytics" DROP CONSTRAINT "component_usage_analytics_component_id_fkey";

-- DropForeignKey
ALTER TABLE "content_assigned_components" DROP CONSTRAINT "content_assigned_components_component_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_change_log" DROP CONSTRAINT "timeline_change_log_component_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_components" DROP CONSTRAINT "timeline_components_component_id_fkey";

-- DropTable
DROP TABLE "component_library";

-- CreateTable
CREATE TABLE "scenes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ComponentType" NOT NULL,
    "is_coverage_linked" BOOLEAN NOT NULL DEFAULT false,
    "workflow_template_id" INTEGER,
    "complexity_score" INTEGER NOT NULL DEFAULT 5,
    "estimated_duration" INTEGER,
    "default_editing_style" TEXT,
    "base_task_hours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usage_count" INTEGER DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "average_actual_duration" DECIMAL(8,2),
    "performance_score" DECIMAL(3,2) DEFAULT 5.0,
    "computed_task_count" INTEGER,
    "computed_total_hours" DECIMAL(8,2),

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_assigned_components" ADD CONSTRAINT "content_assigned_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_coverage" ADD CONSTRAINT "component_coverage_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_music_options" ADD CONSTRAINT "component_music_options_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_components" ADD CONSTRAINT "timeline_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_dependencies" ADD CONSTRAINT "component_dependencies_dependent_component_id_fkey" FOREIGN KEY ("dependent_component_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_dependencies" ADD CONSTRAINT "component_dependencies_parent_component_id_fkey" FOREIGN KEY ("parent_component_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_analytics" ADD CONSTRAINT "component_usage_analytics_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
