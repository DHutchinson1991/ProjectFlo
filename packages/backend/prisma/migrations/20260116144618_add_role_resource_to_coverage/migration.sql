-- AlterTable
ALTER TABLE "coverage" ADD COLUMN     "job_role_id" INTEGER,
ADD COLUMN     "resource_requirements" JSONB;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
