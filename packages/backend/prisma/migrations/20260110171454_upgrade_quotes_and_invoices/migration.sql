-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "proposal_id" INTEGER,
ADD COLUMN     "quote_id" INTEGER;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "deposit_required" DECIMAL(10,2),
ADD COLUMN     "installments" INTEGER DEFAULT 1,
ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payment_method" TEXT DEFAULT 'Bank Transfer',
ADD COLUMN     "tax_rate" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "terms" TEXT,
ADD COLUMN     "title" TEXT;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
