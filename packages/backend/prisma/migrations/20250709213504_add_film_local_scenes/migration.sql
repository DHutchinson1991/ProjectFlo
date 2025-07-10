-- CreateTable
CREATE TABLE "film_local_scenes" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "original_scene_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "description" TEXT,
    "complexity_score" INTEGER DEFAULT 5,
    "estimated_duration" INTEGER DEFAULT 60,
    "default_editing_style" TEXT,
    "base_task_hours" DECIMAL(5,2),
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_local_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_local_scene_media_components" (
    "id" SERIAL NOT NULL,
    "film_local_scene_id" INTEGER NOT NULL,
    "original_component_id" INTEGER,
    "media_type" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "music_type" "MusicType",
    "music_weight" INTEGER DEFAULT 5,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_local_scene_media_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "film_local_scenes_film_id_idx" ON "film_local_scenes"("film_id");

-- CreateIndex
CREATE INDEX "film_local_scenes_original_scene_id_idx" ON "film_local_scenes"("original_scene_id");

-- CreateIndex
CREATE INDEX "film_local_scene_media_components_film_local_scene_id_idx" ON "film_local_scene_media_components"("film_local_scene_id");

-- CreateIndex
CREATE INDEX "film_local_scene_media_components_original_component_id_idx" ON "film_local_scene_media_components"("original_component_id");

-- AddForeignKey
ALTER TABLE "film_local_scenes" ADD CONSTRAINT "film_local_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scenes" ADD CONSTRAINT "film_local_scenes_original_scene_id_fkey" FOREIGN KEY ("original_scene_id") REFERENCES "scenes_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scene_media_components" ADD CONSTRAINT "film_local_scene_media_components_film_local_scene_id_fkey" FOREIGN KEY ("film_local_scene_id") REFERENCES "film_local_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scene_media_components" ADD CONSTRAINT "film_local_scene_media_components_original_component_id_fkey" FOREIGN KEY ("original_component_id") REFERENCES "scene_media_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;
