-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "bank_sort_code" TEXT,
ADD COLUMN     "default_payment_method" TEXT DEFAULT 'Bank Transfer',
ADD COLUMN     "default_tax_rate" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "payment_terms_days" INTEGER DEFAULT 30,
ADD COLUMN     "tax_number" TEXT;
