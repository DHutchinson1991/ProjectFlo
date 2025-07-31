-- AlterTable
ALTER TABLE "scene_coverage" ADD COLUMN     "moment_id" INTEGER;

-- CreateTable
CREATE TABLE "moment_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scene_type" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "default_duration" INTEGER DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_moment_defaults" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "default_duration" INTEGER DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_moment_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_moments" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "template_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_moments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_moment_defaults_project_id_template_id_key" ON "project_moment_defaults"("project_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_moments_scene_id_order_index_key" ON "scene_moments"("scene_id", "order_index");

-- AddForeignKey
ALTER TABLE "scene_coverage" ADD CONSTRAINT "scene_coverage_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "scene_moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_moment_defaults" ADD CONSTRAINT "project_moment_defaults_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_moment_defaults" ADD CONSTRAINT "project_moment_defaults_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "moment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_moments" ADD CONSTRAINT "scene_moments_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_moments" ADD CONSTRAINT "scene_moments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_moments" ADD CONSTRAINT "scene_moments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "moment_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
