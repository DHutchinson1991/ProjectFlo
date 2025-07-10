-- Schema Migration: Consolidate SceneMusicOption into SceneMediaComponent
-- This script merges music options into the unified media component structure

-- Step 1: Add music-specific fields to SceneMediaComponent
ALTER TABLE scene_media_components 
ADD COLUMN music_type VARCHAR(20) NULL,
ADD COLUMN music_weight INTEGER DEFAULT 5;

-- Step 2: Create index for music queries
CREATE INDEX idx_scene_media_music_type ON scene_media_components(music_type) WHERE media_type = 'MUSIC';

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
JOIN scenes_library sl ON smo.scene_id = sl.id;

-- Step 4: Verify migration (count should match)
-- SELECT COUNT(*) FROM scene_music_options; -- Original count
-- SELECT COUNT(*) FROM scene_media_components WHERE media_type = 'MUSIC'; -- Should match

-- Step 5: Update Prisma schema (manual step - see below)
-- Step 6: Update application code (manual step - see below)
-- Step 7: Drop the old table (after verification)
-- DROP TABLE scene_music_options;

/*
PRISMA SCHEMA UPDATES NEEDED:

1. Remove SceneMusicOption model entirely
2. Update SceneMediaComponent model:

model SceneMediaComponent {
  id               Int       @id @default(autoincrement())
  scene_id         Int
  media_type       MediaType // VIDEO, AUDIO, MUSIC
  duration_seconds Int
  is_primary       Boolean   @default(false)
  volume_level     Decimal?  @db.Decimal(3, 2)
  sync_offset      Int?      @default(0)
  
  // Music-specific fields (only used when media_type = MUSIC)
  music_type       String?   // Maps to MusicType enum values
  music_weight     Int?      @default(5)
  
  notes            String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  scene ScenesLibrary @relation(fields: [scene_id], references: [id], onDelete: Cascade)

  @@index([scene_id])
  @@index([media_type])
  @@index([music_type], map: "idx_music_type") // Only for MUSIC media_type
  @@map("scene_media_components")
}

3. Remove music_options relation from ScenesLibrary:
model ScenesLibrary {
  // ... other fields ...
  // Remove this line:
  // music_options           SceneMusicOption[]
  // Keep this line:
  media_components        SceneMediaComponent[]
  // ... rest of model ...
}

APPLICATION CODE UPDATES NEEDED:

1. Update any queries that used SceneMusicOption to use SceneMediaComponent with media_type = 'MUSIC'
2. Update scene creation/editing logic to handle music through media_components
3. Update frontend components to show music options as media components

EXAMPLE QUERY CHANGES:

Before:
```typescript
// Get music options for a scene
const musicOptions = await prisma.sceneMusicOption.findMany({
  where: { scene_id: sceneId }
});
```

After:
```typescript
// Get music components for a scene
const musicComponents = await prisma.sceneMediaComponent.findMany({
  where: { 
    scene_id: sceneId,
    media_type: 'MUSIC'
  }
});
```

BENEFITS:
- Unified media component handling
- Simpler data model (one less table)
- Consistent API for all media types
- Better support for complex scenes with multiple media types
- Easier to implement features like sync_offset for music
*/
