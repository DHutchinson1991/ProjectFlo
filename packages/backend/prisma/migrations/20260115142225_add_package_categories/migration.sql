-- AlterTable
ALTER TABLE "service_packages" ADD COLUMN     "category_id" INTEGER;

-- CreateTable
CREATE TABLE "service_package_categories" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_package_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_package_categories_brand_id_idx" ON "service_package_categories"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_categories_brand_id_name_key" ON "service_package_categories"("brand_id", "name");

-- CreateIndex
CREATE INDEX "service_packages_category_id_idx" ON "service_packages"("category_id");

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_package_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_categories" ADD CONSTRAINT "service_package_categories_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
