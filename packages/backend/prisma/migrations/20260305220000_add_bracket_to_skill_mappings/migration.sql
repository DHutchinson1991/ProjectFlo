-- AlterTable: Add payment_bracket_id column to skill_role_mappings
ALTER TABLE "skill_role_mappings" ADD COLUMN "payment_bracket_id" INTEGER;

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_payment_bracket_id_fkey" FOREIGN KEY ("payment_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropIndex: Remove old 3-column unique constraint
DROP INDEX IF EXISTS "skill_role_mappings_skill_name_job_role_id_brand_id_key";

-- CreateIndex: Add new 4-column unique constraint (with payment_bracket_id)
CREATE UNIQUE INDEX "skill_role_mappings_skill_name_job_role_id_payment_bracket_id_brand_id_key" ON "skill_role_mappings"("skill_name", "job_role_id", "payment_bracket_id", "brand_id");
