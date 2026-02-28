-- DropForeignKey
ALTER TABLE "scene_camera_assignments" DROP CONSTRAINT "scene_camera_assignments_track_id_fkey";

-- AddForeignKey
ALTER TABLE "scene_camera_assignments" ADD CONSTRAINT "scene_camera_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "film_timeline_tracks_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
