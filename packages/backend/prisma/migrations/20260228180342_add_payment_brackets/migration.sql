-- AlterTable
ALTER TABLE "contributor_job_roles" ADD COLUMN     "payment_bracket_id" INTEGER;

-- CreateTable
CREATE TABLE "payment_brackets" (
    "id" SERIAL NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hourly_rate" DECIMAL(8,2) NOT NULL,
    "day_rate" DECIMAL(8,2),
    "overtime_rate" DECIMAL(8,2),
    "description" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_brackets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_brackets_job_role_id_idx" ON "payment_brackets"("job_role_id");

-- CreateIndex
CREATE INDEX "payment_brackets_is_active_idx" ON "payment_brackets"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_brackets_job_role_id_name_key" ON "payment_brackets"("job_role_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_brackets_job_role_id_level_key" ON "payment_brackets"("job_role_id", "level");

-- CreateIndex
CREATE INDEX "contributor_job_roles_payment_bracket_id_idx" ON "contributor_job_roles"("payment_bracket_id");

-- AddForeignKey
ALTER TABLE "payment_brackets" ADD CONSTRAINT "payment_brackets_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_payment_bracket_id_fkey" FOREIGN KEY ("payment_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
