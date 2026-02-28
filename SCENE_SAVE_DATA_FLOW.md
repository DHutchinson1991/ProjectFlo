# Scene Save and Moments - Data Flow Diagram

## Before Fix ❌

```
USER ADDS SCENE "Getting Ready" WITH 3 MOMENTS
         |
         v
TimelineScene {id: 1769981721797, moments: [{...}, {...}, {...}]}
         |
         v
     [SAVE CLICKED]
         |
         v
useTimelineSave.handleSave()
         |
    +----+----+
    |         |
    v         v
[Scene       [Moments?]
 Save]         |
   |           v
   |       ❌ NEVER SAVED! (Bug - no moment API calls)
   |
   v
DB: FilmScene(id: 20, name: "Getting Ready", template_id: 3)
    ❌ NO moments in film_scene_moments table

         |
         v
Timeline updated with id: 20, moments: 3 (still in memory from template)
         |
         v
[REFRESH PAGE]
         |
         v
Load Film -> Get Scenes -> enrichScenesWithMoments()
         |
         v
FilmScene(id: 20) -> Load template 3 -> Get template moments
    ❌ But we don't know which moments were actually selected!
         |
         v
Show 0 moments (template doesn't have them, or wrong template)

```

## After Fix ✅

```
USER ADDS SCENE "Getting Ready" WITH 3 MOMENTS
         |
         v
TimelineScene {
    id: 1769981721797,
    order_index: 1,
    moments: [
        {name: "Bride Getting Dress", duration: 60},
        {name: "Makeup", duration: 45},
        {name: "Final Touch", duration: 30}
    ]
}
         |
         v
     [SAVE CLICKED]
         |
         v
useTimelineSave.handleSave()
         |
    +----+---+----+
    |       |     |
    v       v     v
[Scene   [Order   [Moments
 Save]   Update]   Save]
 |        |        |
 |        |    +---+---+---+
 |        |    |   |   |   |
 |        |    v   v   v   v
 |        | [M1][M2][M3]API calls
 |        |    |   |   |
 v        v    v   v   v
DB:
  FilmScene(id: 20, name: "Getting Ready", order_index: 1)
  FilmSceneMoment(film_scene_id: 20, name: "Bride Getting Dress", order_index: 0)
  FilmSceneMoment(film_scene_id: 20, name: "Makeup", order_index: 1)
  FilmSceneMoment(film_scene_id: 20, name: "Final Touch", order_index: 2)
         |
         v
Context updates scene IDs: 1769981721797 -> 20, marks isNew: false
         |
         v
[REFRESH PAGE]
         |
         v
Load Film -> Get Scenes -> enrichScenesWithMoments()
         |
         v
FilmScene(id: 20, order_index: 1) with embedded moments array [3 items]
         |
         v
Sort scenes by order_index (ensure correct position)
         |
         v
Show Scene 20 at position 1 with 3 moments ✅

```

## Key Improvements

### 1. Moment Persistence Flow (NEW)
```
Scene Creation Success
         |
         v
FOR EACH moment in scene.moments:
    |
    v
    Create CreateSceneMomentDto {
        film_scene_id: databaseId,
        name: moment.name,
        order_index: momentIndex,
        duration: moment.duration
    }
         |
         v
    scenesApi.moments.create(momentData)
         |
         v
    Log: "✅ Moment created: ID X"
```

### 2. Scene Ordering Flow (NEW)
```
Load Film Scenes
         |
         v
enrichScenesWithMoments(filmScenes)
         |
         v
FOR EACH scene:
    - Preserve order_index from database
    - Create TimelineScene with order_index field
         |
         v
SORT scenes by order_index
    scenes.sort((a,b) => a.order_index - b.order_index)
         |
         v
Return sorted TimelineScenes
         |
         v
Display in timeline (correct position!)
```

### 3. Duplicate Prevention Flow (NEW)
```
After Save Completes
         |
         v
Get ID Mapping {
    1769981721797: 20,
    1234567890123: 21,
    ...
}
         |
         v
Update scenes in state:
FOR EACH scene:
    - Replace client ID with database ID
    - Mark scene as isNew: false
         |
         v
Next save call:
    Check: if (isClientGeneratedId || isNew) -> Save
    Since isNew: false, won't save again ✅
```

## Data Table Evolution

### Before Save
```
LocalState (memory):
┌─────────────────────────────┐
│ TimelineScene               │
├─────────────────────────────┤
│ id: 1769981721797           │ ← Client-generated ID
│ name: "Getting Ready"       │
│ order_index: undefined      │ ← NOT SET!
│ moments: [Obj, Obj, Obj]    │
│ isNew: true                 │
└─────────────────────────────┘

Database:
┌──────────────┐
│ FilmScene    │ ← EMPTY
└──────────────┘
```

