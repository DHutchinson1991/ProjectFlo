-- Day Designer: moments always use floor-plan placements; drop legacy no_spatial flag from JSON lock_flags.
UPDATE "day_blueprint_moments"
SET "lock_flags" = "lock_flags"::jsonb - 'no_spatial'
WHERE "lock_flags" IS NOT NULL
  AND "lock_flags"::jsonb ? 'no_spatial';
