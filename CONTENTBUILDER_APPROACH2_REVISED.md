# 🏗️ APPROACH 2: Feature-Based Split (REVISED)

**Based on actual project structure where hooks are centralized**

---

## 🎯 Key Insight

Your hooks are **already well-organized** in:
```
packages/frontend/src/hooks/timeline/
├── data/           # useTimelineData, useScenesLibrary, useSaveState, useTimelineState
├── playback/       # usePlaybackControls, usePlaybackScreen, useCurrentScene
├── scene/          # useSceneGrouping, useSceneOperations
├── viewport/       # useViewportManager, useViewportState
└── interaction/    # useTimelineDragDrop, useKeyboardShortcuts, useDragViewport
```

**So we DON'T move hooks!** We keep them centralized and create **feature containers** that consume them.

---

## 📁 REVISED Feature Structure

```
ContentBuilder/
├── index.tsx                          # ~50 LOC - DndContext + Provider wrapper
├── ContentBuilderContainer.tsx        # ~80 LOC - Feature layout orchestration
│
├── context/                           # NEW - Critical!
│   └── ContentBuilderContext.tsx      # Provider that instantiates hooks once
│
├── features/                          # NEW - Feature modules (UI containers)
│   │
│   ├── timeline/                      # Timeline Feature
│   │   ├── TimelineFeature.tsx        # Container consuming timeline hooks
│   │   ├── components/                # UI components only
│   │   │   ├── ContentBuilderTimeline.tsx
│   │   │   ├── TimelineTrack.tsx
│   │   │   ├── TimelinePlayhead.tsx
│   │   │   ├── TimelineGrid.tsx
│   │   │   ├── TimelineSnapGrid.tsx
│   │   │   ├── TimelineDropZones.tsx
│   │   │   ├── TimelineSceneElement.tsx
│   │   │   ├── TimelineSceneMomentsBlock.tsx
│   │   │   ├── SceneHeaders.tsx
│   │   │   ├── TimelineBottomControls.tsx
│   │   │   └── MomentsTimelineRenderer.tsx
│   │   └── index.ts                   # Export TimelineFeature
│   │
│   ├── playback/                      # Playback Feature
│   │   ├── PlaybackFeature.tsx        # Container consuming playback hooks
│   │   ├── components/
│   │   │   ├── PlaybackScreen.tsx     # From playback/ folder
│   │   │   ├── PlaybackControls.tsx   # From controls/
│   │   │   └── SaveControls.tsx       # From controls/
│   │   └── index.ts
│   │
│   ├── library/                       # Scene Library Feature
│   │   ├── LibraryFeature.tsx         # Container consuming library hooks
│   │   ├── components/
│   │   │   ├── ContentBuilderScenesLibrary.tsx
│   │   │   ├── SceneGrid.tsx
│   │   │   ├── SceneCard.tsx
│   │   │   ├── SceneSearch.tsx
│   │   │   ├── SceneCategories.tsx
│   │   │   └── DragOverlayScene.tsx
│   │   └── index.ts
│   │
│   ├── panels/                        # Panels Feature
│   │   ├── PanelsFeature.tsx          # Simple wrapper
│   │   ├── components/
│   │   │   └── FilmDetailsPanel.tsx
│   │   └── index.ts
│   │
│   └── dialogs/                       # Dialogs Feature
│       ├── DialogsFeature.tsx         # Container consuming dialog state
│       ├── components/
│       │   └── CreateSceneDialog.tsx
│       └── index.ts
│
├── views/                             # Keep existing views (or move to features)
│   ├── PlaybackView.tsx               # Could move to features/playback/
│   └── TimelineView.tsx               # Could move to features/timeline/
│
├── controls/                          # Keep if needed, or move to features
│   ├── ViewControls.tsx
│   └── TimelineControls.tsx
│
├── config/                            # Configuration
│   └── dragConfig.ts
│
└── utils/                             # ContentBuilder-specific utils
    ├── colorUtils.ts
    ├── dragDropUtils.ts
    └── formatUtils.ts

# Hooks stay where they are:
packages/frontend/src/hooks/timeline/  # ← UNCHANGED, centralized
```

