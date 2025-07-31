/*
  Warnings:

  - You are about to drop the column `audio_mics` on the `coverage` table. All the data in the column will be lost.
  - You are about to drop the column `video_cameras` on the `coverage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "coverage" DROP COLUMN "audio_mics",
DROP COLUMN "video_cameras",
ADD COLUMN     "recording_equipment" JSONB,
ALTER COLUMN "coverage_type" SET DEFAULT 'FULL_COVERAGE';
