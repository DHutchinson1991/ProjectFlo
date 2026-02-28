# Timeline Hooks Analysis & Refactoring Strategy

## 📊 Current State Analysis

### Existing Hooks Architecture (7 folders, 13 hooks)

```
/src/hooks/timeline/
├── data/
│   ├── useTimelineData.ts         [158 lines] - Track state management
│   ├── useScenesLibrary.ts        [66 lines]  - Library loading & filtering
│   └── useSaveState.ts            [~40 lines] - Save state management
├── playback/
│   ├── usePlaybackControls.ts     [129 lines] - Playback state & controls
│   └── usePlaybackScreen.ts       [~80 lines] - Playback screen display
├── scene/
│   └── useSceneGrouping.ts        [78 lines]  - Scene grouping & organization
├── viewport/
│   └── (likely has zoom/pan logic)
├── interaction/
│   ├── useTimelineDragDrop.ts     [320 lines] - Drag operations & collision
│   ├── useDragViewport.ts         [94 lines]  - Viewport zoom/pan/scroll
│   └── useKeyboardShortcuts.ts    [~100 lines] - Keyboard navigation
```

### ContentBuilder.tsx Analysis (846 lines)

Currently using 8 hooks from timeline:
- `useTimelineData()` - loads tracks, manages track state
- `usePlaybackControls()` - playback state & controls
- `useScenesLibrary()` - scenes library loading
- `useTimelineDragDrop()` - drag operations
- `useSaveState()` - save state
- `useSceneGrouping()` - scene grouping
- `useKeyboardShortcuts()` - keyboard controls
- `useDragViewport()` - viewport management

**Logic embedded in ContentBuilder that should be extracted:**
1. **Scene Operations** (~150 lines)
   - `handleSceneFromLibrary()` - add library scene to timeline
   - `handleReorderScene()` - magnetic timeline reordering
   - `handleDeleteSceneGroup()` - delete scene group
   - `handleSceneDelete()` - delete single scene

2. **State Initialization** (~80 lines)
   - Local state setup: scenes, tracks, UI flags
   - SessionStorage track restoration
   - Default timeline layer loading
   - Initial scenes loading

3. **Current Scene Calculation** (~60 lines)
   - Find active scenes at playback time
   - Handle composite scenes (multiple types at same time)
   - Create mock media components

4. **Save & Persist Logic** (~20 lines)
   - Enhanced save that includes tracks
   - Callback handling

---

## 🎯 Recommended Refactoring Strategy

### CONSOLIDATION APPROACH

Instead of creating 4 new hooks in a new `contentBuilder/` folder, **consolidate existing logic into the appropriate existing folders**:

### Option A: BEST APPROACH - Consolidate by Domain

```
/src/hooks/timeline/
├── data/
│   ├── useTimelineData.ts         [EXISTING] ✓
│   ├── useScenesLibrary.ts        [EXISTING] ✓
│   ├── useSaveState.ts            [EXISTING] ✓
│   └── useTimelineState.ts        [NEW]      <- Move ContentBuilder initialization & scenes state
│
├── playback/
│   ├── usePlaybackControls.ts     [EXISTING] ✓
│   ├── usePlaybackScreen.ts       [EXISTING] ✓
│   └── useCurrentScene.ts         [NEW]      <- Current scene calculation logic
│
├── scene/
│   ├── useSceneGrouping.ts        [EXISTING] ✓
│   └── useSceneOperations.ts      [NEW]      <- Add/reorder/delete scenes
│
├── interaction/
│   ├── useTimelineDragDrop.ts     [EXISTING] ✓
│   ├── useDragViewport.ts         [EXISTING] ✓
│   └── useKeyboardShortcuts.ts    [EXISTING] ✓
```

### Detailed Hook Breakdown

#### 1. **NEW: `useTimelineState.ts`** (in `/data/`)
**Purpose:** Initialize and manage ContentBuilder's timeline state

**Extracted from ContentBuilder.tsx:**
- Scenes state initialization
- Tracks state initialization
- SessionStorage restoration of tracks
- Load default timeline layers
- Load available scenes library
- UI flags (showLibrary, showCreateSceneDialog)

**Returns:**
```typescript
{
  scenes: TimelineScene[],
  setScenes: (scenes) => void,
  tracks: TimelineTrack[],
  setTracks: (tracks) => void,
  showLibrary: boolean,
  setShowLibrary: (show) => void,
  showCreateSceneDialog: boolean,
  setShowCreateSceneDialog: (show) => void,
}
```

**Replaces:** Scattered useState calls across ContentBuilder
**Lines:** ~100

---

#### 2. **NEW: `useSceneOperations.ts`** (in `/scene/`)
**Purpose:** Handle scene add/reorder/delete operations

**Extracted from ContentBuilder.tsx:**
- `handleSceneFromLibrary()` - Add library scene to timeline
- `handleReorderScene()` - Magnetic timeline reordering logic
- `handleDeleteSceneGroup()` - Delete scene group
- `handleSceneDelete()` - Delete single scene

**Accepts props:**
```typescript
{
  scenes: TimelineScene[],
  setScenes: (scenes) => void,
  tracks: TimelineTrack[],
  setTracks: (tracks) => void,
  timelineRef: React.RefObject<HTMLDivElement>,
}
```

