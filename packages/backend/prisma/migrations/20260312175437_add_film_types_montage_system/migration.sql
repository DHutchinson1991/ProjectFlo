-- AlterTable (unique to this migration - task_library change)
ALTER TABLE "task_library" ADD COLUMN     "due_date_offset_days" INTEGER;
