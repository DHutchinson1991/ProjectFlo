import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Switch,
    Chip,
    Button,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    Layers as LayersIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    DragIndicator as DragIcon
} from '@mui/icons-material';

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    elementCount: number;
    color: string;
    opacity: number;
}

interface LayersPanelProps {
    layers: Layer[];
    activeLayerId: string;
    onLayerSelect: (layerId: string) => void;
    onLayerToggleVisibility: (layerId: string) => void;
    onLayerToggleLock: (layerId: string) => void;
    onLayerCreate: (name: string, color: string) => void;
    onLayerDelete: (layerId: string) => void;
    onLayerRename: (layerId: string, newName: string) => void;
    onLayerReorder: (layers: Layer[]) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
    layers,
    activeLayerId,
    onLayerSelect,
    onLayerToggleVisibility,
    onLayerToggleLock,
    onLayerCreate,
    onLayerDelete,
    onLayerRename,
    onLayerReorder
}) => {
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    const [newLayerName, setNewLayerName] = React.useState('');
    const [newLayerColor, setNewLayerColor] = React.useState('#3498db');
    const [editingLayerId, setEditingLayerId] = React.useState<string | null>(null);
    const [editingName, setEditingName] = React.useState('');

    const handleCreateLayer = () => {
        if (newLayerName.trim()) {
            onLayerCreate(newLayerName.trim(), newLayerColor);
            setNewLayerName('');
            setNewLayerColor('#3498db');
            setCreateDialogOpen(false);
        }
    };

    const handleStartEdit = (layer: Layer) => {
        setEditingLayerId(layer.id);
        setEditingName(layer.name);
    };

    const handleFinishEdit = () => {
        if (editingLayerId && editingName.trim()) {
            onLayerRename(editingLayerId, editingName.trim());
        }
        setEditingLayerId(null);
        setEditingName('');
    };

    const handleCancelEdit = () => {
        setEditingLayerId(null);
        setEditingName('');
    };

    return (
        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <LayersIcon />
                        <Typography variant="h6">Layers</Typography>
                    </Box>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        New
                    </Button>
                </Box>
            </Box>

            {/* Layers List */}
            <Box flex={1} overflow="auto">
                <List dense>
                    {layers.map((layer) => (
                        <ListItem
                            key={layer.id}
                            button
                            selected={layer.id === activeLayerId}
                            onClick={() => onLayerSelect(layer.id)}
                            sx={{
                                borderLeft: layer.id === activeLayerId ? `3px solid ${layer.color}` : 'none',
                                opacity: layer.visible ? 1 : 0.6
                            }}
                        >
                            <ListItemIcon>
                                <DragIcon sx={{ cursor: 'grab' }} />
                            </ListItemIcon>

                            <ListItemText
                                primary={
                                    editingLayerId === layer.id ? (
                                        <TextField
                                            size="small"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={handleFinishEdit}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleFinishEdit();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            autoFocus
                                            sx={{ width: '100%' }}
                                        />
                                    ) : (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: layer.color,
                                                    borderRadius: '50%',
                                                    border: '1px solid #ccc'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {layer.name}
                                            </Typography>
                                        </Box>
                                    )
                                }
                                secondary={
                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                        <Chip
                                            size="small"
                                            label={`${layer.elementCount} items`}
                                            variant="outlined"
                                        />
                                        {layer.id === activeLayerId && (
                                            <Chip
                                                size="small"
                                                label="Active"
                                                color="primary"
                                                variant="filled"
                                            />
                                        )}
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
                                            handleStartEdit(layer);
                                        }}
                                        title="Rename layer"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>

                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLayerToggleLock(layer.id);
                                        }}
                                        title={layer.locked ? "Unlock layer" : "Lock layer"}
                                    >
                                        {layer.locked ? (
                                            <LockIcon fontSize="small" />
                                        ) : (
                                            <LockOpenIcon fontSize="small" />
                                        )}
                                    </IconButton>

                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLayerToggleVisibility(layer.id);
                                        }}
                                        title={layer.visible ? "Hide layer" : "Show layer"}
                                    >
                                        {layer.visible ? (
                                            <VisibilityIcon fontSize="small" />
                                        ) : (
                                            <VisibilityOffIcon fontSize="small" />
                                        )}
                                    </IconButton>

                                    <IconButton
                                        edge="end"
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (layers.length > 1) {
                                                onLayerDelete(layer.id);
                                            }
                                        }}
                                        disabled={layers.length <= 1}
                                        title="Delete layer"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Create Layer Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                <DialogTitle>Create New Layer</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Layer Name"
                        fullWidth
                        variant="outlined"
                        value={newLayerName}
                        onChange={(e) => setNewLayerName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2">Color:</Typography>
                        <input
                            type="color"
                            value={newLayerColor}
                            onChange={(e) => setNewLayerColor(e.target.value)}
                            style={{
                                width: 40,
                                height: 32,
                                border: '1px solid #ccc',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateLayer}
                        variant="contained"
                        disabled={!newLayerName.trim()}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
