/*
  Warnings:

  - The values [CONTENT_OVERRIDE] on the enum `PricingModifierType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `build_content_id` on the `build_scenes` table. All the data in the column will be lost.
  - You are about to drop the column `content_id` on the `scene_template_defaults` table. All the data in the column will be lost.
  - You are about to drop the column `used_in_content_id` on the `scene_usage_analytics` table. All the data in the column will be lost.
  - You are about to drop the column `media_type` on the `task_generation_rules` table. All the data in the column will be lost.
  - You are about to drop the column `content_id` on the `timeline_change_log` table. All the data in the column will be lost.
  - You are about to drop the column `content_id` on the `timeline_editing_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `content_id` on the `timeline_scenes` table. All the data in the column will be lost.
  - You are about to drop the `build_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_assigned_scenes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_change_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_library` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_music_tracks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_versions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scenes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[film_id,user_id,session_start]` on the table `timeline_editing_sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[film_id,layer_id,start_time_seconds]` on the table `timeline_scenes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `build_film_id` to the `build_scenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `film_id` to the `scene_template_defaults` table without a default value. This is not possible if the table is not empty.
  - Added the required column `film_id` to the `timeline_change_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `film_id` to the `timeline_editing_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `film_id` to the `timeline_scenes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FilmType" AS ENUM ('STANDARD', 'RAW_FOOTAGE');

-- AlterEnum
BEGIN;
CREATE TYPE "PricingModifierType_new" AS ENUM ('PEAK_SEASON', 'RUSH_JOB', 'DAY_OF_WEEK', 'LOCATION', 'VOLUME_DISCOUNT', 'TIMELINE_COMPLEXITY', 'COVERAGE_COMPLEXITY', 'SCENE_DEPENDENCY', 'FILM_OVERRIDE');
ALTER TABLE "pricing_modifiers" ALTER COLUMN "type" TYPE "PricingModifierType_new" USING ("type"::text::"PricingModifierType_new");
ALTER TYPE "PricingModifierType" RENAME TO "PricingModifierType_old";
ALTER TYPE "PricingModifierType_new" RENAME TO "PricingModifierType";
DROP TYPE "PricingModifierType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "build_content" DROP CONSTRAINT "build_content_build_id_fkey";

-- DropForeignKey
ALTER TABLE "build_content" DROP CONSTRAINT "build_content_content_id_fkey";

-- DropForeignKey
ALTER TABLE "build_scenes" DROP CONSTRAINT "build_scenes_build_content_id_fkey";

-- DropForeignKey
ALTER TABLE "content_assigned_scenes" DROP CONSTRAINT "content_assigned_scenes_content_id_fkey";

-- DropForeignKey
ALTER TABLE "content_assigned_scenes" DROP CONSTRAINT "content_assigned_scenes_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "content_change_logs" DROP CONSTRAINT "content_change_logs_changed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "content_change_logs" DROP CONSTRAINT "content_change_logs_content_id_fkey";

-- DropForeignKey
ALTER TABLE "content_library" DROP CONSTRAINT "content_library_workflow_template_id_fkey";

-- DropForeignKey
ALTER TABLE "content_music_tracks" DROP CONSTRAINT "content_music_tracks_content_id_fkey";

-- DropForeignKey
ALTER TABLE "content_versions" DROP CONSTRAINT "content_versions_changed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "content_versions" DROP CONSTRAINT "content_versions_content_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_coverage" DROP CONSTRAINT "scene_coverage_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_dependencies" DROP CONSTRAINT "scene_dependencies_dependent_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_dependencies" DROP CONSTRAINT "scene_dependencies_parent_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_music_options" DROP CONSTRAINT "scene_music_options_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_template_defaults" DROP CONSTRAINT "scene_template_defaults_content_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_usage_analytics" DROP CONSTRAINT "scene_usage_analytics_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "scene_usage_analytics" DROP CONSTRAINT "scene_usage_analytics_used_in_content_id_fkey";

-- DropForeignKey
ALTER TABLE "scenes" DROP CONSTRAINT "scenes_workflow_template_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_change_log" DROP CONSTRAINT "timeline_change_log_content_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_change_log" DROP CONSTRAINT "timeline_change_log_scene_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_editing_sessions" DROP CONSTRAINT "timeline_editing_sessions_content_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_scenes" DROP CONSTRAINT "timeline_scenes_content_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_scenes" DROP CONSTRAINT "timeline_scenes_scene_id_fkey";

-- DropIndex
DROP INDEX "timeline_editing_sessions_content_id_user_id_session_start_key";

-- DropIndex
DROP INDEX "timeline_scenes_content_id_layer_id_start_time_seconds_key";

-- AlterTable
ALTER TABLE "build_scenes" DROP COLUMN "build_content_id",
ADD COLUMN     "build_film_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "scene_template_defaults" DROP COLUMN "content_id",
ADD COLUMN     "film_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "scene_usage_analytics" DROP COLUMN "used_in_content_id",
ADD COLUMN     "used_in_film_id" INTEGER;

-- AlterTable
ALTER TABLE "task_generation_rules" DROP COLUMN "media_type",
ADD COLUMN     "scene_type" "MediaType";

-- AlterTable
ALTER TABLE "timeline_change_log" DROP COLUMN "content_id",
ADD COLUMN     "film_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "timeline_editing_sessions" DROP COLUMN "content_id",
ADD COLUMN     "film_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "timeline_scenes" DROP COLUMN "content_id",
ADD COLUMN     "film_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "build_content";

-- DropTable
DROP TABLE "content_assigned_scenes";

-- DropTable
DROP TABLE "content_categories";

-- DropTable
DROP TABLE "content_change_logs";

-- DropTable
DROP TABLE "content_library";

-- DropTable
DROP TABLE "content_music_tracks";

-- DropTable
DROP TABLE "content_versions";

-- DropTable
DROP TABLE "scenes";

-- DropEnum
DROP TYPE "ContentType";

-- CreateTable
CREATE TABLE "film_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflow_template_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default_music_type" "MusicType",
    "delivery_timeline" INTEGER,
    "includes_music" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "type" "FilmType" NOT NULL DEFAULT 'STANDARD',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "film_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MediaType" NOT NULL,
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

    CONSTRAINT "scenes_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_assigned_scenes" (
    "film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_assigned_scenes_pkey" PRIMARY KEY ("film_id","scene_id")
);

-- CreateTable
CREATE TABLE "film_music_tracks" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "music_type" "MusicType" NOT NULL,
    "track_name" TEXT,
    "artist" TEXT,
    "duration" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "film_music_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_versions" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "version_number" TEXT NOT NULL,
    "change_summary" TEXT NOT NULL,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenes_snapshot" JSONB NOT NULL,
    "pricing_snapshot" JSONB NOT NULL,

    CONSTRAINT "film_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_change_logs" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "change_type" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "film_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_films" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,

    CONSTRAINT "build_films_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "film_categories_name_key" ON "film_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "film_categories_code_key" ON "film_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "film_library_name_key" ON "film_library"("name");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_editing_sessions_film_id_user_id_session_start_key" ON "timeline_editing_sessions"("film_id", "user_id", "session_start");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_scenes_film_id_layer_id_start_time_seconds_key" ON "timeline_scenes"("film_id", "layer_id", "start_time_seconds");

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes_library" ADD CONSTRAINT "scenes_library_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_assigned_scenes" ADD CONSTRAINT "film_assigned_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_assigned_scenes" ADD CONSTRAINT "film_assigned_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_coverage" ADD CONSTRAINT "scene_coverage_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_music_options" ADD CONSTRAINT "scene_music_options_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_music_tracks" ADD CONSTRAINT "film_music_tracks_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_versions" ADD CONSTRAINT "film_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_versions" ADD CONSTRAINT "film_versions_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_change_logs" ADD CONSTRAINT "film_change_logs_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_change_logs" ADD CONSTRAINT "film_change_logs_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_films" ADD CONSTRAINT "build_films_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_films" ADD CONSTRAINT "build_films_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_build_film_id_fkey" FOREIGN KEY ("build_film_id") REFERENCES "build_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_dependent_scene_id_fkey" FOREIGN KEY ("dependent_scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_parent_scene_id_fkey" FOREIGN KEY ("parent_scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_used_in_film_id_fkey" FOREIGN KEY ("used_in_film_id") REFERENCES "film_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
