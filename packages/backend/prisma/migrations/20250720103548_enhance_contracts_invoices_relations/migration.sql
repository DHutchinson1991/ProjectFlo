/*
  Warnings:

  - You are about to drop the column `total_amount` on the `invoices` table. All the data in the column will be lost.
  - Added the required column `inquiry_id` to the `contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inquiry_id` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoice_number` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `issue_date` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `due_date` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `invoices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_project_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_project_id_fkey";

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "content" JSONB,
ADD COLUMN     "inquiry_id" INTEGER NOT NULL,
ALTER COLUMN "project_id" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "total_amount",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "inquiry_id" INTEGER NOT NULL,
ALTER COLUMN "project_id" DROP NOT NULL,
ALTER COLUMN "invoice_number" SET NOT NULL,
ALTER COLUMN "issue_date" SET NOT NULL,
ALTER COLUMN "due_date" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Draft';

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
