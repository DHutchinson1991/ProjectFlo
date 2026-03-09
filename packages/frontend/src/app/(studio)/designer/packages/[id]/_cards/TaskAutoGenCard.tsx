'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Chip,
    Collapse, IconButton, Tooltip, Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MovieIcon from '@mui/icons-material/Movie';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import PlaceIcon from '@mui/icons-material/Place';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import BrushIcon from '@mui/icons-material/Brush';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import FolderIcon from '@mui/icons-material/Folder';

import { useBrand } from '@/app/providers/BrandProvider';
import { api } from '@/lib/api';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/formatUtils';
import {
    TaskAutoGenerationPreview,
    TaskAutoGenerationPreviewTask,
    PHASE_LABELS,
    ProjectPhase,
    TriggerType,
} from '@/lib/types/task-library';

// ─── Trigger type icon helper ──────────────────────────────────────
function triggerIcon(type: TriggerType) {
    switch (type) {
        case TriggerType.PER_PROJECT: return <FolderIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM: return <MovieIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM_WITH_MUSIC: return <MusicNoteIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM_WITH_GRAPHICS: return <BrushIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_EVENT_DAY: return <CalendarTodayIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_CREW_MEMBER: return <PeopleIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_LOCATION: return <PlaceIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_ACTIVITY: return <EventIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_ACTIVITY_CREW: return <GroupsIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM_SCENE: return <ContentCutIcon sx={{ fontSize: 12 }} />;
        default: return <AssignmentIcon sx={{ fontSize: 12 }} />;
    }
}

// ─── Phase color helper ──────────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
    Lead: '#94a3b8',
    Inquiry: '#a78bfa',
    Booking: '#22d3ee',
    Creative_Development: '#f59e0b',
    Pre_Production: '#fb923c',
    Production: '#ef4444',
    Post_Production: '#8b5cf6',
    Delivery: '#10b981',
};

interface TaskAutoGenCardProps {
    packageId: number;
    brandId: number;
    cardSx?: Record<string, unknown>;
}

