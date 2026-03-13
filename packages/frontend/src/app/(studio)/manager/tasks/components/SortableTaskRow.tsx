"use client";

import React, { useMemo } from "react";
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
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskLibrary, JobRole, SkillRoleMapping, TriggerType, TRIGGER_TYPE_LABELS } from "@/lib/types";
import { TaskRoleSkillsPanel } from "./TaskRoleSkillsPanel";

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
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
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
    jobRoles,
    allMappings,
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
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
    const isExpanded = expandedTaskId === task.id;

    // Resolve tier & rate from task skills + all mappings
    const TIER_LABELS: Record<number, string> = { 1: "Junior", 2: "Mid-Level", 3: "Senior", 4: "Lead", 5: "Executive" };
    const TIER_COLORS: Record<number, string> = {
        1: "rgba(100, 200, 255, 0.85)",
        2: "rgba(160, 140, 255, 0.85)",
        3: "rgba(255, 180, 100, 0.85)",
        4: "rgba(255, 100, 130, 0.85)",
        5: "rgba(255, 80, 200, 0.85)",
    };
    const resolvedBracket = useMemo(() => {
        const skills = task.skills_needed ?? [];
        const roleId = task.default_job_role_id;
        if (!roleId || skills.length === 0) return null;

        let highest: SkillRoleMapping["payment_bracket"] | null = null;
        for (const m of allMappings) {
            if (m.job_role_id !== roleId) continue;
            if (!skills.includes(m.skill_name)) continue;
            if (!m.payment_bracket) continue;
            if (!highest || (m.payment_bracket.level ?? 0) > (highest.level ?? 0)) {
                highest = m.payment_bracket;
            }
        }
        return highest;
    }, [task.skills_needed, task.default_job_role_id, allMappings]);

    return (
        <>
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
                mb: isExpanded ? 0 : 1,
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
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            "&:hover": {
                                color: phaseStyle.color,
                            },
                        }}
                        onClick={() => router.push(`/manager/tasks/${task.id}`)}
                    >
                        <Typography variant="subtitle2" fontWeight="regular" sx={{ color: 'white', '&:hover': { textDecoration: 'underline' } }}>
                            {task.name}
                        </Typography>
                    </Box>
                )}
            </TableCell>

            {/* Role — inline dropdown + expand toggle */}
            <TableCell>
                {isEditing ? (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        Save first
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                                value={task.default_job_role_id ?? ''}
                                displayEmpty
                                onChange={async (e) => {
                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                    await onUpdateRoleSkills(task.id, {
                                        default_job_role_id: val,
                                        skills_needed: [],
                                    });
                                    // Auto-open panel when role set, collapse when cleared
                                    if (val && !isExpanded) onToggleExpand(task.id);
                                    if (!val && isExpanded) onToggleExpand(task.id);
                                }}
                                sx={{
                                    backgroundColor: task.default_job_role_id
                                        ? 'rgba(100, 255, 218, 0.06)'
                                        : 'rgba(255,255,255,0.05)',
                                    borderRadius: 1.5,
                                    fontSize: '0.75rem',
                                    height: 32,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: task.default_job_role_id
                                            ? 'rgba(100, 255, 218, 0.2)'
                                            : 'rgba(255,255,255,0.12)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: task.default_job_role_id
                                            ? 'rgba(100, 255, 218, 0.4)'
                                            : 'rgba(255,255,255,0.25)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'primary.main',
                                    },
                                    '& .MuiSelect-select': {
                                        color: task.default_job_role_id
                                            ? 'rgba(100, 255, 218, 0.85)'
                                            : 'rgba(255,255,255,0.4)',
                                        fontSize: '0.75rem',
                                        py: 0.5,
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'rgba(255,255,255,0.3)',
                                        fontSize: 16,
                                    },
                                }}
                            >
                                <MenuItem value="">
                                    <em style={{ color: 'rgba(255,255,255,0.4)' }}>No role</em>
                                </MenuItem>
                                {jobRoles.filter((r) => r.is_active).map((role) => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.display_name || role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <IconButton
                            size="small"
                            onClick={() => onToggleExpand(task.id)}
                            sx={{
                                width: 24,
                                height: 24,
                                color: isExpanded ? 'rgba(100, 255, 218, 0.7)' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'rgba(100, 255, 218, 0.85)',
                                },
                            }}
                        >
                            {isExpanded
                                ? <ExpandLessIcon sx={{ fontSize: 16 }} />
                                : <ExpandMoreIcon sx={{ fontSize: 16 }} />
                            }
                        </IconButton>
                    </Box>
                )}
            </TableCell>

            {/* Tier */}
            <TableCell>
                {resolvedBracket ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: TIER_COLORS[resolvedBracket.level ?? 0] ?? 'rgba(255,255,255,0.4)',
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: TIER_COLORS[resolvedBracket.level ?? 0] ?? 'rgba(255,255,255,0.5)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {TIER_LABELS[resolvedBracket.level ?? 0] ?? resolvedBracket.name}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                        —
                    </Typography>
                )}
            </TableCell>

            {/* Rate */}
            <TableCell>
                {resolvedBracket?.hourly_rate != null ? (
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#64ffda',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        £{resolvedBracket.hourly_rate}/hr
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                        —
                    </Typography>
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

            {/* Due Days Offset */}
            <TableCell align="center">
                {isEditing ? (
                    <TextField
                        size="small"
                        type="number"
                        value={inlineEditData.due_date_offset_days ?? ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            updateInlineEditData('due_date_offset_days', val);
                        }}
                        placeholder="—"
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
                ) : (
                    <Tooltip title={task.due_date_offset_days != null
                        ? `${task.due_date_offset_days} day${Math.abs(task.due_date_offset_days) !== 1 ? 's' : ''} ${task.due_date_offset_days >= 0 ? 'after' : 'before'} reference date`
                        : 'No default due date'
                    }>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {task.due_date_offset_days != null ? (
                                <>
                                    <CalendarMonthIcon sx={{ fontSize: 14, color: 'rgba(255, 183, 77, 0.7)' }} />
                                    <Typography variant="body2" sx={{
                                        color: task.due_date_offset_days < 0 ? 'rgba(255, 152, 0, 0.9)' : 'rgba(255, 183, 77, 0.85)',
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                    }}>
                                        {task.due_date_offset_days > 0 ? '+' : ''}{task.due_date_offset_days}d
                                    </Typography>
                                </>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                                    —
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>
                )}
            </TableCell>

            {/* Trigger Type */}
            <TableCell align="center">
                {isEditing ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            value={inlineEditData.trigger_type || TriggerType.ALWAYS}
                            onChange={(e) => updateInlineEditData('trigger_type', e.target.value)}
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: 2,
                                fontSize: '0.75rem',
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
                                    fontSize: '0.75rem',
                                },
                                '& .MuiSvgIcon-root': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                },
                            }}
                        >
                            {Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => (
                                <MenuItem key={value} value={value}>{label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <Chip
                        label={TRIGGER_TYPE_LABELS[task.trigger_type] || 'Always'}
                        size="small"
                        sx={{
                            background: task.trigger_type === TriggerType.ALWAYS
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(79, 172, 254, 0.15)',
                            color: task.trigger_type === TriggerType.ALWAYS
                                ? 'rgba(255, 255, 255, 0.7)'
                                : '#4facfe',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            border: task.trigger_type === TriggerType.ALWAYS
                                ? '1px solid rgba(255, 255, 255, 0.2)'
                                : '1px solid rgba(79, 172, 254, 0.3)',
                        }}
                    />
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

        {/* Expandable role & skills panel */}
        <TableRow
            sx={{
                '& td': { borderBottom: 'none', p: 0 },
                ...(isExpanded ? {} : { display: 'none' }),
            }}
        >
            <TableCell colSpan={11} sx={{ p: 0 }}>
                <TaskRoleSkillsPanel
                    task={task}
                    open={isExpanded}
                    onUpdate={onUpdateRoleSkills}
                />
            </TableCell>
        </TableRow>
        </>
    );
}
