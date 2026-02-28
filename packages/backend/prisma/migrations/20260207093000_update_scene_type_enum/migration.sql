-- AlterEnum
ALTER TYPE "SceneType" RENAME TO "SceneType_old";

CREATE TYPE "SceneType" AS ENUM ('MOMENTS', 'MONTAGE');

ALTER TABLE "scene_templates" ALTER COLUMN "type" TYPE "SceneType" USING (
    CASE
        WHEN "type" IS NULL THEN NULL
        ELSE 'MOMENTS'::"SceneType"
    END
);

DROP TYPE "SceneType_old";