---

## 🔄 What Actually Moves

### Components Move (From ContentBuilder to Features)

```
TIMELINE FEATURE (features/timeline/components/):
├── timeline/ContentBuilderTimeline.tsx      → features/timeline/components/
├── timeline/TimelineTrack.tsx               → features/timeline/components/
├── timeline/TimelinePlayhead.tsx            → features/timeline/components/
├── timeline/TimelineGrid.tsx                → features/timeline/components/
├── timeline/TimelineSnapGrid.tsx            → features/timeline/components/
├── timeline/TimelineDropZones.tsx           → features/timeline/components/
├── timeline/TimelineSceneElement.tsx        → features/timeline/components/
├── timeline/TimelineSceneMomentsBlock.tsx   → features/timeline/components/
├── timeline/SceneHeaders.tsx                → features/timeline/components/
├── timeline/TimelineBottomControls.tsx      → features/timeline/components/
└── timeline/MomentsTimelineRenderer.tsx     → features/timeline/components/

PLAYBACK FEATURE (features/playback/components/):
├── playback/PlaybackScreen.tsx              → features/playback/components/
├── controls/PlaybackControls.tsx            → features/playback/components/
└── controls/SaveControls.tsx                → features/playback/components/

LIBRARY FEATURE (features/library/components/):
├── library/ContentBuilderScenesLibrary.tsx  → features/library/components/
├── library/SceneGrid.tsx                    → features/library/components/
├── library/SceneCard.tsx                    → features/library/components/
├── library/SceneSearch.tsx                  → features/library/components/
├── library/SceneCategories.tsx              → features/library/components/
└── library/DragOverlayScene.tsx             → features/library/components/

PANELS FEATURE (features/panels/components/):
└── panels/FilmDetailsPanel.tsx              → features/panels/components/

DIALOGS FEATURE (features/dialogs/components/):
└── dialogs/CreateSceneDialog.tsx            → features/dialogs/components/

UTILS (stay in ContentBuilder/utils/):
├── utils/colorUtils.ts                      → ContentBuilder/utils/
├── utils/dragDropUtils.ts                   → ContentBuilder/utils/
└── config/dragConfig.ts                     → ContentBuilder/config/
```

### Hooks STAY (In centralized location)

```
✅ KEEP HERE: packages/frontend/src/hooks/timeline/
├── data/
│   ├── useTimelineData.ts
│   ├── useScenesLibrary.ts
│   ├── useSaveState.ts
│   └── useTimelineState.ts
├── playback/
│   ├── usePlaybackControls.ts
│   ├── usePlaybackScreen.ts
│   └── useCurrentScene.ts
├── scene/
│   ├── useSceneGrouping.ts
│   └── useSceneOperations.ts
├── viewport/
│   ├── useViewportManager.ts
│   └── useViewportState.ts
└── interaction/
    ├── useTimelineDragDrop.ts
    ├── useKeyboardShortcuts.ts
    └── useDragViewport.ts
```

---

## 🚨 CRITICAL: Context Provider for Shared State

**Problem:** If each feature calls `useTimelineState()` directly, they create **separate state instances** that don't sync!

**Solution:** A Context Provider that instantiates hooks **once** and shares results.

### ContentBuilder Architecture (3 Layers)

```
┌─────────────────────────────────────────────────────┐
│  ContentBuilder/index.tsx                           │
│  - DndContext wrapper                               │
│  - ContentBuilderProvider (instantiates hooks)      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Features (UI Containers)                           │
│  - TimelineFeature, PlaybackFeature, etc.           │
│  - Use useContentBuilder() context                  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Components (Presentational)                        │
│  - Timeline tracks, playback screen, etc.           │
│  - Receive props from features                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Context Provider Pattern

### 1. ContentBuilderContext (NEW - Critical!)

```typescript
// ContentBuilder/context/ContentBuilderContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import {
  useTimelineData,
  usePlaybackControls,
  useScenesLibrary,
  useTimelineDragDrop,
  useSaveState,
  useSceneGrouping,
  useKeyboardShortcuts,
  useDragViewport,
  useTimelineState,
  useCurrentScene,
  useSceneOperations,
} from '@/hooks/timeline';
import { ContentBuilderProps, TimelineScene } from '@/lib/types/timeline';

