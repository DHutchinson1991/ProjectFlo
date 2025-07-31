# ContentBuilder Module

A modular, type-safe React component for building wedding film timelines with drag-and-drop scene management, multi-media support, and comprehensive playback controls.

## 📁 Folder Structure

```
ContentBuilder/
├── README.md                           # This documentation
├── types/                             # TypeScript type definitions
│   ├── index.ts                       # Centralized type exports
│   ├── sceneTypes.ts                  # Scene and media component types
│   ├── timelineTypes.ts               # Timeline, track, and playback types
│   ├── dragDropTypes.ts               # Drag & drop state management types
│   ├── controlTypes.ts                # UI control component types
│   └── playbackTypes.ts               # PlaybackScreen component types
├── utils/                             # Pure utility functions
│   ├── index.ts                       # Centralized utility exports
│   ├── sceneUtils.ts                  # Scene processing and validation
│   ├── timelineUtils.ts               # Timeline calculations and collision detection
│   ├── trackUtils.ts                  # Track compatibility and assignment
│   ├── colorUtils.ts                  # Scene color generation
│   ├── formatUtils.ts                 # Time/duration formatting
│   └── dragDropUtils.ts               # Drag & drop scene creation logic
├── hooks/                             # Custom React hooks
│   ├── index.ts                       # Centralized hook exports
│   ├── useTimelineData.ts             # Timeline data loading and management
│   ├── usePlaybackControls.ts         # Video playback state management
│   ├── useScenesLibrary.ts            # Scene library filtering and search
│   ├── useDragAndDrop.ts              # Drag & drop state and interactions
│   ├── useSaveState.ts                # Save state management and persistence
│   ├── useSceneGrouping.ts            # Scene grouping and multi-media handling
│   ├── useKeyboardShortcuts.ts        # Keyboard shortcuts and hotkeys
│   ├── useContentBuilderDragHandlers.ts # Main drag & drop event handlers
│   ├── useDragSensors.ts              # Drag sensor configuration
│   └── usePlaybackScreen.ts           # PlaybackScreen data management
├── timeline/                          # Timeline visualization components
│   ├── index.ts                       # Timeline component exports
│   ├── ContentBuilderTimeline.tsx     # Main timeline container
│   ├── TimelineTrack.tsx              # Individual track rendering
│   ├── TimelinePlayhead.tsx           # Current time indicator
│   ├── TimelineDropZones.tsx          # Drop zone handling
│   ├── TimelineSnapGrid.tsx           # Snap grid visualization
│   ├── TimelineGrid.tsx               # Timeline grid lines
│   └── TimelineSceneElement.tsx       # Scene element rendering
├── library/                           # Scene library components
│   ├── index.ts                       # Library component exports
│   ├── ContentBuilderScenesLibrary.tsx # Main library container
│   ├── SceneCard.tsx                  # Individual scene card
│   ├── SceneCategories.tsx            # Category filtering
│   ├── SceneSearch.tsx                # Search functionality
│   ├── SceneGrid.tsx                  # Grid layout for scenes
│   └── DragOverlayScene.tsx           # Drag overlay visualization
├── controls/                          # Control panel components
│   ├── index.ts                       # Control component exports
│   ├── ContentBuilderControls.tsx     # Main controls container
│   ├── PlaybackControls.tsx           # Video playback controls
│   ├── TimelineControls.tsx           # Timeline zoom and navigation
│   ├── SaveControls.tsx               # Save/export functionality
│   └── ViewControls.tsx               # View mode and display options
├── playback/                          # PlaybackScreen components
│   ├── index.ts                       # Playback component exports
│   ├── PlaybackScreen.tsx             # Main playback information display
│   └── PlaybackScreen.module.css      # Dark-themed component styles
└── documentation/                     # Historical documentation
    ├── PHASE-1-STATUS.md             # Previous refactoring status
    ├── PHASE-1-ANALYSIS.md           # Component analysis
    └── REFACTOR-COMPLETE.md          # Refactoring completion notes
```

## 🏗️ Architecture Overview

### Core Design Principles

1. **Modular Architecture**: Each domain has its own folder with focused responsibilities
2. **Type Safety**: Comprehensive TypeScript interfaces for all data structures
3. **Separation of Concerns**: Business logic in hooks, UI logic in components, utilities are pure functions
4. **Centralized Exports**: Each module has an index.ts for clean imports
5. **Multi-Media Support**: Scenes can contain multiple media components (video, audio, graphics)
6. **Single Responsibility**: Each hook and component has one clear purpose

