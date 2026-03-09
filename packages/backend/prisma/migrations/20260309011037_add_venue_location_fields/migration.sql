-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "venue_address" TEXT,
ADD COLUMN     "venue_lat" DOUBLE PRECISION,
ADD COLUMN     "venue_lng" DOUBLE PRECISION;
