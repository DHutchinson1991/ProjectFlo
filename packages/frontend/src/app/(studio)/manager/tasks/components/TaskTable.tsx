"use client";

import React from "react";
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
} from "@mui/material";
import {
    Timer as TimerIcon,
    Person as PersonIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    DragIndicator as DragIndicatorIcon,
    CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskLibrary, JobRole, SkillRoleMapping, TriggerType, TRIGGER_TYPE_LABELS } from "@/lib/types";
import { SortableTaskRow } from "./SortableTaskRow";
import { useRouter } from "next/navigation";

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
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
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
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
    jobRoles,
    allMappings,
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
}: TaskTableProps) {
    const router = useRouter();

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
                        items={tasks.map(task => task.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.map((task) => (
                            <SortableTaskRow
                                key={task.id}
                                task={task}
                                phase={phase}
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
                                expandedTaskId={expandedTaskId}
                                onToggleExpand={onToggleExpand}
                                onUpdateRoleSkills={onUpdateRoleSkills}
                            />
                        ))}
                    </SortableContext>

                    {/* Quick Add Row */}
                    {quickAddPhase === phase && (
                        <TableRow sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 2,
                            mb: 1,
                            transition: 'all 0.3s ease',
                            '& td': {
                                borderBottom: 'none',
                                color: 'white',
                                py: 1.5, // Reduced from 2 to match existing rows better
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

                            {/* Task Name */}
                            <TableCell>
                                <TextField
                                    fullWidth
                                    placeholder="Task name"
                                    value={quickAddData.name || ''}
                                    onChange={(e) => updateQuickAddData('name', e.target.value)}
                                    size="small"
                                    variant="outlined"
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
                            </TableCell>

                            {/* Role — empty for quick add */}
                            <TableCell />

                            {/* Tier — empty for quick add */}
                            <TableCell />

                            {/* Rate — empty for quick add */}
                            <TableCell />

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
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
