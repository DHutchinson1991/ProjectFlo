/*
  Warnings:

  - The primary key for the `scene_coverage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[scene_id,coverage_id,moment_id]` on the table `scene_coverage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "scene_coverage" DROP CONSTRAINT "scene_coverage_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "scene_coverage_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_coverage_scene_id_coverage_id_moment_id_key" ON "scene_coverage"("scene_id", "coverage_id", "moment_id");
