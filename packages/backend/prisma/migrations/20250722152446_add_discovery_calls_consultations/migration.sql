-- CreateEnum
CREATE TYPE "meeting_type" AS ENUM ('ONLINE', 'PHONE_CALL', 'IN_PERSON', 'VIDEO_CALL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "calendar_event_type" ADD VALUE 'DISCOVERY_CALL';
ALTER TYPE "calendar_event_type" ADD VALUE 'CONSULTATION';

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "inquiry_id" INTEGER,
ADD COLUMN     "meeting_type" "meeting_type",
ADD COLUMN     "meeting_url" TEXT,
ADD COLUMN     "outcome_notes" TEXT;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
