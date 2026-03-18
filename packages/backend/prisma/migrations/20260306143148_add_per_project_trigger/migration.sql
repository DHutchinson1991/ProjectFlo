-- AlterEnum
ALTER TYPE "task_trigger_type" ADD VALUE 'per_project';

-- DropForeignKey
ALTER TABLE "skill_role_mappings" DROP CONSTRAINT "skill_role_mappings_payment_bracket_id_fkey";

-- CreateIndex
CREATE INDEX "skill_role_mappings_payment_bracket_id_idx" ON "skill_role_mappings"("payment_bracket_id");

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_payment_bracket_id_fkey" FOREIGN KEY ("payment_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "skill_role_mappings_skill_name_job_role_id_payment_bracket_id_b" RENAME TO "skill_role_mappings_skill_name_job_role_id_payment_bracket__key";
