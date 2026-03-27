"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    IconButton,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Switch,
    Collapse,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    OpenInNew as OpenInNewIcon,
    CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskLibrary, JobRole, SkillRoleMapping, TriggerType, TRIGGER_TYPE_LABELS, CrewMember } from "@/features/catalog/task-library/types";
import { getPhaseConfig, hexToRgba, CrewMemberPicker } from "@/shared/ui/tasks";
import { TIER_LABELS, TIER_COLORS, resolveHighestBracket } from "@/shared/utils/tierRate";
import { DEFAULT_CURRENCY, formatCurrency } from "@projectflo/shared";
import { GRID_COLS } from "../constants";
import { TaskRoleSkillsPanel } from "./TaskRoleSkillsPanel";

interface SortableTaskRowProps {
    task: TaskLibrary;
    phase: string;
    isChild?: boolean;
    onUpdateTask: (taskId: number, data: Partial<TaskLibrary>) => Promise<void>;
    setTaskToDelete: (task: TaskLibrary) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    router: ReturnType<typeof useRouter>;
    isDragging: boolean;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    crewMembers: CrewMember[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateContributor: (taskId: number, crewMemberId: number | null) => Promise<void>;
}

const ghostNameSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 1,
        '& fieldset': { borderColor: 'transparent', transition: 'border-color 0.15s' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
        '&.Mui-focused fieldset': { borderColor: 'rgba(100,255,218,0.35)' },
    },
    '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.87)', fontSize: '0.8125rem', fontWeight: 500, py: 0.375, px: 0.75, lineHeight: 1.3 },
};

const ghostDescSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 1,
        '& fieldset': { borderColor: 'transparent', transition: 'border-color 0.15s' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
        '&.Mui-focused fieldset': { borderColor: 'rgba(100,255,218,0.35)' },
    },
    '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.3)', fontSize: '0.6875rem', fontWeight: 400, py: 0.25, px: 0.75, lineHeight: 1.2 },
};

const ghostNumSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 1,
        '& fieldset': { borderColor: 'transparent', transition: 'border-color 0.15s' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
        '&.Mui-focused fieldset': { borderColor: 'rgba(100,255,218,0.35)' },
    },
    '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 500, py: 0.375, px: 0.5, textAlign: 'center' as const },
};

