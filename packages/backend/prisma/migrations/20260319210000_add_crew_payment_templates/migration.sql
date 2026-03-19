-- CreateTable
CREATE TABLE "crew_payment_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role_type" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crew_payment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_payment_rules" (
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

    CONSTRAINT "crew_payment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crew_payment_templates_brand_id_idx" ON "crew_payment_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "crew_payment_templates_brand_id_name_key" ON "crew_payment_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "crew_payment_rules_template_id_idx" ON "crew_payment_rules"("template_id");

-- AddForeignKey
ALTER TABLE "crew_payment_templates" ADD CONSTRAINT "crew_payment_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_payment_rules" ADD CONSTRAINT "crew_payment_rules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "crew_payment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
