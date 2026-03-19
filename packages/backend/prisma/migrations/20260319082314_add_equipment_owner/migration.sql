-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "owner_id" INTEGER;

-- CreateIndex
CREATE INDEX "equipment_owner_id_idx" ON "equipment"("owner_id");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
