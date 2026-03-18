# Drag & Drop Hook Refactoring Summary

## 🎯 Problem Statement
The timeline interaction layer had 4 confusing, overlapping hooks doing drag-related work:
- **useDragAndDrop** (456 lines) - Did 3 different things
- **useDragState** (119 lines) - Duplicate state management
- **useContentBuilderDragHandlers** (256 lines) - Thin wrapper around dnd-kit
- **useDragSensors** (25 lines) - Trivial dnd-kit config

## ✅ Solution Implemented
Refactored to **2 focused, single-responsibility hooks** with clear separation:

### New Hook: `useTimelineDragDrop`
**Purpose**: Handle all drag-drop operations on the timeline
**Responsibilities**:
- Collision detection between scenes
- Track compatibility validation (which scene types fit on which tracks)
- Drop zone calculations
- Scene placement and positioning logic
- Handle both timeline scene dragging and library scene drops

**Input Props**:
```typescript
{
    scenes: TimelineScene[];
    setScenes: React.Dispatch<React.SetStateAction<TimelineScene[]>>;
    tracks: TimelineTrack[];
    zoomLevel: number;           // From viewport
    gridSize: number;             // From viewport
    snapToGrid: boolean;          // From viewport
    timelineRef?: React.RefObject<HTMLDivElement>;
}
```

**Output**: Drag state + all drag event handlers

### New Hook: `useDragViewport`
**Purpose**: Manage timeline viewport and zoom
**Responsibilities**:
- Zoom level management (1x - 100x)
- Grid snapping (5-second intervals)
- Viewport scrolling and panning
- Zoom-to-fit functionality
- Scroll-to-time for playhead following

**Output**:
```typescript
{
    viewState: ViewState;           // zoomLevel, gridSize, snapToGrid, etc
    setViewState: StateSetterFn;
    updateViewportWidth: (w: number) => void;
    updateViewportLeft: (l: number) => void;
    scrollToTime: (time: number) => void;
    zoomToFit: (duration: number) => void;
}
```

## 🗑️ Deleted Files
1. **useDragAndDrop.ts** - Replaced by useTimelineDragDrop + useDragViewport
2. **useDragState.ts** - Functionality merged into useTimelineDragDrop
3. **useContentBuilderDragHandlers.ts** - Redundant wrapper (dnd-kit events handled directly)
4. **useDragSensors.ts** - Config inlined into ContentBuilder.tsx

## 📝 New/Updated Files
1. **useDragViewport.ts** (NEW) - 90 lines
2. **useTimelineDragDrop.ts** (NEW) - 320 lines
3. **dragConfig.ts** (NEW) - Config constants and helper functions
4. **interaction/index.ts** (UPDATED) - New exports
5. **ContentBuilder.tsx** (UPDATED) - New hook usage + inlined sensor config
6. **ContentBuilder/README.md** (UPDATED) - Documentation

## 🔄 Migration in ContentBuilder.tsx

### Before:
```typescript
const sensors = useDragSensors();

const {
    dragState, viewState, setViewState,
    handleSceneMouseDown, handleTimelineDragOver, ...
} = useDragAndDrop(scenes, setAndNotifyScenes, tracks, timelineRef);

const { activeDragItem, handleDragStart, handleDragEnd, handleDragOver } 
    = useContentBuilderDragHandlers(scenes, ...);
```

### After:
```typescript
// Inline sensor config (simpler, no wrapper needed)
const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

// Separate viewport and drag concerns
const { viewState, setViewState, updateViewportWidth, scrollToTime, zoomToFit } 
    = useDragViewport();

const { dragState, handleSceneMouseDown, handleTimelineDragOver, ... } 
    = useTimelineDragDrop({
        scenes, setScenes: setAndNotifyScenes, tracks,
        zoomLevel: viewState.zoomLevel,
        gridSize: viewState.gridSize,
        snapToGrid: viewState.snapToGrid,
        timelineRef
    });
```

## 📊 Impact Analysis

### Code Reduction
- **Before**: 857 lines of drag hook code (useDragAndDrop + useDragState + useContentBuilderDragHandlers + useDragSensors)
- **After**: 410 lines of drag hook code (useTimelineDragDrop + useDragViewport)
- **Reduction**: 52% less code

### Clarity Improvements
| Aspect | Before | After |
|--------|--------|-------|
| Hooks doing drag work | 4 overlapping hooks | 2 focused hooks |
| Largest hook size | 456 lines | 320 lines |
| Clear responsibility | Confusing | Crystal clear |
| Duplicate state | Yes (useDragState) | No |
| Config reusability | Wrapped in useDragSensors | Inline + constants file |

### Testing & Maintenance
- ✅ **Easier to test** - Each hook is smaller and has one responsibility
- ✅ **Easier to debug** - Clear separation means issues are localized
- ✅ **Easier to extend** - Adding features doesn't require touching multiple hooks
- ✅ **Self-documenting** - Hook names and parameters explain what they do

## 🔍 Verification
- ✅ All TypeScript compilation passes (0 errors)
- ✅ ContentBuilder.tsx compiles without errors
- ✅ No broken imports (old files deleted, exports updated)
- ✅ All handlers properly exported from new hooks
- ✅ README.md updated with new architecture
- ✅ No unused parameters or variables

## 🚀 Next Steps (Optional Future Improvements)
1. Move track compatibility logic to `@/lib/utils/trackUtils.ts` (already exists)
2. Extract drag constants to dragConfig.ts's index export
3. Add unit tests for collision detection logic
4. Consider extracting drop zone calculations to utility function
