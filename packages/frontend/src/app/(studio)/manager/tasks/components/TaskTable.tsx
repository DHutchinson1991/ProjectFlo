"use client";

import React, { useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Switch,
    Box,
    Typography,
} from "@mui/material";
import {
    Timer as TimerIcon,
    Person as PersonIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    DragIndicator as DragIndicatorIcon,
    CalendarMonth as CalendarMonthIcon,
    FolderOpen as FolderOpenIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskLibrary, JobRole, SkillRoleMapping, TriggerType, TRIGGER_TYPE_LABELS } from "@/lib/types";
import { SortableTaskRow } from "./SortableTaskRow";
import { useRouter } from "next/navigation";

interface ContributorOption {
    id: number;
    contact: { first_name?: string; last_name?: string };
    contributor_job_roles?: { job_role_id: number; payment_bracket_id?: number | null; payment_bracket?: { id: number; level: number } | null }[];
}

interface TaskTableProps {
    tasks: TaskLibrary[];
    phase: string;
    inlineEditingTask: number | null;
    inlineEditData: Partial<TaskLibrary>;
    updateInlineEditData: (field: keyof TaskLibrary, value: unknown) => void;
    startInlineEdit: (task: TaskLibrary) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setTaskToDelete: (task: TaskLibrary) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    isDragging: boolean;
    quickAddPhase: string | null;
    quickAddData: Partial<TaskLibrary>;
    startQuickAdd: (phase: string, parentStageId?: number) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    contributors: ContributorOption[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateContributor: (taskId: number, contributorId: number | null) => Promise<void>;
}

export function TaskTable({
    tasks,
    phase,
    inlineEditingTask,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setTaskToDelete,
    setDeleteConfirmOpen,
    isDragging,
    quickAddPhase,
    quickAddData,
    startQuickAdd,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
    jobRoles,
    allMappings,
    contributors,
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
    onUpdateContributor,
}: TaskTableProps) {
    const router = useRouter();

    // Build ordered render list: stage headers with their children, then flat tasks
    const renderItems = useMemo(() => {
        const stageParents = tasks.filter(t => t.is_stage);
        const childTaskIds = new Set<number>();

        // Collect children IDs (from parent's children array or by parent_task_id)
        for (const stage of stageParents) {
            if (stage.children) {
                for (const child of stage.children) childTaskIds.add(child.id);
            }
        }
        for (const t of tasks) {
            if (t.parent_task_id) childTaskIds.add(t.id);
        }

        const items: Array<{ type: 'stage'; stage: TaskLibrary } | { type: 'task'; task: TaskLibrary; isChild: boolean }> = [];

        // First: stage parents with their children
        for (const stage of stageParents) {
            items.push({ type: 'stage', stage });
            // Children from the stage's children array (preferred, already backend-sorted)
            const children = stage.children ?? tasks.filter(t => t.parent_task_id === stage.id);
            for (const child of children) {
                items.push({ type: 'task', task: child, isChild: true });
            }
        }

        // Then: flat tasks (not a stage parent, not a child)
        for (const t of tasks) {
            if (!t.is_stage && !childTaskIds.has(t.id)) {
                items.push({ type: 'task', task: t, isChild: false });
            }
        }

        return items;
    }, [tasks]);

    // Collect all sortable task IDs (skip stage header rows)
    const sortableIds = useMemo(
        () => renderItems.filter(i => i.type === 'task').map(i => (i as { type: 'task'; task: TaskLibrary }).task.id.toString()),
        [renderItems],
    );

    // Determine if quick-add targets a specific stage in this phase
    const isQuickAddForThisPhase = quickAddPhase === phase;
    const quickAddTargetStageId = quickAddData.parent_task_id;

    // Helper: check if the next item in renderItems is a different stage or end of list
    // i.e., we're at the last child of a stage group
    const isLastChildOfStage = (index: number, stageId: number) => {
        const nextItem = renderItems[index + 1];
        if (!nextItem) return true; // end of list
        if (nextItem.type === 'stage') return true; // next is a new stage header
        if (nextItem.type === 'task' && !nextItem.isChild) return true; // next is a flat task
        if (nextItem.type === 'task' && nextItem.task.parent_task_id !== stageId) return true;
        return false;
    };

    // Helper: renders the quick-add row JSX
    const renderQuickAddRow = () => (
        <TableRow key="quick-add-row" sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 2,
            mb: 1,
            transition: 'all 0.3s ease',
            '& td': {
                borderBottom: 'none',
                color: 'white',
                py: 1.5,
                px: 2
            }
        }}>
            {/* Drag handle cell with greyed-out icon */}
            <TableCell sx={{ width: 40, padding: 1 }}>
                <IconButton
                    size="small"
                    disabled
                    sx={{
                        cursor: 'not-allowed',
                        color: 'rgba(255, 255, 255, 0.3)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        opacity: 0.5,
                        '&.Mui-disabled': {
                            color: 'rgba(255, 255, 255, 0.3)',
                            background: 'rgba(255, 255, 255, 0.05)',
                        }
                    }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </IconButton>
            </TableCell>

            {/* Task Name + Parent Stage selector */}
            <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                        fullWidth
                        placeholder="Task name"
                        value={quickAddData.name || ''}
                        onChange={(e) => updateQuickAddData('name', e.target.value)}
                        size="small"
                        variant="outlined"
                        autoFocus
                        sx={{
                            maxWidth: '300px',
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
                    {/* Parent Stage selector */}
                    {tasks.filter(t => t.is_stage).length > 0 && (
                        <FormControl size="small" sx={{ maxWidth: '300px' }}>
                            <Select
                                value={quickAddData.parent_task_id ?? ''}
                                displayEmpty
                                onChange={(e) => {
                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                    updateQuickAddData('parent_task_id', val);
                                }}
                                sx={{
                                    backgroundColor: quickAddData.parent_task_id
                                        ? 'rgba(100, 255, 218, 0.06)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 1.5,
                                    fontSize: '0.75rem',
                                    height: 32,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: quickAddData.parent_task_id
                                            ? 'rgba(100, 255, 218, 0.2)'
                                            : 'rgba(255,255,255,0.12)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.25)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'primary.main',
                                    },
                                    '& .MuiSelect-select': {
                                        color: quickAddData.parent_task_id
                                            ? 'rgba(100, 255, 218, 0.85)'
                                            : 'rgba(255,255,255,0.4)',
                                        fontSize: '0.75rem',
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'rgba(255,255,255,0.3)',
                                    },
                                }}
                            >
                                <MenuItem value="">
                                    <em style={{ color: 'rgba(255,255,255,0.4)' }}>No parent stage</em>
                                </MenuItem>
                                {tasks.filter(t => t.is_stage).map((stage) => (
                                    <MenuItem key={stage.id} value={stage.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: stage.stage_color || 'rgba(255,255,255,0.4)',
                                                flexShrink: 0,
                                            }} />
                                            {stage.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
            </TableCell>

            {/* Role dropdown */}
            <TableCell>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={quickAddData.default_job_role_id ?? ''}
                        displayEmpty
                        onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            updateQuickAddData('default_job_role_id', val);
                        }}
                        sx={{
                            backgroundColor: quickAddData.default_job_role_id
                                ? 'rgba(100, 255, 218, 0.06)'
                                : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            height: 32,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: quickAddData.default_job_role_id
                                    ? 'rgba(100, 255, 218, 0.2)'
                                    : 'rgba(255,255,255,0.12)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.25)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                            },
                            '& .MuiSelect-select': {
                                color: quickAddData.default_job_role_id
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
            </TableCell>

            {/* Tier — read-only */}
            <TableCell>
                {(() => {
                    const roleId = quickAddData.default_job_role_id;
                    if (!roleId) return <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>;
                    let highest: { level?: number | null; name?: string; hourly_rate?: number | null } | null = null;
                    for (const m of allMappings) {
                        if (m.job_role_id !== roleId) continue;
                        if (!m.payment_bracket) continue;
                        if (!highest || (m.payment_bracket.level ?? 0) > (highest.level ?? 0)) {
                            highest = m.payment_bracket;
                        }
                    }
                    if (!highest) return <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>;
                    const TIER_LABELS: Record<number, string> = { 1: "Junior", 2: "Mid-Level", 3: "Senior", 4: "Lead", 5: "Executive" };
                    const TIER_COLORS: Record<number, string> = { 1: "rgba(100, 200, 255, 0.85)", 2: "rgba(160, 140, 255, 0.85)", 3: "rgba(255, 180, 100, 0.85)", 4: "rgba(255, 100, 130, 0.85)", 5: "rgba(255, 80, 200, 0.85)" };
                    const level = highest.level ?? 0;
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: TIER_COLORS[level] ?? 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: TIER_COLORS[level] ?? 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                                {TIER_LABELS[level] ?? highest.name}
                            </Typography>
                        </Box>
                    );
                })()}
            </TableCell>

            {/* Rate — read-only */}
            <TableCell>
                {(() => {
                    const roleId = quickAddData.default_job_role_id;
                    if (!roleId) return <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>;
                    let highest: { level?: number | null; hourly_rate?: number | null } | null = null;
                    for (const m of allMappings) {
                        if (m.job_role_id !== roleId) continue;
                        if (!m.payment_bracket) continue;
                        if (!highest || (m.payment_bracket.level ?? 0) > (highest.level ?? 0)) {
                            highest = m.payment_bracket;
                        }
                    }
                    if (!highest?.hourly_rate) return <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>;
                    return (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(100, 255, 218, 0.85)' }}>
                            £{highest.hourly_rate}/hr
                        </Typography>
                    );
                })()}
            </TableCell>

            {/* Contributor — read-only in quick-add (auto-resolved after create) */}
            <TableCell>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                    Auto
                </Typography>
            </TableCell>

            {/* Description */}
            <TableCell>
                <TextField
                    fullWidth
                    placeholder="Description"
                    value={quickAddData.description || ''}
                    onChange={(e) => updateQuickAddData('description', e.target.value)}
                    size="small"
                    variant="outlined"
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
            </TableCell>

            {/* Hours */}
            <TableCell align="center">
                <TextField
                    type="number"
                    placeholder="Hours"
                    value={quickAddData.effort_hours || ''}
                    onChange={(e) => updateQuickAddData('effort_hours', parseFloat(e.target.value) || 0)}
                    size="small"
                    variant="outlined"
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
            </TableCell>

            {/* Due Days */}
            <TableCell align="center">
                <TextField
                    type="number"
                    placeholder="—"
                    value={quickAddData.due_date_offset_days ?? ''}
                    onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        updateQuickAddData('due_date_offset_days', val);
                    }}
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
            </TableCell>

            {/* Trigger */}
            <TableCell align="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={quickAddData.trigger_type || TriggerType.ALWAYS}
                        onChange={(e) => updateQuickAddData('trigger_type', e.target.value)}
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
            </TableCell>

            {/* Status */}
            <TableCell align="center">
                <Switch
                    checked={quickAddData.is_active ?? true}
                    onChange={(e) => updateQuickAddData('is_active', e.target.checked)}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'primary.main',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'primary.main',
                        },
                    }}
                />
            </TableCell>

            {/* Actions */}
            <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        onClick={saveQuickAdd}
                        disabled={!quickAddData.name}
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            borderRadius: 2,
                            color: '#4caf50',
                            '&:hover': {
                                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            },
                            '&:disabled': {
                                opacity: 0.5,
                            },
                        }}
                    >
                        <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        onClick={cancelQuickAdd}
                        size="small"
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
                </Box>
            </TableCell>
        </TableRow>
    );

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: 40 }}></TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Task Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                            <PersonIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                            Role
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                            <PersonIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                            Contributor
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                            <TimerIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                            Hours
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                            <CalendarMonthIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                            Due Days
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Trigger</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <SortableContext
                        items={sortableIds}
                        strategy={verticalListSortingStrategy}
                    >
                        {renderItems.map((item, index) => {
                            const elements: React.ReactNode[] = [];

                            if (item.type === 'stage') {
                                const stageColor = item.stage.stage_color || 'rgba(255, 255, 255, 0.6)';
                                const childCount = item.stage.children?.length ?? tasks.filter(t => t.parent_task_id === item.stage.id).length;
                                elements.push(
                                    <TableRow
                                        key={`stage-${item.stage.id}`}
                                        sx={{
                                            background: `linear-gradient(90deg, ${stageColor}18 0%, transparent 100%)`,
                                            borderLeft: `3px solid ${stageColor}`,
                                            '& td': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 1.25, px: 2 },
                                        }}
                                    >
                                        <TableCell sx={{ width: 40, padding: 1 }}>
                                            <FolderOpenIcon sx={{ fontSize: 18, color: stageColor, opacity: 0.8 }} />
                                        </TableCell>
                                        <TableCell colSpan={10}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: stageColor, letterSpacing: 0.3 }}>
                                                    {item.stage.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                                                    {childCount} task{childCount !== 1 ? 's' : ''}
                                                </Typography>
                                                {item.stage.description && (
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 1 }}>
                                                        — {item.stage.description}
                                                    </Typography>
                                                )}
                                                <Box sx={{ flex: 1 }} />
                                                <IconButton
                                                    onClick={() => startQuickAdd(phase, item.stage.id)}
                                                    size="small"
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        color: stageColor,
                                                        opacity: 0.6,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            opacity: 1,
                                                            backgroundColor: `${stageColor}15`,
                                                        },
                                                    }}
                                                >
                                                    <AddIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );

                                // If this stage has 0 children and quick-add targets it, render inline
                                if (isQuickAddForThisPhase && quickAddTargetStageId === item.stage.id && childCount === 0) {
                                    elements.push(renderQuickAddRow());
                                }
                            } else {
                                elements.push(
                                    <SortableTaskRow
                                        key={item.task.id}
                                        task={item.task}
                                        phase={phase}
                                        isChild={item.isChild}
                                        inlineEditingTask={inlineEditingTask}
                                        inlineEditData={inlineEditData}
                                        updateInlineEditData={updateInlineEditData}
                                        startInlineEdit={startInlineEdit}
                                        cancelInlineEdit={cancelInlineEdit}
                                        saveInlineEdit={saveInlineEdit}
                                        setTaskToDelete={setTaskToDelete}
                                        setDeleteConfirmOpen={setDeleteConfirmOpen}
                                        router={router}
                                        isDragging={isDragging}
                                        jobRoles={jobRoles}
                                        allMappings={allMappings}
                                        contributors={contributors}
                                        expandedTaskId={expandedTaskId}
                                        onToggleExpand={onToggleExpand}
                                        onUpdateRoleSkills={onUpdateRoleSkills}
                                        onUpdateContributor={onUpdateContributor}
                                    />
                                );

                                // If this child is the last in its stage group and quick-add targets this stage, render inline
                                if (
                                    isQuickAddForThisPhase &&
                                    item.isChild &&
                                    item.task.parent_task_id &&
                                    quickAddTargetStageId === item.task.parent_task_id &&
                                    isLastChildOfStage(index, item.task.parent_task_id)
                                ) {
                                    elements.push(renderQuickAddRow());
                                }
                            }

                            return elements;
                        })}
                    </SortableContext>

                    {/* Quick Add Row — at bottom only when no parent stage is targeted */}
                    {isQuickAddForThisPhase && !quickAddTargetStageId && renderQuickAddRow()}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
