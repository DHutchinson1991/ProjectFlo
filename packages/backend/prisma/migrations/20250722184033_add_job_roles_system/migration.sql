-- CreateTable
CREATE TABLE "job_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_name" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_job_roles" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,

    CONSTRAINT "contributor_job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_name_key" ON "job_roles"("name");

-- CreateIndex
CREATE INDEX "job_roles_category_idx" ON "job_roles"("category");

-- CreateIndex
CREATE INDEX "job_roles_is_active_idx" ON "job_roles"("is_active");

-- CreateIndex
CREATE INDEX "contributor_job_roles_contributor_id_idx" ON "contributor_job_roles"("contributor_id");

-- CreateIndex
CREATE INDEX "contributor_job_roles_job_role_id_idx" ON "contributor_job_roles"("job_role_id");

-- CreateIndex
CREATE INDEX "contributor_job_roles_is_primary_idx" ON "contributor_job_roles"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_job_roles_contributor_id_job_role_id_key" ON "contributor_job_roles"("contributor_id", "job_role_id");

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
