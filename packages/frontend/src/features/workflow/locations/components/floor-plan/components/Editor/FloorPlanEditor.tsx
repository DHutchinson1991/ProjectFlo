import React from 'react';
import { Dialog, Box } from '@mui/material';
import { Svg } from '@svgdotjs/svg.js';
import { FloorPlanEditorProps } from '../../../../types/floor-plan/editor';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { EditorCanvas } from './EditorCanvas';
import { EditorStatusBar } from './EditorStatusBar';
import { useFloorPlanState } from '../../../../hooks/floor-plan/useFloorPlanState';
import { useZoomPan } from '../../../../hooks/floor-plan/useZoomPan';
import { useUndoRedo } from '../../../../hooks/floor-plan/useUndoRedo';
import { SIDEBAR_WIDTH } from '../../../../constants/dimensions';
import { Wall } from '../../../../types/floor-plan/WallTypes';

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    locationId,
    initialData,
    allVersions = []
}) => {
    const floorPlanState = useFloorPlanState({ initialData });
    const zoomPanState = useZoomPan();
    const undoRedoState = useUndoRedo();

    // Create enhanced floor plan state with missing callbacks
    const enhancedFloorPlanState = {
        ...floorPlanState,
        onWallCreated: (wall: Wall) => {
            floorPlanState.setWalls([...floorPlanState.walls, wall]);
        },
        onRoomSelected: (roomId: string) => {
            floorPlanState.setSelectedRoomId(roomId);
        },
        onRoomDeselected: () => {
            floorPlanState.setSelectedRoomId(undefined);
        },
        onSvgDrawingReady: (drawing: Svg) => {
            console.log('SVG Drawing ready:', drawing);
        },
        onGridScaleChange: (scale: '1m' | '5m' | '10m') => {
            floorPlanState.setGridScale(scale);
        },
        onMeasurementsToggle: () => {
            floorPlanState.setShowMeasurements(!floorPlanState.showMeasurements);
        }
    };

    const handleClose = () => {
        // Clear history when closing
        undoRedoState.clearHistory();
        onClose();
    };

    const handleSave = () => {
        // TODO: Implement save logic
        console.log('Saving floor plan...');
        onSave({
            venue_floor_plan_data: {},
            venue_floor_plan_version: floorPlanState.selectedVersion,
            venue_floor_plan_updated_at: new Date().toISOString(),
            venue_floor_plan_updated_by: 1, // TODO: Get current user ID
        });
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    width: '95vw',
                    height: '90vh',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    m: 2
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Top Toolbar */}
                <EditorToolbar
                    locationId={locationId}
                    onClose={handleClose}
                    onSave={handleSave}
                    onDelete={onDelete}
                    floorPlanState={floorPlanState}
                    undoRedoState={undoRedoState}
                    allVersions={allVersions}
                />

                {/* Main Content Area */}
                <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Sidebar */}
                    <EditorSidebar
                        width={SIDEBAR_WIDTH}
                        floorPlanState={floorPlanState}
                        zoomPanState={zoomPanState}
                    />

                    {/* Canvas Area */}
                    <EditorCanvas
                        floorPlanState={enhancedFloorPlanState}
                        zoomPanState={zoomPanState}
                    />
                </Box>

                {/* Bottom Status Bar */}
                <EditorStatusBar
                    floorPlanState={enhancedFloorPlanState}
                    zoomPanState={zoomPanState}
                />
            </Box>
        </Dialog>
    );
};
