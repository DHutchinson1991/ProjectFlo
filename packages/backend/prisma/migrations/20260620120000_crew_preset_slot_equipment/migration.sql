-- AlterTable
ALTER TABLE "crew_preset_slots" ADD COLUMN "equipment_id" INTEGER;

-- CreateIndex
CREATE INDEX "crew_preset_slots_equipment_id_idx" ON "crew_preset_slots"("equipment_id");

-- AddForeignKey
ALTER TABLE "crew_preset_slots" ADD CONSTRAINT "crew_preset_slots_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
