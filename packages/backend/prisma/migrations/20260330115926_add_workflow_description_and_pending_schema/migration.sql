/*
  Warnings:

  - You are about to drop the column `base_price` on the `service_packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment_brackets" ADD COLUMN     "half_day_rate" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "service_packages" DROP COLUMN "base_price";

-- AlterTable
ALTER TABLE "task_library" ADD COLUMN     "is_on_site" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workflow_description" TEXT;

-- AlterTable
ALTER TABLE "task_library_subtask_templates" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "brand_finance_settings" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "onsite_half_day_max_hours" INTEGER NOT NULL DEFAULT 6,
    "onsite_full_day_max_hours" INTEGER NOT NULL DEFAULT 12,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_finance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_finance_settings_brand_id_key" ON "brand_finance_settings"("brand_id");

-- AddForeignKey
ALTER TABLE "brand_finance_settings" ADD CONSTRAINT "brand_finance_settings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
