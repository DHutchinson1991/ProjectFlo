-- AlterTable
ALTER TABLE "coverage" ADD COLUMN     "equipment_assignments" JSONB,
ADD COLUMN     "operator_id" INTEGER;
