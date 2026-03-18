-- CreateTable
CREATE TABLE "schedule_presets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "schedule_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_presets_brand_id_name_key" ON "schedule_presets"("brand_id", "name");

-- CreateIndex
CREATE INDEX "schedule_presets_brand_id_idx" ON "schedule_presets"("brand_id");

-- AddForeignKey
ALTER TABLE "schedule_presets" ADD CONSTRAINT "schedule_presets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
