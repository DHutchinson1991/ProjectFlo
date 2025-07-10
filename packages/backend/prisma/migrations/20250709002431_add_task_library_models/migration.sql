-- CreateEnum
CREATE TYPE "project_phase" AS ENUM ('Lead', 'Inquiry', 'Booking', 'Creative_Development', 'Pre_Production', 'Production', 'Post_Production');

-- CreateTable
CREATE TABLE "task_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "project_phase" NOT NULL,
    "effort_hours" DECIMAL(8,2),
    "recorded_hours" DECIMAL(8,2),
    "skills_needed" TEXT[],
    "pricing_type" "pricing_type_options" NOT NULL DEFAULT 'Hourly',
    "fixed_price" DECIMAL(10,2),
    "hourly_rate" DECIMAL(8,2),
    "complexity_score" INTEGER DEFAULT 1,
    "notes" TEXT,
    "brand_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_library_benchmarks" (
    "id" SERIAL NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "contributor_default_hours" DECIMAL(8,2),
    "contributor_average_hours" DECIMAL(8,2),
    "contributor_best_hours" DECIMAL(8,2),
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_library_skill_rates" (
    "id" SERIAL NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "skill_name" TEXT NOT NULL,
    "skill_level" TEXT NOT NULL,
    "hourly_rate" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_skill_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_library_brand_id_idx" ON "task_library"("brand_id");

-- CreateIndex
CREATE INDEX "task_library_phase_idx" ON "task_library"("phase");

-- CreateIndex
CREATE INDEX "task_library_is_active_idx" ON "task_library"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_benchmarks_task_library_id_contributor_id_key" ON "task_library_benchmarks"("task_library_id", "contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_skill_rates_task_library_id_skill_name_skill_l_key" ON "task_library_skill_rates"("task_library_id", "skill_name", "skill_level");

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_skill_rates" ADD CONSTRAINT "task_library_skill_rates_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