### Recent Refactoring (Latest)

The ContentBuilder has been further modularized to extract complex logic from the main component:

- **useKeyboardShortcuts**: Extracted keyboard event handling with support for delete, and extensible for more shortcuts
- **useContentBuilderDragHandlers**: Centralized all drag & drop event handling logic 
- **useDragSensors**: Standardized sensor configuration for consistent drag behavior
- **PlaybackScreen**: New dedicated component for displaying current scene information
- **usePlaybackScreen**: Hook for managing playback screen data and state
- **Reduced main component**: ContentBuilder.tsx reduced from 378 to 239 lines (37% reduction)
- **Improved maintainability**: Each concern is now in its own focused hook
- **Enhanced types**: Added playbackTypes.ts for PlaybackScreen component types

### Data Flow

```
ContentBuilder.tsx (Orchestrator)
    ↓
    ├── Hooks (Business Logic)
    │   ├── useTimelineData → Timeline data management
    │   ├── usePlaybackControls → Playback state
    │   ├── useScenesLibrary → Library filtering
    │   ├── useDragAndDrop → Drag interactions
    │   ├── useSaveState → Persistence
    │   └── useSceneGrouping → Multi-media grouping
    ↓
    ├── Components (UI Rendering)
    │   ├── Timeline → Visual timeline with tracks
    │   ├── Library → Draggable scene library
    │   └── Controls → Playback and view controls
    ↓
    └── Utils (Pure Functions)
        ├── Scene processing
        ├── Timeline calculations
        ├── Color generation
        └── Format helpers
```

## 🔧 Key Features

### Timeline Management
- **Multi-track support**: Video, audio, graphics, and music tracks
- **Collision detection**: Prevents scene overlap with intelligent placement
- **Snap grid**: 5-second snap grid for precise positioning
- **Zoom controls**: Expandable timeline zoom (1x to 50x)
- **Auto-fit**: Automatically fits 1 minute in viewport on load

### Scene Library
- **Multi-media scenes**: Scenes can contain multiple media components
- **Drag visualization**: Shows all linked media when dragging multi-component scenes
- **Category filtering**: Filter by scene categories
- **Search functionality**: Text-based scene search
- **Visual indicators**: Chips show number of media components per scene

### Playback Controls
- **Video playback**: Play/pause/stop controls
- **Speed adjustment**: Variable playback speed
- **Timeline scrubbing**: Click-to-seek timeline navigation
- **Time display**: Current time and total duration

### Save System
- **Auto-save detection**: Tracks changes and shows save status
- **Manual save**: User-triggered save with visual feedback
- **Error handling**: Comprehensive error states and recovery

