-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "currency" VARCHAR(3) DEFAULT 'USD';

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "currency" VARCHAR(3) DEFAULT 'USD';
