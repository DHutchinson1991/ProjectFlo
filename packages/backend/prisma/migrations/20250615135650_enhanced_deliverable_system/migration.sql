/*
  Warnings:

  - Added the required column `updated_at` to the `deliverables` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('STANDARD', 'RAW_FOOTAGE');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('COVERAGE_BASED', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "MusicType" AS ENUM ('NONE', 'SCENE_MATCHED', 'ORCHESTRAL', 'PIANO', 'MODERN', 'VINTAGE');

-- CreateEnum
CREATE TYPE "ProcessingLevel" AS ENUM ('MINIMAL', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "DeliveryFormat" AS ENUM ('MP4_H264', 'PRORES_422', 'ORIGINAL_CODEC');

-- CreateEnum
CREATE TYPE "PricingModifierType" AS ENUM ('PEAK_SEASON', 'RUSH_JOB', 'DAY_OF_WEEK', 'LOCATION', 'VOLUME_DISCOUNT');

-- AlterTable
ALTER TABLE "deliverables" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "default_music_type" "MusicType",
ADD COLUMN     "delivery_timeline" INTEGER,
ADD COLUMN     "includes_music" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "DeliverableType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0';

-- CreateTable
CREATE TABLE "video_components" (
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

    CONSTRAINT "video_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_components" (
    "deliverable_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_components_pkey" PRIMARY KEY ("deliverable_id","component_id")
);

-- CreateTable
CREATE TABLE "component_coverage_scenes" (
    "component_id" INTEGER NOT NULL,
    "coverage_scene_id" INTEGER NOT NULL,

    CONSTRAINT "component_coverage_scenes_pkey" PRIMARY KEY ("component_id","coverage_scene_id")
);

-- CreateTable
CREATE TABLE "component_music_options" (
    "id" SERIAL NOT NULL,
    "component_id" INTEGER NOT NULL,
    "music_type" "MusicType" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "component_music_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_component_tasks" (
    "id" SERIAL NOT NULL,
    "component_id" INTEGER NOT NULL,
    "task_template_name" TEXT NOT NULL,
    "hours_required" DECIMAL(4,2) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "video_component_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_music_tracks" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "music_type" "MusicType" NOT NULL,
    "track_name" TEXT,
    "artist" TEXT,
    "duration" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "deliverable_music_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_modifiers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PricingModifierType" NOT NULL,
    "multiplier" DECIMAL(4,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_versions" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "version_number" TEXT NOT NULL,
    "change_summary" TEXT NOT NULL,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "components_snapshot" JSONB NOT NULL,
    "pricing_snapshot" JSONB NOT NULL,

    CONSTRAINT "deliverable_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_change_logs" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "change_type" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverable_change_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deliverable_components" ADD CONSTRAINT "deliverable_components_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_components" ADD CONSTRAINT "deliverable_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "video_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_coverage_scenes" ADD CONSTRAINT "component_coverage_scenes_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "video_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_coverage_scenes" ADD CONSTRAINT "component_coverage_scenes_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_music_options" ADD CONSTRAINT "component_music_options_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "video_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_component_tasks" ADD CONSTRAINT "video_component_tasks_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "video_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_music_tracks" ADD CONSTRAINT "deliverable_music_tracks_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_versions" ADD CONSTRAINT "deliverable_versions_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_versions" ADD CONSTRAINT "deliverable_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_change_logs" ADD CONSTRAINT "deliverable_change_logs_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_change_logs" ADD CONSTRAINT "deliverable_change_logs_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
