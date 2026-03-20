-- AlterTable
ALTER TABLE "project_event_day_subjects" ADD COLUMN     "member_names" JSONB;

-- AlterTable
ALTER TABLE "subject_role_templates" ADD COLUMN     "never_group" BOOLEAN NOT NULL DEFAULT false;
