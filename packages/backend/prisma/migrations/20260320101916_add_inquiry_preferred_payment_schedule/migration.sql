-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "preferred_payment_schedule_template_id" INTEGER;

-- CreateIndex
CREATE INDEX "inquiries_preferred_payment_schedule_template_id_idx" ON "inquiries"("preferred_payment_schedule_template_id");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_preferred_payment_schedule_template_id_fkey" FOREIGN KEY ("preferred_payment_schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
