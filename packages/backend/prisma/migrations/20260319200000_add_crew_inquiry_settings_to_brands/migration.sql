-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "crew_payment_terms" TEXT DEFAULT '50% on booking confirmation, 50% within 7 days of delivery',
ADD COLUMN     "crew_response_deadline_days" INTEGER DEFAULT 5,
ADD COLUMN     "inquiry_validity_days" INTEGER DEFAULT 14;
