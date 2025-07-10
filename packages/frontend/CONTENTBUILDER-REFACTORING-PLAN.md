# ContentBuilder Components - Comprehensive Refactoring Plan

## Current Structure Analysis (4,109 total lines)

### File Breakdown
- **ContentBuilderHooks.ts** (844 lines) - Multiple hooks in one file
- **ContentBuilderScenesLibrary.tsx** (667 lines) - Complex scene library UI
- **ContentBuilderUtils.ts** (584 lines) - Centralized utilities
- **ContentBuilderTimeline.tsx** (544 lines) - Timeline visualization 
- **ContentBuilderControls.tsx** (524 lines) - Playback and control UI
- **ContentBuilder.tsx** (379 lines) - Main orchestrator
- **EnhancedTimelineScene.tsx** (296 lines) - Individual scene rendering
- **DragOverlayScene.tsx** (139 lines) - Drag overlay component
- **ContentBuilderTypes.ts** (133 lines) - Type definitions

## 🎯 Refactoring Strategy: Modular Architecture

### Phase 1: Split Large Files into Focused Modules

#### 1.1 ContentBuilderHooks.ts → Multiple Hook Files
**Split 844 lines into 6 specialized hook files:**

```
hooks/
├── useTimelineData.ts (120 lines)
├── usePlaybackControls.ts (125 lines) 
├── useScenesLibrary.ts (90 lines)
├── useDragAndDrop.ts (280 lines)
├── useSaveState.ts (110 lines)
└── useSceneGrouping.ts (90 lines)
```

#### 1.2 ContentBuilderTimeline.tsx → Component Architecture
**Split 544 lines into timeline components:**

```
timeline/
├── ContentBuilderTimeline.tsx (200 lines) - Main container
├── TimelineTrack.tsx (80 lines) - Individual track
├── TimelineGrid.tsx (60 lines) - Grid and time markers
├── TimelinePlayhead.tsx (40 lines) - Current time indicator
├── TimelineDropZones.tsx (80 lines) - Drop zone logic
└── TimelineSnapGrid.tsx (60 lines) - Snap interval controls
```

#### 1.3 ContentBuilderScenesLibrary.tsx → Library Architecture
**Split 667 lines into library components:**

```
library/
├── ContentBuilderScenesLibrary.tsx (150 lines) - Main container
├── SceneCard.tsx (120 lines) - Individual scene card
├── SceneCategories.tsx (100 lines) - Category filtering
├── SceneSearch.tsx (80 lines) - Search functionality
└── SceneGrid.tsx (80 lines) - Grid layout logic
```

#### 1.4 ContentBuilderControls.tsx → Control Components
**Split 524 lines into control components:**

```
controls/
├── ContentBuilderControls.tsx (150 lines) - Main container
├── PlaybackControls.tsx (120 lines) - Play/pause/stop
├── TimelineControls.tsx (100 lines) - Zoom/pan controls
├── SaveControls.tsx (80 lines) - Save state management
└── ViewControls.tsx (60 lines) - View options
```

### Phase 2: Create Specialized Utility Modules

#### 2.1 Split ContentBuilderUtils.ts by Domain
**Split 584 lines into focused utility modules:**

```
utils/
├── sceneUtils.ts (150 lines) - Scene-related utilities
├── timelineUtils.ts (120 lines) - Timeline calculations
├── dragDropUtils.ts (100 lines) - Drag and drop logic
├── colorUtils.ts (60 lines) - Color mapping
├── trackUtils.ts (80 lines) - Track management
└── formatUtils.ts (40 lines) - Formatting functions
```

#### 2.2 Enhanced Type Organization
**Reorganize ContentBuilderTypes.ts by domain:**

```
types/
├── sceneTypes.ts (40 lines) - Scene-related types
├── timelineTypes.ts (35 lines) - Timeline types
├── controlTypes.ts (25 lines) - Control types
├── dragDropTypes.ts (20 lines) - Drag/drop types
└── index.ts (15 lines) - Re-exports
```

### Phase 3: Create Feature-Based Architecture

#### 3.1 Scene Management Module
```
features/scene-management/
├── components/
│   ├── SceneCard.tsx
│   ├── SceneCategories.tsx
│   └── SceneSearch.tsx
├── hooks/
│   └── useSceneManagement.ts
├── utils/
│   └── sceneUtils.ts
└── types/
    └── sceneTypes.ts
```

