-- AlterEnum
ALTER TYPE "calendar_event_type" ADD VALUE 'WEDDING_DAY';

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "welcome_sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "needs_assessment_submissions" ADD COLUMN     "review_checklist_state" JSONB,
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3);
