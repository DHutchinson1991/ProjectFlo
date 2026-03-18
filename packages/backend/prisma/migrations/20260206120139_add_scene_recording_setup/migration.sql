-- CreateTable
CREATE TABLE "scene_recording_setups" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_camera_assignments" (
    "id" SERIAL NOT NULL,
    "recording_setup_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "subject_ids" INTEGER[],

    CONSTRAINT "scene_camera_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scene_recording_setups_scene_id_key" ON "scene_recording_setups"("scene_id");

-- CreateIndex
CREATE INDEX "scene_camera_assignments_recording_setup_id_idx" ON "scene_camera_assignments"("recording_setup_id");

-- CreateIndex
CREATE INDEX "scene_camera_assignments_track_id_idx" ON "scene_camera_assignments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_camera_assignments_recording_setup_id_track_id_key" ON "scene_camera_assignments"("recording_setup_id", "track_id");

-- AddForeignKey
ALTER TABLE "scene_recording_setups" ADD CONSTRAINT "scene_recording_setups_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_camera_assignments" ADD CONSTRAINT "scene_camera_assignments_recording_setup_id_fkey" FOREIGN KEY ("recording_setup_id") REFERENCES "scene_recording_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_camera_assignments" ADD CONSTRAINT "scene_camera_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "film_timeline_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
