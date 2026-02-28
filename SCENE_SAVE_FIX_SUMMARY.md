# Scene Save and Ordering Fix - Summary

## Issues Fixed

### 1. **Scenes Appearing at Wrong Position** ❌→✅
**Problem**: Newly saved scenes appeared at the start of the timeline underneath existing scenes instead of in their correct position.

**Root Cause**: 
- Scenes were not being sorted by `order_index` after loading from database
- The `order_index` wasn't being preserved from the database to the frontend

**Solution**:
- Modified `enrichScenesWithMoments.ts` to:
  - Log `order_index` for each scene during processing
  - Sort all scenes by `order_index` before returning
  - Preserve `order_index` from database when creating TimelineScene objects
- Updated `TimelineScene` type to include `order_index` field
- Added logging to track sorting operations

**Files Modified**:
- `src/hooks/films/enrichScenesWithMoments.ts`
- `src/lib/types/timeline.ts`

### 2. **Moments Not Persisting After Save** ❌→✅
**Problem**: When a scene with 3 moments was created, it showed 3 moments initially, but after refresh it showed 0 moments.

**Root Cause**: 
- `useTimelineSave` was only saving the scene record to the database
- The moments from the template were never being persisted to the `SceneMoment` table
- After reload, enrichment tried to fetch moments from template, but if template changed or moments don't exist in DB, they'd be lost

**Solution**:
- Modified `useTimelineSave.ts` to:
  - After successfully creating a scene in the database, immediately save all its moments
  - For each moment in `scene.moments`, call `scenesApi.moments.create()`
  - Track moment creation with order_index to maintain sequence
  - Added comprehensive logging for moment save operations
  - Handle moment save failures gracefully (scene still persisted, just moments failed)

**Files Modified**:
- `src/hooks/content-builder/data/useTimelineSave.ts`

### 3. **Duplicate Scenes Being Created** ❌→✅
**Problem**: When saving, scenes with IDs 20 and 21 were both created for "Getting Ready" scene.

**Root Cause**:
- After save completes, scenes weren't marked as `isNew = false`
- If save was called again, the detection logic (checking for client-generated IDs > 1000000000000) couldn't distinguish between old and new scenes
- Scenes with database IDs (19, 20, 21) were being saved again as if they were new

**Solution**:
- Modified `ContentBuilderContext.tsx` to:
  - After save completes and ID mapping is applied, mark all scenes as `isNew: false`
  - Even scenes that didn't get ID mapping updates are marked as not new
  - Added logging to track which scenes are marked as saved
  - Save hook now uses this flag plus client ID check to prevent re-saves

**Files Modified**:
- `src/app/(studio)/designer/components/ContentBuilder/context/ContentBuilderContext.tsx`

## Code Changes

### Change 1: useTimelineSave.ts - Add Moment Persistence
```typescript
// After successful scene creation, save all moments from the scene
if (scene.moments && scene.moments.length > 0) {
    console.log(`📍 [SAVE] Saving ${scene.moments.length} moments for scene ${newDatabaseId}`);
    for (let momentIndex = 0; momentIndex < scene.moments.length; momentIndex++) {
        const moment = scene.moments[momentIndex];
        const momentData = {
            film_scene_id: newDatabaseId,
            name: moment.name,
            order_index: momentIndex,
            duration: moment.duration || 60,
        };
        const momentResult = await scenesApi.moments.create(momentData);
    }
}
```

### Change 2: enrichScenesWithMoments.ts - Add Sorting
```typescript
// Sort by order_index to maintain correct scene sequence
const sortedScenes = [...timelineScenes].sort((a, b) => {
    const aOrder = (a as any).order_index ?? Infinity;
    const bOrder = (b as any).order_index ?? Infinity;
    return aOrder - bOrder;
});

// Preserve order_index when creating TimelineScene
timelineScenes.push({
    id: scene.id,
    order_index: scene.order_index, // 🔥 Preserve from database
    moments: momentsList,
    // ... other fields
});
```

