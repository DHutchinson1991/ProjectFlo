-- CreateEnum
CREATE TYPE "EquipmentTemplateSlotType" AS ENUM ('CAMERA', 'AUDIO');

-- CreateTable
CREATE TABLE "equipment_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_template_items" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "slot_type" "EquipmentTemplateSlotType" NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_templates_brand_id_idx" ON "equipment_templates"("brand_id");

-- CreateIndex
CREATE INDEX "equipment_template_items_template_id_idx" ON "equipment_template_items"("template_id");

-- CreateIndex
CREATE INDEX "equipment_template_items_equipment_id_idx" ON "equipment_template_items"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_template_items_template_id_slot_type_slot_index_key" ON "equipment_template_items"("template_id", "slot_type", "slot_index");

-- AddForeignKey
ALTER TABLE "equipment_templates" ADD CONSTRAINT "equipment_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "equipment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
