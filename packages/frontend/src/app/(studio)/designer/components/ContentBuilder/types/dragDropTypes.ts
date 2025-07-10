import { TimelineScene, ScenesLibrary } from './sceneTypes';

export interface DragState {
    draggedScene: TimelineScene | null;
    draggedLibraryScene: ScenesLibrary | null;
    dragOffset: { x: number; y: number };
    isDragActive: boolean;
    hasCollision?: boolean; // Track if current drag position would cause collision
    previewPosition?: { startTime: number; trackId: number }; // Preview position during drag
}

export interface ViewState {
    zoomLevel: number; // pixels per second
    snapToGrid: boolean;
    gridSize: number; // seconds
    selectedScene: TimelineScene | null;
    viewportLeft: number; // timeline scroll position in pixels
    viewportWidth: number; // visible viewport width in pixels;
}
