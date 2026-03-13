/*
  Warnings:

  - The values [STANDARD] on the enum `FilmType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AudioSourceType" AS ENUM ('MOMENT', 'BEAT', 'SCENE', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "AudioTrackType" AS ENUM ('SPEECH', 'AMBIENT', 'MUSIC');

-- AlterEnum
BEGIN;
CREATE TYPE "FilmType_new" AS ENUM ('ACTIVITY', 'FEATURE', 'MONTAGE', 'RAW_FOOTAGE');
ALTER TABLE "film_library" ALTER COLUMN "type" DROP DEFAULT;
-- Convert STANDARD -> FEATURE during type cast
ALTER TABLE "film_library" ALTER COLUMN "type" TYPE "FilmType_new" USING (CASE WHEN "type"::text = 'STANDARD' THEN 'FEATURE'::"FilmType_new" ELSE "type"::text::"FilmType_new" END);
ALTER TYPE "FilmType" RENAME TO "FilmType_old";
ALTER TYPE "FilmType_new" RENAME TO "FilmType";
DROP TYPE "FilmType_old";
ALTER TABLE "film_library" ALTER COLUMN "type" SET DEFAULT 'FEATURE';
COMMIT;

-- AlterTable
ALTER TABLE "film_library" ALTER COLUMN "type" SET DEFAULT 'FEATURE';

-- AlterTable
ALTER TABLE "film_scene_beats" ADD COLUMN     "source_activity_id" INTEGER,
ADD COLUMN     "source_moment_id" INTEGER,
ADD COLUMN     "source_scene_id" INTEGER;

-- AlterTable
ALTER TABLE "films" ADD COLUMN     "film_type" "FilmType" NOT NULL DEFAULT 'FEATURE',
ADD COLUMN     "montage_preset_id" INTEGER,
ADD COLUMN     "target_duration_max" INTEGER,
ADD COLUMN     "target_duration_min" INTEGER;

-- CreateTable
CREATE TABLE "montage_presets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "min_duration_seconds" INTEGER NOT NULL,
    "max_duration_seconds" INTEGER NOT NULL,
    "is_system_seeded" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "montage_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_structure_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "film_type" "FilmType" NOT NULL DEFAULT 'MONTAGE',
    "is_system_seeded" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_structure_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_structure_template_scenes" (
    "id" SERIAL NOT NULL,
    "film_structure_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "SceneType" NOT NULL DEFAULT 'MONTAGE',
    "suggested_duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_structure_template_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_audio_sources" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "source_type" "AudioSourceType" NOT NULL,
    "source_activity_id" INTEGER,
    "source_moment_id" INTEGER,
    "source_scene_id" INTEGER,
    "track_type" "AudioTrackType" NOT NULL DEFAULT 'SPEECH',
    "start_offset_seconds" INTEGER,
    "duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_audio_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "montage_presets_brand_id_idx" ON "montage_presets"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "montage_presets_brand_id_name_key" ON "montage_presets"("brand_id", "name");

-- CreateIndex
CREATE INDEX "film_structure_templates_brand_id_idx" ON "film_structure_templates"("brand_id");

-- CreateIndex
CREATE INDEX "film_structure_templates_film_type_idx" ON "film_structure_templates"("film_type");

-- CreateIndex
CREATE UNIQUE INDEX "film_structure_templates_brand_id_name_key" ON "film_structure_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "film_structure_template_scenes_film_structure_template_id_idx" ON "film_structure_template_scenes"("film_structure_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_structure_template_scenes_film_structure_template_id_o_key" ON "film_structure_template_scenes"("film_structure_template_id", "order_index");

-- CreateIndex
CREATE INDEX "scene_audio_sources_scene_id_idx" ON "scene_audio_sources"("scene_id");

-- CreateIndex
CREATE INDEX "scene_audio_sources_source_activity_id_idx" ON "scene_audio_sources"("source_activity_id");

-- CreateIndex
CREATE INDEX "scene_audio_sources_source_moment_id_idx" ON "scene_audio_sources"("source_moment_id");

-- CreateIndex
CREATE INDEX "scene_audio_sources_source_scene_id_idx" ON "scene_audio_sources"("source_scene_id");

-- CreateIndex
CREATE INDEX "film_scene_beats_source_activity_id_idx" ON "film_scene_beats"("source_activity_id");

-- CreateIndex
CREATE INDEX "film_scene_beats_source_moment_id_idx" ON "film_scene_beats"("source_moment_id");

-- CreateIndex
CREATE INDEX "film_scene_beats_source_scene_id_idx" ON "film_scene_beats"("source_scene_id");

-- CreateIndex
CREATE INDEX "films_montage_preset_id_idx" ON "films"("montage_preset_id");

-- AddForeignKey
ALTER TABLE "films" ADD CONSTRAINT "films_montage_preset_id_fkey" FOREIGN KEY ("montage_preset_id") REFERENCES "montage_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_source_activity_id_fkey" FOREIGN KEY ("source_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_source_moment_id_fkey" FOREIGN KEY ("source_moment_id") REFERENCES "package_activity_moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_source_scene_id_fkey" FOREIGN KEY ("source_scene_id") REFERENCES "film_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montage_presets" ADD CONSTRAINT "montage_presets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_structure_templates" ADD CONSTRAINT "film_structure_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_structure_template_scenes" ADD CONSTRAINT "film_structure_template_scenes_film_structure_template_id_fkey" FOREIGN KEY ("film_structure_template_id") REFERENCES "film_structure_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_source_activity_id_fkey" FOREIGN KEY ("source_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_source_moment_id_fkey" FOREIGN KEY ("source_moment_id") REFERENCES "package_activity_moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_source_scene_id_fkey" FOREIGN KEY ("source_scene_id") REFERENCES "film_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
