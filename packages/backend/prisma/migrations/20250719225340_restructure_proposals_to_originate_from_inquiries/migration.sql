/*
  Warnings:

  - Added the required column `inquiry_id` to the `proposals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_project_id_fkey";

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "content" JSONB,
ADD COLUMN     "inquiry_id" INTEGER NOT NULL,
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "project_id" DROP NOT NULL,
ALTER COLUMN "title" SET DEFAULT 'New Proposal',
ALTER COLUMN "status" SET DEFAULT 'Draft';

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
