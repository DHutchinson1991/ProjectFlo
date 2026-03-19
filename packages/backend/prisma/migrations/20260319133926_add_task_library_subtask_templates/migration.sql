-- CreateTable
CREATE TABLE "task_library_subtask_templates" (
    "id" SERIAL NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "subtask_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_auto_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_subtask_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_library_subtask_templates_task_library_id_order_index_idx" ON "task_library_subtask_templates"("task_library_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_subtask_templates_task_library_id_subtask_key_key" ON "task_library_subtask_templates"("task_library_id", "subtask_key");

-- AddForeignKey
ALTER TABLE "task_library_subtask_templates" ADD CONSTRAINT "task_library_subtask_templates_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
