/*
  Warnings:

  - You are about to drop the column `business_id` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `business_id` on the `film_library` table. All the data in the column will be lost.
  - You are about to drop the column `business_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `business_id` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `business_id` on the `scenes_library` table. All the data in the column will be lost.

*/
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

-- DropIndex
DROP INDEX "contacts_business_id_idx";

-- DropIndex
DROP INDEX "film_library_business_id_idx";

-- DropIndex
DROP INDEX "projects_business_id_idx";

-- DropIndex
DROP INDEX "roles_business_id_idx";

-- DropIndex
DROP INDEX "scenes_library_business_id_idx";

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "business_id",
ADD COLUMN     "brand_id" INTEGER;

-- AlterTable
ALTER TABLE "film_library" DROP COLUMN "business_id",
ADD COLUMN     "brand_id" INTEGER;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "business_id",
ADD COLUMN     "brand_id" INTEGER;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "business_id",
ADD COLUMN     "brand_id" INTEGER;

-- AlterTable
ALTER TABLE "scenes_library" DROP COLUMN "business_id",
ADD COLUMN     "brand_id" INTEGER;

-- CreateIndex
CREATE INDEX "contacts_brand_id_idx" ON "contacts"("brand_id");

-- CreateIndex
CREATE INDEX "film_library_brand_id_idx" ON "film_library"("brand_id");

-- CreateIndex
CREATE INDEX "projects_brand_id_idx" ON "projects"("brand_id");

-- CreateIndex
CREATE INDEX "roles_brand_id_idx" ON "roles"("brand_id");

-- CreateIndex
CREATE INDEX "scenes_library_brand_id_idx" ON "scenes_library"("brand_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes_library" ADD CONSTRAINT "scenes_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
