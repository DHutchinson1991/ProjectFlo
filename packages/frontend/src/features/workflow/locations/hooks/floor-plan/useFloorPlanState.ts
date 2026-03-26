import { useState, useEffect } from 'react';
import { Tool } from '../../constants/tools';
import { VenueFloorPlan, EditorState, LayerDefinition } from '../../types/floor-plan/editor';
import { Wall, Room } from '../../types/floor-plan/WallTypes';

interface UseFloorPlanStateProps {
    initialData?: VenueFloorPlan;
}

export const useFloorPlanState = ({ initialData }: UseFloorPlanStateProps) => {
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [objectCount, setObjectCount] = useState(0);

    // Version management state
    const [selectedVersion, setSelectedVersion] = useState<number>(
        (initialData?.venue_floor_plan_data ? initialData.venue_floor_plan_version : 1) || 1
    );
    const [currentVersionData, setCurrentVersionData] = useState<VenueFloorPlan | undefined>(
        initialData?.venue_floor_plan_data ? initialData : undefined
    );

    // Layer management state
    const [layers, setLayers] = useState<LayerDefinition[]>([
        { id: 'layer-structure', name: 'Walls & Structure', visible: true },
        { id: 'layer-furniture', name: 'Furniture', visible: true },
        { id: 'layer-decoration', name: 'Decoration', visible: true }
    ]);
    const [activeLayerId, setActiveLayerId] = useState('layer-structure');

    // Professional Wall System State
    const [walls, setWalls] = useState<Wall[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>();
    const [wallType, setWallType] = useState<'interior' | 'exterior'>('interior');
    const [showRoomLabels, setShowRoomLabels] = useState(true);
    const [showRoomAreas, setShowRoomAreas] = useState(true);
    const [showRoomDimensions, setShowRoomDimensions] = useState(false);

    // Grid scale state
    const [gridScale, setGridScale] = useState<'1m' | '5m' | '10m'>('1m');

    // Measurement display state
    const [showMeasurements, setShowMeasurements] = useState<boolean>(true);

    // Load initial data when component mounts or initialData changes
    useEffect(() => {
        if (initialData?.venue_floor_plan_data) {
            setSelectedVersion(initialData.venue_floor_plan_version || 1);
            setCurrentVersionData(initialData);
        } else {
            // Reset to default state when no data
            setSelectedVersion(1);
            setCurrentVersionData(undefined);
            setWalls([]);
            setRooms([]);
            setSelectedRoomId(undefined);
        }
    }, [initialData]);

    const editorState: EditorState = {
        activeTool,
        objectCount,
        selectedVersion,
        currentVersionData,
        activeLayerId,
        wallType,
        showRoomLabels,
        showRoomAreas,
        showRoomDimensions,
        gridScale,
        showMeasurements,
        isDrawing: false, // This will be managed by drawing hook
        zoomLevel: 1, // This will be managed by zoom hook
        panOffset: { x: 0, y: 0 }, // This will be managed by zoom hook
        isPanning: false, // This will be managed by zoom hook
        lastPanPoint: { x: 0, y: 0 }, // This will be managed by zoom hook
    };

    return {
        // State
        activeTool,
        objectCount,
        selectedVersion,
        currentVersionData,
        layers,
        activeLayerId,
        walls,
        rooms,
        selectedRoomId,
        wallType,
        showRoomLabels,
        showRoomAreas,
        showRoomDimensions,
        gridScale,
        showMeasurements,
        editorState,

        // Setters
        setActiveTool,
        setObjectCount,
        setSelectedVersion,
        setCurrentVersionData,
        setLayers,
        setActiveLayerId,
        setWalls,
        setRooms,
        setSelectedRoomId,
        setWallType,
        setShowRoomLabels,
        setShowRoomAreas,
        setShowRoomDimensions,
        setGridScale,
        setShowMeasurements,
    };
};
