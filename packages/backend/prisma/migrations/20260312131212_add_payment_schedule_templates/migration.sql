-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "schedule_template_id" INTEGER;

-- CreateTable
CREATE TABLE "payment_schedule_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedule_rules" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount_type" TEXT NOT NULL DEFAULT 'PERCENT',
    "amount_value" DECIMAL(10,2) NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "trigger_days" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_payment_milestones" (
    "id" SERIAL NOT NULL,
    "estimate_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_payment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_schedule_templates_brand_id_idx" ON "payment_schedule_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedule_templates_brand_id_name_key" ON "payment_schedule_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "payment_schedule_rules_template_id_idx" ON "payment_schedule_rules"("template_id");

-- CreateIndex
CREATE INDEX "estimate_payment_milestones_estimate_id_idx" ON "estimate_payment_milestones"("estimate_id");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_schedule_template_id_fkey" FOREIGN KEY ("schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedule_templates" ADD CONSTRAINT "payment_schedule_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedule_rules" ADD CONSTRAINT "payment_schedule_rules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_payment_milestones" ADD CONSTRAINT "estimate_payment_milestones_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
