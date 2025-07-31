import { useState, useCallback, useRef } from 'react';
import { FloorPlanIntegrationService, FloorPlanState } from '../services/FloorPlanIntegrationService';
import { MeasurementService, Measurement } from '../services/MeasurementService';
import { Tool } from '../constants/tools';

export interface SelectedElement {
    id: string;
    type: string;
    name: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    rotation: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
}

export interface UseIntegratedFloorPlanState {
    // State
    floorPlanState: FloorPlanState | null;
    selectedElements: SelectedElement[];
    activeTool: Tool;

    // Integration service methods
    createElement: (tool: Tool, position: { x: number; y: number }) => string | null;
    selectElements: (elementIds: string[]) => void;
    updateElement: (elementId: string, updates: Partial<SelectedElement>) => void;
    deleteElements: (elementIds: string[]) => void;

    // Measurement methods
    createMeasurement: (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => Measurement;
    deleteMeasurement: (measurementId: string) => void;
    toggleMeasurementVisibility: (measurementId: string) => void;

    // Layer methods
    createLayer: (name: string, color: string) => string;
    deleteLayer: (layerId: string) => void;
    setActiveLayer: (layerId: string) => void;

    // Grid methods
    setGridScale: (scale: '1m' | '5m' | '10m') => void;
    toggleGridVisibility: () => void;
    toggleSnapToGrid: () => void;

    // Undo/Redo methods
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Data methods
    saveFloorPlanData: () => unknown;
    loadFloorPlanData: (data: unknown) => void;

    // Tool management
    setActiveTool: (tool: Tool) => void;

    // Cleanup
    dispose: () => void;
}

interface UseIntegratedFloorPlanProps {
    containerId: string;
    initialData?: unknown;
    onElementSelected?: (elementIds: string[]) => void;
    onElementCreated?: (elementId: string, elementType: Tool) => void;
    onElementUpdated?: (elementId: string, updates: unknown) => void;
    onElementDeleted?: (elementIds: string[]) => void;
    onMeasurementCreated?: (measurement: Measurement) => void;
    onMeasurementDeleted?: (measurementId: string) => void;
    onLayerChanged?: (layerId: string) => void;
    onStateChanged?: (newState: Partial<FloorPlanState>) => void;
}

export const useIntegratedFloorPlan = ({
    containerId,
    initialData,
    onElementSelected,
    onElementCreated,
    onElementUpdated,
    onElementDeleted,
    onMeasurementCreated,
    onMeasurementDeleted,
    onLayerChanged,
    onStateChanged
}: UseIntegratedFloorPlanProps): UseIntegratedFloorPlanState => {
    const integrationServiceRef = useRef<FloorPlanIntegrationService | null>(null);
    const [floorPlanState, setFloorPlanState] = useState<FloorPlanState | null>(null);
    const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
    const [activeTool, setActiveTool] = useState<Tool>('select');

    // Element operations
    const createElement = useCallback((tool: Tool, position: { x: number; y: number }) => {
        return integrationServiceRef.current?.createElement(tool, position) || null;
    }, []);

    const selectElements = useCallback((elementIds: string[]) => {
        integrationServiceRef.current?.selectElements(elementIds);
    }, []);

    const updateElement = useCallback((elementId: string, updates: Partial<SelectedElement>) => {
        integrationServiceRef.current?.updateElement(elementId, updates);
    }, []);

    const deleteElements = useCallback((elementIds: string[]) => {
        integrationServiceRef.current?.deleteElements(elementIds);
    }, []);

    // Measurement operations
    const createMeasurement = useCallback((startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
        // Convert to GridPoint format (assuming z: 0 for 2D measurements)
        const startGridPoint = { x: startPoint.x, y: startPoint.y, z: 0 };
        const endGridPoint = { x: endPoint.x, y: endPoint.y, z: 0 };

        // Use a default grid scale - this should ideally come from the current floor plan state
        const gridScale: '1m' | '5m' | '10m' = '1m';

        return MeasurementService.createMeasurement(startGridPoint, endGridPoint, gridScale);
    }, []);

    const deleteMeasurement = useCallback((measurementId: string) => {
        integrationServiceRef.current?.deleteMeasurement(measurementId);
    }, []);

    const toggleMeasurementVisibility = useCallback((measurementId: string) => {
        integrationServiceRef.current?.toggleMeasurementVisibility(measurementId);
    }, []);

    // Layer operations
    const createLayer = useCallback((name: string, color: string) => {
        return integrationServiceRef.current?.createLayer(name, color) || '';
    }, []);

    const deleteLayer = useCallback((layerId: string) => {
        integrationServiceRef.current?.deleteLayer(layerId);
    }, []);

    const setActiveLayer = useCallback((layerId: string) => {
        integrationServiceRef.current?.setActiveLayer(layerId);
    }, []);

    // Grid operations
    const setGridScale = useCallback((scale: '1m' | '5m' | '10m') => {
        integrationServiceRef.current?.setGridScale(scale);
    }, []);

    const toggleGridVisibility = useCallback(() => {
        integrationServiceRef.current?.toggleGridVisibility();
    }, []);

    const toggleSnapToGrid = useCallback(() => {
        integrationServiceRef.current?.toggleSnapToGrid();
    }, []);

    // Undo/Redo operations
    const undo = useCallback(() => {
        integrationServiceRef.current?.undo();
    }, []);

    const redo = useCallback(() => {
        integrationServiceRef.current?.redo();
    }, []);

    const canUndo = useCallback(() => {
        return integrationServiceRef.current?.canUndo() || false;
    }, []);

    const canRedo = useCallback(() => {
        return integrationServiceRef.current?.canRedo() || false;
    }, []);

    // Data operations
    const saveFloorPlanData = useCallback(() => {
        return integrationServiceRef.current?.saveFloorPlanData();
    }, []);

    const loadFloorPlanData = useCallback((data: unknown) => {
        integrationServiceRef.current?.loadFloorPlanData(data);
    }, []);

    // Cleanup
    const dispose = useCallback(() => {
        integrationServiceRef.current?.dispose();
        integrationServiceRef.current = null;
    }, []);

    return {
        // State
        floorPlanState,
        selectedElements,
        activeTool,

        // Integration service methods
        createElement,
        selectElements,
        updateElement,
        deleteElements,

        // Measurement methods
        createMeasurement,
        deleteMeasurement,
        toggleMeasurementVisibility,

        // Layer methods
        createLayer,
        deleteLayer,
        setActiveLayer,

        // Grid methods
        setGridScale,
        toggleGridVisibility,
        toggleSnapToGrid,

        // Undo/Redo methods
        undo,
        redo,
        canUndo,
        canRedo,

        // Data methods
        saveFloorPlanData,
        loadFloorPlanData,

        // Tool management
        setActiveTool,

        // Cleanup
        dispose
    };
};
