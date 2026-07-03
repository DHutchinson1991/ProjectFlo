-- ============================================================================
-- Unify "Inquiry Wizard" (formerly "Needs Assessment") and
-- "Discovery Questionnaire" into a single system with a `stage` discriminator.
--
--   1. Rename needs_assessment_* tables/indexes/constraints/sequences to
--      inquiry_wizard_* (this drops the need for the Prisma @@map
--      indirection that has existed since the needs-assessment -> inquiry
--      wizard code rename).
--   2. Add the columns needed for inquiry_wizard_* to also represent
--      discovery-call submissions: `stage` on templates, `section` /
--      `script_hint` / `visibility` on questions, `call_notes` /
--      `transcript` / `sentiment` / `call_duration_seconds` on submissions.
--   3. Copy every discovery_questionnaire_* row into the renamed tables as
--      stage = 'DISCOVERY_CALL' rows, preserving brand/inquiry linkage.
--   4. Rename (not drop) the old discovery_questionnaire_* tables to
--      `_deprecated_discovery_questionnaire_*` so this migration is easy to
--      verify and roll back. A follow-up migration should DROP them once
--      the merge has been verified in production.
-- ============================================================================

-- ─── Step 1: rename needs_assessment_* -> inquiry_wizard_* ─────────────────

ALTER TABLE "needs_assessment_templates" RENAME TO "inquiry_wizard_templates";
ALTER TABLE "needs_assessment_questions" RENAME TO "inquiry_wizard_questions";
ALTER TABLE "needs_assessment_submissions" RENAME TO "inquiry_wizard_submissions";

ALTER TABLE "inquiry_wizard_templates" RENAME CONSTRAINT "needs_assessment_templates_pkey" TO "inquiry_wizard_templates_pkey";
ALTER TABLE "inquiry_wizard_questions" RENAME CONSTRAINT "needs_assessment_questions_pkey" TO "inquiry_wizard_questions_pkey";
ALTER TABLE "inquiry_wizard_submissions" RENAME CONSTRAINT "needs_assessment_submissions_pkey" TO "inquiry_wizard_submissions_pkey";

ALTER TABLE "inquiry_wizard_templates" RENAME CONSTRAINT "needs_assessment_templates_brand_id_fkey" TO "inquiry_wizard_templates_brand_id_fkey";
ALTER TABLE "inquiry_wizard_questions" RENAME CONSTRAINT "needs_assessment_questions_template_id_fkey" TO "inquiry_wizard_questions_template_id_fkey";
ALTER TABLE "inquiry_wizard_submissions" RENAME CONSTRAINT "needs_assessment_submissions_template_id_fkey" TO "inquiry_wizard_submissions_template_id_fkey";
ALTER TABLE "inquiry_wizard_submissions" RENAME CONSTRAINT "needs_assessment_submissions_brand_id_fkey" TO "inquiry_wizard_submissions_brand_id_fkey";
ALTER TABLE "inquiry_wizard_submissions" RENAME CONSTRAINT "needs_assessment_submissions_inquiry_id_fkey" TO "inquiry_wizard_submissions_inquiry_id_fkey";
ALTER TABLE "inquiry_wizard_submissions" RENAME CONSTRAINT "needs_assessment_submissions_contact_id_fkey" TO "inquiry_wizard_submissions_contact_id_fkey";

ALTER INDEX "needs_assessment_templates_share_token_key" RENAME TO "inquiry_wizard_templates_share_token_key";
ALTER INDEX "needs_assessment_templates_brand_id_idx" RENAME TO "inquiry_wizard_templates_brand_id_idx";
ALTER INDEX "needs_assessment_questions_template_id_idx" RENAME TO "inquiry_wizard_questions_template_id_idx";
ALTER INDEX "needs_assessment_submissions_brand_id_idx" RENAME TO "inquiry_wizard_submissions_brand_id_idx";
ALTER INDEX "needs_assessment_submissions_inquiry_id_idx" RENAME TO "inquiry_wizard_submissions_inquiry_id_idx";