#### 3.2 Timeline Module
```
features/timeline/
├── components/
│   ├── Timeline.tsx
│   ├── TimelineTrack.tsx
│   ├── TimelineGrid.tsx
│   └── TimelineScene.tsx (enhanced)
├── hooks/
│   ├── useTimelineData.ts
│   └── useDragAndDrop.ts
├── utils/
│   └── timelineUtils.ts
└── types/
    └── timelineTypes.ts
```

#### 3.3 Playback Control Module
```
features/playback/
├── components/
│   ├── PlaybackControls.tsx
│   └── ViewControls.tsx
├── hooks/
│   └── usePlaybackControls.ts
├── utils/
│   └── playbackUtils.ts
└── types/
    └── playbackTypes.ts
```

## 🛠️ Specific Refactoring Opportunities

### A. Performance Optimizations

#### A.1 Memoization Strategy
```typescript
// Current: Large components re-render frequently
// Target: Selective memoization with React.memo and useMemo

// Example for SceneCard
const SceneCard = React.memo(({ scene, onDrag }) => {
    const memoizedStyles = useMemo(() => ({
        backgroundColor: getSceneColor(scene.type),
        width: scene.duration * ZOOM_LEVEL
    }), [scene.type, scene.duration]);
    
    return <Box sx={memoizedStyles}>...</Box>;
});
```

#### A.2 Virtual Scrolling for Large Lists
```typescript
// Timeline with many scenes (>100)
import { FixedSizeList as List } from 'react-window';

const VirtualizedTimeline = () => {
    const renderScene = useCallback(({ index, style }) => (
        <div style={style}>
            <EnhancedTimelineScene scene={scenes[index]} />
        </div>
    ), [scenes]);
    
    return (
        <List
            height={600}
            itemCount={scenes.length}
            itemSize={40}
        >
            {renderScene}
        </List>
    );
};
```

### B. Code Quality Improvements

#### B.1 Custom Hook Consolidation
```typescript
// Current: Multiple separate hooks
// Target: Composite hooks for related functionality

const useTimelineState = () => {
    const timelineData = useTimelineData();
    const playbackControls = usePlaybackControls();
    const dragAndDrop = useDragAndDrop();
    
    return {
        ...timelineData,
        ...playbackControls,
        ...dragAndDrop,
    };
};
```

#### B.2 Context Providers for Shared State
```typescript
// Create ContentBuilderContext to reduce prop drilling
const ContentBuilderContext = createContext();

export const ContentBuilderProvider = ({ children }) => {
    const timelineState = useTimelineState();
    const sceneLibrary = useScenesLibrary();
    
    return (
        <ContentBuilderContext.Provider value={{
            ...timelineState,
            ...sceneLibrary
        }}>
            {children}
        </ContentBuilderContext.Provider>
    );
};
```

### C. Component Architecture Improvements

#### C.1 Compound Component Pattern
```typescript
// Make ContentBuilder more composable
const ContentBuilder = {
    Root: ContentBuilderRoot,
    Timeline: ContentBuilderTimeline,
    Library: ContentBuilderScenesLibrary,
    Controls: ContentBuilderControls,
};

// Usage:
<ContentBuilder.Root>
    <ContentBuilder.Controls />
    <ContentBuilder.Timeline />
    <ContentBuilder.Library />
</ContentBuilder.Root>
```

#### C.2 Render Props for Complex Logic
```typescript
// For complex drag and drop behavior
const DragDropProvider = ({ children }) => {
    const dragState = useDragAndDrop();
    
    return children(dragState);
};

// Usage:
<DragDropProvider>
    {({ isDragging, draggedItem, onDrop }) => (
        <Timeline 
            isDragging={isDragging}
            onDrop={onDrop}
        />
    )}
</DragDropProvider>
```

## 📁 Proposed New File Structure

