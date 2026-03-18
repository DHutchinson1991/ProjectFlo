-- CreateTable
CREATE TABLE "package_event_days" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_event_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_event_days_package_id_idx" ON "package_event_days"("package_id");

-- CreateIndex
CREATE INDEX "package_event_days_event_day_template_id_idx" ON "package_event_days"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_event_days_package_id_event_day_template_id_key" ON "package_event_days"("package_id", "event_day_template_id");

-- AddForeignKey
ALTER TABLE "package_event_days" ADD CONSTRAINT "package_event_days_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_days" ADD CONSTRAINT "package_event_days_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_day_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
