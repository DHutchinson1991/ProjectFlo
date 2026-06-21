-- Day Designer generation mode defaults to NORMAL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'DayBlueprintGenerationMode'
  ) THEN
    CREATE TYPE "DayBlueprintGenerationMode" AS ENUM ('NORMAL', 'AI');
  END IF;
END
$$;

ALTER TABLE "day_blueprint_versions"
  ADD COLUMN IF NOT EXISTS "generation_mode" "DayBlueprintGenerationMode" NOT NULL DEFAULT 'NORMAL';
