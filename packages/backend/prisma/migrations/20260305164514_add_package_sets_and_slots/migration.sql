-- CreateTable
CREATE TABLE "package_sets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT DEFAULT '📦',
    "category_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_set_slots" (
    "id" SERIAL NOT NULL,
    "package_set_id" INTEGER NOT NULL,
    "service_package_id" INTEGER,
    "slot_label" TEXT NOT NULL DEFAULT 'Package',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_set_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_sets_brand_id_idx" ON "package_sets"("brand_id");

-- CreateIndex
CREATE INDEX "package_sets_category_id_idx" ON "package_sets"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_sets_brand_id_name_key" ON "package_sets"("brand_id", "name");

-- CreateIndex
CREATE INDEX "package_set_slots_package_set_id_idx" ON "package_set_slots"("package_set_id");

-- CreateIndex
CREATE INDEX "package_set_slots_service_package_id_idx" ON "package_set_slots"("service_package_id");

-- AddForeignKey
ALTER TABLE "package_sets" ADD CONSTRAINT "package_sets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_sets" ADD CONSTRAINT "package_sets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_package_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_set_slots" ADD CONSTRAINT "package_set_slots_package_set_id_fkey" FOREIGN KEY ("package_set_id") REFERENCES "package_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_set_slots" ADD CONSTRAINT "package_set_slots_service_package_id_fkey" FOREIGN KEY ("service_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