interface ContentBuilderContextType {
  // Timeline State
  scenes: TimelineScene[];
  setScenes: (scenes: TimelineScene[]) => void;
  tracks: any[];
  setTracks: (tracks: any[]) => void;
  showLibrary: boolean;
  setShowLibrary: (show: boolean) => void;
  showCreateSceneDialog: boolean;
  setShowCreateSceneDialog: (show: boolean) => void;
  
  // Timeline Data
  loadTimelineLayers: () => void;
  
  // Playback
  playbackState: any;
  handlePlay: () => void;
  handleStop: () => void;
  handleSpeedChange: (speed: number) => void;
  handleTimelineClick: (time: number) => void;
  jumpToTime: (time: number) => void;
  currentScene: any;
  
  // Scene Library
  getFilteredScenes: () => any[];
  loadAvailableScenes: () => void;
  
  // Save State
  saveState: any;
  handleSave: () => void;
  
  // Scene Grouping
  sceneGroups: any[];
  getGroupForScene: (sceneId: string) => any;
  isSceneInCollapsedGroup: (sceneId: string) => boolean;
  
  // Viewport
  viewState: any;
  setViewState: (state: any) => void;
  updateViewportWidth: (width: number) => void;
  scrollToTime: (time: number) => void;
  zoomToFit: (duration: number) => void;
  
  // Drag & Drop
  dragState: any;
  handleSceneMouseDown: (e: any, scene: any) => void;
  handleLibrarySceneDragStart: (scene: any) => void;
  handleTimelineDragOver: (e: any) => void;
  handleTimelineDragLeave: () => void;
  handleTimelineDrop: (e: any) => void;
  handleLibrarySceneDragEnd: () => void;
  isSceneCompatibleWithTrack: (sceneType: string, trackType: string) => boolean;
  
  // Scene Operations
  handleSceneDelete: (sceneId: string) => void;
  handleReorderScene: (sceneId: string, newIndex: number) => void;
  handleDeleteSceneGroup: (groupId: string) => void;
  handleSceneFromLibrary: (scene: any) => void;
  
  // Props
  filmId?: string;
  readOnly: boolean;
  onSave?: (scenes: any[], tracks: any[]) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
}

const ContentBuilderContext = createContext<ContentBuilderContextType | null>(null);

