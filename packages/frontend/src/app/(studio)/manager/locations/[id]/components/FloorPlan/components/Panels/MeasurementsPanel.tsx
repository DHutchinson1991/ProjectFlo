import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Paper,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Straighten as MeasureIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { Measurement } from '../../services/MeasurementService';

interface MeasurementsPanelProps {
    measurements: Measurement[];
    gridScale: '1m' | '5m' | '10m';
    onGridScaleChange: (scale: '1m' | '5m' | '10m') => void;
    onStartMeasurement: () => void;
    onDeleteMeasurement: (measurementId: string) => void;
    onToggleMeasurementVisibility: (measurementId: string) => void;
    onSelectMeasurement: (measurementId: string) => void;
    hiddenMeasurements: Set<string>;
}

export const MeasurementsPanel: React.FC<MeasurementsPanelProps> = ({
    measurements,
    gridScale,
    onGridScaleChange,
    onStartMeasurement,
    onDeleteMeasurement,
    onToggleMeasurementVisibility,
    onSelectMeasurement,
    hiddenMeasurements
}) => {
    const totalMeasurements = measurements.length;
    const visibleMeasurements = measurements.filter(m => !hiddenMeasurements.has(m.id)).length;

    const formatAngle = (angle: number): string => {
        return `${Math.round(angle)}°`;
    };

    const getMeasurementDescription = (measurement: Measurement): string => {
        const distance = `${measurement.realDistance.value}${measurement.realDistance.unit}`;
        const angle = formatAngle(measurement.angle);
        return `${distance} at ${angle}`;
    };

    return (
        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <MeasureIcon />
                        <Typography variant="h6">Measurements</Typography>
                    </Box>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onStartMeasurement}
                        variant="outlined"
                    >
                        Measure
                    </Button>
                </Box>

                {/* Grid Scale Control */}
                <FormControl size="small" fullWidth>
                    <InputLabel>Grid Scale</InputLabel>
                    <Select
                        value={gridScale}
                        label="Grid Scale"
                        onChange={(e) => onGridScaleChange(e.target.value as '1m' | '5m' | '10m')}
                    >
                        <MenuItem value="1m">1 meter per grid</MenuItem>
                        <MenuItem value="5m">5 meters per grid</MenuItem>
                        <MenuItem value="10m">10 meters per grid</MenuItem>
                    </Select>
                </FormControl>

                {/* Summary */}
                <Box display="flex" gap={1} mt={2}>
                    <Chip
                        size="small"
                        label={`${totalMeasurements} total`}
                        variant="outlined"
                    />
                    <Chip
                        size="small"
                        label={`${visibleMeasurements} visible`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Box>

            {/* Measurements List */}
            <Box flex={1} overflow="auto">
                {measurements.length === 0 ? (
                    <Box p={3} textAlign="center" color="text.secondary">
                        <MeasureIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body2">
                            No measurements yet
                        </Typography>
                        <Typography variant="caption">
                            Click "Measure" to start measuring distances
                        </Typography>
                    </Box>
                ) : (
                    <List dense>
                        {measurements.map((measurement, index) => {
                            const isHidden = hiddenMeasurements.has(measurement.id);

                            return (
                                <React.Fragment key={measurement.id}>
                                    <ListItem
                                        button
                                        onClick={() => onSelectMeasurement(measurement.id)}
                                        sx={{
                                            opacity: isHidden ? 0.5 : 1,
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {measurement.label}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={formatAngle(measurement.angle)}
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        From ({Math.round(measurement.startPoint.x)}, {Math.round(measurement.startPoint.y)})
                                                        to ({Math.round(measurement.endPoint.x)}, {Math.round(measurement.endPoint.y)})
                                                    </Typography>
                                                    <br />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {Math.round(measurement.pixelDistance)}px
                                                    </Typography>
                                                </Box>
                                            }
                                        />

                                        <ListItemSecondaryAction>
                                            <Box display="flex" alignItems="center">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleMeasurementVisibility(measurement.id);
                                                    }}
                                                    title={isHidden ? "Show measurement" : "Hide measurement"}
                                                >
                                                    {isHidden ? (
                                                        <VisibilityOffIcon fontSize="small" />
                                                    ) : (
                                                        <VisibilityIcon fontSize="small" />
                                                    )}
                                                </IconButton>

                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteMeasurement(measurement.id);
                                                    }}
                                                    title="Delete measurement"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < measurements.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </Box>

            {/* Footer with quick stats */}
            {measurements.length > 0 && (
                <Box p={2} borderTop={1} borderColor="divider">
                    <Typography variant="caption" color="text.secondary">
                        Total distance: {' '}
                        {measurements.reduce((sum, m) => sum + m.realDistance.value, 0).toFixed(2)}
                        {measurements[0]?.realDistance.unit || 'm'}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};
