-- DropConstraint
ALTER TABLE "scene_coverage" DROP CONSTRAINT IF EXISTS "scene_coverage_scene_id_assignment_key";

-- DropIndex (in case it exists as a standalone index)
DROP INDEX IF EXISTS "scene_coverage_scene_id_assignment_key";
