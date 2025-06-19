/*
  Warnings:

  - You are about to drop the `deliverable_components` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deliverable_default_components` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_components` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "component_coverage_scenes" DROP CONSTRAINT "component_coverage_scenes_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_music_options" DROP CONSTRAINT "component_music_options_component_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_components" DROP CONSTRAINT "deliverable_components_component_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_components" DROP CONSTRAINT "deliverable_components_deliverable_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_default_components" DROP CONSTRAINT "deliverable_default_components_coverage_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_default_components" DROP CONSTRAINT "deliverable_default_components_default_editing_style_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_default_components" DROP CONSTRAINT "deliverable_default_components_deliverable_id_fkey";

-- DropForeignKey
ALTER TABLE "video_component_tasks" DROP CONSTRAINT "video_component_tasks_component_id_fkey";

-- DropTable
DROP TABLE "deliverable_components";

-- DropTable
DROP TABLE "deliverable_default_components";

-- DropTable
DROP TABLE "video_components";

-- CreateTable
CREATE TABLE "component_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ComponentType" NOT NULL,
    "complexity_score" INTEGER NOT NULL DEFAULT 5,
    "estimated_duration" INTEGER,
    "default_editing_style" TEXT,
    "base_task_hours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_assigned_components" (
    "deliverable_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_assigned_components_pkey" PRIMARY KEY ("deliverable_id","component_id")
);

-- CreateTable
CREATE TABLE "component_template_defaults" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "coverage_scene_id" INTEGER,
    "default_editing_style_id" INTEGER NOT NULL,
    "default_target_minutes" DECIMAL(8,2),
    "default_is_included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "component_template_defaults_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deliverable_assigned_components" ADD CONSTRAINT "deliverable_assigned_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_assigned_components" ADD CONSTRAINT "deliverable_assigned_components_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_coverage_scenes" ADD CONSTRAINT "component_coverage_scenes_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_music_options" ADD CONSTRAINT "component_music_options_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_component_tasks" ADD CONSTRAINT "video_component_tasks_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_template_defaults" ADD CONSTRAINT "component_template_defaults_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_template_defaults" ADD CONSTRAINT "component_template_defaults_default_editing_style_id_fkey" FOREIGN KEY ("default_editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_template_defaults" ADD CONSTRAINT "component_template_defaults_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
