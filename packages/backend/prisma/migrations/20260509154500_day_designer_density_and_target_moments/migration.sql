-- Day Designer "moment density" support.
-- Per-activity override: nullable Int. When NULL the brand's density library
-- (brand_settings.day_designer_density_library_v1) is consulted by the AI
-- generator's skeleton builder.
ALTER TABLE "day_blueprint_activities" ADD COLUMN "target_moment_count" INTEGER;
