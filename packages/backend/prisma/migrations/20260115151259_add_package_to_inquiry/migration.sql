-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "selected_package_id" INTEGER;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_selected_package_id_fkey" FOREIGN KEY ("selected_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