**Returns:**
```typescript
{
  handleSceneFromLibrary: (libraryScene) => void,
  handleReorderScene: (direction, sceneName) => void,
  handleDeleteSceneGroup: (sceneName) => void,
  handleSceneDelete: (scene) => void,
}
```

**Merges with:** `useSceneGrouping.ts` in the same folder
**Lines:** ~150

---

#### 3. **NEW: `useCurrentScene.ts`** (in `/playback/`)
**Purpose:** Calculate current active scene(s) from playback state

**Extracted from ContentBuilder.tsx:**
- Current scene calculation based on playback time
- Handles multiple simultaneous scenes (video + audio + music)
- Creates composite scene with all active media components

**Accepts props:**
```typescript
{
  scenes: TimelineScene[],
  currentTime: number,
}
```

**Returns:**
```typescript
{
  currentScene: TimelineScene | null,
  activeScenesAtTime: TimelineScene[],
}
```

**Merges with:** `usePlaybackControls.ts` in same folder
**Lines:** ~80

---

### Summary of Changes

| Location | Hook | Purpose | Size | Status |
|----------|------|---------|------|--------|
| `data/` | `useTimelineState` | Initialize timeline state | 100 | NEW |
| `data/` | `useTimelineData` | Track management | 158 | KEEP |
| `data/` | `useScenesLibrary` | Library loading | 66 | KEEP |
| `data/` | `useSaveState` | Save management | 40 | KEEP |
| `playback/` | `useCurrentScene` | Current scene calc | 80 | NEW |
| `playback/` | `usePlaybackControls` | Playback state | 129 | KEEP |
| `playback/` | `usePlaybackScreen` | Display logic | 80 | KEEP |
| `scene/` | `useSceneOperations` | Scene operations | 150 | NEW |
| `scene/` | `useSceneGrouping` | Scene grouping | 78 | KEEP |
| `interaction/` | All 3 existing | Drag & keyboard | ~514 | KEEP |

---

## 📝 Implementation Plan

### Phase 1: Extract & Create New Hooks
1. **Create `useTimelineState.ts`** (data/)
   - Extract state initialization from ContentBuilder
   - Extract sessionStorage restoration logic
   - Extract loadTimelineLayers() call

2. **Create `useCurrentScene.ts`** (playback/)
   - Extract currentScene calculation logic
   - Extract activeScenesAtTime filtering
   - Extract mock media component creation

3. **Create `useSceneOperations.ts`** (scene/)
   - Extract all 4 scene operation handlers
   - Consolidate with useSceneGrouping location
   - Import grouping helper if needed

### Phase 2: Update ContentBuilder.tsx
1. Move file to `ContentBuilder/index.tsx`
2. Replace state initialization with `useTimelineState()`
3. Replace scene operations with `useSceneOperations()`
4. Replace current scene calculation with `useCurrentScene()`
5. Keep JSX rendering (~400 lines)

### Phase 3: Update Exports
1. Update `/hooks/timeline/data/index.ts`
2. Update `/hooks/timeline/playback/index.ts`
3. Update `/hooks/timeline/scene/index.ts`
4. Update `/hooks/timeline/index.ts` (no change needed)

### Phase 4: Verification
1. Check for import errors
2. Verify TypeScript compilation
3. Test ContentBuilder rendering
4. Test all scene operations

---

## 🔍 Duplicate Logic Analysis

### Found: Scene reordering logic
- **Location:** ContentBuilder.tsx `handleReorderScene()`
- **Similar to:** None identified
- **Action:** Extract to `useSceneOperations.ts` ✓

### Found: Composite scene creation
- **Location:** ContentBuilder.tsx (part of playback logic)
- **Similar to:** None identified (unique to multi-track support)
- **Action:** Extract to `useCurrentScene.ts` ✓

### Found: Track initialization
- **Location:** `useTimelineData.ts` (default tracks)
- **Similar to:** ContentBuilder.tsx (sessionStorage restoration)
- **Status:** Consolidate in `useTimelineState.ts` ✓

### Found: Scene library loading
- **Location:** `useScenesLibrary.ts` (already centralized)
- **Status:** No changes needed ✓

---

## ✅ Benefits of This Approach

1. **No new folders** - Uses existing domain-based organization
2. **Clear responsibility** - Each hook has single purpose
3. **Better naming** - Hooks named by what they do, not where they're used
4. **Centralized** - All timeline logic stays in `/hooks/timeline/`
5. **Reduced ContentBuilder size** - 846 → ~400 lines (50% reduction)
6. **Reusable hooks** - New hooks can be used elsewhere if needed
7. **No duplication** - Identified and consolidated duplicate logic

---

## 🚀 Next Steps

1. **Confirm this approach** - Consolidate into existing folders vs. create new `contentBuilder/` folder?
2. **Extract hooks** - Create the 3 new hooks following this plan
3. **Refactor ContentBuilder** - Move to index.tsx and update imports
4. **Test thoroughly** - Ensure all scene operations work correctly
5. **Update documentation** - Update any architecture docs
