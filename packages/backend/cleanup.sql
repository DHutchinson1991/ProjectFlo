-- Check and clean up existing data before migration
SELECT 'Checking component_library table...' as status;

-- Check if there are any records with old enum values
SELECT COUNT(*) as count_with_old_enum, type 
FROM component_library 
WHERE type IN ('COVERAGE_BASED', 'PRODUCTION')
GROUP BY type;

-- Delete records with old enum values if any exist
DELETE FROM component_library WHERE type IN ('COVERAGE_BASED', 'PRODUCTION');

SELECT 'Cleanup complete. Ready for migration.' as status;
