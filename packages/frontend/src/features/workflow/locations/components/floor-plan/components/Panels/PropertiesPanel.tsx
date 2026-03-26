import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    IconButton,
    Paper
} from '@mui/material';
import {
    Palette as PaletteIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Flip as FlipIcon
} from '@mui/icons-material';

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

interface PropertiesPanelProps {
    selectedElement: SelectedElement | null;
    onUpdateElement: (elementId: string, updates: Partial<SelectedElement>) => void;
    onDeleteElement: (elementId: string) => void;
    onDuplicateElement: (elementId: string) => void;
    onFlipElement: (elementId: string, direction: 'horizontal' | 'vertical') => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedElement,
    onUpdateElement,
    onDeleteElement,
    onDuplicateElement,
    onFlipElement
}) => {
    if (!selectedElement) {
        return (
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                }}
            >
                <Typography variant="body2">
                    Select an element to edit properties
                </Typography>
            </Paper>
        );
    }

    const handleChange = (property: keyof SelectedElement, value: any) => {
        onUpdateElement(selectedElement.id, { [property]: value });
    };

    return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
                Properties
            </Typography>

            {/* Element Info */}
            <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                    {selectedElement.type}
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={selectedElement.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    sx={{ mt: 1 }}
                />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Position */}
            <Typography variant="subtitle2" gutterBottom>
                Position
            </Typography>
            <Box display="flex" gap={1} mb={2}>
                <TextField
                    size="small"
                    label="X"
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
                />
                <TextField
                    size="small"
                    label="Y"
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
                />
            </Box>

            {/* Dimensions */}
            <Typography variant="subtitle2" gutterBottom>
                Dimensions
            </Typography>
            <Box display="flex" gap={1} mb={2}>
                {selectedElement.width !== undefined && (
                    <TextField
                        size="small"
                        label="Width"
                        type="number"
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => handleChange('width', parseFloat(e.target.value) || 0)}
                    />
                )}
                {selectedElement.height !== undefined && (
                    <TextField
                        size="small"
                        label="Height"
                        type="number"
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => handleChange('height', parseFloat(e.target.value) || 0)}
                    />
                )}
                {selectedElement.radius !== undefined && (
                    <TextField
                        size="small"
                        label="Radius"
                        type="number"
                        value={Math.round(selectedElement.radius)}
                        onChange={(e) => handleChange('radius', parseFloat(e.target.value) || 0)}
                    />
                )}
            </Box>

            {/* Rotation */}
            <Typography variant="subtitle2" gutterBottom>
                Rotation: {selectedElement.rotation}°
            </Typography>
            <Slider
                value={selectedElement.rotation}
                min={-180}
                max={180}
                onChange={(_, value) => handleChange('rotation', value)}
                sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Appearance */}
            <Typography variant="subtitle2" gutterBottom>
                Appearance
            </Typography>

            {/* Fill Color */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TextField
                    size="small"
                    label="Fill Color"
                    value={selectedElement.fill}
                    onChange={(e) => handleChange('fill', e.target.value)}
                    sx={{ flex: 1 }}
                />
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: selectedElement.fill,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        // TODO: Open color picker
                    }}
                />
            </Box>

            {/* Stroke Color */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TextField
                    size="small"
                    label="Stroke Color"
                    value={selectedElement.stroke}
                    onChange={(e) => handleChange('stroke', e.target.value)}
                    sx={{ flex: 1 }}
                />
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: selectedElement.stroke,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        // TODO: Open color picker
                    }}
                />
            </Box>

            {/* Stroke Width */}
            <TextField
                fullWidth
                size="small"
                label="Stroke Width"
                type="number"
                value={selectedElement.strokeWidth}
                onChange={(e) => handleChange('strokeWidth', parseFloat(e.target.value) || 0)}
                sx={{ mb: 1 }}
            />

            {/* Opacity */}
            <Typography variant="body2" gutterBottom>
                Opacity: {Math.round(selectedElement.opacity * 100)}%
            </Typography>
            <Slider
                value={selectedElement.opacity}
                min={0}
                max={1}
                step={0.1}
                onChange={(_, value) => handleChange('opacity', value)}
                sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Typography variant="subtitle2" gutterBottom>
                Actions
            </Typography>
            <Box display="flex" gap={1}>
                <IconButton
                    size="small"
                    onClick={() => onDuplicateElement(selectedElement.id)}
                    title="Duplicate"
                >
                    <CopyIcon />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onFlipElement(selectedElement.id, 'horizontal')}
                    title="Flip Horizontal"
                >
                    <FlipIcon />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onFlipElement(selectedElement.id, 'vertical')}
                    title="Flip Vertical"
                    sx={{ transform: 'rotate(90deg)' }}
                >
                    <FlipIcon />
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteElement(selectedElement.id)}
                    title="Delete"
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
        </Paper>
    );
};
