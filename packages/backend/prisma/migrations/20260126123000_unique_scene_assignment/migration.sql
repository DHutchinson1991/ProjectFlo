-- Deduplicate existing scene coverage assignments (keep the lowest id per scene_id + assignment)
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY scene_id, assignment ORDER BY id) AS rn
    FROM scene_coverage
    WHERE assignment IS NOT NULL
)
DELETE FROM scene_coverage
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Enforce uniqueness of assignment per scene
ALTER TABLE "scene_coverage"
ADD CONSTRAINT "scene_coverage_scene_id_assignment_key" UNIQUE ("scene_id", "assignment");
