-- CreateEnum
CREATE TYPE "inquiry_availability_request_status" AS ENUM ('pending', 'confirmed', 'declined', 'cancelled');

-- CreateTable
CREATE TABLE "inquiry_availability_requests" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "project_day_operator_id" INTEGER,
    "status" "inquiry_availability_request_status" NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_availability_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiry_availability_requests_inquiry_id_idx" ON "inquiry_availability_requests"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_availability_requests_contributor_id_idx" ON "inquiry_availability_requests"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_availability_requests_inquiry_id_contributor_id_key" ON "inquiry_availability_requests"("inquiry_id", "contributor_id");

-- AddForeignKey
ALTER TABLE "inquiry_availability_requests" ADD CONSTRAINT "inquiry_availability_requests_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_availability_requests" ADD CONSTRAINT "inquiry_availability_requests_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
