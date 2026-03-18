-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('VIDEO', 'AUDIO', 'GRAPHICS', 'MUSIC');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('PEOPLE', 'OBJECTS', 'LOCATIONS');

-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('CEREMONY', 'RECEPTION', 'GETTING_READY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MusicType" ADD VALUE 'CLASSICAL';
ALTER TYPE "MusicType" ADD VALUE 'JAZZ';
ALTER TYPE "MusicType" ADD VALUE 'ACOUSTIC';
ALTER TYPE "MusicType" ADD VALUE 'ELECTRONIC';
ALTER TYPE "MusicType" ADD VALUE 'CUSTOM';

-- CreateTable
CREATE TABLE "films" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_timeline_tracks_v2" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TrackType" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_timeline_tracks_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_subjects" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SceneType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_template_suggested_subjects" (
    "id" SERIAL NOT NULL,
    "scene_template_id" INTEGER NOT NULL,
    "subject_template_id" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scene_template_suggested_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_moment_templates" (
    "id" SERIAL NOT NULL,
    "scene_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "estimated_duration" INTEGER DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_moment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scenes" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "scene_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_moments" (
    "id" SERIAL NOT NULL,
    "film_scene_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_recording_setups" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_subject_assignments" (
    "id" SERIAL NOT NULL,
    "recording_setup_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "subject_ids" INTEGER[],

    CONSTRAINT "camera_subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_music" (
    "id" SERIAL NOT NULL,
    "film_scene_id" INTEGER NOT NULL,
    "music_name" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER,
    "music_type" "MusicType" NOT NULL DEFAULT 'MODERN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_music" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "music_name" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER,
    "music_type" "MusicType" NOT NULL DEFAULT 'MODERN',
    "overrides_scene_music" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_music_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "films_brand_id_idx" ON "films"("brand_id");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_film_id_idx" ON "film_timeline_tracks_v2"("film_id");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_type_idx" ON "film_timeline_tracks_v2"("type");

-- CreateIndex
CREATE UNIQUE INDEX "film_timeline_tracks_v2_film_id_name_key" ON "film_timeline_tracks_v2"("film_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_templates_name_key" ON "subject_templates"("name");

-- CreateIndex
CREATE INDEX "film_subjects_film_id_idx" ON "film_subjects"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_subjects_film_id_name_key" ON "film_subjects"("film_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "scene_templates_name_key" ON "scene_templates"("name");

-- CreateIndex
CREATE INDEX "scene_template_suggested_subjects_scene_template_id_idx" ON "scene_template_suggested_subjects"("scene_template_id");

-- CreateIndex
CREATE INDEX "scene_template_suggested_subjects_subject_template_id_idx" ON "scene_template_suggested_subjects"("subject_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_template_suggested_subjects_scene_template_id_subject_key" ON "scene_template_suggested_subjects"("scene_template_id", "subject_template_id");

-- CreateIndex
CREATE INDEX "scene_moment_templates_scene_template_id_idx" ON "scene_moment_templates"("scene_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_moment_templates_scene_template_id_order_index_key" ON "scene_moment_templates"("scene_template_id", "order_index");

-- CreateIndex
CREATE INDEX "film_scenes_film_id_idx" ON "film_scenes"("film_id");

-- CreateIndex
CREATE INDEX "film_scenes_scene_template_id_idx" ON "film_scenes"("scene_template_id");

-- CreateIndex
CREATE INDEX "film_scene_moments_film_scene_id_idx" ON "film_scene_moments"("film_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_moments_film_scene_id_order_index_key" ON "film_scene_moments"("film_scene_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "moment_recording_setups_moment_id_key" ON "moment_recording_setups"("moment_id");

-- CreateIndex
CREATE INDEX "camera_subject_assignments_recording_setup_id_idx" ON "camera_subject_assignments"("recording_setup_id");

-- CreateIndex
CREATE INDEX "camera_subject_assignments_track_id_idx" ON "camera_subject_assignments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "camera_subject_assignments_recording_setup_id_track_id_key" ON "camera_subject_assignments"("recording_setup_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_music_film_scene_id_key" ON "scene_music"("film_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "moment_music_moment_id_key" ON "moment_music"("moment_id");

-- AddForeignKey
ALTER TABLE "films" ADD CONSTRAINT "films_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_timeline_tracks_v2" ADD CONSTRAINT "film_timeline_tracks_v2_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_subjects" ADD CONSTRAINT "film_subjects_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_suggested_subjects" ADD CONSTRAINT "scene_template_suggested_subjects_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_suggested_subjects" ADD CONSTRAINT "scene_template_suggested_subjects_subject_template_id_fkey" FOREIGN KEY ("subject_template_id") REFERENCES "subject_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_moment_templates" ADD CONSTRAINT "scene_moment_templates_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scenes" ADD CONSTRAINT "film_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scenes" ADD CONSTRAINT "film_scenes_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_moments" ADD CONSTRAINT "film_scene_moments_film_scene_id_fkey" FOREIGN KEY ("film_scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_recording_setups" ADD CONSTRAINT "moment_recording_setups_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_subject_assignments" ADD CONSTRAINT "camera_subject_assignments_recording_setup_id_fkey" FOREIGN KEY ("recording_setup_id") REFERENCES "moment_recording_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_subject_assignments" ADD CONSTRAINT "camera_subject_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "film_timeline_tracks_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_music" ADD CONSTRAINT "scene_music_film_scene_id_fkey" FOREIGN KEY ("film_scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_music" ADD CONSTRAINT "moment_music_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
