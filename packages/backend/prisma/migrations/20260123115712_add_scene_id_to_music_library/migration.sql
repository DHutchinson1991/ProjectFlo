-- AlterTable
ALTER TABLE "music_library" ADD COLUMN     "scene_id" INTEGER;

-- AddForeignKey
ALTER TABLE "music_library" ADD CONSTRAINT "music_library_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;
