-- CreateTable
CREATE TABLE "event_day_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_day_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_schedules" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER,
    "scheduled_start_time" TEXT,
    "scheduled_duration_minutes" INTEGER,
    "moment_schedules" JSONB,
    "beat_schedules" JSONB,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_films" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_film_scene_schedules" (
    "id" SERIAL NOT NULL,
    "package_film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER,
    "scheduled_start_time" TEXT,
    "scheduled_duration_minutes" INTEGER,
    "moment_schedules" JSONB,
    "beat_schedules" JSONB,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_film_scene_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_event_days" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_event_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_films" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "package_film_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_schedules" (
    "id" SERIAL NOT NULL,
    "project_film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "project_event_day_id" INTEGER,
    "scheduled_start_time" TEXT,
    "scheduled_duration_minutes" INTEGER,
    "moment_schedules" JSONB,
    "beat_schedules" JSONB,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_day_templates_brand_id_idx" ON "event_day_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_day_templates_brand_id_name_key" ON "event_day_templates"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_schedules_scene_id_key" ON "film_scene_schedules"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_schedules_film_id_idx" ON "film_scene_schedules"("film_id");

-- CreateIndex
CREATE INDEX "film_scene_schedules_event_day_template_id_idx" ON "film_scene_schedules"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_films_package_id_idx" ON "package_films"("package_id");

-- CreateIndex
CREATE INDEX "package_films_film_id_idx" ON "package_films"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_films_package_id_film_id_key" ON "package_films"("package_id", "film_id");

-- CreateIndex
CREATE INDEX "package_film_scene_schedules_package_film_id_idx" ON "package_film_scene_schedules"("package_film_id");

-- CreateIndex
CREATE INDEX "package_film_scene_schedules_event_day_template_id_idx" ON "package_film_scene_schedules"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_film_scene_schedules_package_film_id_scene_id_key" ON "package_film_scene_schedules"("package_film_id", "scene_id");

-- CreateIndex
CREATE INDEX "project_event_days_project_id_idx" ON "project_event_days"("project_id");

-- CreateIndex
CREATE INDEX "project_event_days_event_day_template_id_idx" ON "project_event_days"("event_day_template_id");

-- CreateIndex
CREATE INDEX "project_films_project_id_idx" ON "project_films"("project_id");

-- CreateIndex
CREATE INDEX "project_films_film_id_idx" ON "project_films"("film_id");

-- CreateIndex
CREATE INDEX "project_films_package_film_id_idx" ON "project_films"("package_film_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_films_project_id_film_id_key" ON "project_films"("project_id", "film_id");

-- CreateIndex
CREATE INDEX "project_film_scene_schedules_project_film_id_idx" ON "project_film_scene_schedules"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_scene_schedules_project_event_day_id_idx" ON "project_film_scene_schedules"("project_event_day_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_film_scene_schedules_project_film_id_scene_id_key" ON "project_film_scene_schedules"("project_film_id", "scene_id");

-- AddForeignKey
ALTER TABLE "event_day_templates" ADD CONSTRAINT "event_day_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_schedules" ADD CONSTRAINT "film_scene_schedules_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_schedules" ADD CONSTRAINT "film_scene_schedules_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_schedules" ADD CONSTRAINT "film_scene_schedules_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_films" ADD CONSTRAINT "package_films_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_films" ADD CONSTRAINT "package_films_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_package_film_id_fkey" FOREIGN KEY ("package_film_id") REFERENCES "package_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_days" ADD CONSTRAINT "project_event_days_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_days" ADD CONSTRAINT "project_event_days_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_package_film_id_fkey" FOREIGN KEY ("package_film_id") REFERENCES "package_films"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;
