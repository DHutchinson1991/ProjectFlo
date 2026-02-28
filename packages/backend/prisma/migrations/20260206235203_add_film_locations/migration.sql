-- CreateTable
CREATE TABLE "film_locations" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_locations" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "film_locations_film_id_idx" ON "film_locations"("film_id");

-- CreateIndex
CREATE INDEX "film_locations_location_id_idx" ON "film_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_locations_film_id_location_id_key" ON "film_locations"("film_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_locations_scene_id_key" ON "film_scene_locations"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_locations_scene_id_idx" ON "film_scene_locations"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_locations_location_id_idx" ON "film_scene_locations"("location_id");

-- AddForeignKey
ALTER TABLE "film_locations" ADD CONSTRAINT "film_locations_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_locations" ADD CONSTRAINT "film_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_locations" ADD CONSTRAINT "film_scene_locations_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_locations" ADD CONSTRAINT "film_scene_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
