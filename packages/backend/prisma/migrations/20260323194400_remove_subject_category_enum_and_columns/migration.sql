-- DropForeignKey
ALTER TABLE "film_subjects" DROP CONSTRAINT "film_subjects_role_template_id_fkey";

-- DropForeignKey
ALTER TABLE "project_film_subjects" DROP CONSTRAINT "project_film_subjects_role_template_id_fkey";

-- AlterTable
ALTER TABLE "film_subjects" DROP COLUMN "category",
DROP COLUMN "is_custom",
ALTER COLUMN "role_template_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "package_day_subjects" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "project_day_subjects" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "project_film_subjects" DROP COLUMN "category",
DROP COLUMN "is_custom",
ALTER COLUMN "role_template_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "subject_templates" DROP COLUMN "category";

-- DropEnum
DROP TYPE "SubjectCategory";

-- AddForeignKey
ALTER TABLE "film_subjects" ADD CONSTRAINT "film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
