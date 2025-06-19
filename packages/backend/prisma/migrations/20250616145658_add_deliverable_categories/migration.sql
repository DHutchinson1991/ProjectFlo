-- CreateTable
CREATE TABLE "deliverable_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_categories_name_key" ON "deliverable_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_categories_code_key" ON "deliverable_categories"("code");
