export interface VenueFloorPlan {
    venue_floor_plan_data: Record<string, unknown> | null;
    venue_floor_plan_version: number;
    venue_floor_plan_updated_at: string | null;
    venue_floor_plan_updated_by: number | null;
}

export interface FloorPlanEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: VenueFloorPlan) => void;
    onDelete?: () => void;
    locationId: number;
    initialData?: VenueFloorPlan;
    allVersions?: VenueFloorPlan[];
}

export interface EditorState {
    activeTool: import('../constants/tools').Tool;
    objectCount: number;
    selectedVersion: number;
    currentVersionData?: VenueFloorPlan;
    activeLayerId: string;
    wallType: 'interior' | 'exterior';
    showRoomLabels: boolean;
    showRoomAreas: boolean;
    showRoomDimensions: boolean;
    gridScale: '1m' | '5m' | '10m';
    showMeasurements: boolean;
    isDrawing: boolean;
    zoomLevel: number;
    panOffset: { x: number; y: number };
    isPanning: boolean;
    lastPanPoint: { x: number; y: number };
}

export interface LayerDefinition {
    id: string;
    name: string;
    visible: boolean;
}
