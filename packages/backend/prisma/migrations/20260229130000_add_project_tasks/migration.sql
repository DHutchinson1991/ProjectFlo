-- CreateTable
CREATE TABLE "project_tasks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_library_id" INTEGER,
    "package_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "project_phase" NOT NULL,
    "trigger_type" "task_trigger_type" NOT NULL DEFAULT 'always',
    "trigger_context" TEXT,
    "estimated_hours" DECIMAL(8,2),
    "actual_hours" DECIMAL(8,2),
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "due_date" TIMESTAMP(3),
    "assigned_to_id" INTEGER,
    "pricing_type" "pricing_type_options" NOT NULL DEFAULT 'Hourly',
    "fixed_price" DECIMAL(10,2),
    "hourly_rate" DECIMAL(8,2),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_tasks_project_id_idx" ON "project_tasks"("project_id");

-- CreateIndex
CREATE INDEX "project_tasks_task_library_id_idx" ON "project_tasks"("task_library_id");

-- CreateIndex
CREATE INDEX "project_tasks_package_id_idx" ON "project_tasks"("package_id");

-- CreateIndex
CREATE INDEX "project_tasks_assigned_to_id_idx" ON "project_tasks"("assigned_to_id");

-- CreateIndex
CREATE INDEX "project_tasks_phase_idx" ON "project_tasks"("phase");

-- CreateIndex
CREATE INDEX "project_tasks_status_idx" ON "project_tasks"("status");

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
