/*
  Warnings:

  - You are about to drop the column `music_weight` on the `scene_media_components` table. All the data in the column will be lost.
  - You are about to drop the column `sync_offset` on the `scene_media_components` table. All the data in the column will be lost.
  - You are about to drop the column `volume_level` on the `scene_media_components` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "scene_media_components" DROP COLUMN "music_weight",
DROP COLUMN "sync_offset",
DROP COLUMN "volume_level";
