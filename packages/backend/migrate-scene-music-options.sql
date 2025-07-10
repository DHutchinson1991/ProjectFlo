-- Migration: Consolidate SceneMusicOption into SceneMediaComponent
-- This migration adds music-specific fields to SceneMediaComponent and migrates data

-- Step 1: Add new columns to scene_media_components
ALTER TABLE scene_media_components 
ADD COLUMN music_type VARCHAR(50) NULL,
ADD COLUMN music_weight INTEGER DEFAULT 5;

-- Step 2: Create index for music queries
CREATE INDEX idx_scene_media_music_type ON scene_media_components(music_type) 
WHERE media_type = 'MUSIC';

-- Step 3: Migrate existing SceneMusicOption data to SceneMediaComponent
INSERT INTO scene_media_components (
    scene_id,
    media_type,
    duration_seconds,
    is_primary,
    music_type,
    music_weight,
    notes,
    created_at,
    updated_at
)
SELECT 
    smo.scene_id,
    'MUSIC' as media_type,
    COALESCE(sl.estimated_duration, 30) as duration_seconds, -- Default 30s if no duration
    false as is_primary, -- Music is typically not primary
    smo.music_type::text as music_type,
    smo.weight as music_weight,
    'Migrated from SceneMusicOption' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM scene_music_options smo
JOIN scenes_library sl ON smo.scene_id = sl.id
WHERE NOT EXISTS (
    -- Avoid duplicates if migration is run multiple times
    SELECT 1 FROM scene_media_components smc 
    WHERE smc.scene_id = smo.scene_id 
    AND smc.media_type = 'MUSIC' 
    AND smc.music_type = smo.music_type::text
);

-- Step 4: Verification queries (run these to check migration)
-- SELECT COUNT(*) as original_count FROM scene_music_options;
-- SELECT COUNT(*) as migrated_count FROM scene_media_components WHERE media_type = 'MUSIC';
-- SELECT 'Migration complete' as status WHERE 
--   (SELECT COUNT(*) FROM scene_music_options) = 
--   (SELECT COUNT(*) FROM scene_media_components WHERE media_type = 'MUSIC');

-- Step 5: After verification, drop the old table (uncomment when ready)
-- DROP TABLE scene_music_options;
