-- CreateTable
CREATE TABLE "estimate_snapshots" (
    "id" SERIAL NOT NULL,
    "estimate_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshotted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "items_snapshot" JSONB NOT NULL,
    "label" TEXT,

    CONSTRAINT "estimate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estimate_snapshots_estimate_id_idx" ON "estimate_snapshots"("estimate_id");

-- AddForeignKey
ALTER TABLE "estimate_snapshots" ADD CONSTRAINT "estimate_snapshots_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
