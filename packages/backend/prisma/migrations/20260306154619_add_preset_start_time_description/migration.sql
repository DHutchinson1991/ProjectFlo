-- AlterTable
ALTER TABLE "event_day_activity_preset_moments" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "event_day_activity_presets" ADD COLUMN     "default_start_time" TEXT,
ADD COLUMN     "description" TEXT;
