'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, AppBar, Toolbar, IconButton, Divider, Card, CardContent,
    Grid, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent,
    DialogActions, Fab, Slider, FormControlLabel, Switch, Alert,
} from '@mui/material';
import {
    Save as SaveIcon, CropFree as SelectIcon, PanTool as PanIcon,
    Straighten as LineIcon, RectangleOutlined as RectangleIcon,
    RadioButtonUnchecked as CircleIcon, TextFields as TextIcon,
    Delete as DeleteIcon, Layers as LayersIcon,
    ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, CenterFocusStrong as CenterIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { locationsApi } from '../api';
import type { FloorPlan, UpdateFloorPlanRequest } from '../types';

type DrawingTool = 'select' | 'pan' | 'line' | 'rectangle' | 'circle' | 'text';

interface CanvasObject {
    id: string;
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    name: string;
}

const OBJECT_LIBRARY = [
    { id: 'chair', name: 'Chair', icon: '🪑', width: 20, height: 20, color: '#8B4513' },
    { id: 'table', name: 'Table', icon: '🪑', width: 60, height: 40, color: '#A0522D' },
    { id: 'desk', name: 'Desk', icon: '🖥️', width: 80, height: 40, color: '#8B4513' },
    { id: 'door', name: 'Door', icon: '🚪', width: 30, height: 5, color: '#654321' },
    { id: 'window', name: 'Window', icon: '🪟', width: 40, height: 5, color: '#87CEEB' },
    { id: 'wall', name: 'Wall', icon: '🧱', width: 100, height: 10, color: '#696969' },
    { id: 'plant', name: 'Plant', icon: '🪴', width: 15, height: 15, color: '#228B22' },
    { id: 'shelf', name: 'Shelf', icon: '📚', width: 80, height: 15, color: '#8B4513' },
];

interface FloorPlanEditorScreenProps {
    locationId: number;
    floorPlanId: number;
}

export function FloorPlanEditorScreen({ locationId, floorPlanId }: FloorPlanEditorScreenProps) {
    const router = useRouter();

    const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [activeTool, setActiveTool] = useState<DrawingTool>('select');
    const [showGrid, setShowGrid] = useState(true);
    const [gridSize, setGridSize] = useState(20);
    const [zoom, setZoom] = useState(1);
    const [objectLibraryOpen, setObjectLibraryOpen] = useState(false);
    const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);

    useEffect(() => {
        if (!floorPlanId) return;
        setLoading(true);
        locationsApi.getFloorPlan(floorPlanId)
            .then(data => {
                setFloorPlan(data);
                if (data.fabric_data && typeof data.fabric_data === 'object' && 'objects' in data.fabric_data) {
                    setCanvasObjects((data.fabric_data as { objects: CanvasObject[] }).objects || []);
                }
            })
            .catch(() => setError('Failed to load floor plan'))
            .finally(() => setLoading(false));
    }, [floorPlanId]);

    const saveFloorPlan = async () => {
        if (!floorPlan) return;
        try {
            const fabricData = { version: '5.2.1', objects: canvasObjects, background: '#ffffff', width: 800, height: 600 };
            const updateData: UpdateFloorPlanRequest = { fabric_data: fabricData, version: floorPlan.version + 1 };
            await locationsApi.updateFloorPlan(floorPlan.id, updateData);
            setHasUnsavedChanges(false);
            setFloorPlan(prev => prev ? { ...prev, ...updateData } : null);
        } catch {
            setError('Failed to save floor plan');
        }
    };

    const addObjectFromLibrary = (item: typeof OBJECT_LIBRARY[0]) => {
        setCanvasObjects(prev => [...prev, { id: Date.now().toString(), type: 'rect', left: 100, top: 100, width: item.width, height: item.height, fill: item.color, stroke: '#000000', strokeWidth: 1, name: item.name }]);
        setHasUnsavedChanges(true);
        setObjectLibraryOpen(false);
    };

    const clearCanvas = () => {
        if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            setCanvasObjects([]);
            setHasUnsavedChanges(true);
        }
    };

    if (loading) return <Box>Loading...</Box>;
    if (!floorPlan) return <Box>Floor plan not found</Box>;

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => router.push(`/resources/locations/${locationId}`)} sx={{ mr: 2 }}>
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>{floorPlan.name} - Floor Plan Editor</Typography>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={saveFloorPlan} disabled={!hasUnsavedChanges}>Save</Button>
                </Toolbar>
            </AppBar>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ display: 'flex', flex: 1 }}>
                <Card sx={{ width: 250, m: 1, display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>Tools</Typography>
                        <ToggleButtonGroup orientation="vertical" value={activeTool} exclusive onChange={(_, value) => value && setActiveTool(value)} fullWidth sx={{ mb: 2 }}>
                            <ToggleButton value="select"><SelectIcon sx={{ mr: 1 }} /> Select</ToggleButton>
                            <ToggleButton value="pan"><PanIcon sx={{ mr: 1 }} /> Pan</ToggleButton>
                            <ToggleButton value="line"><LineIcon sx={{ mr: 1 }} /> Line</ToggleButton>
                            <ToggleButton value="rectangle"><RectangleIcon sx={{ mr: 1 }} /> Rectangle</ToggleButton>
                            <ToggleButton value="circle"><CircleIcon sx={{ mr: 1 }} /> Circle</ToggleButton>
                            <ToggleButton value="text"><TextIcon sx={{ mr: 1 }} /> Text</ToggleButton>
                        </ToggleButtonGroup>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>View Controls</Typography>
                        <Box display="flex" gap={1} mb={2}>
                            <IconButton onClick={() => setZoom(zoom * 1.2)} title="Zoom In"><ZoomInIcon /></IconButton>
                            <IconButton onClick={() => setZoom(zoom * 0.8)} title="Zoom Out"><ZoomOutIcon /></IconButton>
                            <IconButton onClick={() => setZoom(1)} title="Center"><CenterIcon /></IconButton>
                        </Box>
                        <Typography variant="body2" gutterBottom>Zoom: {Math.round(zoom * 100)}%</Typography>
                        <FormControlLabel control={<Switch checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />} label="Show Grid" />
                        {showGrid && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" gutterBottom>Grid Size: {gridSize}px</Typography>
                                <Slider value={gridSize} onChange={(_, v) => setGridSize(v as number)} min={10} max={50} step={5} size="small" />
                            </Box>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Button variant="outlined" fullWidth startIcon={<LayersIcon />} onClick={() => setObjectLibraryOpen(true)} sx={{ mb: 1 }}>Object Library</Button>
                        <Button variant="outlined" fullWidth startIcon={<DeleteIcon />} onClick={clearCanvas} color="error">Clear Canvas</Button>
                    </CardContent>
                </Card>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', m: 1 }}>
                    <Card sx={{ flex: 1, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h6">Canvas (800×600) - {canvasObjects.length} objects</Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto', p: 2, position: 'relative', minHeight: 600, backgroundColor: '#f5f5f5', backgroundImage: showGrid ? `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)` : 'none', backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto' }}>
                            <Box sx={{ width: 800 * zoom, height: 600 * zoom, backgroundColor: '#ffffff', border: '2px solid #333', position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                                {canvasObjects.map((obj) => (
                                    <Box key={obj.id} sx={{ position: 'absolute', left: obj.left, top: obj.top, width: obj.width, height: obj.height, backgroundColor: obj.fill, border: `${obj.strokeWidth || 1}px solid ${obj.stroke || '#000'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', textShadow: '1px 1px 1px #000', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} title={obj.name}>
                                        {obj.name}
                                    </Box>
                                ))}
                                {canvasObjects.length === 0 && (
                                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
                                        <Typography variant="h6" gutterBottom>Floor Plan Canvas</Typography>
                                        <Typography variant="body2">Add objects from the library to start designing</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Card>
                </Box>

                <Card sx={{ width: 250, m: 1 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Floor Plan Info</Typography>
                        <Typography variant="body2" gutterBottom><strong>Name:</strong> {floorPlan.name}</Typography>
                        <Typography variant="body2" gutterBottom><strong>Version:</strong> {floorPlan.version}</Typography>
                        <Typography variant="body2" gutterBottom><strong>Objects:</strong> {canvasObjects.length}</Typography>
                        <Typography variant="body2" gutterBottom><strong>Canvas Size:</strong> 800×600</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" color="text.secondary"><strong>Note:</strong> This is a simplified floor plan editor. Full Fabric.js integration is planned for future updates.</Typography>
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={objectLibraryOpen} onClose={() => setObjectLibraryOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Object Library</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        {OBJECT_LIBRARY.map((item) => (
                            <Grid item xs={6} sm={4} key={item.id}>
                                <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => addObjectFromLibrary(item)}>
                                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="h4" component="div">{item.icon}</Typography>
                                        <Typography variant="body2">{item.name}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setObjectLibraryOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', md: 'none' } }} onClick={() => setObjectLibraryOpen(true)}>
                <LayersIcon />
            </Fab>
        </Box>
    );
}