### After Save (Now!)
```
LocalState (memory):
┌─────────────────────────────┐
│ TimelineScene               │
├─────────────────────────────┤
│ id: 20                      │ ← Database ID (updated)
│ name: "Getting Ready"       │
│ order_index: 1              │ ← NOW SET! (for correct position)
│ moments: [Obj, Obj, Obj]    │
│ isNew: false                │ ← Prevents re-save
└─────────────────────────────┘

Database:
┌────────────────────────────────────┐
│ FilmScene                          │
├────────────────────────────────────┤
│ id: 20                             │
│ film_id: 5                         │
│ name: "Getting Ready"              │
│ order_index: 1                     │ ✅ NEW
│ scene_template_id: 3               │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ FilmSceneMoment                    │ ✅ NEW TABLE ENTRIES
├────────────────────────────────────┤
│ film_scene_id: 20                  │
│ name: "Bride Getting Dress"        │
│ order_index: 0                     │
│ duration: 60                       │
├────────────────────────────────────┤
│ film_scene_id: 20                  │
│ name: "Makeup"                     │
│ order_index: 1                     │
│ duration: 45                       │
├────────────────────────────────────┤
│ film_scene_id: 20                  │
│ name: "Final Touch"                │
│ order_index: 2                     │
│ duration: 30                       │
└────────────────────────────────────┘
```

### After Refresh (Still Works!)
```
Load sequence:
  1. Fetch Film (includes scenes array)
  2. For each scene in array:
     - enrichScenesWithMoments loads from DB
     - Moments are already in DB! ✅
     - order_index is in DB! ✅
  3. Sort by order_index
  4. Display

Timeline displays:
├─ Scene 19 (id: 19, order: 0) - 5 moments ✅
├─ Scene 20 (id: 20, order: 1) - 3 moments ✅ (persisted!)
└─ Scene 21 (id: 21, order: 2) - 2 moments ✅
```

## API Calls Comparison

### Before Fix ❌
```
1. POST /scenes/films/5/scenes
   Body: {film_id: 5, name: "Getting Ready", scene_template_id: 3, order_index: 1}
   Response: {id: 20, ...}

2. PATCH /scenes/20
   Body: {order_index: 1}
   Response: {id: 20, ...}

Total: 2 API calls
Moments: 0 API calls (BUG!)
```

### After Fix ✅
```
1. POST /scenes/films/5/scenes
   Body: {film_id: 5, name: "Getting Ready", scene_template_id: 3, order_index: 1}
   Response: {id: 20, ...}

2. POST /moments
   Body: {film_scene_id: 20, name: "Bride Getting Dress", order_index: 0, duration: 60}
   Response: {id: 45, ...}

3. POST /moments
   Body: {film_scene_id: 20, name: "Makeup", order_index: 1, duration: 45}
   Response: {id: 46, ...}

4. POST /moments
   Body: {film_scene_id: 20, name: "Final Touch", order_index: 2, duration: 30}
   Response: {id: 47, ...}

5. PATCH /scenes/20
   Body: {order_index: 1}
   Response: {id: 20, ...}

Total: 5 API calls
Moments: 3 API calls ✅
```

## Console Log Analysis

### Good Save (with fix)
```
💾 [SAVE] Scene 1/3: Detected as NEW
📍 [SAVE] Scene 1/3:
  - Film ID: 5
  - Name: Getting Ready
  - Template ID: 3
  - Order Index: 1
  - Moments: 3
✅ [SAVE] Scene saved successfully: {clientId: 1769981721797, databaseId: 20}
📍 [SAVE] Saving 3 moments for scene 20
  📍 [SAVE] Moment 1/3: Bride Getting Dress (60s)
  ✅ [SAVE] Moment created: ID 45
  📍 [SAVE] Moment 2/3: Makeup (45s)
  ✅ [SAVE] Moment created: ID 46
  📍 [SAVE] Moment 3/3: Final Touch (30s)
  ✅ [SAVE] Moment created: ID 47
✅ [SAVE] All moments saved for scene 20
💾 [SAVE] ID mapping saved: [[1769981721797, 20]]
💾 [CONTEXT] Updating scene ID: 1769981721797 → 20
✅ [ENRICH] Scenes sorted by order_index: [{id: 19, order: 0}, {id: 20, order: 1}]
```

### Bad Save (before fix)
```
💾 [SAVE] Scene 1/3: Detected as NEW
✅ [SAVE] Scene saved successfully: {clientId: 1769981721797, databaseId: 20}
❌ STOP - NO MOMENT SAVES HAPPEN!
```

This comprehensive fix ensures moments are persisted and scenes maintain their correct position in the timeline.