### Change 3: ContentBuilderContext.tsx - Mark Saved Scenes
```typescript
const updatedScenes = scenes.map(scene => {
    if (idMapping.has(scene.id)) {
        const databaseId = idMapping.get(scene.id)!;
        return { ...scene, id: databaseId, isNew: false }; // Mark as saved
    }
    return { ...scene, isNew: false }; // Mark all as not new
});
```

### Change 4: timeline.ts - Update Type Definition
```typescript
export interface TimelineScene {
    // ... existing fields
    order_index?: number;      // 🔥 New field
    moments?: any[];           // 🔥 New field
    coverage_items?: any[];    // 🔥 New field
    music?: any;               // 🔥 New field
}
```

## Debugging Logs Added

All changes include comprehensive console logging to help debug any future issues:

### In useTimelineSave.ts:
```
📍 [SAVE] Scene order_index: N
📍 [SAVE] Saving 3 moments for scene 20
  📍 [SAVE] Moment 1/3: Bride Putting on Dress (60s)
  ✅ [SAVE] Moment created: ID 45
✅ [SAVE] All moments saved for scene 20
```

### In enrichScenesWithMoments.ts:
```
📥 [ENRICH] Input scenes: [{id: 19, name: 'Ceremony', order_index: 0}, ...]
📊 [ENRICH-SORT] Comparing Ceremony (order: 0) vs Getting Ready (order: 1)
✅ [ENRICH] Scenes sorted by order_index: [{id: 19, order: 0}, {id: 20, order: 1}, ...]
```

### In ContentBuilderContext.tsx:
```
💾 [CONTEXT] Applying ID mapping to scenes
💾 [CONTEXT] Updating scene ID: 1769981721797 → 19
💾 [CONTEXT] Updated scenes after ID mapping: [{id: 19, isNew: false, moments: 5}, ...]
```

## Testing the Fix

### Test Case 1: Scene Order
1. Load a film with multiple scenes
2. Add a new scene (it will have a large client ID like 1769981721797)
3. Click Save
4. Check console logs for:
   - ✅ Scene saved successfully with database ID
   - ✅ Order index set correctly
   - ✅ Scene placed in correct position (not at start)
5. Refresh the page
6. Verify scenes appear in same order

### Test Case 2: Moment Persistence
1. Add a new scene with template that has 3 moments
2. Check console for "Saving 3 moments"
3. Click Save
4. Check console for "Moment created: ID X" (should appear 3 times)
5. Refresh the page
6. Verify moments still show 3 (not 0)

### Test Case 3: No Duplicates
1. Add scene
2. Click Save
3. Check database - should have 1 new scene
4. Click Save again
5. Check database - should still have 1 scene (not 2)
6. Check console for "Skipping already saved scene"

## Console Log Format

All logs follow this pattern:
- 📍 [SECTION] Informational message
- ✅ [SECTION] Success message
- ❌ [SECTION] Error message
- ⚠️ [SECTION] Warning message
- 📥/📤 [SECTION] Data flow message
- 🔥 Important changes/fixes

This makes it easy to grep/search for specific operations in browser DevTools.

## Backwards Compatibility

All changes are backwards compatible:
- New fields added to TimelineScene are optional
- Existing code that doesn't use these fields continues to work
- Moment persistence is automatic and transparent to calling code
- Sorting happens transparently during scene loading

## Performance Impact

Minimal performance impact:
- Moment saving adds one API call per moment (already necessary for persistence)
- Scene sorting is O(n log n) and only happens once during initial load
- No additional API calls for existing workflows

## Future Enhancements

1. Batch moment creation API endpoint for better performance
2. Transaction support to ensure scenes and moments are created atomically
3. Cascading delete for moments when scene is deleted
4. UI validation to prevent scene operations while save is in progress
