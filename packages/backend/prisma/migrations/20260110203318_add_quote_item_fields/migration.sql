-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "category" TEXT,
ADD COLUMN     "end_time" TEXT,
ADD COLUMN     "service_date" TIMESTAMP(3),
ADD COLUMN     "start_time" TEXT,
ADD COLUMN     "unit" TEXT;
