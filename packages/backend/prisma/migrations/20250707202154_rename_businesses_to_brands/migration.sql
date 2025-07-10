/*
  Warnings:

  - You are about to drop the `business_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `businesses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_businesses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "business_settings" DROP CONSTRAINT "business_settings_business_id_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_business_id_fkey";

-- DropForeignKey
ALTER TABLE "film_library" DROP CONSTRAINT "film_library_business_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_business_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_business_id_fkey";

-- DropForeignKey
ALTER TABLE "scenes_library" DROP CONSTRAINT "scenes_library_business_id_fkey";

-- DropForeignKey
ALTER TABLE "user_businesses" DROP CONSTRAINT "user_businesses_business_id_fkey";

-- DropForeignKey
ALTER TABLE "user_businesses" DROP CONSTRAINT "user_businesses_user_id_fkey";

-- DropTable
DROP TABLE "business_settings";

-- DropTable
DROP TABLE "businesses";

-- DropTable
DROP TABLE "user_businesses";

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "business_type" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "postal_code" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_settings" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_brands" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "brand_settings_brand_id_idx" ON "brand_settings"("brand_id");

-- CreateIndex
CREATE INDEX "brand_settings_category_idx" ON "brand_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "brand_settings_brand_id_key_key" ON "brand_settings"("brand_id", "key");

-- CreateIndex
CREATE INDEX "user_brands_user_id_idx" ON "user_brands"("user_id");

-- CreateIndex
CREATE INDEX "user_brands_brand_id_idx" ON "user_brands"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_brands_user_id_brand_id_key" ON "user_brands"("user_id", "brand_id");

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes_library" ADD CONSTRAINT "scenes_library_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
