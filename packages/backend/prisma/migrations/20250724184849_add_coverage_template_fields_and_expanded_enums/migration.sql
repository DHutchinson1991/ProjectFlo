-- CreateEnum
CREATE TYPE "VideoStyleType" AS ENUM ('FULL', 'MONTAGE', 'CINEMATIC');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AudioEquipment" ADD VALUE 'HANDHELD_MIC';
ALTER TYPE "AudioEquipment" ADD VALUE 'SHOTGUN_MIC';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CameraMovement" ADD VALUE 'TILT';
ALTER TYPE "CameraMovement" ADD VALUE 'ZOOM';
ALTER TYPE "CameraMovement" ADD VALUE 'DOLLY';
ALTER TYPE "CameraMovement" ADD VALUE 'CRANE';
ALTER TYPE "CameraMovement" ADD VALUE 'DRONE';
ALTER TYPE "CameraMovement" ADD VALUE 'STEADICAM';

-- AlterEnum
ALTER TYPE "ShotType" ADD VALUE 'MASTER_SHOT';

-- AlterTable
ALTER TABLE "coverage" ADD COLUMN     "is_template" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "video_style_type" "VideoStyleType";
