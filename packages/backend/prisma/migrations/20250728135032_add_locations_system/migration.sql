-- CreateTable
CREATE TABLE "locations_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "postal_code" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "capacity" INTEGER,
    "notes" TEXT,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_spaces" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "space_type" TEXT NOT NULL,
    "capacity" INTEGER,
    "dimensions_length" DECIMAL(8,2),
    "dimensions_width" DECIMAL(8,2),
    "dimensions_height" DECIMAL(8,2),
    "metadata" JSONB,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" SERIAL NOT NULL,
    "space_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fabric_data" JSONB NOT NULL,
    "layers_data" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plan_objects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "fabric_template" JSONB NOT NULL,
    "thumbnail_url" TEXT,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_plan_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_location_space" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "space_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_location_space_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_library_brand_id_idx" ON "locations_library"("brand_id");

-- CreateIndex
CREATE INDEX "location_spaces_location_id_idx" ON "location_spaces"("location_id");

-- CreateIndex
CREATE INDEX "floor_plans_space_id_idx" ON "floor_plans"("space_id");

-- CreateIndex
CREATE INDEX "floor_plans_project_id_idx" ON "floor_plans"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "floor_plans_space_id_project_id_version_key" ON "floor_plans"("space_id", "project_id", "version");

-- CreateIndex
CREATE INDEX "floor_plan_objects_brand_id_idx" ON "floor_plan_objects"("brand_id");

-- CreateIndex
CREATE INDEX "floor_plan_objects_category_idx" ON "floor_plan_objects"("category");

-- CreateIndex
CREATE INDEX "scene_location_space_location_id_idx" ON "scene_location_space"("location_id");

-- CreateIndex
CREATE INDEX "scene_location_space_space_id_idx" ON "scene_location_space"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_location_space_scene_id_key" ON "scene_location_space"("scene_id");

-- AddForeignKey
ALTER TABLE "locations_library" ADD CONSTRAINT "locations_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_spaces" ADD CONSTRAINT "location_spaces_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "location_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_objects" ADD CONSTRAINT "floor_plan_objects_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_location_space" ADD CONSTRAINT "scene_location_space_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_location_space" ADD CONSTRAINT "scene_location_space_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_location_space" ADD CONSTRAINT "scene_location_space_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "location_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
