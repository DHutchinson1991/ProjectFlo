-- Cleanup legacy film/scene/moment/coverage data
-- Safe, data-only deletes (no schema changes)

-- Step 1: Delete SceneCoverage records
DELETE FROM "scene_coverage" WHERE "id" IS NOT NULL;

-- Step 3: Delete LocalSceneComponent records
DELETE FROM "film_local_scene_media_components" WHERE "id" IS NOT NULL;

-- Step 4: Delete Moment records
DELETE FROM "scene_moments" WHERE "id" IS NOT NULL;

-- Step 5: Delete LocalScene records
DELETE FROM "film_local_scenes" WHERE "id" IS NOT NULL;

-- Step 6: Delete Film assigned scenes
DELETE FROM "film_assigned_scenes" WHERE "film_id" IS NOT NULL;

-- Step 7: Delete Film records
DELETE FROM "film_library" WHERE "id" IS NOT NULL;

-- Step 7: Delete Timeline layers
DELETE FROM "timeline_layers" WHERE "id" IS NOT NULL;

-- Step 8: Delete Coverage records (after SceneCoverage)
DELETE FROM "coverage" WHERE "id" IS NOT NULL;