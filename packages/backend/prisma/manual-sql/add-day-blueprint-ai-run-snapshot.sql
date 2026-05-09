-- Adds snapshot_json + cancel_requested_at to day_blueprint_ai_runs.
-- Idempotent (uses IF NOT EXISTS) so it is safe to re-run while the
-- baseline migration still owns the rest of the table definition.
ALTER TABLE "day_blueprint_ai_runs"
  ADD COLUMN IF NOT EXISTS "snapshot_json" JSONB,
  ADD COLUMN IF NOT EXISTS "cancel_requested_at" TIMESTAMP(3);
