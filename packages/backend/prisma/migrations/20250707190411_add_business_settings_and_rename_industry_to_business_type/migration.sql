-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "business_id" INTEGER;

-- AlterTable
ALTER TABLE "film_library" ADD COLUMN     "business_id" INTEGER;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "business_id" INTEGER;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "business_id" INTEGER;

-- AlterTable
ALTER TABLE "scenes_library" ADD COLUMN     "business_id" INTEGER;

-- CreateTable
CREATE TABLE "businesses" (
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

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_businesses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_name_key" ON "businesses"("name");

-- CreateIndex
CREATE INDEX "business_settings_business_id_idx" ON "business_settings"("business_id");

-- CreateIndex
CREATE INDEX "business_settings_category_idx" ON "business_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_business_id_key_key" ON "business_settings"("business_id", "key");

-- CreateIndex
CREATE INDEX "user_businesses_user_id_idx" ON "user_businesses"("user_id");

-- CreateIndex
CREATE INDEX "user_businesses_business_id_idx" ON "user_businesses"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_businesses_user_id_business_id_key" ON "user_businesses"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "contacts_business_id_idx" ON "contacts"("business_id");

-- CreateIndex
CREATE INDEX "film_library_business_id_idx" ON "film_library"("business_id");

-- CreateIndex
CREATE INDEX "projects_business_id_idx" ON "projects"("business_id");

-- CreateIndex
CREATE INDEX "roles_business_id_idx" ON "roles"("business_id");

-- CreateIndex
CREATE INDEX "scenes_library_business_id_idx" ON "scenes_library"("business_id");

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_businesses" ADD CONSTRAINT "user_businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_businesses" ADD CONSTRAINT "user_businesses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes_library" ADD CONSTRAINT "scenes_library_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
