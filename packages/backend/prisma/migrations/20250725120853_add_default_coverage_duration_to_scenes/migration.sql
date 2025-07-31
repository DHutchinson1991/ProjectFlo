-- AlterTable
ALTER TABLE "scenes_library" ADD COLUMN     "default_coverage_duration" INTEGER DEFAULT 30;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
