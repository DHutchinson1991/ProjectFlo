-- CreateTable
CREATE TABLE "beat_recording_setups" (
    "id" SERIAL NOT NULL,
    "beat_id" INTEGER NOT NULL,
    "camera_track_ids" INTEGER[],
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beat_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beat_recording_setups_beat_id_key" ON "beat_recording_setups"("beat_id");

-- CreateIndex
CREATE INDEX "beat_recording_setups_beat_id_idx" ON "beat_recording_setups"("beat_id");

-- AddForeignKey
ALTER TABLE "beat_recording_setups" ADD CONSTRAINT "beat_recording_setups_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "film_scene_beats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
