-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "cancellation_tier1_days" INTEGER DEFAULT 90,
ADD COLUMN     "cancellation_tier1_percent" DECIMAL(5,2) DEFAULT 50,
ADD COLUMN     "cancellation_tier2_days" INTEGER DEFAULT 30,
ADD COLUMN     "late_fee_percent" DECIMAL(5,2) DEFAULT 2;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "rendered_html" TEXT,
ADD COLUMN     "signing_token" TEXT,
ADD COLUMN     "template_id" INTEGER;

-- AlterTable
ALTER TABLE "contributors" ADD COLUMN     "default_camera_id" INTEGER;

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "event_type_id" INTEGER,
ADD COLUMN     "guest_count" TEXT,
ADD COLUMN     "portal_token" TEXT,
ADD COLUMN     "venue_source" TEXT,
ADD COLUMN     "venue_updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "inquiry_tasks" ADD COLUMN     "assigned_to_id" INTEGER,
ADD COLUMN     "is_stage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "job_role_id" INTEGER,
ADD COLUMN     "parent_inquiry_task_id" INTEGER,
ADD COLUMN     "stage_color" TEXT;

-- AlterTable
ALTER TABLE "needs_assessment_templates" ADD COLUMN     "share_token" TEXT;

-- AlterTable
ALTER TABLE "package_event_day_subjects" ADD COLUMN     "count" INTEGER;

-- AlterTable
ALTER TABLE "project_event_day_subjects" ADD COLUMN     "count" INTEGER;

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "client_response" TEXT,
ADD COLUMN     "client_response_at" TIMESTAMP(3),
ADD COLUMN     "client_response_message" TEXT,
ADD COLUMN     "share_token" TEXT;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "schedule_template_id" INTEGER,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "task_library" ADD COLUMN     "default_contributor_id" INTEGER,
ADD COLUMN     "is_auto_only" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_stage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_task_id" INTEGER,
ADD COLUMN     "stage_color" TEXT;

-- CreateTable
CREATE TABLE "contract_clause_categories" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "country_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_clause_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_clauses" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clause_type" TEXT NOT NULL DEFAULT 'STANDARD',
    "country_code" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signers" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signed_at" TIMESTAMP(3),
    "signature_text" TEXT,
    "signer_ip" TEXT,
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_template_clauses" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "clause_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "override_body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_template_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "payment_schedule_template_id" INTEGER,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_questionnaire_questions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "section" TEXT,
    "prompt" TEXT NOT NULL,
    "script_hint" TEXT,
    "field_type" TEXT NOT NULL,
    "field_key" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_questionnaire_submissions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "inquiry_id" INTEGER,
    "responses" JSONB NOT NULL,
    "call_notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_questionnaire_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_questionnaire_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_questionnaire_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_requests" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "selected_package_id" INTEGER,
    "customisations" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_payment_milestones" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_payment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_clause_categories_brand_id_country_code_idx" ON "contract_clause_categories"("brand_id" ASC, "country_code" ASC);

-- CreateIndex
CREATE INDEX "contract_clause_categories_brand_id_idx" ON "contract_clause_categories"("brand_id" ASC);

-- CreateIndex
CREATE INDEX "contract_clauses_brand_id_clause_type_idx" ON "contract_clauses"("brand_id" ASC, "clause_type" ASC);

-- CreateIndex
CREATE INDEX "contract_clauses_brand_id_idx" ON "contract_clauses"("brand_id" ASC);

-- CreateIndex
CREATE INDEX "contract_clauses_category_id_idx" ON "contract_clauses"("category_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contract_signers_token_key" ON "contract_signers"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contract_template_clauses_template_id_clause_id_key" ON "contract_template_clauses"("template_id" ASC, "clause_id" ASC);

-- CreateIndex
CREATE INDEX "tmpl_clauses_clause_id_idx" ON "contract_template_clauses"("clause_id" ASC);

-- CreateIndex
CREATE INDEX "tmpl_clauses_template_id_idx" ON "contract_template_clauses"("template_id" ASC);

-- CreateIndex
CREATE INDEX "contract_templates_brand_id_idx" ON "contract_templates"("brand_id" ASC);

-- CreateIndex
CREATE INDEX "discovery_questionnaire_questions_template_id_idx" ON "discovery_questionnaire_questions"("template_id" ASC);

-- CreateIndex
CREATE INDEX "discovery_questionnaire_submissions_brand_id_idx" ON "discovery_questionnaire_submissions"("brand_id" ASC);

-- CreateIndex
CREATE INDEX "discovery_questionnaire_submissions_inquiry_id_idx" ON "discovery_questionnaire_submissions"("inquiry_id" ASC);

-- CreateIndex
CREATE INDEX "discovery_questionnaire_templates_brand_id_idx" ON "discovery_questionnaire_templates"("brand_id" ASC);

-- CreateIndex
CREATE INDEX "package_requests_inquiry_id_idx" ON "package_requests"("inquiry_id" ASC);

-- CreateIndex
CREATE INDEX "quote_payment_milestones_quote_id_idx" ON "quote_payment_milestones"("quote_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_signing_token_key" ON "contracts"("signing_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_portal_token_key" ON "inquiries"("portal_token" ASC);

-- CreateIndex
CREATE INDEX "inquiry_tasks_assigned_to_id_idx" ON "inquiry_tasks"("assigned_to_id" ASC);

-- CreateIndex
CREATE INDEX "inquiry_tasks_job_role_id_idx" ON "inquiry_tasks"("job_role_id" ASC);

-- CreateIndex
CREATE INDEX "inquiry_tasks_parent_inquiry_task_id_idx" ON "inquiry_tasks"("parent_inquiry_task_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "needs_assessment_templates_share_token_key" ON "needs_assessment_templates"("share_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "proposals_share_token_key" ON "proposals"("share_token" ASC);

-- CreateIndex
CREATE INDEX "task_library_default_contributor_id_idx" ON "task_library"("default_contributor_id" ASC);

-- CreateIndex
CREATE INDEX "task_library_parent_task_id_idx" ON "task_library"("parent_task_id" ASC);

-- AddForeignKey
ALTER TABLE "contract_clause_categories" ADD CONSTRAINT "contract_clause_categories_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "contract_clause_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signers" ADD CONSTRAINT "contract_signers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_clauses" ADD CONSTRAINT "contract_template_clauses_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "contract_clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_clauses" ADD CONSTRAINT "contract_template_clauses_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_payment_schedule_template_id_fkey" FOREIGN KEY ("payment_schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_default_camera_id_fkey" FOREIGN KEY ("default_camera_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_questions" ADD CONSTRAINT "discovery_questionnaire_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "discovery_questionnaire_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_submissions" ADD CONSTRAINT "discovery_questionnaire_submissions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_submissions" ADD CONSTRAINT "discovery_questionnaire_submissions_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_submissions" ADD CONSTRAINT "discovery_questionnaire_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "discovery_questionnaire_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_templates" ADD CONSTRAINT "discovery_questionnaire_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_parent_inquiry_task_id_fkey" FOREIGN KEY ("parent_inquiry_task_id") REFERENCES "inquiry_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_requests" ADD CONSTRAINT "package_requests_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_payment_milestones" ADD CONSTRAINT "quote_payment_milestones_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_schedule_template_id_fkey" FOREIGN KEY ("schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_default_contributor_id_fkey" FOREIGN KEY ("default_contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

