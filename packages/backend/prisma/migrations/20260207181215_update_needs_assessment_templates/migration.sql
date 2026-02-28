-- AlterTable
ALTER TABLE "needs_assessment_questions" ADD COLUMN     "condition_json" JSONB;

-- AlterTable
ALTER TABLE "needs_assessment_templates" ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0';
