-- CreateTable
CREATE TABLE "inquiry_task_events" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "triggered_by" TEXT,
    "description" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_task_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiry_task_events_task_id_idx" ON "inquiry_task_events"("task_id");

-- AddForeignKey
ALTER TABLE "inquiry_task_events" ADD CONSTRAINT "inquiry_task_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "inquiry_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
