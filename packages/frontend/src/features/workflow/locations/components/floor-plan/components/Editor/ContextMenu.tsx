import React from 'react';
import {
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    ContentPaste as PasteIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Flip as FlipIcon,
    RotateRight as RotateIcon,
    Layers as LayerIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    ColorLens as ColorIcon,
    AspectRatio as ResizeIcon,
    Straighten as MeasureIcon
} from '@mui/icons-material';

export interface ContextMenuAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    divider?: boolean;
}

interface ContextMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    selectedElementId?: string;
    selectedElementType?: string;
    actions: ContextMenuAction[];
    onAction: (actionId: string, elementId?: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    anchorEl,
    open,
    onClose,
    selectedElementId,
    selectedElementType,
    actions,
    onAction
}) => {
    const handleAction = (actionId: string) => {
        onAction(actionId, selectedElementId);
        onClose();
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            PaperProps={{
                sx: {
                    minWidth: 180,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }
            }}
        >
            {selectedElementId && selectedElementType && (
                <>
                    <MenuItem disabled>
                        <ListItemText>
                            <Typography variant="caption" color="text.secondary">
                                {selectedElementType}
                            </Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider />
                </>
            )}

            {actions.map((action, index) => (
                <React.Fragment key={action.id}>
                    <MenuItem
                        onClick={() => handleAction(action.id)}
                        disabled={action.disabled}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {action.icon}
                        </ListItemIcon>
                        <ListItemText primary={action.label} />
                    </MenuItem>
                    {action.divider && <Divider />}
                </React.Fragment>
            ))}
        </Menu>
    );
};

// Predefined action sets for different contexts
export const getElementActions = (
    hasClipboard: boolean = false,
    isLocked: boolean = false
): ContextMenuAction[] => [
        {
            id: 'edit',
            label: 'Edit Properties',
            icon: <EditIcon fontSize="small" />
        },
        {
            id: 'copy',
            label: 'Copy',
            icon: <CopyIcon fontSize="small" />
        },
        {
            id: 'paste',
            label: 'Paste',
            icon: <PasteIcon fontSize="small" />,
            disabled: !hasClipboard
        },
        {
            id: 'duplicate',
            label: 'Duplicate',
            icon: <CopyIcon fontSize="small" />
        },
        {
            id: 'divider1',
            label: '',
            icon: null,
            divider: true
        },
        {
            id: 'flip-horizontal',
            label: 'Flip Horizontal',
            icon: <FlipIcon fontSize="small" />
        },
        {
            id: 'flip-vertical',
            label: 'Flip Vertical',
            icon: <FlipIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
        },
        {
            id: 'rotate',
            label: 'Rotate 90°',
            icon: <RotateIcon fontSize="small" />
        },
        {
            id: 'divider2',
            label: '',
            icon: null,
            divider: true
        },
        {
            id: 'change-layer',
            label: 'Move to Layer',
            icon: <LayerIcon fontSize="small" />
        },
        {
            id: 'toggle-lock',
            label: isLocked ? 'Unlock' : 'Lock',
            icon: isLocked ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />
        },
        {
            id: 'change-color',
            label: 'Change Color',
            icon: <ColorIcon fontSize="small" />
        },
        {
            id: 'resize',
            label: 'Resize',
            icon: <ResizeIcon fontSize="small" />
        },
        {
            id: 'divider3',
            label: '',
            icon: null,
            divider: true
        },
        {
            id: 'delete',
            label: 'Delete',
            icon: <DeleteIcon fontSize="small" />
        }
    ];

export const getCanvasActions = (
    hasClipboard: boolean = false
): ContextMenuAction[] => [
        {
            id: 'paste',
            label: 'Paste',
            icon: <PasteIcon fontSize="small" />,
            disabled: !hasClipboard
        },
        {
            id: 'divider1',
            label: '',
            icon: null,
            divider: true
        },
        {
            id: 'measure',
            label: 'Start Measurement',
            icon: <MeasureIcon fontSize="small" />
        },
        {
            id: 'select-all',
            label: 'Select All',
            icon: <EditIcon fontSize="small" />
        }
    ];