export const ContentBuilderProvider: React.FC<{
  children: ReactNode;
  filmId?: string;
  initialScenes?: TimelineScene[];
  onSave?: (scenes: any[], tracks: any[]) => void;
  readOnly?: boolean;
  timelineRef: React.RefObject<HTMLDivElement>;
}> = ({ children, filmId, initialScenes = [], onSave, readOnly = false, timelineRef }) => {
  // ✅ INSTANTIATE ALL HOOKS ONCE HERE
  const timelineState = useTimelineState(initialScenes);
  const { loadTimelineLayers } = useTimelineData();
  const playbackControls = usePlaybackControls(timelineState.scenes);
  const scenesLibrary = useScenesLibrary(filmId);
  const saveState = useSaveState(timelineState.scenes, onSave);
  const sceneGrouping = useSceneGrouping(timelineState.scenes);
  const viewport = useDragViewport();
  const currentScene = useCurrentScene(timelineState.scenes, playbackControls.playbackState.currentTime);
  
  const dragDrop = useTimelineDragDrop({
    scenes: timelineState.scenes,
    setScenes: timelineState.setScenes,
    tracks: timelineState.tracks,
    zoomLevel: viewport.viewState.zoomLevel,
    gridSize: viewport.viewState.gridSize,
    snapToGrid: viewport.viewState.snapToGrid,
    timelineRef,
  });
  
  const sceneOperations = useSceneOperations({
    scenes: timelineState.scenes,
    setScenes: timelineState.setScenes,
    tracks: timelineState.tracks,
    setTracks: timelineState.setTracks,
  });
  
  // Keyboard shortcuts
  useKeyboardShortcuts(readOnly, viewport.viewState, sceneOperations.handleSceneDelete);
  
  // Initialize data on mount
  React.useEffect(() => {
    const filmIdFromUrl = typeof window !== 'undefined' ? 
      new URLSearchParams(window.location.search).get('filmId') ||
      window.location.pathname.split('/').pop() : null;
    
    if (filmIdFromUrl) {
      const savedTracksKey = `film_${filmIdFromUrl}_tracks`;
      const savedTracksStr = sessionStorage.getItem(savedTracksKey);
      if (savedTracksStr) {
        try {
          const savedTracks = JSON.parse(savedTracksStr);
          if (savedTracks && Array.isArray(savedTracks)) {
            timelineState.setTracks(savedTracks);
            sessionStorage.removeItem(savedTracksKey);
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved tracks:', e);
        }
      }
    }
    
    loadTimelineLayers();
    scenesLibrary.loadAvailableScenes();
  }, []);
  
  // ✅ SHARE ALL HOOK RESULTS VIA CONTEXT
  const value: ContentBuilderContextType = {
    ...timelineState,
    loadTimelineLayers,
    ...playbackControls,
    ...scenesLibrary,
    saveState: saveState.saveState,
    handleSave: saveState.handleSave,
    ...sceneGrouping,
    ...viewport,
    ...dragDrop,
    ...sceneOperations,
    currentScene: currentScene.currentScene,
    filmId,
    readOnly,
    onSave,
    timelineRef,
  };

  return (
    <ContentBuilderContext.Provider value={value}>
      {children}
    </ContentBuilderContext.Provider>
  );
};

// ✅ CUSTOM HOOK FOR FEATURES TO CONSUME CONTEXT
export const useContentBuilder = () => {
  const context = useContext(ContentBuilderContext);
  if (!context) {
    throw new Error('useContentBuilder must be used within ContentBuilderProvider');
  }
  return context;
};
```

### 2. Feature Container Pattern (Updated)

Each feature uses `useContentBuilder()` instead of calling hooks directly:

```typescript
// features/timeline/TimelineFeature.tsx
import React from 'react';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { ContentBuilderTimeline } from './components/ContentBuilderTimeline';

/**
 * Timeline Feature Container
 * Consumes shared context and renders timeline UI
 */
export const TimelineFeature: React.FC = () => {
  // ✅ USE SHARED CONTEXT (not direct hooks!)
  const {
    scenes,
    tracks,
    sceneGroups,
    getGroupForScene,
    isSceneInCollapsedGroup,
    handleSceneDelete,
    handleReorderScene,
    handleDeleteSceneGroup,
    dragState,
    handleSceneMouseDown,
    handleTimelineDragOver,
    handleTimelineDragLeave,
    handleTimelineDrop,
    isSceneCompatibleWithTrack,
    readOnly,
  } = useContentBuilder();

  return (
    <ContentBuilderTimeline
      scenes={scenes}
      tracks={tracks}
      sceneGroups={sceneGroups}
      getGroupForScene={getGroupForScene}
      isSceneInCollapsedGroup={isSceneInCollapsedGroup}
      onSceneDelete={handleSceneDelete}
      onReorderScene={handleReorderScene}
      onDeleteSceneGroup={handleDeleteSceneGroup}
      dragState={dragState}
      onSceneMouseDown={handleSceneMouseDown}
      onTimelineDragOver={handleTimelineDragOver}
      onTimelineDragLeave={handleTimelineDragLeave}
      onTimelineDrop={handleTimelineDrop}
      isSceneCompatibleWithTrack={isSceneCompatibleWithTrack}
      readOnly={readOnly}
    />
  );
};
```

### Example: Playback Feature

```typescript
// features/playback/PlaybackFeature.tsx
import React from 'react';
import { 
  usePlaybackControls, 
  useCurrentScene 
} from '@/hooks/timeline'; // ← Centralized hooks

import { PlaybackScreen } from './components/PlaybackScreen';
import { PlaybackControls } from './components/PlaybackControls';
import { SaveControls } from './components/SaveControls';
import { Box } from '@mui/material';

interface PlaybackFeatureProps {
  scenes: any[];
  totalDuration: number;
  onSave?: () => void;
  saveState?: any;
}

/**
 * Playback Feature Container
 * Combines playback hooks and renders playback UI
 */
export const PlaybackFeature: React.FC<PlaybackFeatureProps> = ({
  scenes,
  totalDuration,
  onSave,
  saveState,
}) => {
  // Consume centralized hooks
  const {
    playbackState,
    handlePlay,
    handleStop,
    handleSpeedChange,
    handleTimelineClick,
    jumpToTime,
  } = usePlaybackControls(scenes);

  const { currentScene } = useCurrentScene(scenes, playbackState.currentTime);

  return (
    <Box>
      <PlaybackScreen
        currentScene={currentScene}
        totalDuration={totalDuration}
        currentTime={playbackState.currentTime}
      />
      
      <PlaybackControls
        isPlaying={playbackState.isPlaying}
        currentTime={playbackState.currentTime}
        totalDuration={totalDuration}
        playbackSpeed={playbackState.speed}
        onPlay={handlePlay}
        onStop={handleStop}
        onSeek={jumpToTime}
        onSpeedChange={handleSpeedChange}
      />
      
      {onSave && (
        <SaveControls
          saveState={saveState}
          onSave={onSave}
        />
      )}
    </Box>
  );
};
```

---

## 🔍 Benefits of This Revised Approach

### ✅ Keeps Existing Hook Architecture
- Hooks stay centralized in `src/hooks/timeline/`
- No need to move well-organized hook files
- Maintains current hook testing setup

### ✅ Feature Containers Add Clarity
- Each feature container shows exactly which hooks it uses
- Easy to see feature dependencies
- Clear boundary between features

### ✅ Easy Migration Path
```
Phase 1: Create feature folders & containers
  → Create features/ directory
  → Create feature containers (TimelineFeature, etc)
  → Keep everything working as-is

Phase 2: Move components into features
  → Move timeline components to features/timeline/components/
  → Move playback components to features/playback/components/
  → etc.

Phase 3: Update imports
  → Update ContentBuilderContainer to use feature components
  → Test each feature independently
```

### ✅ Better Than Original Approach 2
- No disruption to working hooks
- Simpler migration (only move components)
- Clear separation: hooks (logic) vs features (UI containers)

---

## 📊 Comparison: Original vs Revised Approach 2

| Aspect | Original Approach 2 | Revised Approach 2 |
|--------|---------------------|-------------------|
| **Hooks Location** | Move to features/ | ✅ Keep centralized |
| **Hook Organization** | Per-feature hooks | ✅ Keep current (by category) |
| **Components** | Move to features/ | ✅ Move to features/ |
| **Migration Effort** | 6-7 hours | 4-5 hours (less) |
| **Testing Impact** | High (hooks move) | Low (hooks unchanged) |
| **Clarity** | Good | ✅ Better (clear separation) |

---

## 🚀 Migration Steps (Revised)

### Step 1: Create Feature Structure (15 min)
```bash
cd packages/frontend/src/app/(studio)/designer/components/ContentBuilder
mkdir -p context
mkdir -p features/{timeline,playback,library,panels,dialogs}
mkdir -p features/timeline/components
mkdir -p features/playback/components
mkdir -p features/library/components
mkdir -p features/panels/components
mkdir -p features/dialogs/components
```

### Step 2: Create ContentBuilderContext (1 hour)
- Create `context/ContentBuilderContext.tsx`
- Instantiate all hooks once
- Export `useContentBuilder()` hook
- Test context provides data
4
### Step 3: Create Timeline Feature Container (45 min)
- Create `features/timeline/TimelineFeature.tsx`
- Import timeline hooks from `@/hooks/timeline`
- Combine hook logic
- Prepare for timeline components
5
### Step 3: Move Timeline Components (1 hour)
- Move 11 timeline components to `features/timeline/components/`
- Update imports in components
- Update TimelineFeature to use moved components
- Test timeline works

### Step 4: Create Playback Feature (45 min)
- Create `features/playback/PlaybackFeature.tsx`
- Import playback hooks from `@/hooks/timeline`
- Move 3 playback components
- Test playback works

### Step 6: Create Library Feature (45 min)
- Create `features/library/LibraryFeature.tsx`
- Import library hooks
- Move 6 library components
- Test library works

### Step 7: Create Panels & Dialogs Features (30 min)
- Create simple feature containers
- Move respective components

### Step 8: Update Main Component (1 hour)
- Update ContentBuilderContainer to use feature components
- Clean up old imports
- Test everything works

**Total: 5-6 hours** (includes context setup)

---

## 📋 File Organization Summary

```
Project Structure:

✅ Hooks (Centralized - UNCHANGED):
   packages/frontend/src/hooks/timeline/
   ├── data/        # Data & state hooks
   ├── playback/    # Playback hooks
   ├── scene/       # Scene operations hooks
   ├── viewport/    # Viewport hooks
   └── interaction/ # Drag, keyboard hooks

✅ Features (New - UI Containers):
   ContentBuilder/features/
   ├── timeline/    # Timeline feature container + components
   ├── playback/    # Playback feature container + components
   ├── library/     # Library feature container + components
   ├── panels/      # Panels feature container + components
   └── dialogs/     # Dialogs feature container + components

✅ Utils (ContentBuilder-specific):
   ContentBuilder/
   ├── utils/       # Color, drag-drop utils
   └── config/      # Drag config
```
mplete ContentBuilder Structure

### index.tsx (Root - Provides Context & DndContext)

```typescript
// ContentBuilder/index.tsx
import React, { useRef } from 'react';
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { ContentBuilderProvider } from './context/ContentBuilderContext';
import { ContentBuilderContainer } from './ContentBuilderContainer';
import { ContentBuilderProps } from '@/lib/types/timeline';

const ContentBuilder: React.FC<ContentBuilderProps> = (props) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  
  return (
    <DndContext sensors={sensors}>
      <ContentBuilderProvider
        filmId={props.filmId}
        initialScenes={props.initialScenes}
        onSave={props.onSave}
        readOnly={props.readOnly}
        timelineRef={timelineRef}
      >
        <ContentBuilderContainer timelineRef={timelineRef} />
        <DragOverlay>{/* Drag overlay content */}</DragOverlay>
      </ContentBuilderProvider>
    </DndContext>
  );
};

