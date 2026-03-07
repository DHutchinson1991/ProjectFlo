-- CreateTable
CREATE TABLE "event_types" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "default_duration_hours" INTEGER,
    "default_start_time" TEXT,
    "typical_guest_count" INTEGER,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type_event_days" (
    "id" SERIAL NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_type_event_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type_subject_types" (
    "id" SERIAL NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "subject_type_template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_type_subject_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_types_brand_id_idx" ON "event_types"("brand_id");

-- CreateIndex
CREATE INDEX "event_types_is_system_idx" ON "event_types"("is_system");

-- CreateIndex
CREATE INDEX "event_types_is_active_idx" ON "event_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_brand_id_name_key" ON "event_types"("brand_id", "name");

-- CreateIndex
CREATE INDEX "event_type_event_days_event_type_id_idx" ON "event_type_event_days"("event_type_id");

-- CreateIndex
CREATE INDEX "event_type_event_days_event_day_template_id_idx" ON "event_type_event_days"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_event_days_event_type_id_event_day_template_id_key" ON "event_type_event_days"("event_type_id", "event_day_template_id");

-- CreateIndex
CREATE INDEX "event_type_subject_types_event_type_id_idx" ON "event_type_subject_types"("event_type_id");

-- CreateIndex
CREATE INDEX "event_type_subject_types_subject_type_template_id_idx" ON "event_type_subject_types"("subject_type_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_subject_types_event_type_id_subject_type_templat_key" ON "event_type_subject_types"("event_type_id", "subject_type_template_id");

-- AddForeignKey
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_event_days" ADD CONSTRAINT "event_type_event_days_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_event_days" ADD CONSTRAINT "event_type_event_days_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_subject_types" ADD CONSTRAINT "event_type_subject_types_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_subject_types" ADD CONSTRAINT "event_type_subject_types_subject_type_template_id_fkey" FOREIGN KEY ("subject_type_template_id") REFERENCES "subject_type_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
