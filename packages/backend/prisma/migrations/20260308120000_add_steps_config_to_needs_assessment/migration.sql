-- Add steps_config JSONB column to needs_assessment_templates
ALTER TABLE "needs_assessment_templates" ADD COLUMN "steps_config" JSONB;
