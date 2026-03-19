-- AlterTable
ALTER TABLE "job_roles"
ADD COLUMN "on_site" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "inquiry_task_subtasks" (
    "id" SERIAL NOT NULL,
    "inquiry_task_id" INTEGER NOT NULL,
    "subtask_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_auto_only" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by_id" INTEGER,
    "job_role_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_task_subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_task_subtasks_inquiry_task_id_subtask_key_key" ON "inquiry_task_subtasks"("inquiry_task_id", "subtask_key");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_inquiry_task_id_order_index_idx" ON "inquiry_task_subtasks"("inquiry_task_id", "order_index");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_status_idx" ON "inquiry_task_subtasks"("status");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_completed_by_id_idx" ON "inquiry_task_subtasks"("completed_by_id");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_job_role_id_idx" ON "inquiry_task_subtasks"("job_role_id");

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks"
ADD CONSTRAINT "inquiry_task_subtasks_inquiry_task_id_fkey" FOREIGN KEY ("inquiry_task_id") REFERENCES "inquiry_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks"
ADD CONSTRAINT "inquiry_task_subtasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks"
ADD CONSTRAINT "inquiry_task_subtasks_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
