-- AlterTable
ALTER TABLE "coverage" ADD COLUMN     "audio_mics" INTEGER DEFAULT 1,
ADD COLUMN     "coverage_type" TEXT DEFAULT 'STANDARD',
ADD COLUMN     "video_cameras" INTEGER DEFAULT 1;