```
components/
├── ContentBuilder.tsx (Main orchestrator - 200 lines)
├── 
├── features/
│   ├── timeline/
│   │   ├── Timeline.tsx (150 lines)
│   │   ├── TimelineTrack.tsx (80 lines)
│   │   ├── TimelineScene.tsx (120 lines)
│   │   ├── TimelineGrid.tsx (60 lines)
│   │   └── TimelinePlayhead.tsx (40 lines)
│   │
│   ├── scene-library/
│   │   ├── SceneLibrary.tsx (120 lines)
│   │   ├── SceneCard.tsx (80 lines)
│   │   ├── SceneCategories.tsx (60 lines)
│   │   └── SceneSearch.tsx (50 lines)
│   │
│   ├── controls/
│   │   ├── PlaybackControls.tsx (100 lines)
│   │   ├── ViewControls.tsx (80 lines)
│   │   └── SaveControls.tsx (70 lines)
│   │
│   └── drag-drop/
│       ├── DragOverlay.tsx (60 lines)
│       └── DropZones.tsx (80 lines)
│
├── hooks/
│   ├── timeline/
│   │   ├── useTimelineData.ts (100 lines)
│   │   ├── useTimelineView.ts (80 lines)
│   │   └── useTimelineSync.ts (60 lines)
│   │
│   ├── scene-library/
│   │   ├── useScenesLibrary.ts (80 lines)
│   │   └── useSceneFiltering.ts (50 lines)
│   │
│   ├── playback/
│   │   └── usePlaybackControls.ts (100 lines)
│   │
│   ├── drag-drop/
│   │   └── useDragAndDrop.ts (150 lines)
│   │
│   └── state/
│       ├── useSaveState.ts (80 lines)
│       └── useSceneGrouping.ts (70 lines)
│
├── utils/
│   ├── scene/
│   │   ├── sceneUtils.ts (80 lines)
│   │   ├── sceneColors.ts (40 lines)
│   │   └── sceneGrouping.ts (60 lines)
│   │
│   ├── timeline/
│   │   ├── timelineUtils.ts (70 lines)
│   │   ├── timelineCalculations.ts (50 lines)
│   │   └── collisionDetection.ts (40 lines)
│   │
│   ├── drag-drop/
│   │   └── dragDropUtils.ts (60 lines)
│   │
│   └── formatting/
│       ├── timeFormatting.ts (30 lines)
│       └── numberFormatting.ts (20 lines)
│
├── types/
│   ├── scene.ts (40 lines)
│   ├── timeline.ts (35 lines)
│   ├── controls.ts (25 lines)
│   ├── dragDrop.ts (20 lines)
│   └── index.ts (15 lines)
│
└── context/
    ├── ContentBuilderContext.tsx (80 lines)
    └── ContentBuilderProvider.tsx (100 lines)
```

## 🚀 Implementation Benefits

### Immediate Benefits
1. **Maintainability**: Smaller, focused files (50-150 lines each)
2. **Testability**: Individual components and hooks can be tested in isolation
3. **Reusability**: Components can be used independently
4. **Performance**: Better code splitting and lazy loading opportunities

### Long-term Benefits
1. **Scalability**: Easy to add new features without modifying existing code
2. **Team Development**: Multiple developers can work on different features
3. **Bundle Optimization**: Tree shaking eliminates unused code
4. **Type Safety**: More focused type definitions

## 📋 Migration Strategy

### Phase 1: Extract Hooks (Week 1)
1. Split ContentBuilderHooks.ts into individual hook files
2. Update imports in existing components
3. Test all functionality works

### Phase 2: Split Large Components (Week 2)
1. Extract Timeline sub-components
2. Extract Scene Library sub-components  
3. Extract Control sub-components
4. Maintain same public APIs

### Phase 3: Organize by Feature (Week 3)
1. Group related files into feature folders
2. Create context providers
3. Optimize imports and exports

### Phase 4: Performance Optimization (Week 4)
1. Add memoization where needed
2. Implement virtual scrolling if needed
3. Add performance monitoring

## ✅ Success Metrics

1. **Bundle Size**: Reduce by 15-20% through better tree shaking
2. **Load Time**: Improve initial load by 200-300ms through code splitting
3. **Developer Experience**: Reduce file search time by 50%
4. **Maintainability**: Enable isolated testing of 90% of components
5. **Type Safety**: Achieve 100% TypeScript coverage with focused types

This refactoring plan transforms the ContentBuilder from a monolithic structure into a modern, modular architecture that's easier to maintain, test, and extend.
