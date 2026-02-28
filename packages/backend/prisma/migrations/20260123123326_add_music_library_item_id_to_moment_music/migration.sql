-- AlterTable
ALTER TABLE "scene_moment_music" ADD COLUMN     "music_library_item_id" INTEGER;

-- AddForeignKey
ALTER TABLE "scene_moment_music" ADD CONSTRAINT "scene_moment_music_music_library_item_id_fkey" FOREIGN KEY ("music_library_item_id") REFERENCES "music_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;
