-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "resolved_bracket_id" INTEGER,
ADD COLUMN     "resolved_job_role_id" INTEGER,
ADD COLUMN     "resolved_rate" DECIMAL(8,2),
ADD COLUMN     "resolved_skill" TEXT;

-- CreateTable
CREATE TABLE "skill_role_mappings" (
    "id" SERIAL NOT NULL,
    "skill_name" TEXT NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "brand_id" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_role_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_role_mappings_skill_name_idx" ON "skill_role_mappings"("skill_name");

-- CreateIndex
CREATE INDEX "skill_role_mappings_job_role_id_idx" ON "skill_role_mappings"("job_role_id");

-- CreateIndex
CREATE INDEX "skill_role_mappings_brand_id_idx" ON "skill_role_mappings"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_role_mappings_skill_name_job_role_id_brand_id_key" ON "skill_role_mappings"("skill_name", "job_role_id", "brand_id");

-- CreateIndex
CREATE INDEX "project_tasks_resolved_job_role_id_idx" ON "project_tasks"("resolved_job_role_id");

-- CreateIndex
CREATE INDEX "project_tasks_resolved_bracket_id_idx" ON "project_tasks"("resolved_bracket_id");

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_resolved_job_role_id_fkey" FOREIGN KEY ("resolved_job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_resolved_bracket_id_fkey" FOREIGN KEY ("resolved_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
