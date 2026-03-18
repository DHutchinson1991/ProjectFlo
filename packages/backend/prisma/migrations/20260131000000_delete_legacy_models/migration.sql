-- Drop all foreign key constraints first
ALTER TABLE "film_assigned_scenes" DROP CONSTRAINT IF EXISTS "film_assigned_scenes_scene_id_fkey";
ALTER TABLE "film_local_scenes" DROP CONSTRAINT IF EXISTS "film_local_scenes_original_scene_id_fkey";
ALTER TABLE "scene_coverage" DROP CONSTRAINT IF EXISTS "scene_coverage_scene_id_fkey";
ALTER TABLE "scene_moments" DROP CONSTRAINT IF EXISTS "scene_moments_scene_id_fkey";
ALTER TABLE "scene_subjects" DROP CONSTRAINT IF EXISTS "scene_subjects_scene_id_fkey";
ALTER TABLE "scene_subjects" DROP CONSTRAINT IF EXISTS "scene_subjects_subject_id_fkey";
ALTER TABLE "music_library" DROP CONSTRAINT IF EXISTS "music_library_scene_id_fkey";
ALTER TABLE "scene_template_defaults" DROP CONSTRAINT IF EXISTS "scene_template_defaults_film_id_fkey";

-- Drop old tables in dependency order
DROP TABLE IF EXISTS "film_assigned_scenes" CASCADE;
DROP TABLE IF EXISTS "film_local_scene_media_components" CASCADE;
DROP TABLE IF EXISTS "film_local_scenes" CASCADE;
DROP TABLE IF EXISTS "scene_coverage" CASCADE;
DROP TABLE IF EXISTS "scene_moment_music" CASCADE;
DROP TABLE IF EXISTS "scene_moments" CASCADE;
DROP TABLE IF EXISTS "scene_subjects" CASCADE;
DROP TABLE IF EXISTS "scene_template_defaults" CASCADE;

-- Drop the old library/template models
DROP TABLE IF EXISTS "scenes_library" CASCADE;
DROP TABLE IF EXISTS "subjects_library" CASCADE;
DROP TABLE IF EXISTS "music_library" CASCADE;

-- Drop scene dependency models
DROP TABLE IF EXISTS "scene_dependency" CASCADE;
DROP TABLE IF EXISTS "scene_location_space" CASCADE;
DROP TABLE IF EXISTS "scene_media_component" CASCADE;
DROP TABLE IF EXISTS "scene_usage_analytics" CASCADE;

-- Drop timeline change models
DROP TABLE IF EXISTS "timeline_change_log" CASCADE;
DROP TABLE IF EXISTS "timeline_scene" CASCADE;
DROP TABLE IF EXISTS "timeline_editing_session" CASCADE;

-- Drop scene template models
DROP TABLE IF EXISTS "scene_template_suggested_subject" CASCADE;
DROP TABLE IF EXISTS "scene_template" CASCADE;

-- Drop moment templates
DROP TABLE IF EXISTS "moment_templates" CASCADE;
DROP TABLE IF EXISTS "project_moment_defaults" CASCADE;

-- Ensure tables with only legacy references are clean
DELETE FROM "projects" WHERE "id" NOT IN (SELECT DISTINCT "project_id" FROM "builds" WHERE "project_id" IS NOT NULL);
