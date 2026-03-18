-- CreateTable
CREATE TABLE "event_day_activity_presets" (
    "id" SERIAL NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "default_duration_minutes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_day_activity_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_day_activity_presets_event_day_template_id_idx" ON "event_day_activity_presets"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_day_activity_presets_event_day_template_id_name_key" ON "event_day_activity_presets"("event_day_template_id", "name");

-- AddForeignKey
ALTER TABLE "event_day_activity_presets" ADD CONSTRAINT "event_day_activity_presets_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
