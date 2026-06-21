-- CreateEnum
CREATE TYPE "ShotCoupling" AS ENUM ('LINKED', 'PINNED');

-- AlterTable
ALTER TABLE "camera_subject_assignments" ADD COLUMN "shot_coupling" "ShotCoupling" DEFAULT 'LINKED';
