-- Add payment_terms column to crew_payment_templates
ALTER TABLE "crew_payment_templates" ADD COLUMN "payment_terms" TEXT DEFAULT 'DUE_ON_RECEIPT';

-- Add task_library_id and frequency columns to crew_payment_rules
ALTER TABLE "crew_payment_rules" ADD COLUMN "task_library_id" INTEGER;
ALTER TABLE "crew_payment_rules" ADD COLUMN "frequency" TEXT;

-- Add foreign key constraint for task_library reference
ALTER TABLE "crew_payment_rules" ADD CONSTRAINT "crew_payment_rules_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for task_library_id lookups
CREATE INDEX "crew_payment_rules_task_library_id_idx" ON "crew_payment_rules"("task_library_id");
