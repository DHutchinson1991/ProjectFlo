-- CreateEnum
CREATE TYPE "due_date_offset_reference" AS ENUM ('inquiry_created', 'booking_date', 'event_date', 'delivery_date');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "delivery_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "task_library" ADD COLUMN     "due_date_offset_reference" "due_date_offset_reference";
