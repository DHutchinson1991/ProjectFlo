-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "installments" INTEGER DEFAULT 1,
ADD COLUMN     "payment_method" TEXT DEFAULT 'Bank Transfer';
