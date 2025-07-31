/*
  Warnings:

  - The `coverage_type` column on the `coverage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "ShotType" AS ENUM ('ESTABLISHING_SHOT', 'WIDE_SHOT', 'MEDIUM_SHOT', 'TWO_SHOT', 'CLOSE_UP', 'EXTREME_CLOSE_UP', 'DETAIL_SHOT', 'REACTION_SHOT', 'OVER_SHOULDER', 'CUTAWAY', 'INSERT_SHOT');

-- CreateEnum
CREATE TYPE "CameraMovement" AS ENUM ('STATIC', 'PAN', 'TRACKING', 'GIMBAL_STABILIZED', 'HANDHELD');

-- CreateEnum
CREATE TYPE "AudioEquipment" AS ENUM ('LAPEL_MIC', 'WIRELESS_MIC', 'AMBIENT_MIC', 'RECORDER', 'BOOM_MIC', 'MIXING_BOARD');

-- AlterTable
ALTER TABLE "coverage" ADD COLUMN     "aperture" TEXT,
ADD COLUMN     "audio_equipment" "AudioEquipment",
ADD COLUMN     "camera_movement" "CameraMovement",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lens_focal_length" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "shot_type" "ShotType",
ADD COLUMN     "subject" TEXT,
DROP COLUMN "coverage_type",
ADD COLUMN     "coverage_type" "CoverageType";

-- AlterTable
ALTER TABLE "scene_coverage" ADD COLUMN     "priority_order" INTEGER NOT NULL DEFAULT 1;
