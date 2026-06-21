CREATE TABLE "equipment_presets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_presets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "equipment_preset_slots" (
    "id" SERIAL NOT NULL,
    "preset_id" INTEGER NOT NULL,
    "slot_type" "EquipmentTemplateSlotType" NOT NULL,
    "equipment_id" INTEGER,
    "crew_id" INTEGER,
    "job_role_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "equipment_preset_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "equipment_presets_brand_id_name_key" ON "equipment_presets"("brand_id", "name");
CREATE INDEX "equipment_presets_brand_id_idx" ON "equipment_presets"("brand_id");
CREATE INDEX "equipment_preset_slots_preset_id_idx" ON "equipment_preset_slots"("preset_id");
CREATE INDEX "equipment_preset_slots_equipment_id_idx" ON "equipment_preset_slots"("equipment_id");
CREATE INDEX "equipment_preset_slots_crew_id_idx" ON "equipment_preset_slots"("crew_id");
CREATE INDEX "equipment_preset_slots_job_role_id_idx" ON "equipment_preset_slots"("job_role_id");

ALTER TABLE "equipment_presets"
    ADD CONSTRAINT "equipment_presets_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "equipment_preset_slots"
    ADD CONSTRAINT "equipment_preset_slots_preset_id_fkey"
    FOREIGN KEY ("preset_id") REFERENCES "equipment_presets"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "equipment_preset_slots"
    ADD CONSTRAINT "equipment_preset_slots_equipment_id_fkey"
    FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "equipment_preset_slots"
    ADD CONSTRAINT "equipment_preset_slots_crew_id_fkey"
    FOREIGN KEY ("crew_id") REFERENCES "crew"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "equipment_preset_slots"
    ADD CONSTRAINT "equipment_preset_slots_job_role_id_fkey"
    FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
