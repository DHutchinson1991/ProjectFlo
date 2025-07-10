"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    TableCell,
    TableRow,
    Chip,
    IconButton,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Switch,
    Stack,
    Tooltip,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskLibrary, PricingType } from "@/lib/types";

interface SortableTaskRowProps {
    task: TaskLibrary;
    phase: string;
    inlineEditingTask: number | null;
    inlineEditData: Partial<TaskLibrary>;
    updateInlineEditData: (field: keyof TaskLibrary, value: unknown) => void;
    startInlineEdit: (task: TaskLibrary) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setTaskToDelete: (task: TaskLibrary) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    router: ReturnType<typeof useRouter>;
    isDragging: boolean;
}

export function SortableTaskRow({
    task,
    phase,
    inlineEditingTask,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setTaskToDelete,
    setDeleteConfirmOpen,
    router,
    isDragging,
}: SortableTaskRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isCurrentDragging,
    } = useSortable({ id: task.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isCurrentDragging ? 0 : 1, // Completely hide when dragging since we have overlay
    };

    const isEditing = inlineEditingTask === task.id;

    // Get phase colors
    const phaseColors = {
        'Lead': { color: '#667eea', bg: 'rgba(102, 126, 234, 0.1)', hover: 'rgba(102, 126, 234, 0.2)' },
        'Inquiry': { color: '#f093fb', bg: 'rgba(240, 147, 251, 0.1)', hover: 'rgba(240, 147, 251, 0.2)' },
        'Booking': { color: '#4facfe', bg: 'rgba(79, 172, 254, 0.1)', hover: 'rgba(79, 172, 254, 0.2)' },
        'Creative_Development': { color: '#43e97b', bg: 'rgba(67, 233, 123, 0.1)', hover: 'rgba(67, 233, 123, 0.2)' },
        'Pre_Production': { color: '#fa709a', bg: 'rgba(250, 112, 154, 0.1)', hover: 'rgba(250, 112, 154, 0.2)' },
        'Production': { color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)', hover: 'rgba(33, 150, 243, 0.2)' },
        'Post_Production': { color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)', hover: 'rgba(156, 39, 176, 0.2)' },
        'Delivery': { color: '#ffeb3b', bg: 'rgba(255, 235, 59, 0.1)', hover: 'rgba(255, 235, 59, 0.2)' }
    };

    const phaseStyle = phaseColors[phase as keyof typeof phaseColors] || phaseColors['Lead'];

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            hover
            sx={{
                background: isEditing ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)',
                cursor: isDragging ? 'grabbing' : 'inherit',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isEditing ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: 2,
                mb: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                    background: `linear-gradient(135deg, ${phaseStyle.bg} 0%, ${phaseStyle.hover} 100%)`,
                    borderColor: phaseStyle.color,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${phaseStyle.hover}`,
                },
                '& td': {
                    borderBottom: 'none',
                    color: 'white',
                    py: isEditing ? 1.5 : 2, // Slightly more compact when editing
                    px: 2
                }
            }}
        >
            {/* Drag Handle */}
            <TableCell sx={{ width: 40, padding: 1 }}>
                <IconButton
                    size="small"
                    {...attributes}
                    {...listeners}
                    sx={{
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                        color: phaseStyle.color,
                        background: phaseStyle.bg,
                        border: `1px solid ${phaseStyle.color}`,
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 2px 8px ${phaseStyle.hover}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: phaseStyle.hover,
                            transform: 'scale(1.1)',
                            boxShadow: `0 4px 12px ${phaseStyle.hover}`,
                        }
                    }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </IconButton>
            </TableCell>

            {/* Task Name */}
            <TableCell>
                {isEditing ? (
                    <TextField
                        size="small"
                        value={inlineEditData.name || ""}
                        onChange={(e) => updateInlineEditData('name', e.target.value)}
                        fullWidth
                        variant="outlined"
                        placeholder="Task name"
                        sx={{
                            maxWidth: '300px', // Constrain the width like quick add
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: 2,
                                fontSize: '0.875rem',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '0.875rem',
                            },
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                color: phaseStyle.color,
                                textDecoration: "underline",
                            },
                        }}
                        onClick={() => router.push(`/manager/tasks/${task.id}`)}
                    >
                        <Typography variant="subtitle2" fontWeight="regular" sx={{ color: 'white' }}>
                            {task.name}
                        </Typography>
                    </Box>
                )}
            </TableCell>

            {/* Description */}
            <TableCell>
                {isEditing ? (
                    <TextField
                        size="small"
                        value={inlineEditData.description || ""}
                        onChange={(e) => updateInlineEditData('description', e.target.value)}
                        fullWidth
                        variant="outlined"
                        placeholder="Description"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: 2,
                                fontSize: '0.875rem',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '0.875rem',
                            },
                        }}
                    />
                ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {task.description || "No description"}
                    </Typography>
                )}
            </TableCell>

            {/* Effort Hours */}
            <TableCell align="center">
                {isEditing ? (
                    <TextField
                        size="small"
                        type="number"
                        value={inlineEditData.effort_hours || 0}
                        onChange={(e) => updateInlineEditData('effort_hours', parseFloat(e.target.value) || 0)}
                        placeholder="Hours"
                        sx={{
                            width: '80px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: 2,
                                fontSize: '0.875rem',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                                textAlign: 'center',
                                fontSize: '0.875rem',
                            },
                        }}
                    />
                ) : (
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                            {task.effort_hours}h
                        </Typography>
                        {task.recorded_hours && task.recorded_hours > 0 && (
                            <Chip
                                label={`${task.recorded_hours}h recorded`}
                                size="small"
                                sx={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontWeight: 500,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                        )}
                    </Stack>
                )}
            </TableCell>

            {/* Pricing */}
            <TableCell align="center">
                {isEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <TextField
                            type="number"
                            placeholder={inlineEditData.pricing_type === PricingType.FIXED ? "Price" : "Rate"}
                            value={inlineEditData.pricing_type === PricingType.FIXED ? inlineEditData.fixed_price || '' : inlineEditData.hourly_rate || ''}
                            onChange={(e) => updateInlineEditData(
                                inlineEditData.pricing_type === PricingType.FIXED ? 'fixed_price' : 'hourly_rate',
                                parseFloat(e.target.value) || 0
                            )}
                            size="small"
                            variant="outlined"
                            sx={{
                                width: '70px',
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: 2,
                                    fontSize: '0.875rem',
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                                '& .MuiInputBase-input': {
                                    color: 'white',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                },
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 70 }}>
                            <Select
                                value={inlineEditData.pricing_type || PricingType.HOURLY}
                                onChange={(e) => updateInlineEditData('pricing_type', e.target.value)}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: 2,
                                    fontSize: '0.875rem',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'primary.main',
                                    },
                                    '& .MuiSelect-select': {
                                        color: 'white',
                                        fontSize: '0.875rem',
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            >
                                <MenuItem value={PricingType.HOURLY}>Hourly</MenuItem>
                                <MenuItem value={PricingType.FIXED}>Fixed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                ) : (
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {task.pricing_type === PricingType.FIXED && task.fixed_price && (
                            `$${task.fixed_price} Fixed`
                        )}
                        {task.pricing_type === PricingType.HOURLY && task.hourly_rate && (
                            `$${task.hourly_rate} Hourly`
                        )}
                        {(!task.fixed_price && !task.hourly_rate) && (
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Not set</span>
                        )}
                    </Typography>
                )}
            </TableCell>

            {/* Status */}
            <TableCell align="center">
                {isEditing ? (
                    <Switch
                        checked={inlineEditData.is_active ?? true}
                        onChange={(e) => updateInlineEditData('is_active', e.target.checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'primary.main',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: 'primary.main',
                            },
                        }}
                    />
                ) : (
                    <Chip
                        label={task.is_active ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                            background: task.is_active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            color: task.is_active ? '#4caf50' : 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500
                        }}
                    />
                )}
            </TableCell>

            {/* Actions */}
            <TableCell align="center">
                {isEditing ? (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Save Changes">
                            <IconButton
                                size="small"
                                onClick={saveInlineEdit}
                                sx={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    border: '1px solid rgba(76, 175, 80, 0.3)',
                                    borderRadius: 2,
                                    color: '#4caf50',
                                    '&:hover': {
                                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                    },
                                }}
                            >
                                <SaveIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <IconButton
                                size="small"
                                onClick={cancelInlineEdit}
                                sx={{
                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                    border: '1px solid rgba(244, 67, 54, 0.3)',
                                    borderRadius: 2,
                                    color: '#f44336',
                                    '&:hover': {
                                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                    },
                                }}
                            >
                                <CancelIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit Task">
                            <IconButton
                                size="small"
                                onClick={() => startInlineEdit(task)}
                                sx={{
                                    color: '#64ffda',
                                    '&:hover': {
                                        background: 'rgba(100, 255, 218, 0.1)',
                                    }
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setTaskToDelete(task);
                                    setDeleteConfirmOpen(true);
                                }}
                                sx={{
                                    color: '#f44336',
                                    '&:hover': {
                                        background: 'rgba(244, 67, 54, 0.1)',
                                    }
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </TableCell>
        </TableRow>
    );
}
