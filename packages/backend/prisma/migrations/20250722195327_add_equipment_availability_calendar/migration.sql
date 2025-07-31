-- CreateEnum
CREATE TYPE "equipment_availability_status" AS ENUM ('AVAILABLE', 'BOOKED', 'IN_USE', 'UNAVAILABLE', 'TENTATIVE');

-- CreateTable
CREATE TABLE "equipment_availability" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT true,
    "status" "equipment_availability_status" NOT NULL DEFAULT 'AVAILABLE',
    "title" TEXT,
    "description" TEXT,
    "project_id" INTEGER,
    "booked_by_id" INTEGER,
    "client_id" INTEGER,
    "booking_notes" TEXT,
    "internal_notes" TEXT,
    "recurring_rule" TEXT,
    "recurring_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "equipment_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_availability_equipment_id_idx" ON "equipment_availability"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_availability_start_date_idx" ON "equipment_availability"("start_date");

-- CreateIndex
CREATE INDEX "equipment_availability_end_date_idx" ON "equipment_availability"("end_date");

-- CreateIndex
CREATE INDEX "equipment_availability_slots_status_idx" ON "equipment_availability"("status");

-- CreateIndex
CREATE INDEX "equipment_availability_project_id_idx" ON "equipment_availability"("project_id");

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_booked_by_id_fkey" FOREIGN KEY ("booked_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
