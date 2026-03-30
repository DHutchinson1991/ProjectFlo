-- Remove locations spaces and floor-plan persistence.

ALTER TABLE "locations_library"
  DROP COLUMN IF EXISTS "venue_floor_plan_data",
  DROP COLUMN IF EXISTS "venue_floor_plan_updated_at",
  DROP COLUMN IF EXISTS "venue_floor_plan_updated_by",
  DROP COLUMN IF EXISTS "venue_floor_plan_version";

DROP TABLE IF EXISTS "floor_plan_objects" CASCADE;
DROP TABLE IF EXISTS "floor_plans" CASCADE;
DROP TABLE IF EXISTS "location_spaces" CASCADE;
