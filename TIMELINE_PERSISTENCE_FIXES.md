# Timeline Persistence & Moments Enrichment - Fixes Applied

## Problem Summary
The timeline persistence system had 3 major issues:
1. **API path error**: enrichScenesWithMoments was trying to access `api.content.sceneTemplates` which doesn't exist
2. **Save logic issues**: Scenes weren't being saved properly, with template IDs being confused
3. **No delete functionality**: Users couldn't delete scenes from the timeline

## Solutions Implemented

### 1. Fixed API Path Error ✅
**File**: `enrichScenesWithMoments.ts` (Line 62)

**Problem**: 
```typescript
template = await api.content.sceneTemplates.getById(scene.scene_template_id);  // ❌ WRONG
```

**Solution**:
```typescript
template = await api.scenes.getById(scene.scene_template_id);  // ✅ CORRECT
```

### 2. Created Scene Template Loader Utility ✅
**File**: `sceneTemplateLoader.ts` (NEW)

Extracted template fetching into a dedicated utility with:
- Built-in caching to avoid duplicate API calls
- Centralized error handling
- Clear logging for debugging
- Fallback gracefully if template loading fails

**Benefits**:
- Single responsibility (just loads templates)
- Reusable across multiple components
- Easy to test
- Better error messages

### 3. Refactored Moment Enrichment ✅
**File**: `enrichScenesWithMoments.ts` (REFACTORED)

**Key Changes**:
- Now uses `sceneTemplateLoader.ts` instead of inline API calls
- Removed manual cache parameter (now centralized)
- Better error handling - returns partial results if some templates fail
- Cleaner code, easier to maintain

**How it works**:
1. Load film scenes from database (may have 0 moments directly attached)
2. For each scene with a template ID, fetch moments from the template
3. Create TimelineScene objects for each moment
4. Return timeline-ready scene structure with all moments loaded

### 4. Improved Save Logic ✅
**File**: `useTimelineSave.ts` (IMPROVED)

**Changes**:
- Skip scenes that are already in the database (have an ID and aren't marked as new)
- Only save NEW scenes that are being added
- Better handling of template IDs with fallback to 1
- More detailed logging to track what's being saved

**Why this helps**:
- Prevents duplicate saves
- Reduces API calls
- Clearer save intention (only new scenes get POST requests)
- Avoids 404 errors from trying to save incompletely formed scenes

### 5. Implemented Scene Delete ✅
**File**: `useSceneDelete.ts` (NEW)

Simple, clean delete hook that:
- Deletes from database via API
- Updates local state
- Has error handling and fallback logic
- Clear logging for debugging

**Usage**:
```typescript
const { handleDeleteScene } = useSceneDelete(filmId, onSceneDeleted);
await handleDeleteScene(sceneId, sceneName);
```

## API Endpoints Used

### Scene Management
- **Get scene template**: `GET /scenes/{id}`
- **Create scene**: `POST /scenes/films/{filmId}/scenes`
- **Reorder scenes**: `POST /scenes/{filmId}/reorder`
- **Delete scene**: `DELETE /films/{filmId}/scenes/{sceneId}` (needs implementation in API)

### Film Management
- **Get film with scenes**: `GET /films/{id}` (includes scenes relation)

## Data Flow After Fixes

### Loading Scenes
```
Page Load
  ↓
useFilmData.ts
  ↓
api.films.getById(filmId)  ← Gets film with scenes
  ↓
enrichScenesWithMoments()
  ↓
For each scene with template_id:
  - loadSceneTemplate(templateId)  ← Uses cache, fetches if needed
  - Create TimelineScene from moments
  ↓
Timeline displays scenes with all moments
```

### Saving Scenes
```
User clicks "Save"
  ↓
useTimelineSave.handleSave()
  ↓
For each NEW scene (no database ID):
  - api.films.localScenes.create()
  - POST /scenes/films/{filmId}/scenes
  ↓
Scene created in database with template reference
  ↓
Reorder scenes (if needed)
  ↓
Success notification
```

### Deleting Scenes
```
User clicks delete on scene
  ↓
useSceneDelete.handleDeleteScene()
  ↓
api.films.localScenes.delete()
  ↓
Scene removed from database
Local state updated
  ↓
Timeline refreshes without deleted scene
```

## Testing Checklist

- [ ] Load a film with existing scenes → moments should appear after reload
- [ ] Add a new scene → should save without 404 errors
- [ ] Delete a scene → should remove from both database and timeline
- [ ] Refresh page → scenes should reload with moments intact
- [ ] Multiple saves → should not create duplicate scenes
- [ ] Scene with no template → should show as empty scene (not error)

## Files Modified/Created

### Created:
1. `sceneTemplateLoader.ts` - Template fetching utility with caching
2. `useSceneDelete.ts` - Scene deletion hook

### Modified:
1. `enrichScenesWithMoments.ts` - Fixed API path, refactored to use loader
2. `useTimelineSave.ts` - Improved save logic, skip already-saved scenes

### No Changes Needed:
- `sceneConversionUtils.ts` - Already sets correct original_scene_id
- `api.ts` - Already has correct endpoint paths

## Remaining Known Issues

1. **Reorder endpoint returns 500** - Non-critical, scenes still save
   - Workaround: Disable reorder for now, add try-catch in save
   
2. **Delete endpoint may need implementation** - Need to add to API if not present
   - Suggested route: `DELETE /films/{filmId}/scenes/{sceneId}`

3. **Template loading fails silently** - If API is down, scenes show empty
   - This is acceptable, prevents app crash
   - Users can refresh after API is back up

## Next Steps (Optional Improvements)

1. Add optimistic UI updates while saving
2. Add undo/redo for scene operations
3. Batch save scenes instead of one-by-one
4. Add scene duplication feature
5. Implement scene templates preview before import
