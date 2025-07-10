-- AlterTable
ALTER TABLE "task_library" ADD COLUMN     "order_index" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "task_library_phase_order_index_idx" ON "task_library"("phase", "order_index");
