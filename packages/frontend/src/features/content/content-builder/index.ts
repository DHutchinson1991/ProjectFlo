// Content Builder feature - public API
// The timeline editor for building film structures with scenes, moments, beats, and tracks

export { default as ContentBuilder } from './components/ContentBuilder';
export { ContentBuilderContainer } from './components/ContentBuilderContainer';
export { ContentBuilderProvider, useContentBuilder } from './context/ContentBuilderContext';
export type { TrackDefault } from './context/ContentBuilderContext';

// Utils
export { getSceneColorByType, getSceneColor, getDefaultTrackColor } from './utils/colorUtils';

// Data hooks (for film editor pages that compose ContentBuilder)
export { useTimelineStorage, useTimelineSave } from './hooks/data';

// Re-export types for consumers
export * from './types/timeline';