export default ContentBuilder;
```

### ContentBuilderContainer.tsx (Layout Orchestration)

```typescript
// ContentBuilderContainer.tsx
import React from 'react';
import { Box } from '@mui/material';
import { TimelineFeature } from './features/timeline';
import { PlaybackFeature } from './features/playback';
import { PanelsFeature } from './features/panels';
import { DialogsFeature } from './features/dialogs';

interface Props {
  timelineRef: React.RefObject<HTMLDivElement>;
}

export const ContentBuilderContainer: React.FC<Props> = ({ timelineRef }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '82vw' }}>
      {/* Top Row */}
      <Box sx={{ display: 'flex' }}>
        <PlaybackFeature />
        <PanelsFeature />
      </Box>

      {/* Timeline Row */}
      <TimelineFeature timelineRef={timelineRef} />

      {/* Dialogs */}
      <DialogsFeature />
    </Box>
  );
};
```

Much cleaner! Context provides shared state, features consume it, components render UI
```

Much cleaner! Each feature is self-contained, but hooks remain centralized.

---

## ✅ Summary

**Revised Approach 2 is better because:**

1. **Respects existing architecture** - Hooks are already well-organized, keep them there
2. **Simpler migration** - Only move components, not hooks (4-5 hours vs 6-7)
3. **Clear separation** - Hooks = logic (centralized), Features = UI containers (feature-based)
4. **Less risk** - Hooks don't move, so existing hook tests unchanged
5. **Better clarity** - Feature containers show exactly which hooks they use

**Next step:** Start with creating feature containers, then incrementally move components.
