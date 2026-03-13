-- CreateTable
CREATE TABLE "inquiry_tasks" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "task_library_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "project_phase" NOT NULL,
    "trigger_type" "task_trigger_type" NOT NULL DEFAULT 'always',
    "estimated_hours" DECIMAL(8,2),
    "due_date" TIMESTAMP(3),
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "completed_by_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiry_tasks_inquiry_id_idx" ON "inquiry_tasks"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_tasks_task_library_id_idx" ON "inquiry_tasks"("task_library_id");

-- CreateIndex
CREATE INDEX "inquiry_tasks_inquiry_id_order_index_idx" ON "inquiry_tasks"("inquiry_id", "order_index");

-- CreateIndex
CREATE INDEX "inquiry_tasks_status_idx" ON "inquiry_tasks"("status");

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
