// Main FloorPlan module exports

// Components (with specific exports to avoid conflicts)
export {
    FloorPlanEditor as FloorPlanEditorDialog,
    IntegratedFloorPlanEditor,
    EditorToolbar,
    EditorCanvas,
    EditorSidebar,
    EditorStatusBar,
    ContextMenu,
    getElementActions,
    getCanvasActions,
    PropertiesPanel,
    LayersPanel,
    MeasurementsPanel,
    RoomPanel,
    DrawingToolbar,
    VenueToolbar,
    FurnitureToolbar
} from './components';

// Component types (with aliases to avoid conflicts)
export type {
    SelectedElement as ComponentSelectedElement,
    Layer as ComponentLayer,
    ContextMenuAction
} from './components';

// Services
export {
    SVGCanvasService,
    ElementFactory,
    FloorPlanDataService,
    GridService,
    MeasurementService,
    FloorPlanIntegrationService
} from '../../services';

// Service types
export type {
    SVGDrawing,
    ElementCreationResult,
    FloorPlanData,
    GridPoint,
    GridBounds,
    Measurement,
    ElementDimensions,
    FloorPlanState,
    Layer as ServiceLayer,
    FloorPlanSnapshot,
    IntegrationEventHandlers
} from '../../services';

// Hooks
export {
    useFloorPlanState,
    useZoomPan,
    useUndoRedo,
    useIntegratedFloorPlan
} from '../../hooks/floor-plan';

// Hook types
export type {
    UseIntegratedFloorPlanState,
    SelectedElement as HookSelectedElement
} from '../../hooks/floor-plan';

// Constants
export * from '../../constants/elements';
export * from '../../constants/tools';
export * from '../../constants/dimensions';

// Types
export * from '../../types/floor-plan/editor';
export * from '../../types/floor-plan/WallTypes';

// Main Editor Components for external use (recommended exports)
export { FloorPlanEditor as FloorPlanEditorModal } from './components/Editor/FloorPlanEditor';
export { IntegratedFloorPlanEditor as FloorPlanEditor } from './components/Editor/IntegratedFloorPlanEditor';
