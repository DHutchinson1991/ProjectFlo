-- CreateEnum
CREATE TYPE "inquiry_equipment_reservation_status" AS ENUM ('reserved', 'cancelled');

-- AlterTable
ALTER TABLE "equipment_availability" ADD COLUMN     "inquiry_id" INTEGER;

-- CreateTable
CREATE TABLE "inquiry_equipment_reservations" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "project_day_operator_equipment_id" INTEGER NOT NULL,
    "equipment_availability_id" INTEGER,
    "status" "inquiry_equipment_reservation_status" NOT NULL DEFAULT 'reserved',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_equipment_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiry_equipment_reservations_inquiry_id_idx" ON "inquiry_equipment_reservations"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_equipment_reservations_equipment_id_idx" ON "inquiry_equipment_reservations"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_equipment_reservations_inquiry_id_project_day_opera_key" ON "inquiry_equipment_reservations"("inquiry_id", "project_day_operator_equipment_id");

-- CreateIndex
CREATE INDEX "equipment_availability_inquiry_id_idx" ON "equipment_availability"("inquiry_id");

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_equipment_reservations" ADD CONSTRAINT "inquiry_equipment_reservations_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_equipment_reservations" ADD CONSTRAINT "inquiry_equipment_reservations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
