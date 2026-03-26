import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Button,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Close as CloseIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { VenueFloorPlan } from '../../../../types/floor-plan/editor';

interface EditorToolbarProps {
    locationId: number;
    onClose: () => void;
    onSave: () => void;
    onDelete?: () => void;
    floorPlanState: any; // TODO: Type this properly
    undoRedoState: any;  // TODO: Type this properly
    allVersions: VenueFloorPlan[];
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onClose,
    onSave,
    onDelete,
    floorPlanState,
    undoRedoState,
    allVersions
}) => {
    return (
        <AppBar position="static" color="default" elevation={0}>
            <Toolbar sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Floor Plan Editor
                </Typography>

                {/* Version Selector */}
                {allVersions.length > 0 && (
                    <Box sx={{ minWidth: 120, mr: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Version</InputLabel>
                            <Select
                                value={floorPlanState.selectedVersion}
                                label="Version"
                                onChange={(e) => floorPlanState.setSelectedVersion(Number(e.target.value))}
                            >
                                {allVersions.map((version) => (
                                    <MenuItem key={version.venue_floor_plan_version} value={version.venue_floor_plan_version}>
                                        Version {version.venue_floor_plan_version}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {/* Undo/Redo Controls */}
                <Box sx={{ mr: 2 }}>
                    <IconButton
                        onClick={() => undoRedoState.handleUndo()}
                        disabled={!undoRedoState.canUndo}
                        size="small"
                    >
                        <UndoIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => undoRedoState.handleRedo()}
                        disabled={!undoRedoState.canRedo}
                        size="small"
                    >
                        <RedoIcon />
                    </IconButton>
                </Box>

                {/* Delete Button */}
                {onDelete && (
                    <Button
                        onClick={onDelete}
                        startIcon={<DeleteIcon />}
                        color="error"
                        sx={{ mr: 1 }}
                    >
                        Delete
                    </Button>
                )}

                {/* Save Button */}
                <Button
                    onClick={onSave}
                    variant="contained"
                    sx={{ mr: 1 }}
                >
                    Save
                </Button>

                {/* Close Button */}
                <IconButton onClick={onClose} edge="end">
                    <CloseIcon />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
};
