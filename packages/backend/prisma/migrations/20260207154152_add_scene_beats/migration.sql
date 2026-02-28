-- CreateTable
CREATE TABLE "film_scene_beats" (
    "id" SERIAL NOT NULL,
    "film_scene_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_beats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "film_scene_beats_film_scene_id_idx" ON "film_scene_beats"("film_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_beats_film_scene_id_order_index_key" ON "film_scene_beats"("film_scene_id", "order_index");

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_film_scene_id_fkey" FOREIGN KEY ("film_scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
