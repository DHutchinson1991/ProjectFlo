-- Add film equipment table for camera, audio, music configuration
CREATE TABLE "film_equipment" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_equipment_pkey" PRIMARY KEY ("id")
);

-- Add film timeline tracks table for persistent track management
CREATE TABLE "film_timeline_tracks" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "track_type" "MediaType" NOT NULL,
    "track_label" TEXT,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_timeline_tracks_pkey" PRIMARY KEY ("id")
);

-- Add duration mode fields to film_local_scenes
ALTER TABLE "film_local_scenes" ADD COLUMN "duration_mode" TEXT DEFAULT 'MOMENTS';
ALTER TABLE "film_local_scenes" ADD COLUMN "fixed_duration" INTEGER DEFAULT 60;

-- Create unique constraints
CREATE UNIQUE INDEX "film_equipment_film_id_equipment_type_key" ON "film_equipment"("film_id", "equipment_type");
CREATE UNIQUE INDEX "film_timeline_tracks_film_id_order_index_key" ON "film_timeline_tracks"("film_id", "order_index");

-- Create indexes for performance
CREATE INDEX "film_equipment_film_id_idx" ON "film_equipment"("film_id");
CREATE INDEX "film_equipment_equipment_type_idx" ON "film_equipment"("equipment_type");
CREATE INDEX "film_timeline_tracks_film_id_idx" ON "film_timeline_tracks"("film_id");
CREATE INDEX "film_timeline_tracks_track_type_idx" ON "film_timeline_tracks"("track_type");

-- Add foreign key constraints
ALTER TABLE "film_equipment" ADD CONSTRAINT "film_equipment_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "film_timeline_tracks" ADD CONSTRAINT "film_timeline_tracks_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
