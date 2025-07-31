-- CreateEnum
CREATE TYPE "SubjectPriority" AS ENUM ('PRIMARY', 'SECONDARY', 'BACKGROUND');

-- CreateTable
CREATE TABLE "subjects_library" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "context_role" TEXT NOT NULL,
    "hair_color" TEXT,
    "hair_style" TEXT,
    "skin_tone" TEXT,
    "height" TEXT,
    "eye_color" TEXT,
    "appearance_notes" TEXT,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_subjects" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "priority" "SubjectPriority" NOT NULL DEFAULT 'SECONDARY',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_moment_music" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "music_name" TEXT,
    "artist" TEXT,
    "duration" INTEGER,
    "music_type" "MusicType" NOT NULL DEFAULT 'NONE',
    "file_path" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_moment_music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_library" (
    "id" SERIAL NOT NULL,
    "music_name" TEXT,
    "artist" TEXT,
    "duration" INTEGER,
    "music_type" "MusicType" NOT NULL DEFAULT 'MODERN',
    "file_path" TEXT,
    "notes" TEXT,
    "project_id" INTEGER,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "assignment_number" TEXT,

    CONSTRAINT "music_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_library_brand_id_idx" ON "subjects_library"("brand_id");

-- CreateIndex
CREATE INDEX "subjects_library_context_role_idx" ON "subjects_library"("context_role");

-- CreateIndex
CREATE INDEX "scene_subjects_scene_id_idx" ON "scene_subjects"("scene_id");

-- CreateIndex
CREATE INDEX "scene_subjects_subject_id_idx" ON "scene_subjects"("subject_id");

-- CreateIndex
CREATE INDEX "scene_subjects_priority_idx" ON "scene_subjects"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "scene_subjects_scene_id_subject_id_key" ON "scene_subjects"("scene_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_moment_music_moment_id_key" ON "scene_moment_music"("moment_id");

-- AddForeignKey
ALTER TABLE "subjects_library" ADD CONSTRAINT "subjects_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_subjects" ADD CONSTRAINT "scene_subjects_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_subjects" ADD CONSTRAINT "scene_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_moment_music" ADD CONSTRAINT "scene_moment_music_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_library" ADD CONSTRAINT "music_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_library" ADD CONSTRAINT "music_library_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
