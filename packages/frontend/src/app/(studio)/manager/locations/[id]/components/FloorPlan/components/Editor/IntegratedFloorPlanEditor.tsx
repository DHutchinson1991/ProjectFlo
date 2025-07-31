import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Paper, Drawer, Tabs, Tab, IconButton, Button, Typography } from '@mui/material';
import { Undo, Redo, Save, Close } from '@mui/icons-material';
import { ContextMenu, getElementActions, getCanvasActions } from './ContextMenu';
import { PropertiesPanel, SelectedElement } from '../Panels/PropertiesPanel';
import { FloorPlanIntegrationService, FloorPlanState } from '../../services/FloorPlanIntegrationService';
import { Tool } from '../../constants/tools';

interface IntegratedFloorPlanEditorProps {
    initialData?: unknown;
    onSave?: (data: unknown) => void;
    onCancel?: () => void;
    readOnly?: boolean;
}

export const IntegratedFloorPlanEditor: React.FC<IntegratedFloorPlanEditorProps> = ({
    initialData,
    onSave,
    onCancel
}) => {
    // Refs
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const integrationServiceRef = useRef<FloorPlanIntegrationService | null>(null);

    // State management
    const [state, setState] = useState<FloorPlanState | null>(null);
    const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [rightPanelTab, setRightPanelTab] = useState(0);
    const [rightPanelOpen] = useState(true);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        selectedElementId?: string;
        selectedElementType?: string;
    } | null>(null);

    // Initialize integration service
    useEffect(() => {
        if (!canvasContainerRef.current || integrationServiceRef.current) return;

        const containerId = 'floor-plan-canvas';
        canvasContainerRef.current.id = containerId;

        integrationServiceRef.current = new FloorPlanIntegrationService(
            containerId,
            initialData,
            {
                onElementSelected: (elementIds) => {
                    // Convert element IDs to SelectedElement objects
                    // TODO: Get actual element data from canvas
                    const elements: SelectedElement[] = elementIds.map(id => ({
                        id,
                        type: 'rectangle', // TODO: Get actual type
                        name: `Element ${id}`,
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 60,
                        rotation: 0,
                        fill: '#3498db',
                        stroke: '#2980b9',
                        strokeWidth: 2,
                        opacity: 1
                    }));
                    setSelectedElements(elements);
                },
                onElementCreated: (elementId, elementType) => {
                    console.log(`Element created: ${elementId} (${elementType})`);
                },
                onElementUpdated: (elementId, updates) => {
                    console.log(`Element updated: ${elementId}`, updates);
                },
                onElementDeleted: (elementIds) => {
                    console.log(`Elements deleted:`, elementIds);
                    setSelectedElements([]);
                },
                onMeasurementCreated: (measurement) => {
                    console.log('Measurement created:', measurement);
                },
                onMeasurementDeleted: (measurementId) => {
                    console.log(`Measurement deleted: ${measurementId}`);
                },
                onLayerChanged: (layerId) => {
                    console.log(`Active layer changed: ${layerId}`);
                },
                onStateChanged: (newState) => {
                    setState(prevState => {
                        if (!prevState) return null;
                        return { ...prevState, ...newState };
                    });
                }
            }
        );

        setState(integrationServiceRef.current.getState());

        return () => {
            integrationServiceRef.current?.dispose();
        };
    }, [initialData]);

    // Event handlers
    const handleCanvasClick = useCallback((event: React.MouseEvent, position: { x: number; y: number }) => {
        if (!integrationServiceRef.current) return;

        if (activeTool !== 'select') {
            // Create element at clicked position
            integrationServiceRef.current.createElement(activeTool, position);
        } else {
            // Selection logic handled by canvas component
        }
    }, [activeTool]);

    const handleContextMenu = useCallback((event: React.MouseEvent, elementId?: string, elementType?: string) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            selectedElementId: elementId,
            selectedElementType: elementType
        });
    }, []);

    const handleContextMenuClose = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleContextMenuAction = useCallback((actionId: string, elementId?: string) => {
        if (!integrationServiceRef.current) return;

        switch (actionId) {
            case 'delete':
                if (elementId) {
                    integrationServiceRef.current.deleteElements([elementId]);
                }
                break;
            case 'copy':
                // TODO: Implement copy
                break;
            case 'paste':
                // TODO: Implement paste
                break;
            case 'duplicate':
                // TODO: Implement duplicate
                break;
            case 'measure':
                setActiveTool('measure');
                break;
            default:
                console.log(`Context menu action: ${actionId}`);
        }
    }, []);

    // Element property updates
    const handleElementUpdate = useCallback((elementId: string, updates: Partial<SelectedElement>) => {
        integrationServiceRef.current?.updateElement(elementId, updates);
    }, []);

    const handleElementDelete = useCallback((elementId: string) => {
        integrationServiceRef.current?.deleteElements([elementId]);
    }, []);

    const handleElementDuplicate = useCallback((elementId: string) => {
        // TODO: Implement duplication
        console.log(`Duplicate element: ${elementId}`);
    }, []);

    const handleElementFlip = useCallback((elementId: string, direction: 'horizontal' | 'vertical') => {
        // TODO: Implement flip
        console.log(`Flip element ${elementId} ${direction}`);
    }, []);

    // Save/Cancel handlers
    const handleSave = useCallback(() => {
        if (integrationServiceRef.current && onSave) {
            const data = integrationServiceRef.current.saveFloorPlanData();
            onSave(data);
        }
    }, [onSave]);

    const handleCancel = useCallback(() => {
        onCancel?.();
    }, [onCancel]);

    // Undo/Redo
    const handleUndo = useCallback(() => {
        integrationServiceRef.current?.undo();
    }, []);

    const handleRedo = useCallback(() => {
        integrationServiceRef.current?.redo();
    }, []);

    if (!state) {
        return <Box>Loading...</Box>;
    }

    const selectedElement = selectedElements[0] || null;

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <Paper elevation={1} sx={{ zIndex: 10 }}>
                <Box p={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                        <Typography variant="h6">Floor Plan Editor</Typography>
                        <Box sx={{ flex: 1 }} />
                        <IconButton onClick={handleUndo} disabled={!integrationServiceRef.current?.canUndo()}>
                            <Undo />
                        </IconButton>
                        <IconButton onClick={handleRedo} disabled={!integrationServiceRef.current?.canRedo()}>
                            <Redo />
                        </IconButton>
                        <Button onClick={handleSave} startIcon={<Save />} variant="contained" size="small">
                            Save
                        </Button>
                        <Button onClick={handleCancel} startIcon={<Close />} variant="outlined" size="small">
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Main content area */}
            <Box sx={{ flex: 1, display: 'flex' }}>
                {/* Left Sidebar */}
                <Paper elevation={1} sx={{ width: 280, borderRadius: 0 }}>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6">Tools</Typography>
                        {/* Tool selection interface would go here */}
                    </Box>
                </Paper>

                {/* Canvas area */}
                <Box sx={{ flex: 1, position: 'relative' }}>
                    <Box
                        ref={canvasContainerRef}
                        sx={{ width: '100%', height: '100%' }}
                        onClick={(e: React.MouseEvent) => {
                            const rect = canvasContainerRef.current?.getBoundingClientRect();
                            if (rect) {
                                handleCanvasClick(e, { x: e.clientX - rect.left, y: e.clientY - rect.top });
                            }
                        }}
                        onContextMenu={(e: React.MouseEvent) => handleContextMenu(e)}
                    >
                        {/* Simplified canvas - EditorCanvas expects different props */}
                        <Box sx={{ width: '100%', height: '400px', bgcolor: 'grey.100', border: '1px dashed grey.400' }}>
                            <Typography sx={{ p: 2 }}>Canvas Area - Tool: {activeTool}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Right Panel */}
                <Drawer
                    variant="persistent"
                    anchor="right"
                    open={rightPanelOpen}
                    sx={{
                        width: rightPanelOpen ? 320 : 0,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 320,
                            boxSizing: 'border-box',
                            position: 'relative',
                            height: '100%'
                        },
                    }}
                >
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Tabs
                            value={rightPanelTab}
                            onChange={(_, newValue) => setRightPanelTab(newValue)}
                            variant="fullWidth"
                        >
                            <Tab label="Properties" />
                            <Tab label="Layers" />
                            <Tab label="Measurements" />
                            <Tab label="Rooms" />
                        </Tabs>

                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            {rightPanelTab === 0 && (
                                <PropertiesPanel
                                    selectedElement={selectedElement}
                                    onUpdateElement={handleElementUpdate}
                                    onDeleteElement={handleElementDelete}
                                    onDuplicateElement={handleElementDuplicate}
                                    onFlipElement={handleElementFlip}
                                />
                            )}
                            {rightPanelTab === 1 && (
                                <Box p={2}>
                                    <Typography variant="h6">Layers</Typography>
                                    <Typography color="text.secondary">
                                        Layers panel - placeholder implementation
                                    </Typography>
                                </Box>
                            )}
                            {rightPanelTab === 2 && (
                                <Box p={2}>
                                    <Typography variant="h6">Measurements</Typography>
                                    <Typography color="text.secondary">
                                        Measurements panel - placeholder implementation
                                    </Typography>
                                </Box>
                            )}
                            {rightPanelTab === 3 && (
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="h6">Rooms</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Room management panel placeholder
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Drawer>
            </Box>

            {/* Status bar */}
            <Paper elevation={1} sx={{ zIndex: 10 }}>
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">
                        Selected: {selectedElements.length} | Grid: {state.gridScale} | Snap: {state.snapToGrid ? 'On' : 'Off'}
                    </Typography>
                </Box>
            </Paper>

            {/* Context Menu */}
            <ContextMenu
                anchorEl={contextMenu ? {
                    getBoundingClientRect: () => ({
                        top: contextMenu.mouseY,
                        left: contextMenu.mouseX,
                        right: contextMenu.mouseX,
                        bottom: contextMenu.mouseY,
                        width: 0,
                        height: 0,
                        x: contextMenu.mouseX,
                        y: contextMenu.mouseY,
                        toJSON: () => ({})
                    })
                } as HTMLElement : null}
                open={Boolean(contextMenu)}
                onClose={handleContextMenuClose}
                selectedElementId={contextMenu?.selectedElementId}
                selectedElementType={contextMenu?.selectedElementType}
                actions={contextMenu?.selectedElementId
                    ? getElementActions(false, false)
                    : getCanvasActions(false)
                }
                onAction={handleContextMenuAction}
            />
        </Box>
    );
};
