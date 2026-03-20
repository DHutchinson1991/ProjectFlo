-- AlterTable
ALTER TABLE "discovery_questionnaire_questions" ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'both';

-- AlterTable
ALTER TABLE "discovery_questionnaire_submissions" ADD COLUMN     "sentiment" JSONB;
