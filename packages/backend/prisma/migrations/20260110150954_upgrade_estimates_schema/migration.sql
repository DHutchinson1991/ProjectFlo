-- AlterTable
ALTER TABLE "estimate_items" ADD COLUMN     "category" TEXT,
ADD COLUMN     "end_time" TEXT,
ADD COLUMN     "service_date" TIMESTAMP(3),
ADD COLUMN     "start_time" TEXT,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "deposit_required" DECIMAL(10,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tax_rate" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "terms" TEXT,
ADD COLUMN     "title" TEXT;