ALTER SEQUENCE "needs_assessment_templates_id_seq" RENAME TO "inquiry_wizard_templates_id_seq";
ALTER SEQUENCE "needs_assessment_questions_id_seq" RENAME TO "inquiry_wizard_questions_id_seq";
ALTER SEQUENCE "needs_assessment_submissions_id_seq" RENAME TO "inquiry_wizard_submissions_id_seq";

-- ─── Step 2: add the stage discriminator + discovery-call columns ─────────

CREATE TYPE "InquiryWizardStage" AS ENUM ('INTAKE', 'DISCOVERY_CALL');

ALTER TABLE "inquiry_wizard_templates" ADD COLUMN "stage" "InquiryWizardStage" NOT NULL DEFAULT 'INTAKE';

ALTER TABLE "inquiry_wizard_questions" ADD COLUMN "section" TEXT;
ALTER TABLE "inquiry_wizard_questions" ADD COLUMN "script_hint" TEXT;
ALTER TABLE "inquiry_wizard_questions" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'both';

ALTER TABLE "inquiry_wizard_submissions" ADD COLUMN "call_notes" TEXT;
ALTER TABLE "inquiry_wizard_submissions" ADD COLUMN "transcript" TEXT;
ALTER TABLE "inquiry_wizard_submissions" ADD COLUMN "sentiment" JSONB;
ALTER TABLE "inquiry_wizard_submissions" ADD COLUMN "call_duration_seconds" INTEGER;

-- ─── Step 3: copy discovery_questionnaire_* rows in as DISCOVERY_CALL rows ─
--
-- A temporary bridging column carries the legacy discovery template id so
-- the questions/submissions inserts below can resolve the new template_id
-- via an explicit join, instead of relying on row-insertion order.

ALTER TABLE "inquiry_wizard_templates" ADD COLUMN "_migrated_from_discovery_template_id" INTEGER;

INSERT INTO "inquiry_wizard_templates" (
    "brand_id", "name", "description", "is_active", "status", "version", "stage",
    "created_at", "updated_at", "_migrated_from_discovery_template_id"
)
SELECT
    "brand_id", "name", "description", "is_active", 'live', '1.0', 'DISCOVERY_CALL',
    "created_at", "updated_at", "id"
FROM "discovery_questionnaire_templates";

INSERT INTO "inquiry_wizard_questions" (
    "template_id", "order_index", "section", "prompt", "script_hint", "field_type",
    "field_key", "required", "options", "visibility", "created_at", "updated_at"
)
SELECT
    iwt."id", dq."order_index", dq."section", dq."prompt", dq."script_hint", dq."field_type",
    dq."field_key", dq."required", dq."options", dq."visibility", dq."created_at", dq."updated_at"
FROM "discovery_questionnaire_questions" dq
JOIN "inquiry_wizard_templates" iwt ON iwt."_migrated_from_discovery_template_id" = dq."template_id";

INSERT INTO "inquiry_wizard_submissions" (
    "template_id", "brand_id", "inquiry_id", "status", "responses", "call_notes",
    "transcript", "sentiment", "call_duration_seconds", "submitted_at", "created_at", "updated_at"
)
SELECT
    iwt."id", ds."brand_id", ds."inquiry_id", 'submitted', ds."responses", ds."call_notes",
    ds."transcript", ds."sentiment", ds."call_duration_seconds", ds."submitted_at", ds."created_at", ds."updated_at"
FROM "discovery_questionnaire_submissions" ds
JOIN "inquiry_wizard_templates" iwt ON iwt."_migrated_from_discovery_template_id" = ds."template_id";

ALTER TABLE "inquiry_wizard_templates" DROP COLUMN "_migrated_from_discovery_template_id";

-- ─── Step 4: rename the old discovery_questionnaire_* tables (kept for
--     rollback/verification; drop in a follow-up migration once verified) ─

ALTER TABLE "discovery_questionnaire_templates" RENAME TO "_deprecated_discovery_questionnaire_templates";
ALTER TABLE "discovery_questionnaire_questions" RENAME TO "_deprecated_discovery_questionnaire_questions";
ALTER TABLE "discovery_questionnaire_submissions" RENAME TO "_deprecated_discovery_questionnaire_submissions";
