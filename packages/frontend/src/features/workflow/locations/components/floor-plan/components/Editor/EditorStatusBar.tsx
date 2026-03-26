import React from 'react';
import {
    Box,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import { CANVAS_DIMENSIONS } from '../../../../constants/dimensions';

interface FloorPlanState {
    objectCount: number;
    gridScale: '1m' | '5m' | '10m';
    showMeasurements: boolean;
    onGridScaleChange: (scale: '1m' | '5m' | '10m') => void;
    onMeasurementsToggle: () => void;
}

interface ZoomPanState {
    zoomLevel: number;
}

interface EditorStatusBarProps {
    floorPlanState: FloorPlanState;
    zoomPanState: ZoomPanState;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
    floorPlanState,
    zoomPanState
}) => {
    // Destructure values from state objects
    const {
        objectCount,
        gridScale,
        showMeasurements,
        onGridScaleChange,
        onMeasurementsToggle
    } = floorPlanState;

    const { zoomLevel } = zoomPanState;
    return (
        <Box
            sx={{
                mt: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Canvas: {CANVAS_DIMENSIONS.width}×{CANVAS_DIMENSIONS.height}px | Grid: On | Zoom: {Math.round(zoomLevel * 100)}%
                </Typography>

                {/* Grid Scale Selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Grid Scale:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select
                            value={gridScale}
                            onChange={(e) => onGridScaleChange(e.target.value as '1m' | '5m' | '10m')}
                            sx={{
                                fontSize: '0.75rem',
                                height: '24px',
                                '& .MuiSelect-select': {
                                    py: 0.5,
                                    px: 1
                                }
                            }}
                        >
                            <MenuItem value="1m" sx={{ fontSize: '0.75rem' }}>1m</MenuItem>
                            <MenuItem value="5m" sx={{ fontSize: '0.75rem' }}>5m</MenuItem>
                            <MenuItem value="10m" sx={{ fontSize: '0.75rem' }}>10m</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Measurements Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Measurements:
                    </Typography>
                    <Button
                        size="small"
                        variant={showMeasurements ? "contained" : "outlined"}
                        onClick={onMeasurementsToggle}
                        sx={{
                            fontSize: '0.7rem',
                            minWidth: 'auto',
                            px: 1,
                            py: 0.25,
                            height: '24px'
                        }}
                    >
                        {showMeasurements ? 'On' : 'Off'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Objects: {objectCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Zoom: {Math.round(zoomLevel * 100)}%
                </Typography>
            </Box>
        </Box>
    );
};
