# ContentBuilder Component Development Guide

A comprehensive guide for developing components in the ProjectFlo ContentBuilder system.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Naming Conventions](#naming-conventions)
4. [Component Organization](#component-organization)
5. [Creating New Components](#creating-new-components)
6. [Import Patterns](#import-patterns)
7. [Utilities & Helpers](#utilities--helpers)
8. [Type Definitions](#type-definitions)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

---

## Architecture Overview

The ContentBuilder is a visual timeline and library editor for managing video project scenes and moments. It consists of:

- **Timeline Panel**: Displays scenes and moments in a zoomable, scrollable timeline
- **Library Panel**: Shows available scenes that can be dragged to the timeline
- **Playback Panel**: Controls video playback and timeline scrubbing
- **Details Panel**: Displays and edits properties of selected items
- **Infrastructure Components**: Grid, tracks, playhead, and other canvas primitives

### Key Principles

✅ **Symmetric Naming**: File name = Component name = Export name  
✅ **Domain-Based Organization**: Components grouped by feature (timeline, library, moments)  
✅ **Single Responsibility**: Each component has one clear purpose  
✅ **Centralized Utilities**: Business logic in @/lib/utils, UI logic in ContentBuilder/utils  
✅ **Type Safety**: Full TypeScript with proper interfaces and types

---

## Directory Structure

```
ContentBuilder/
├── ui/
│   ├── panels/
│   │   ├── timeline/              # Timeline visualization & interaction
│   │   │   ├── infrastructure/    # Canvas primitives (Grid, Track, etc.)
│   │   │   │   ├── Grid.tsx
│   │   │   │   ├── SnapGrid.tsx
│   │   │   │   ├── Playhead.tsx
│   │   │   │   ├── Track.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── DropZones.tsx
│   │   │   │   ├── Timeline.tsx
│   │   │   │   └── index.ts
│   │   │   ├── scenes/            # Scene-related timeline components
│   │   │   │   ├── ScenesHeader.tsx
│   │   │   │   ├── SceneBlock.tsx
│   │   │   │   ├── SceneActions.tsx
│   │   │   │   ├── SceneMomentsTrack.tsx
│   │   │   │   └── index.ts
│   │   │   └── moments/           # Moment-related timeline components
│   │   │       ├── MomentsRenderer.tsx
│   │   │       ├── MomentsContainer.tsx
│   │   │       ├── MomentsHeader.tsx
│   │   │       ├── MomentEditor.tsx
│   │   │       ├── MomentEditorFields.tsx
│   │   │       ├── MomentCoverageSelector.tsx
│   │   │       └── index.ts
│   │   ├── library/               # Scene library & selection
│   │   │   └── scenes/
│   │   │       ├── ScenesBrowser.tsx
│   │   │       ├── ScenesGrid.tsx
│   │   │       ├── ScenesSearch.tsx
│   │   │       ├── ScenesCategoryFilter.tsx
│   │   │       ├── SceneCard.tsx
│   │   │       └── index.ts
│   │   └── playback/              # Playback controls
│   │       ├── PlaybackControls.tsx
│   │       ├── SaveControls.tsx
│   │       └── index.ts
│   ├── modals/                    # Dialog windows
│   ├── context/                   # React Context definitions
│   ├── utils/                     # UI-specific utilities
│   │   ├── colorUtils.ts          # Color palette functions
│   │   ├── dragDropUtils.ts       # Drag-drop calculations
│   │   └── index.ts
│   └── index.ts
├── hooks/                         # Custom React hooks (see @/hooks/timeline)
├── context/                       # Context providers
├── index.tsx                      # Main ContentBuilder component
└── ContentBuilderContainer.tsx    # Container with data loading
```

---

## Naming Conventions

### The Symmetric Naming Rule

**File name = Component name = Export name**

This is the golden rule that ensures perfect consistency:

```typescript
// ✅ CORRECT: File = Function = Export
// File: ScenesHeader.tsx
const ScenesHeader: React.FC<ScenesHeaderProps> = ({ ... }) => { ... };
export default ScenesHeader;

// ✅ CORRECT: Named export variant
// File: ScenesBrowser.tsx
const ScenesBrowser: React.FC<ScenesBrowserProps> = ({ ... }) => { ... };
export { ScenesBrowser };
```

### Component Naming

- **Plural form**: Use plural for container/grid components
  - `ScenesHeader.tsx` - shows multiple scenes
  - `ScenesGrid.tsx` - grid of multiple scenes
  - `MomentsRenderer.tsx` - renders multiple moments
  - `TimelineSceneMomentBlock.tsx` - contains multiple moments

- **Singular form**: Use singular for item/detail components
  - `SceneCard.tsx` - single scene card
  - `MomentEditor.tsx` - edits single moment
  - `SceneBlock.tsx` - renders single scene block

### Props Interface Naming

Props interfaces should match the component name:

```typescript
// ✅ CORRECT
interface ScenesHeaderProps {
    scenes: Scene[];
    onSelectScene: (scene: Scene) => void;
}

// ❌ AVOID
interface Props { ... }
interface ScenesLibraryHeaderProps { ... }  // Doesn't match filename
```

### Export Patterns

**Two acceptable patterns** (use consistently):

1. **Default Export** (via barrel export)
   ```typescript
   // In component file
   export default ScenesHeader;
   
   // In barrel export
   export { default as ScenesHeader } from './ScenesHeader';
   ```

2. **Named Export**
   ```typescript
   // In component file
   export { ScenesHeader };
   
   // In barrel export
   export { ScenesHeader } from './ScenesHeader';
   ```

---

## Component Organization

### Folder Organization by Domain

Components are organized by feature/domain, not by type:

```
❌ WRONG (by type):
├── components/
│   ├── scenes/
│   │   ├── Scene.tsx
│   │   ├── SceneGrid.tsx
│   │   ├── SceneLibrary.tsx
│   ├── timeline/
│   │   ├── Track.tsx
│   │   ├── Grid.tsx
│   └── modals/
│       └── SceneDialog.tsx

✅ CORRECT (by domain):
├── panels/
│   ├── timeline/scenes/
│   │   └── (timeline scene components)
│   ├── timeline/moments/
│   │   └── (timeline moment components)
│   └── library/scenes/
│       └── (library scene components)
```

### Barrel Exports

Every folder should have an `index.ts` that exports all public components:

```typescript
// scenes/index.ts
export { ScenesHeader } from './ScenesHeader';
export { SceneBlock } from './SceneBlock';
export { SceneActions } from './SceneActions';
export { SceneMomentsTrack } from './SceneMomentsTrack';
```

**Benefits:**
- Single import point: `import { ScenesHeader, SceneBlock } from './scenes'`
- Easy to see what's exported
- Easier refactoring (can reorganize internal structure)

---

## Creating New Components

### Step 1: Determine Naming

```typescript
// Example: Create a new component to show scene details

1. File name: SceneDetails.tsx (or ScenesDetailPanel.tsx if plural)
2. Component name: const SceneDetails = ...
3. Props name: interface SceneDetailsProps { ... }
4. Export: export { SceneDetails }
```

### Step 2: Create the Component File

```typescript
// File: SceneDetails.tsx
'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Displays detailed information about a scene.
 * 
 * @param scene - The scene to display details for
 * @param onEdit - Called when user initiates editing
 */
interface SceneDetailsProps {
    scene: Scene;
    onEdit?: (scene: Scene) => void;
}

export const SceneDetails: React.FC<SceneDetailsProps> = ({ scene, onEdit }) => {
    return (
        <Box>
            <Typography variant="h6">{scene.name}</Typography>
            <Typography variant="body2">{scene.description}</Typography>
        </Box>
    );
};
```

### Step 3: Add to Barrel Export

```typescript
// In the parent folder's index.ts
export { SceneDetails } from './SceneDetails';
```

### Step 4: Use in Parent Components

```typescript
// Import through barrel
import { SceneDetails } from './scenes';

// Use the component
<SceneDetails scene={currentScene} onEdit={handleEdit} />
```

---

## Import Patterns

### Rule 1: Import from Barrels When Possible

```typescript
// ✅ PREFERRED
import { ScenesHeader, SceneBlock, SceneActions } from './scenes';
import { Grid, Track, Timeline } from './infrastructure';

// ❌ AVOID (except when only needing one item)
import ScenesHeader from './scenes/ScenesHeader';
import SceneBlock from './scenes/SceneBlock';
```

### Rule 2: Use @/lib/utils for Business Logic

```typescript
// ✅ CORRECT
import { formatTime } from '@/lib/utils/formatUtils';
import { transformFilmMomentsTimeline } from '@/lib/utils/momentTransform';
import { findAvailableSpaceOnTrack } from '@/lib/utils/timelineUtils';

// ❌ AVOID (don't re-export from lib in ContentBuilder)
import { formatTime } from '../../../utils/formatUtils';
```

### Rule 3: Use Relative Paths for UI-Specific Utilities

```typescript
// ✅ CORRECT
import { getSceneColorByType, getDefaultTrackColor } from '../utils/colorUtils';
import { calculateDropPosition } from '../utils/dragDropUtils';

// From deeply nested: use appropriate relative path
import { getSceneColorByType } from '../../../utils/colorUtils';
```

### Rule 4: Type Imports

```typescript
// ✅ USE TYPE IMPORTS
import type { Scene, TimelineTrack } from '@/lib/types/timeline';
import type { ScenesLibrary } from '@/lib/types/domains/scenes';

// Component imports remain regular
import { ScenesGrid } from './library/scenes';
```

---

## Utilities & Helpers

### ColorUtils

Provides color palette for timeline visualization:

```typescript
import { getSceneColorByType, getDefaultTrackColor } from '../utils/colorUtils';

// Get color for a scene block
const sceneColor = getSceneColorByType('VIDEO');  // Returns: "#1e88e5"

// Get color for a track background
const trackColor = getDefaultTrackColor('video');  // Returns: "#1565c0"

// Debug palette (development only)
logPaletteDebug('Timeline Initialized');
```

### DragDropUtils

Handles drag-and-drop calculations:

```typescript
import { calculateDropPosition, isValidDrop } from '../utils/dragDropUtils';

// Calculate where item was dropped
const dropResult = calculateDropPosition(
    { x: 250, y: 120 },
    { zoomLevel: 10, viewportLeft: 0 },
    tracks,
    trackOffset
);

// Validate the drop
const isValid = isValidDrop(
    draggedScene,
    dropResult,
    existingScenes,
    (sceneType, trackType) => sceneType === trackType,
    tracks
);
```

### Centralized Utilities (@/lib/utils)

For business logic utilities, import from centralized location:

```typescript
// Format utilities
import { formatTime, formatDuration } from '@/lib/utils/formatUtils';

// Timeline calculations
import { findAvailableSpaceOnTrack, scenesWouldCollide } from '@/lib/utils/timelineUtils';

// Scene utilities
import { getScenePrimaryMediaType } from '@/lib/utils/sceneUtils';

// Moment transformations
import { transformFilmMomentsTimeline } from '@/lib/utils/momentTransform';
```

---

## Type Definitions

Always import types with `type` keyword:

```typescript
import type { 
    TimelineScene, 
    TimelineTrack,
    ViewState 
} from '@/lib/types/timeline';

import type { 
    ScenesLibrary,
    SceneMoment 
} from '@/lib/types/domains/scenes';
```

### Define Component Props Interface

```typescript
/**
 * Props for ScenesGrid component
 */
interface ScenesGridProps {
    /** Array of scenes to display */
    scenes: ScenesLibrary[];
    
    /** Currently selected scene ID */
    selectedSceneId?: number;
    
    /** Called when user selects a scene */
    onSceneSelect?: (scene: ScenesLibrary) => void;
    
    /** Read-only mode (no interactions) */
    readOnly?: boolean;
}
```

---

## Best Practices

### 1. Use React.FC<Props> for Type Safety

```typescript
// ✅ CORRECT
const ScenesHeader: React.FC<ScenesHeaderProps> = ({ scenes, onEdit }) => {
    // Component logic
};

// ❌ AVOID
function ScenesHeader({ scenes, onEdit }: ScenesHeaderProps) {
    // Missing return type
}
```

### 2. Memoize Expensive Components

```typescript
import { memo } from 'react';

const SceneCard: React.FC<SceneCardProps> = memo(({ scene, isSelected, onClick }) => {
    return (
        <Box onClick={onClick}>
            {/* Render scene card */}
        </Box>
    );
});

export { SceneCard };
```

### 3. Use Callbacks for Event Handlers

```typescript
const ScenesGrid: React.FC<ScenesGridProps> = ({ scenes, onSceneSelect }) => {
    const handleSceneClick = useCallback((scene: ScenesLibrary) => {
        onSceneSelect?.(scene);
    }, [onSceneSelect]);
    
    return (
        <Box>
            {scenes.map(scene => (
                <SceneCard 
                    key={scene.id} 
                    scene={scene} 
                    onClick={() => handleSceneClick(scene)} 
                />
            ))}
        </Box>
    );
};
```

### 4. Document with JSDoc

```typescript
/**
 * Displays a grid of scenes from the library.
 * 
 * Users can select scenes to add to the timeline.
 * 
 * @param scenes - Array of available scenes
 * @param selectedSceneId - ID of currently selected scene
 * @param onSceneSelect - Callback when scene is selected
 * @param readOnly - Whether to show in read-only mode
 * 
 * @example
 * <ScenesGrid 
 *   scenes={library} 
 *   onSceneSelect={handleAdd}
 * />
 */
const ScenesGrid: React.FC<ScenesGridProps> = ({ ... }) => {
    // Implementation
};
```

### 5. Avoid Prop Drilling

Use Context for shared state:

```typescript
// ✅ Use ContentBuilderContext
const { selectedScene, setSelectedScene } = useContext(ContentBuilderContext);

// ❌ AVOID passing through many levels
<Parent scene={scene}>
    <Child scene={scene}>
        <GrandChild scene={scene} />
    </Child>
</Parent>
```

### 6. Extract Complex Logic to Hooks

```typescript
// scenes/hooks/useSceneSelection.ts
export const useSceneSelection = (initialScene?: Scene) => {
    const [selectedScene, setSelectedScene] = useState<Scene | null>(initialScene || null);
    
    return { selectedScene, setSelectedScene };
};

// In component
const { selectedScene, setSelectedScene } = useSceneSelection();
```

---

## Common Patterns

### Pattern 1: List with Selection

```typescript
interface ScenesListProps {
    scenes: ScenesLibrary[];
    onSelect?: (scene: ScenesLibrary) => void;
}

const ScenesList: React.FC<ScenesListProps> = ({ scenes, onSelect }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    
    const handleSelect = useCallback((scene: ScenesLibrary) => {
        setSelectedId(scene.id);
        onSelect?.(scene);
    }, [onSelect]);
    
    return (
        <Box>
            {scenes.map(scene => (
                <SceneCard
                    key={scene.id}
                    scene={scene}
                    isSelected={selectedId === scene.id}
                    onClick={() => handleSelect(scene)}
                />
            ))}
        </Box>
    );
};
```

### Pattern 2: Search & Filter

```typescript
interface ScenesSearchProps {
    onSearch?: (query: string) => void;
}

const ScenesSearch: React.FC<ScenesSearchProps> = ({ onSearch }) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSearch?.(e.target.value);
    }, [onSearch]);
    
    return (
        <TextField
            placeholder="Search scenes..."
            onChange={handleChange}
            fullWidth
        />
    );
};
```

### Pattern 3: Controlled Component

```typescript
interface SceneCategoryFilterProps {
    selectedCategory: string | null;
    onCategorySelect: (category: string) => void;
}

const ScenesCategoryFilter: React.FC<SceneCategoryFilterProps> = ({
    selectedCategory,
    onCategorySelect
}) => {
    return (
        <Box>
            {categories.map(cat => (
                <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'contained' : 'outlined'}
                    onClick={() => onCategorySelect(cat)}
                >
                    {cat}
                </Button>
            ))}
        </Box>
    );
};
```

### Pattern 4: Data Loading

```typescript
const ScenesContainer: React.FC = () => {
    const [scenes, setScenes] = useState<ScenesLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchScenes = async () => {
            try {
                const data = await api.scenes.list();
                setScenes(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        
        fetchScenes();
    }, []);
    
    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    
    return <ScenesGrid scenes={scenes} />;
};
```

---

## Summary Checklist

When creating a new component:

- [ ] File name matches component name (`ScenesHeader.tsx` for `ScenesHeader`)
- [ ] Component name matches export name
- [ ] Props interface named `{ComponentName}Props`
- [ ] Full TypeScript with `React.FC<Props>` annotation
- [ ] JSDoc with `@param`, `@returns`, `@example`
- [ ] Added to parent folder's `index.ts`
- [ ] Imports follow the rules (barrel → @/lib/utils → relative)
- [ ] Using `useCallback` for event handlers
- [ ] Using `memo` for expensive components
- [ ] Extracted complex logic to hooks if needed
- [ ] No prop drilling (use Context instead)
- [ ] Type imports use `import type`

---

## Resources

- [TypeScript React Best Practices](https://www.typescriptlang.org/docs/handbook/react.html)
- [React Hooks Documentation](https://react.dev/reference/react)
- [MUI Component Documentation](https://mui.com/material-ui/getting-started/)
- [ContentBuilder Context Guide](./ContentBuilderContext.ts)

