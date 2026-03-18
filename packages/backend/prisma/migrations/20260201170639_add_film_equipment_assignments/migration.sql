/*
  Warnings:

  - You are about to drop the `scene_dependencies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scene_media_components` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timeline_scenes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "scene_dependencies" DROP CONSTRAINT "scene_dependencies_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_scenes" DROP CONSTRAINT "timeline_scenes_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_scenes" DROP CONSTRAINT "timeline_scenes_film_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_scenes" DROP CONSTRAINT "timeline_scenes_layer_id_fkey";

-- DropTable
DROP TABLE "scene_dependencies";

-- DropTable
DROP TABLE "scene_media_components";

-- DropTable
DROP TABLE "timeline_scenes";

-- CreateTable
CREATE TABLE "film_equipment_assignments" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "film_equipment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "film_equipment_assignments_film_id_idx" ON "film_equipment_assignments"("film_id");

-- CreateIndex
CREATE INDEX "film_equipment_assignments_equipment_id_idx" ON "film_equipment_assignments"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_equipment_assignments_film_id_equipment_id_key" ON "film_equipment_assignments"("film_id", "equipment_id");

-- AddForeignKey
ALTER TABLE "film_equipment_assignments" ADD CONSTRAINT "film_equipment_assignments_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_equipment_assignments" ADD CONSTRAINT "film_equipment_assignments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
