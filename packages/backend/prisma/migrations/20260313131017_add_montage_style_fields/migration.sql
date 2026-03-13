-- CreateEnum
CREATE TYPE "MontageStyle" AS ENUM ('RHYTHMIC', 'IMPRESSIONISTIC', 'SEQUENTIAL', 'PARALLEL', 'HIGHLIGHTS', 'NARRATIVE_ARC');

-- AlterTable
ALTER TABLE "film_scenes" ADD COLUMN     "montage_bpm" INTEGER,
ADD COLUMN     "montage_style" "MontageStyle";

-- AlterTable
ALTER TABLE "film_scene_moments" ADD COLUMN     "source_activity_id" INTEGER;