export function SortableTaskRow({
    task, phase, isChild = false,
    onUpdateTask,
    setTaskToDelete, setDeleteConfirmOpen, router, isDragging,
    jobRoles, allMappings, crewMembers,
    expandedTaskId, onToggleExpand, onUpdateRoleSkills, onUpdateContributor,
}: SortableTaskRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging: isCurrentDragging } = useSortable({ id: task.id.toString() });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isCurrentDragging ? 0 : 1 };

    const subtasks = task.task_library_subtask_templates ?? [];
    const [subtasksOpen, setSubtasksOpen] = useState(subtasks.length > 0);
    const cfg = getPhaseConfig(phase);
    const phaseColor = cfg.color;
    const isExpanded = expandedTaskId === task.id;
    const [hovered, setHovered] = useState(false);

    // Local state for text/number fields — saved on blur or Enter
    const [localName, setLocalName] = useState(task.name);
    const [localDesc, setLocalDesc] = useState(task.description || '');
    const [localHours, setLocalHours] = useState(task.effort_hours != null ? String(task.effort_hours) : '');
    const [localDue, setLocalDue] = useState(task.due_date_offset_days != null ? String(task.due_date_offset_days) : '');
    const [dueEditing, setDueEditing] = useState(false);

    const save = (data: Partial<TaskLibrary>) => onUpdateTask(task.id, data);

    const resolvedBracket = useMemo(() => {
        return resolveHighestBracket(task.default_job_role_id, allMappings, task.skills_needed ?? []);
    }, [task.skills_needed, task.default_job_role_id, allMappings]);

    return (
        <>
        {/* ── Main row ── */}
        <Box
            ref={setNodeRef}
            style={style}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center', minHeight: 44,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft: isChild ? `2px solid ${phaseColor}55` : `3px solid ${phaseColor}`,
                cursor: isDragging ? 'grabbing' : 'default',
                transition: 'background-color 0.12s',
                bgcolor: isChild ? 'rgba(255,255,255,0.012)' : 'transparent',
                '&:hover': { bgcolor: `${hexToRgba(phaseColor, 0.04)}` },
            }}
        >
            {/* Drag */}
            <Box {...attributes} {...listeners} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                cursor: 'grab', '&:active': { cursor: 'grabbing' },
            }}>
                <DragIndicatorIcon sx={{ fontSize: 14, color: hovered ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)' }} />
            </Box>

            {/* Subtask chevron */}
            <Box
                onClick={subtasks.length > 0 ? (e) => { e.stopPropagation(); setSubtasksOpen(o => !o); } : undefined}
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                    cursor: subtasks.length > 0 ? 'pointer' : 'default',
                    '&:hover': subtasks.length > 0 ? { bgcolor: 'rgba(255,255,255,0.06)' } : {},
                    borderRadius: '3px',
                }}
            >
                {subtasks.length > 0 && (
                    <ExpandMoreIcon sx={{
                        fontSize: 14, color: '#94a3b8',
                        transform: subtasksOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s',
                    }} />
                )}
            </Box>

            {/* Task name + description */}
            <Box sx={{ px: 0.5, overflow: 'hidden', pl: isChild ? 2.5 : 0.5 }}>
                <TextField
                    size="small" value={localName} fullWidth
                    onChange={(e) => setLocalName(e.target.value)}
                    onBlur={() => { if (localName.trim() && localName !== task.name) save({ name: localName.trim() }); else if (!localName.trim()) setLocalName(task.name); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder="Task name"
                    sx={ghostNameSx}
                />
                <TextField
                    size="small" value={localDesc} fullWidth
                    onChange={(e) => setLocalDesc(e.target.value)}
                    onBlur={() => { if (localDesc !== (task.description || '')) save({ description: localDesc || undefined }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder="Description…"
                    sx={ghostDescSx}
                />
            </Box>

            {/* Role */}
            <Box sx={{ px: 0.5, display: 'flex', alignItems: 'center', gap: 0.25, overflow: 'hidden' }}>
                <FormControl size="small" sx={{ minWidth: 0, flex: 1 }}>
                    <Select
                        value={task.default_job_role_id ?? ''} displayEmpty
                        onChange={async (e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            await onUpdateRoleSkills(task.id, { default_job_role_id: val, skills_needed: [] });
                            if (val && !isExpanded) onToggleExpand(task.id);
                            if (!val && isExpanded) onToggleExpand(task.id);
                        }}
                        sx={{
                            bgcolor: task.default_job_role_id ? 'rgba(100,255,218,0.06)' : 'rgba(255,255,255,0.03)',
                            borderRadius: 1, fontSize: '0.6875rem', height: 28,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: task.default_job_role_id ? 'rgba(100,255,218,0.2)' : 'rgba(255,255,255,0.08)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                            '& .MuiSelect-select': { color: task.default_job_role_id ? 'rgba(100,255,218,0.85)' : 'rgba(255,255,255,0.35)', fontSize: '0.6875rem', py: 0.25 },
                            '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.2)', fontSize: 14 },
                        }}
                    >
                        <MenuItem value=""><em style={{ color: 'rgba(255,255,255,0.4)' }}>—</em></MenuItem>
                        {jobRoles.filter(r => r.is_active).map(role => (
                            <MenuItem key={role.id} value={role.id}>{role.display_name || role.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <IconButton size="small" onClick={() => onToggleExpand(task.id)} sx={{
                    width: 20, height: 20, flexShrink: 0,
                    color: isExpanded ? 'rgba(100,255,218,0.7)' : 'rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(100,255,218,0.85)' },
                }}>
                    {isExpanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                </IconButton>
            </Box>

            {/* Tier */}
            <Box sx={{ px: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {resolvedBracket ? (
                    <>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: TIER_COLORS[resolvedBracket.level ?? 0] ?? 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: TIER_COLORS[resolvedBracket.level ?? 0], whiteSpace: 'nowrap' }}>
                            {TIER_LABELS[resolvedBracket.level ?? 0] ?? resolvedBracket.name}
                        </Typography>
                    </>
                ) : <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.18)' }}>—</Typography>}
            </Box>

            {/* Rate */}
            <Box sx={{ px: 0.5 }}>
                {resolvedBracket?.hourly_rate != null ? (
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: '#64ffda', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatCurrency(resolvedBracket.hourly_rate, DEFAULT_CURRENCY)}/hr
                    </Typography>
                ) : <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.18)' }}>—</Typography>}
            </Box>

            {/* Contributor */}
            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <CrewMemberPicker
                    contributors={crewMembers}
                    selectedId={task.default_crew_member?.id ?? null}
                    selectedName={task.default_crew_member ? `${task.default_crew_member.contact.first_name} ${task.default_crew_member.contact.last_name}` : null}
                    onSelect={(id) => onUpdateContributor(task.id, id)}
                    filterRoleId={task.default_job_role_id ?? null}
                    filterMinBracketLevel={resolvedBracket?.level ?? null}
                    showDashWhenEmpty
                />
            </Box>

            {/* Hours */}
            <Box sx={{ px: 0.25 }}>
                <TextField
                    size="small" type="number" value={localHours}
                    onChange={(e) => setLocalHours(e.target.value)}
                    onBlur={() => {
                        if (localHours === '') { if (task.effort_hours != null) save({ effort_hours: 0 }); return; }
                        const parsed = parseFloat(localHours);
                        if (!isNaN(parsed) && parsed !== task.effort_hours) save({ effort_hours: parsed });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder="—"
                    sx={ghostNumSx}
                    inputProps={{ min: 0, step: 0.5 }}
                />
            </Box>

            {/* Due offset */}
            <Box sx={{ px: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {dueEditing ? (
                    <TextField
                        size="small" type="number" value={localDue} autoFocus
                        onChange={(e) => setLocalDue(e.target.value)}
                        onBlur={() => {
                            setDueEditing(false);
                            if (localDue === '') { if (task.due_date_offset_days != null) save({ due_date_offset_days: null }); return; }
                            const parsed = parseInt(localDue, 10);
                            if (!isNaN(parsed) && parsed !== task.due_date_offset_days) save({ due_date_offset_days: parsed });
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDueEditing(false); setLocalDue(task.due_date_offset_days != null ? String(task.due_date_offset_days) : ''); } }}
                        sx={ghostNumSx}
                    />
                ) : (
                    <Box onClick={() => setDueEditing(true)} sx={{ cursor: 'text', display: 'flex', alignItems: 'center', gap: 0.375, minWidth: 32, justifyContent: 'center' }}>
                        {task.due_date_offset_days != null ? (
                            <>
                                <CalendarMonthIcon sx={{ fontSize: 11, color: 'rgba(255,183,77,0.55)', flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: task.due_date_offset_days < 0 ? 'rgba(255,152,0,0.9)' : 'rgba(255,183,77,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                    {task.due_date_offset_days > 0 ? '+' : ''}{task.due_date_offset_days}d
                                </Typography>
                            </>
                        ) : (
                            <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.18)' }}>—</Typography>
                        )}
                    </Box>
                )}
            </Box>

            {/* Trigger */}
            <Box sx={{ display: 'flex', justifyContent: 'center', px: 0.25 }}>
                <FormControl size="small" sx={{ minWidth: 0, width: '100%' }}>
                    <Select
                        value={task.trigger_type || TriggerType.ALWAYS}
                        onChange={(e) => save({ trigger_type: e.target.value as TriggerType })}
                        sx={{
                            bgcolor: task.trigger_type === TriggerType.ALWAYS ? 'rgba(255,255,255,0.04)' : 'rgba(79,172,254,0.08)',
                            borderRadius: 1, fontSize: '0.625rem', height: 24,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                            '& .MuiSelect-select': {
                                color: task.trigger_type === TriggerType.ALWAYS ? 'rgba(255,255,255,0.5)' : '#4facfe',
                                fontSize: '0.625rem', py: 0.125, fontWeight: 700, px: 0.75,
                            },
                            '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.25)', fontSize: 14, right: 0 },
                        }}
                    >
                        {Object.entries(TRIGGER_TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            {/* Status */}
            <Box sx={{ display: 'flex', justifyContent: 'center', px: 0.25 }}>
                <Switch
                    size="small"
                    checked={task.is_active}
                    onChange={(e) => save({ is_active: e.target.checked })}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#00C875' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'rgba(0,200,117,0.4)' },
                    }}
                />
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                <IconButton size="small" onClick={() => router.push(`/task-library/${task.id}`)}
                    sx={{ width: 24, height: 24, color: hovered ? 'rgba(255,255,255,0.35)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' } }}>
                    <OpenInNewIcon sx={{ fontSize: 12 }} />
                </IconButton>
                <IconButton size="small" onClick={() => { setTaskToDelete(task); setDeleteConfirmOpen(true); }}
                    sx={{ width: 24, height: 24, color: hovered ? '#f44336' : 'transparent', '&:hover': { bgcolor: 'rgba(244,67,54,0.1)' } }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
        </Box>

        {/* ── Expandable role & skills panel ── */}
        <Collapse in={isExpanded}>
            <TaskRoleSkillsPanel task={task} open={isExpanded} onUpdate={onUpdateRoleSkills} />
        </Collapse>

        {/* ── Subtask rows ── */}
        <Collapse in={subtasksOpen}>
            {subtasks.map(st => (
                <Box key={`subtask-${st.id}`} sx={{
                    display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center', minHeight: 32,
                    borderBottom: '1px solid rgba(139,92,246,0.06)', borderLeft: `2px solid rgba(139,92,246,0.2)`,
                    bgcolor: 'rgba(139,92,246,0.025)',
                }}>
                    <Box />{/* drag */}
                    <Box />{/* chevron */}
                    <Box sx={{ px: 1.5, pl: isChild ? 5 : 3, overflow: 'hidden' }}>
                        <Typography noWrap sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{st.name}</Typography>
                    </Box>
                    <Box /><Box /><Box /><Box /><Box /><Box />
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: st.is_auto_only ? 'rgba(79,172,254,0.12)' : 'rgba(255,255,255,0.06)',
                            color: st.is_auto_only ? '#4facfe' : 'rgba(255,255,255,0.5)',
                            fontWeight: 700, fontSize: '0.5625rem', height: 18, px: 0.625, borderRadius: '4px',
                        }}>
                            {st.is_auto_only ? 'Auto' : 'Always'}
                        </Box>
                    </Box>
                    <Box /><Box />
                </Box>
            ))}
        </Collapse>
        </>
    );
}