export function TaskAutoGenCard({ packageId, brandId, cardSx = {} }: TaskAutoGenCardProps) {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency || 'USD';
    const [preview, setPreview] = useState<TaskAutoGenerationPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

    // ─── Load preview data ───────────────────────────────
    const loadPreview = useCallback(async () => {
        if (!packageId || !brandId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.taskLibrary.previewAutoGeneration(packageId, brandId);
            setPreview(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load task preview');
        } finally {
            setLoading(false);
        }
    }, [packageId, brandId]);

    useEffect(() => {
        loadPreview();
    }, [loadPreview]);

    // ─── Toggle phase expansion ─────────────────────────
    const togglePhase = (phase: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phase)) next.delete(phase);
            else next.add(phase);
            return next;
        });
    };



    // ─── Render ─────────────────────────────────────────
    return (
            <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                {/* Card Header */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 28, height: 28, borderRadius: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)',
                            }}>
                                <AutoAwesomeIcon sx={{ fontSize: 14, color: '#a78bfa' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Task Auto-Generation
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Refresh preview">
                                <span>
                                    <IconButton size="small" onClick={loadPreview} disabled={loading} sx={{ color: '#64748b', '&:hover': { color: '#a78bfa' } }}>
                                        <RefreshIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            {preview && preview.summary.total_generated_tasks > 0 && (
                                <Chip
                                    label={`${preview.summary.total_generated_tasks} tasks`}
                                    size="small"
                                    sx={{
                                        height: 18, fontSize: '0.55rem', fontWeight: 700,
                                        bgcolor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa',
                                        border: '1px solid rgba(167, 139, 250, 0.2)',
                                        '& .MuiChip-label': { px: 0.6 },
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Content */}
                <Box sx={{ px: 2.5, py: 2 }}>
                    {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={24} sx={{ color: '#a78bfa' }} />
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 1.5, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && preview && (
                        <>
                            {/* Summary Stats */}
                            <Box sx={{
                                display: 'flex', gap: 1.5, mb: 2,
                                p: 1.5, borderRadius: 2,
                                bgcolor: 'rgba(167, 139, 250, 0.04)',
                                border: '1px solid rgba(167, 139, 250, 0.12)',
                            }}>
                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>
                                        {preview.summary.total_generated_tasks}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Tasks
                                    </Typography>
                                </Box>
                                <Box sx={{ width: '1px', bgcolor: 'rgba(167, 139, 250, 0.15)' }} />
                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#22d3ee' }}>
                                        {preview.summary.total_estimated_hours}h
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Est. Hours
                                    </Typography>
                                </Box>
                                <Box sx={{ width: '1px', bgcolor: 'rgba(167, 139, 250, 0.15)' }} />
                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
                                        {preview.summary.total_estimated_cost > 0 ? formatCurrency(preview.summary.total_estimated_cost, currency) : '—'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Est. Cost
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Phase breakdown — table layout with Role, Crew, Hours & Cost columns */}
                            <Box>
                                {/* Persistent column headers */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                        gap: 0.5,
                                        px: 1.5, py: 0.75,
                                        mb: 0.5,
                                        borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Task
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                                        Count
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                        <WorkIcon sx={{ fontSize: 10 }} />Role
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                        <PersonIcon sx={{ fontSize: 10 }} />Crew
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3 }}>
                                        {getCurrencySymbol(currency)} Cost
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>
                                        Hours
                                    </Typography>
                                    {/* Empty header for chevron column */}
                                    <Box />
                                </Box>

                                {/* Phase groups */}
                                <Stack spacing={0.5}>
                                    {Object.entries(preview.byPhase).map(([phase, tasks]) => {
                                        const phaseLabel = PHASE_LABELS[phase as ProjectPhase] || phase;
                                        const phaseColor = PHASE_COLORS[phase] || '#94a3b8';
                                        const isExpanded = expandedPhases.has(phase);
                                        const phaseHours = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + t.total_hours, 0);
                                        const phaseTaskCount = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + t.total_instances, 0);
                                        const phaseCost = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + (t.estimated_cost ?? 0), 0);
                                        const uniqueRoles = new Set(tasks.map((t: TaskAutoGenerationPreviewTask) => t.role_name).filter(Boolean)).size;
                                        const uniqueCrew = new Set(tasks.map((t: TaskAutoGenerationPreviewTask) => t.assigned_to_name).filter(Boolean)).size;

                                        return (
                                            <Box key={phase}>
                                                {/* Phase header — grid-aligned with column headers */}
                                                <Box
                                                    onClick={() => togglePhase(phase)}
                                                    sx={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                                        gap: 0.5,
                                                        alignItems: 'center',
                                                        p: 1, borderRadius: 1.5, cursor: 'pointer',
                                                        bgcolor: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid rgba(52, 58, 68, 0.2)',
                                                        transition: 'all 0.15s ease',
                                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: `${phaseColor}40` },
                                                    }}
                                                >
                                                    {/* Col 1: Phase name */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                        <Box sx={{ width: 4, height: 20, borderRadius: 1, bgcolor: phaseColor, flexShrink: 0 }} />
                                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', minWidth: 0 }} noWrap>
                                                            {phaseLabel}
                                                        </Typography>
                                                    </Box>
                                                    {/* Col 2: Task count */}
                                                    <Chip
                                                        label={`${phaseTaskCount}`}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: '0.55rem', fontWeight: 700,
                                                            bgcolor: `${phaseColor}12`, color: phaseColor,
                                                            border: `1px solid ${phaseColor}25`,
                                                            '& .MuiChip-label': { px: 0.6 },
                                                            justifySelf: 'center',
                                                        }}
                                                    />
                                                    {/* Col 3: Role count */}
                                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                        {uniqueRoles > 0 ? (
                                                            <><WorkIcon sx={{ fontSize: 10 }} />{uniqueRoles} role{uniqueRoles !== 1 ? 's' : ''}</>
                                                        ) : (
                                                            <Typography component="span" sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>
                                                        )}
                                                    </Typography>
                                                    {/* Col 4: Crew count */}
                                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                        {uniqueCrew > 0 ? (
                                                            <><PersonIcon sx={{ fontSize: 10 }} />{uniqueCrew} crew</>
                                                        ) : (
                                                            <Typography component="span" sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>
                                                        )}
                                                    </Typography>
                                                    {/* Col 5: Phase cost */}
                                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                        {phaseCost > 0 ? formatCurrency(phaseCost, currency) : `${getCurrencySymbol(currency)}—`}
                                                    </Typography>
                                                    {/* Col 6: Phase hours */}
                                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                        {phaseHours > 0 ? `${Math.round(phaseHours * 10) / 10}h` : '0h'}
                                                    </Typography>
                                                    {/* Col 7: Expand chevron */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16, color: '#64748b' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#64748b' }} />}
                                                    </Box>
                                                </Box>

                                                {/* Expanded task rows — aligned to column headers */}
                                                <Collapse in={isExpanded}>
                                                    <Box sx={{ mt: 0.25 }}>
                                                        {tasks.map((task: TaskAutoGenerationPreviewTask, idx: number) => (
                                                            <Box
                                                                key={`${task.task_library_id}-${idx}`}
                                                                sx={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                                                    gap: 0.5,
                                                                    alignItems: 'center',
                                                                    py: 0.5, px: 1.5,
                                                                    borderLeft: `2px solid ${phaseColor}30`,
                                                                    borderBottom: '1px solid rgba(52, 58, 68, 0.08)',
                                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                                                }}
                                                            >
                                                                {/* Col 1: Task name */}
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                                    {triggerIcon(task.trigger_type as TriggerType)}
                                                                    <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1', minWidth: 0 }} noWrap>
                                                                        {task.name}
                                                                    </Typography>
                                                                </Box>
                                                                {/* Col 2: Multiplier / instance count */}
                                                                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {task.multiplier > 1 ? `×${task.multiplier}` : ''}
                                                                </Typography>
                                                                {/* Col 3: Role */}
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    {task.role_name ? (
                                                                        <Tooltip title={`Role: ${task.role_name}`} arrow placement="top">
                                                                            <Chip
                                                                                icon={<WorkIcon sx={{ fontSize: 10 }} />}
                                                                                label={task.role_name}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 20, fontSize: '0.6rem', fontWeight: 600,
                                                                                    bgcolor: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa',
                                                                                    border: '1px solid rgba(167, 139, 250, 0.25)',
                                                                                    '& .MuiChip-icon': { color: '#a78bfa' },
                                                                                    '& .MuiChip-label': { px: 0.5 },
                                                                                    maxWidth: '100%',
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Typography sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>
                                                                    )}
                                                                </Box>
                                                                {/* Col 4: Crew */}
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    {task.assigned_to_name ? (
                                                                        <Tooltip title={`Assigned to: ${task.assigned_to_name}`} arrow placement="top">
                                                                            <Chip
                                                                                icon={<PersonIcon sx={{ fontSize: 10 }} />}
                                                                                label={task.assigned_to_name}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 20, fontSize: '0.6rem', fontWeight: 600,
                                                                                    bgcolor: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee',
                                                                                    border: '1px solid rgba(34, 211, 238, 0.25)',
                                                                                    '& .MuiChip-icon': { color: '#22d3ee' },
                                                                                    '& .MuiChip-label': { px: 0.5 },
                                                                                    maxWidth: '100%',
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Typography sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>
                                                                    )}
                                                                </Box>
                                                                {/* Col 5: Cost */}
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {task.estimated_cost != null && task.estimated_cost > 0 ? formatCurrency(task.estimated_cost, currency) : '—'}
                                                                </Typography>
                                                                {/* Col 6: Hours */}
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {task.total_hours > 0 ? `${Math.round(task.total_hours * 10) / 10}h` : '—'}
                                                                </Typography>
                                                                {/* Col 7: Empty (chevron only in phase header) */}
                                                                <Box />
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Collapse>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>

                            {/* Empty state */}
                            {preview.summary.total_generated_tasks === 0 && (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <AssignmentIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        No tasks in your library yet.
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 0.5 }}>
                                        Add tasks to your Task Library to see auto-generation previews.
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    {/* No preview / initial loading */}
                    {!loading && !error && !preview && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Loading task auto-generation preview...
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
    );
}

export default TaskAutoGenCard;