### PlaybackScreen
- **Real-time scene info**: Shows comprehensive data about the current scene
- **16:9 format**: Displayed in a cinematic 16:9 aspect ratio black box
- **Positioned above controls**: Located at the top, above playback controls
- **Dark theme**: Pure black background (#000000) with light text
- **Text-only display**: No thumbnails, pure information display
- **Synced to timeline**: Updates automatically based on playback time
- **Current scene detection**: Automatically finds scene at current playback position
- **Media component details**: Shows all media types and durations
- **Progress tracking**: Visual progress bar and percentage within current scene
- **Responsive design**: Adapts layout for mobile and desktop viewing

## 📦 Component Usage

### Basic Implementation

```tsx
import { ContentBuilder } from './ContentBuilder';

function VideoEditor() {
  const handleSave = (scenes: TimelineScene[]) => {
    // Save timeline scenes
    console.log('Saving scenes:', scenes);
  };

  return (
    <ContentBuilder
      initialScenes={[]}
      onSave={handleSave}
      readOnly={false}
    />
  );
}
```

### Using Individual Components

```tsx
import { 
  ContentBuilderTimeline,
  ContentBuilderScenesLibrary,
  ContentBuilderControls,
  PlaybackScreen
} from './ContentBuilder';
import { useTimelineData, useDragAndDrop, usePlaybackScreen } from './ContentBuilder/hooks';

// Example of using PlaybackScreen independently
function CustomPlaybackDisplay() {
  const [currentScene, setCurrentScene] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  return (
    <PlaybackScreen
      currentScene={currentScene}
      totalDuration={300}
      currentTime={currentTime}
      readOnly={true}
    />
  );
}
```

## 🎯 Type System

### Core Types

- **`ScenesLibrary`**: Library scene with multiple media components
- **`TimelineScene`**: Scene placed on timeline with timing information
- **`MediaComponent`**: Individual media asset (video, audio, graphics)
- **`TimelineTrack`**: Timeline track definition and properties
- **`DragState`**: Drag and drop interaction state
- **`ViewState`**: Timeline viewport and zoom state
- **`PlaybackScreenData`**: Formatted scene information for display
- **`PlaybackScreenState`**: PlaybackScreen component state management

### Multi-Media Support

Scenes support multiple media types simultaneously:
- **Video**: Primary visual content
- **Audio**: Dialogue, ambient sound, narration
- **Graphics**: Overlays, titles, transitions
- **Music**: Background music and sound effects

## 🔨 Development Guidelines

### Adding New Features

1. **Types First**: Define TypeScript interfaces in `/types`
2. **Pure Functions**: Add utilities to `/utils` with comprehensive tests
3. **Business Logic**: Implement hooks in `/hooks` for stateful logic
4. **UI Components**: Create focused components in appropriate module folders
5. **Integration**: Update main ContentBuilder.tsx to orchestrate new features

### Best Practices

- **Single Responsibility**: Each file has one clear purpose
- **Type Safety**: Use TypeScript strictly, avoid `any` types
- **Error Handling**: Implement comprehensive error boundaries
- **Performance**: Use React.memo for expensive renders
- **Accessibility**: Include ARIA labels and keyboard navigation

### Testing Strategy

- **Unit Tests**: Test utilities and hooks independently
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Monitor rendering performance with large scene libraries

## 🚀 Performance Optimizations

### Implemented Optimizations

1. **Virtual Scrolling**: Timeline renders only visible scenes
2. **Memoized Calculations**: Expensive timeline calculations are cached
3. **Debounced Search**: Search input is debounced to prevent excessive filtering
4. **Optimistic Updates**: UI updates immediately, syncs with backend async
5. **Lazy Loading**: Scene thumbnails load on-demand

### Memory Management

- **Scene Cleanup**: Removed auto-seeded timeline scenes to reduce database load
- **Event Cleanup**: All event listeners are properly removed on unmount
- **Reference Management**: Uses React refs appropriately to prevent memory leaks

## 📊 Metrics and Analytics

### Performance Metrics
- Timeline render time
- Scene drag responsiveness
- Library search performance
- Save operation duration

### User Experience Metrics
- Drag success rate
- Timeline collision frequency
- Save error rate
- User workflow completion

## 🔄 Migration Guide

### From Legacy ContentBuilder

The modular architecture replaces the previous monolithic files:

- `ContentBuilderTypes.ts` → `types/` folder
- `ContentBuilderTimeline.tsx` → `timeline/` folder
- `ContentBuilderScenesLibrary.tsx` → `library/` folder
- `ContentBuilderControls.tsx` → `controls/` folder

Import paths have changed:
```tsx
// Old
import { TimelineScene } from './ContentBuilderTypes';

// New
import { TimelineScene } from './ContentBuilder/types';
```

## 🐛 Troubleshooting

### Common Issues

1. **Timeline Scenes Not Appearing**: Check that scenes have valid `start_time` and `duration`
2. **Drag Not Working**: Verify `readOnly` prop is false and scenes have proper IDs
3. **Save Errors**: Check network connectivity and save handler implementation
4. **Performance Issues**: Monitor scene count and consider virtualization

### Debug Mode

Enable debug logging:
```tsx
<ContentBuilder
  initialScenes={scenes}
  onSave={handleSave}
  debug={true} // Enables console logging
/>
```

## 🔮 Future Enhancements

### Planned Features
- **Collaborative Editing**: Real-time collaboration support
- **Advanced Effects**: Transition effects between scenes
- **Template System**: Pre-built timeline templates
- **Export Options**: Multiple export formats and quality settings
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Undo/Redo**: Full action history with undo capabilities

### Technical Improvements
- **WebGL Rendering**: Hardware-accelerated timeline rendering
- **Web Workers**: Background processing for heavy calculations
- **Service Worker**: Offline editing capabilities
- **WebRTC**: Real-time collaborative features

## 📝 Contributing

1. Follow the modular architecture patterns
2. Add comprehensive TypeScript types
3. Include unit tests for new utilities
4. Update this README for significant changes
5. Use conventional commit messages

## 📚 Related Documentation

- [Project Architecture](../../../../../../Plan/Architecture/)
- [Database Schema](../../../../../../Plan/Data/Database%20Schema.md)
- [UI Components](../../../../../../Plan/Design/UI%20Components.md)
- [Implementation Roadmap](../../../../../../Plan/Implementation/Development%20Roadmap.md)
