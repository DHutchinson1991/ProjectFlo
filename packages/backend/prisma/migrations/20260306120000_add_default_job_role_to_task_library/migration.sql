-- AlterTable: add default_job_role_id to task_library
ALTER TABLE "task_library" ADD COLUMN "default_job_role_id" INTEGER;

-- CreateIndex
CREATE INDEX "task_library_default_job_role_id_idx" ON "task_library"("default_job_role_id");

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_default_job_role_id_fkey" FOREIGN KEY ("default_job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
