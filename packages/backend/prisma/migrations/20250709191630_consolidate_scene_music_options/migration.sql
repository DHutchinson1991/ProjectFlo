/*
  Warnings:

  - The primary key for the `contributor_task_benchmarks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `scene_music_options` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[task_template_id,contributor_id]` on the table `contributor_task_benchmarks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `contributor_task_benchmarks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "scene_music_options" DROP CONSTRAINT "scene_music_options_scene_id_fkey";

-- AlterTable
ALTER TABLE "contributor_task_benchmarks" DROP CONSTRAINT "contributor_task_benchmarks_pkey",
ADD COLUMN     "completed_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contributor_best_hours" DECIMAL(8,2),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "contributor_task_benchmarks_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "scene_music_options";

-- CreateTable
CREATE TABLE "scene_media_components" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "volume_level" DECIMAL(3,2),
    "sync_offset" INTEGER DEFAULT 0,
    "music_type" TEXT,
    "music_weight" INTEGER DEFAULT 5,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_media_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scene_media_components_scene_id_idx" ON "scene_media_components"("scene_id");

-- CreateIndex
CREATE INDEX "scene_media_components_media_type_idx" ON "scene_media_components"("media_type");

-- CreateIndex
CREATE INDEX "scene_media_components_music_type_idx" ON "scene_media_components"("music_type");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_task_benchmarks_task_template_id_contributor_id_key" ON "contributor_task_benchmarks"("task_template_id", "contributor_id");

-- AddForeignKey
ALTER TABLE "scene_media_components" ADD CONSTRAINT "scene_media_components_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
