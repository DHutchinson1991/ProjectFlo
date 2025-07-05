/*
  Warnings:

  - The values [COMPONENT_DEPENDENCY] on the enum `PricingModifierType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `default_music_type` on the `content_library` table. All the data in the column will be lost.
  - You are about to drop the column `components_snapshot` on the `content_versions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `scenes` table. All the data in the column will be lost.
  - You are about to drop the column `component_type` on the `task_generation_rules` table. All the data in the column will be lost.
  - You are about to drop the column `build_component_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `component_id` on the `timeline_change_log` table. All the data in the column will be lost.
  - You are about to drop the `build_components` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `component_coverage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `component_dependencies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `component_music_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `component_template_defaults` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `component_usage_analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_assigned_components` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timeline_components` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `scenes_snapshot` to the `content_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `media_type` to the `scenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `build_scene_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'AUDIO', 'MUSIC');

-- AlterEnum
BEGIN;
CREATE TYPE "PricingModifierType_new" AS ENUM ('PEAK_SEASON', 'RUSH_JOB', 'DAY_OF_WEEK', 'LOCATION', 'VOLUME_DISCOUNT', 'TIMELINE_COMPLEXITY', 'COVERAGE_COMPLEXITY', 'SCENE_DEPENDENCY', 'CONTENT_OVERRIDE');
ALTER TABLE "pricing_modifiers" ALTER COLUMN "type" TYPE "PricingModifierType_new" USING ("type"::text::"PricingModifierType_new");
ALTER TYPE "PricingModifierType" RENAME TO "PricingModifierType_old";
ALTER TYPE "PricingModifierType_new" RENAME TO "PricingModifierType";
DROP TYPE "PricingModifierType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "build_components" DROP CONSTRAINT "build_components_build_content_id_fkey";

-- DropForeignKey
ALTER TABLE "build_components" DROP CONSTRAINT "build_components_coverage_id_fkey";

-- DropForeignKey
ALTER TABLE "build_components" DROP CONSTRAINT "build_components_editing_style_id_fkey";

-- DropForeignKey
ALTER TABLE "component_coverage" DROP CONSTRAINT "component_coverage_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_coverage" DROP CONSTRAINT "component_coverage_coverage_id_fkey";

-- DropForeignKey
ALTER TABLE "component_dependencies" DROP CONSTRAINT "component_dependencies_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "component_dependencies" DROP CONSTRAINT "component_dependencies_dependent_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_dependencies" DROP CONSTRAINT "component_dependencies_parent_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_music_options" DROP CONSTRAINT "component_music_options_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_template_defaults" DROP CONSTRAINT "component_template_defaults_content_id_fkey";

-- DropForeignKey
ALTER TABLE "component_template_defaults" DROP CONSTRAINT "component_template_defaults_coverage_id_fkey";

-- DropForeignKey
ALTER TABLE "component_template_defaults" DROP CONSTRAINT "component_template_defaults_default_editing_style_id_fkey";

-- DropForeignKey
ALTER TABLE "component_usage_analytics" DROP CONSTRAINT "component_usage_analytics_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_usage_analytics" DROP CONSTRAINT "component_usage_analytics_used_in_build_id_fkey";

-- DropForeignKey
ALTER TABLE "component_usage_analytics" DROP CONSTRAINT "component_usage_analytics_used_in_content_id_fkey";

-- DropForeignKey
ALTER TABLE "component_usage_analytics" DROP CONSTRAINT "component_usage_analytics_user_id_fkey";

-- DropForeignKey
ALTER TABLE "content_assigned_components" DROP CONSTRAINT "content_assigned_components_component_id_fkey";

-- DropForeignKey
ALTER TABLE "content_assigned_components" DROP CONSTRAINT "content_assigned_components_content_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_build_component_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_change_log" DROP CONSTRAINT "timeline_change_log_component_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_components" DROP CONSTRAINT "timeline_components_component_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_components" DROP CONSTRAINT "timeline_components_content_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_components" DROP CONSTRAINT "timeline_components_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_components" DROP CONSTRAINT "timeline_components_layer_id_fkey";

-- AlterTable
ALTER TABLE "content_library" DROP COLUMN "default_music_type";

-- AlterTable
ALTER TABLE "content_versions" DROP COLUMN "components_snapshot",
ADD COLUMN     "scenes_snapshot" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "scenes" DROP COLUMN "type",
ADD COLUMN     "media_type" "MediaType" NOT NULL;

-- AlterTable
ALTER TABLE "task_generation_rules" DROP COLUMN "component_type",
ADD COLUMN     "media_type" "MediaType";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "build_component_id",
ADD COLUMN     "build_scene_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "timeline_change_log" DROP COLUMN "component_id",
ADD COLUMN     "scene_id" INTEGER;

-- DropTable
DROP TABLE "build_components";

-- DropTable
DROP TABLE "component_coverage";

-- DropTable
DROP TABLE "component_dependencies";

-- DropTable
DROP TABLE "component_music_options";

-- DropTable
DROP TABLE "component_template_defaults";

-- DropTable
DROP TABLE "component_usage_analytics";

-- DropTable
DROP TABLE "content_assigned_components";

-- DropTable
DROP TABLE "timeline_components";

-- DropEnum
DROP TYPE "ComponentType";

-- CreateTable
CREATE TABLE "content_assigned_scenes" (
    "content_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_assigned_scenes_pkey" PRIMARY KEY ("content_id","scene_id")
);

-- CreateTable
CREATE TABLE "scene_coverage" (
    "scene_id" INTEGER NOT NULL,
    "coverage_id" INTEGER NOT NULL,

    CONSTRAINT "scene_coverage_pkey" PRIMARY KEY ("scene_id","coverage_id")
);

-- CreateTable
CREATE TABLE "scene_music_options" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "music_type" "MusicType" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "scene_music_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_template_defaults" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "coverage_id" INTEGER,
    "default_editing_style_id" INTEGER NOT NULL,
    "default_target_minutes" DECIMAL(8,2),
    "default_is_included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scene_template_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_scenes" (
    "id" SERIAL NOT NULL,
    "build_content_id" INTEGER NOT NULL,
    "coverage_id" INTEGER NOT NULL,
    "editing_style_id" INTEGER NOT NULL,
    "target_minutes" DECIMAL(8,2),
    "is_included" BOOLEAN DEFAULT true,
    "calculated_price" DECIMAL(10,2),

    CONSTRAINT "build_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_scenes" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "layer_id" INTEGER NOT NULL,
    "start_time_seconds" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "timeline_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_dependencies" (
    "id" SERIAL NOT NULL,
    "parent_scene_id" INTEGER NOT NULL,
    "dependent_scene_id" INTEGER NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'REQUIRED',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER,

    CONSTRAINT "scene_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_usage_analytics" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "used_in_content_id" INTEGER,
    "used_in_build_id" INTEGER,
    "usage_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actual_duration_seconds" INTEGER,
    "estimated_duration_seconds" INTEGER,
    "variance_percentage" DECIMAL(5,2),
    "user_id" INTEGER,

    CONSTRAINT "scene_usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "timeline_scenes_content_id_layer_id_start_time_seconds_key" ON "timeline_scenes"("content_id", "layer_id", "start_time_seconds");

-- CreateIndex
CREATE UNIQUE INDEX "scene_dependencies_parent_scene_id_dependent_scene_id_key" ON "scene_dependencies"("parent_scene_id", "dependent_scene_id");

-- AddForeignKey
ALTER TABLE "content_assigned_scenes" ADD CONSTRAINT "content_assigned_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_assigned_scenes" ADD CONSTRAINT "content_assigned_scenes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_coverage" ADD CONSTRAINT "scene_coverage_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_coverage" ADD CONSTRAINT "scene_coverage_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_music_options" ADD CONSTRAINT "scene_music_options_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_default_editing_style_id_fkey" FOREIGN KEY ("default_editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_build_content_id_fkey" FOREIGN KEY ("build_content_id") REFERENCES "build_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_editing_style_id_fkey" FOREIGN KEY ("editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_build_scene_id_fkey" FOREIGN KEY ("build_scene_id") REFERENCES "build_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "timeline_layers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_dependent_scene_id_fkey" FOREIGN KEY ("dependent_scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_parent_scene_id_fkey" FOREIGN KEY ("parent_scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_used_in_build_id_fkey" FOREIGN KEY ("used_in_build_id") REFERENCES "builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_used_in_content_id_fkey" FOREIGN KEY ("used_in_content_id") REFERENCES "content_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
