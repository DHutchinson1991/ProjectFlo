import React from 'react';
import { Drawer, Box } from '@mui/material';
import { DrawingToolbar } from '../Toolbars/DrawingToolbar';
import { VenueToolbar } from '../Toolbars/VenueToolbar';
import { FurnitureToolbar } from '../Toolbars/FurnitureToolbar';
import { RoomPanel } from '../Panels/RoomPanel';

interface EditorSidebarProps {
    width: number;
    floorPlanState: any; // TODO: Type this properly
    zoomPanState: any;   // TODO: Type this properly
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
    width,
    floorPlanState,
    zoomPanState
}) => {
    return (
        <Drawer
            variant="permanent"
            anchor="left"
            PaperProps={{
                sx: {
                    width,
                    position: 'relative',
                    height: '100%',
                    borderRight: '1px solid',
                    borderColor: 'divider'
                }
            }}
        >
            <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Drawing Tools */}
                <DrawingToolbar
                    activeTool={floorPlanState.activeTool}
                    onToolChange={floorPlanState.setActiveTool}
                />

                {/* Venue Structure Tools */}
                <VenueToolbar
                    activeTool={floorPlanState.activeTool}
                    onToolChange={floorPlanState.setActiveTool}
                />

                {/* Furniture Tools */}
                <FurnitureToolbar
                    activeTool={floorPlanState.activeTool}
                    onToolChange={floorPlanState.setActiveTool}
                />

                {/* Room Management Panel */}
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <RoomPanel
                        rooms={floorPlanState.rooms}
                        selectedRoomId={floorPlanState.selectedRoomId}
                        onRoomSelected={floorPlanState.setSelectedRoomId}
                        walls={floorPlanState.walls}
                        wallType={floorPlanState.wallType}
                        onWallTypeChange={floorPlanState.setWallType}
                        showRoomLabels={floorPlanState.showRoomLabels}
                        showRoomAreas={floorPlanState.showRoomAreas}
                        showRoomDimensions={floorPlanState.showRoomDimensions}
                        onShowRoomLabelsChange={floorPlanState.setShowRoomLabels}
                        onShowRoomAreasChange={floorPlanState.setShowRoomAreas}
                        onShowRoomDimensionsChange={floorPlanState.setShowRoomDimensions}
                        activeTool={floorPlanState.activeTool}
                    />
                </Box>
            </Box>
        </Drawer>
    );
};
