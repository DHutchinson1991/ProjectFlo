-- CreateTable
CREATE TABLE "needs_assessment_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_assessment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs_assessment_questions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "field_key" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "help_text" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs_assessment_submissions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "inquiry_id" INTEGER,
    "contact_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "responses" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "needs_assessment_templates_brand_id_idx" ON "needs_assessment_templates"("brand_id");

-- CreateIndex
CREATE INDEX "needs_assessment_questions_template_id_idx" ON "needs_assessment_questions"("template_id");

-- CreateIndex
CREATE INDEX "needs_assessment_submissions_brand_id_idx" ON "needs_assessment_submissions"("brand_id");

-- CreateIndex
CREATE INDEX "needs_assessment_submissions_inquiry_id_idx" ON "needs_assessment_submissions"("inquiry_id");

-- AddForeignKey
ALTER TABLE "needs_assessment_templates" ADD CONSTRAINT "needs_assessment_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_questions" ADD CONSTRAINT "needs_assessment_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "needs_assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "needs_assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
