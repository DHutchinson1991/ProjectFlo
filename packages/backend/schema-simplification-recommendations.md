# ProjectFlo Database Schema Simplification Recommendations

## Current Scene-Related Tables (9 tables)

### Core Tables (Keep as-is):
1. **ScenesLibrary** - Main scene definitions ✅
2. **SceneMediaComponent** - Multi-media components ✅ 
3. **TimelineScene** - Scenes on timeline ✅
4. **TimelineLayer** - Timeline layers ✅

### Junction Tables (Keep as-is):
5. **SceneCoverage** - Scene-to-coverage mapping ✅
6. **FilmAssignedScenes** - Scene-to-film assignments ✅

### Tables to Consider for Consolidation:

## 1. MERGE: SceneMusicOption + SceneMediaComponent

**Current Structure:**
```sql
-- SceneMusicOption (separate table)
model SceneMusicOption {
  id         Int           @id @default(autoincrement())
  scene_id   Int
  music_type MusicType
  weight     Int           @default(5)
  scene      ScenesLibrary @relation(...)
}

-- SceneMediaComponent (handles video/audio)
model SceneMediaComponent {
  id               Int       @id @default(autoincrement())
  scene_id         Int
  media_type       MediaType // VIDEO, AUDIO, MUSIC
  duration_seconds Int
  is_primary       Boolean   @default(false)
  volume_level     Decimal?  @db.Decimal(3, 2)
  sync_offset      Int?      @default(0)
  // ...
}
```

**Recommended Consolidation:**
Since `SceneMediaComponent` already supports `MUSIC` as a media type, we can eliminate `SceneMusicOption` by adding music-specific fields to `SceneMediaComponent`:

```sql
model SceneMediaComponent {
  id               Int       @id @default(autoincrement())
  scene_id         Int
  media_type       MediaType // VIDEO, AUDIO, MUSIC
  duration_seconds Int
  is_primary       Boolean   @default(false)
  volume_level     Decimal?  @db.Decimal(3, 2)
  sync_offset      Int?      @default(0)
  
  -- Music-specific fields (only used when media_type = MUSIC)
  music_type       MusicType? // ORCHESTRAL, PIANO, etc.
  music_weight     Int?       @default(5) // Selection priority
  
  notes            String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
  scene ScenesLibrary @relation(...)
}
```

**Benefits:**
- Reduces from 9 to 8 tables (-11%)
- Maintains all functionality
- Single place to manage all media components
- Simpler queries for multi-media scenes

## 2. EVALUATE: SceneTemplateDefaults vs ScenesLibrary

**Current Duplication:**
- `ScenesLibrary.default_editing_style` (String)
- `SceneTemplateDefaults.default_editing_style_id` (Int FK)

**Analysis:**
`SceneTemplateDefaults` appears to be film-specific overrides, while `ScenesLibrary` has global defaults. This is actually proper normalization - keep both.

## 3. CONSIDER: SceneDependency Table Necessity

**Current Usage Check Needed:**
```sql
model SceneDependency {
  id                 Int           @id @default(autoincrement())
  parent_scene_id    Int
  dependent_scene_id Int
  dependency_type    String        @default("REQUIRED")
  description        String?
  // ...
}
```

**Questions:**
- Is this feature actively used?
- Could dependencies be handled at the timeline level instead?
- Are there real business requirements for scene-level dependencies?

**Recommendation:** Audit usage. If rarely used, consider removing to simplify.

## 4. OPTIMIZE: SceneUsageAnalytics Structure

**Current Structure:**
```sql
model SceneUsageAnalytics {
  id                         Int           @id @default(autoincrement())
  scene_id                   Int
  used_in_film_id            Int?
  used_in_build_id           Int?
  usage_date                 DateTime      @default(now())
  actual_duration_seconds    Int?
  estimated_duration_seconds Int?
  variance_percentage        Decimal?      @db.Decimal(5, 2)
  user_id                    Int?
  // ...
}
```

**Potential Optimization:**
This table could grow very large. Consider:
- Partitioning by date
- Aggregating old data
- Or moving to a separate analytics database

## 5. SIMPLIFY: build_scenes Integration

**Current Issue:**
`build_scenes` doesn't reference `ScenesLibrary` directly - it goes through `coverage`. This creates complexity.

**Current Flow:**
`build_scenes.coverage_id` → `coverage` → `SceneCoverage` → `ScenesLibrary`

**Consider Adding:**
Direct `scene_id` field to `build_scenes` for simpler queries, or evaluate if this table is still needed.

## Summary of Recommended Changes

### Immediate Simplifications (Low Risk):

1. **Merge SceneMusicOption into SceneMediaComponent**
   - Add `music_type` and `music_weight` fields to `SceneMediaComponent`
   - Drop `SceneMusicOption` table
   - Update related code to use unified media component structure

### Future Considerations (Requires Business Analysis):

2. **Audit SceneDependency usage** - Remove if unused
3. **Optimize SceneUsageAnalytics** - Consider partitioning or archival strategy
4. **Evaluate build_scenes complexity** - Consider adding direct scene reference

### Result:
- **Tables Reduced:** 9 → 8 (immediate), potentially → 7 (if dependencies removed)
- **Complexity Reduced:** Unified media component handling
- **Functionality Maintained:** All current features preserved
- **Query Simplification:** Easier multi-media scene queries

## Implementation Priority:

1. **High Priority:** Merge SceneMusicOption (clear benefit, low risk)
2. **Medium Priority:** Audit SceneDependency usage
3. **Low Priority:** Optimize analytics table (performance concern, not complexity)

This maintains the excellent normalization you have while reducing unnecessary table proliferation.
