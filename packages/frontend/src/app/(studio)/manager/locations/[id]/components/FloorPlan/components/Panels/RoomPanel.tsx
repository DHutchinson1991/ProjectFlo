import React from 'react';
import {
    Box,
    Typography,
    Button,
    FormControlLabel,
    Checkbox,
    Divider
} from '@mui/material';
import { Tool } from '../../constants/tools';
import { Room, Wall } from '../../types/WallTypes';
import { RoomRenderer } from '../Renderers/RoomRenderer';

interface RoomPanelProps {
    rooms: Room[];
    selectedRoomId?: string;
    onRoomSelected: (roomId: string) => void;
    walls: Wall[];
    wallType: 'interior' | 'exterior';
    onWallTypeChange: (type: 'interior' | 'exterior') => void;
    showRoomLabels: boolean;
    showRoomAreas: boolean;
    showRoomDimensions: boolean;
    onShowRoomLabelsChange: (show: boolean) => void;
    onShowRoomAreasChange: (show: boolean) => void;
    onShowRoomDimensionsChange: (show: boolean) => void;
    activeTool: Tool;
}

export const RoomPanel: React.FC<RoomPanelProps> = ({
    rooms,
    onRoomSelected,
    walls,
    wallType,
    onWallTypeChange,
    showRoomLabels,
    showRoomAreas,
    showRoomDimensions,
    onShowRoomLabelsChange,
    onShowRoomAreasChange,
    onShowRoomDimensionsChange,
    activeTool
}) => {
    return (
        <Box>
            {/* Wall Tool Settings */}
            {activeTool === 'wall' && (
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Wall Type
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Interior Wall Button */}
                        <Button
                            variant={wallType === 'interior' ? 'contained' : 'outlined'}
                            onClick={() => onWallTypeChange('interior')}
                            size="small"
                            sx={{
                                flex: 1,
                                backgroundColor: wallType === 'interior' ? '#2196F3' : 'transparent',
                                borderColor: '#2196F3',
                                color: wallType === 'interior' ? 'white' : '#2196F3',
                                '&:hover': {
                                    backgroundColor: wallType === 'interior' ? '#1976D2' : '#E3F2FD',
                                },
                                fontSize: '0.75rem',
                                py: 1
                            }}
                        >
                            Interior
                            <br />
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>4.5&quot;</span>
                        </Button>

                        {/* Exterior Wall Button */}
                        <Button
                            variant={wallType === 'exterior' ? 'contained' : 'outlined'}
                            onClick={() => onWallTypeChange('exterior')}
                            size="small"
                            sx={{
                                flex: 1,
                                backgroundColor: wallType === 'exterior' ? '#FF5722' : 'transparent',
                                borderColor: '#FF5722',
                                color: wallType === 'exterior' ? 'white' : '#FF5722',
                                '&:hover': {
                                    backgroundColor: wallType === 'exterior' ? '#E64A19' : '#FFF3E0',
                                },
                                fontSize: '0.75rem',
                                py: 1
                            }}
                        >
                            Exterior
                            <br />
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8&quot;</span>
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Room Display Options */}
            {walls.length > 0 && (
                <>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            Room Display
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showRoomLabels}
                                    onChange={(e) => onShowRoomLabelsChange(e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Show Room Labels"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showRoomAreas}
                                    onChange={(e) => onShowRoomAreasChange(e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Show Room Areas"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showRoomDimensions}
                                    onChange={(e) => onShowRoomDimensionsChange(e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Show Dimensions"
                            sx={{ display: 'block' }}
                        />
                    </Box>
                </>
            )}

            {/* Room Manager */}
            {rooms.length > 0 && (
                <>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <RoomRenderer
                            svgDrawing={{ current: null }} // TODO: Get actual SVG reference
                            rooms={rooms}
                            showRoomLabels={true}
                            showRoomAreas={true}
                            showRoomDimensions={true}
                            onRoomSelected={onRoomSelected}
                            onRoomDeselected={() => { }}
                            onRoomUpdated={() => { }} // TODO: Implement room updates
                            onRoomDeleted={() => { }} // TODO: Implement room deletion
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};
