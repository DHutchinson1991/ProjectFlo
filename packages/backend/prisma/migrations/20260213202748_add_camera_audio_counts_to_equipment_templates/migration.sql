-- AlterTable
ALTER TABLE "equipment_templates" ADD COLUMN     "audio_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "camera_count" INTEGER NOT NULL DEFAULT 1;
