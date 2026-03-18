-- CreateTable
CREATE TABLE "event_day_activity_preset_moments" (
    "id" SERIAL NOT NULL,
    "event_day_activity_preset_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_key_moment" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_day_activity_preset_moments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_day_activity_preset_moments_event_day_activity_preset_idx" ON "event_day_activity_preset_moments"("event_day_activity_preset_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_day_activity_preset_moments_event_day_activity_preset_key" ON "event_day_activity_preset_moments"("event_day_activity_preset_id", "order_index");

-- AddForeignKey
ALTER TABLE "event_day_activity_preset_moments" ADD CONSTRAINT "event_day_activity_preset_moments_event_day_activity_prese_fkey" FOREIGN KEY ("event_day_activity_preset_id") REFERENCES "event_day_activity_presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
