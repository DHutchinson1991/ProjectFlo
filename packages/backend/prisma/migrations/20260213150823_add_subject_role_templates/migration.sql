-- AlterTable
ALTER TABLE "film_subjects" ADD COLUMN     "role_template_id" INTEGER;

-- CreateTable
CREATE TABLE "subject_type_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "SubjectCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_type_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_role_templates" (
    "id" SERIAL NOT NULL,
    "subject_type_id" INTEGER NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_role_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subject_type_templates_brand_id_idx" ON "subject_type_templates"("brand_id");

-- CreateIndex
CREATE INDEX "subject_type_templates_category_idx" ON "subject_type_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "subject_type_templates_brand_id_name_key" ON "subject_type_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "subject_role_templates_subject_type_id_idx" ON "subject_role_templates"("subject_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_role_templates_subject_type_id_role_name_key" ON "subject_role_templates"("subject_type_id", "role_name");

-- CreateIndex
CREATE INDEX "film_subjects_role_template_id_idx" ON "film_subjects"("role_template_id");

-- AddForeignKey
ALTER TABLE "subject_type_templates" ADD CONSTRAINT "subject_type_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_role_templates" ADD CONSTRAINT "subject_role_templates_subject_type_id_fkey" FOREIGN KEY ("subject_type_id") REFERENCES "subject_type_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_subjects" ADD CONSTRAINT "film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_role_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
