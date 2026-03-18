'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, Chip,
    Collapse, IconButton, Tooltip, LinearProgress,
    FormControl, Select, MenuItem, Card, CardContent,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
import InventoryIcon from '@mui/icons-material/Inventory';
import FolderIcon from '@mui/icons-material/Folder';

import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';

import { api } from '@/lib/api';
import {
    TaskAutoGenerationPreview,
    TaskAutoGenerationPreviewTask,
    PHASE_LABELS,
    ProjectPhase,
    TriggerType,
} from '@/lib/types/task-library';
import { ServicePackage } from '@/lib/types/domains/sales';

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

interface TaskAutoGenExecuteCardProps {
    projectId: number;
    brandId: number;
}

export default function TaskAutoGenExecuteCard({ projectId, brandId }: TaskAutoGenExecuteCardProps) {
    // Package selection
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

    // Preview
    const [preview, setPreview] = useState<TaskAutoGenerationPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

    // Execute
    const [executing, setExecuting] = useState(false);
    const [executeResult, setExecuteResult] = useState<{ success: boolean; taskCount: number; hours: number; autoAssigned: number } | null>(null);
    const [executeError, setExecuteError] = useState<string | null>(null);

    // ─── Load packages ──────────────────────────────────
    useEffect(() => {
        if (!brandId) return;
        let cancelled = false;
        setPackagesLoading(true);
        api.servicePackages.getAll(brandId)
            .then((data) => { if (!cancelled) setPackages(data || []); })
            .catch(() => { if (!cancelled) setPackages([]); })
            .finally(() => { if (!cancelled) setPackagesLoading(false); });
        return () => { cancelled = true; };
    }, [brandId]);

    // ─── Load preview when package selected ─────────────
    const loadPreview = useCallback(async () => {
        if (!selectedPackageId || !brandId) return;
        setPreviewLoading(true);
        setPreviewError(null);
        setPreview(null);
        try {
            const data = await api.taskLibrary.previewAutoGeneration(selectedPackageId, brandId);
            setPreview(data);
        } catch (err) {
            setPreviewError(err instanceof Error ? err.message : 'Failed to load task preview');
        } finally {
            setPreviewLoading(false);
        }
    }, [selectedPackageId, brandId]);

    useEffect(() => {
        if (selectedPackageId) {
            loadPreview();
            setExecuteResult(null);
            setExecuteError(null);
        } else {
            setPreview(null);
        }
    }, [selectedPackageId, loadPreview]);

    // ─── Execute auto-generation ────────────────────────
    const handleExecute = async () => {
        if (!selectedPackageId || !projectId || !brandId) return;
        setExecuting(true);
        setExecuteError(null);
        try {
            const result = await api.taskLibrary.executeAutoGeneration({
                projectId,
                packageId: selectedPackageId,
                brandId,
            });
            setExecuteResult({
                success: result.success,
                taskCount: result.summary.total_tasks_created,
                hours: result.summary.total_estimated_hours,
                autoAssigned: result.summary.tasks_auto_assigned ?? 0,
            });
        } catch (err) {
            setExecuteError(err instanceof Error ? err.message : 'Failed to generate tasks');
        } finally {
            setExecuting(false);
        }
    };

    // ─── Toggle phase expansion ─────────────────────────
    const togglePhase = (phase: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phase)) next.delete(phase);
            else next.add(phase);
            return next;
        });
    };

    // ─── Content count items ────────────────────────────
    const contentCountItems = preview ? [
        { label: 'Films', count: preview.contentCounts.films, icon: <MovieIcon sx={{ fontSize: 13 }} />, color: '#648CFF' },
        { label: 'Films w/ Music', count: preview.contentCounts.films_with_music, icon: <MusicNoteIcon sx={{ fontSize: 13 }} />, color: '#ec4899' },
        { label: 'Films w/ Graphics', count: preview.contentCounts.films_with_graphics, icon: <BrushIcon sx={{ fontSize: 13 }} />, color: '#06b6d4' },
        { label: 'Event Days', count: preview.contentCounts.event_days, icon: <CalendarTodayIcon sx={{ fontSize: 13 }} />, color: '#22d3ee' },
        { label: 'Crew', count: preview.contentCounts.crew_members, icon: <PeopleIcon sx={{ fontSize: 13 }} />, color: '#f59e0b' },
        { label: 'Locations', count: preview.contentCounts.locations, icon: <PlaceIcon sx={{ fontSize: 13 }} />, color: '#10b981' },
        { label: 'Activities', count: preview.contentCounts.activities, icon: <EventIcon sx={{ fontSize: 13 }} />, color: '#a78bfa' },
        { label: 'Activity × Crew', count: preview.contentCounts.activity_crew_assignments, icon: <GroupsIcon sx={{ fontSize: 13 }} />, color: '#f472b6' },
        { label: 'Film Scenes', count: preview.contentCounts.film_scenes, icon: <ContentCutIcon sx={{ fontSize: 13 }} />, color: '#fb923c' },
    ] : [];

    const selectedPackage = packages.find(p => p.id === selectedPackageId);

    return (
        <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(52, 58, 68, 0.3)',
            background: 'rgba(16, 18, 22, 0.95)',
            backdropFilter: 'blur(10px)',
        }}>
            <CardContent sx={{ p: 3 }}>
                {/* Card Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)',
                        }}>
                            <AutoAwesomeIcon sx={{ fontSize: 16, color: '#a78bfa' }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>
                                Task Auto-Generation
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                Generate tasks from your task library based on package content
                            </Typography>
                        </Box>
                    </Box>
                    {preview && (
                        <Tooltip title="Refresh preview">
                            <IconButton size="small" onClick={loadPreview} disabled={previewLoading} sx={{ color: '#64748b', '&:hover': { color: '#a78bfa' } }}>
                                <RefreshIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {/* Success result */}
                {executeResult?.success && (
                    <Alert
                        icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                        severity="success"
                        sx={{
                            mb: 2, bgcolor: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            '& .MuiAlert-message': { fontSize: '0.8rem' },
                        }}
                    >
                        Successfully generated {executeResult.taskCount} tasks ({executeResult.hours}h estimated)
                        {executeResult.autoAssigned > 0 && ` · ${executeResult.autoAssigned} auto-assigned to crew`}
                    </Alert>
                )}

                {executeError && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2, bgcolor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            '& .MuiAlert-message': { fontSize: '0.8rem' },
                        }}
                    >
                        {executeError}
                    </Alert>
                )}

                {/* Package Selector */}
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                    Select Package
                </Typography>

                {packagesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={20} sx={{ color: '#a78bfa' }} />
                    </Box>
                ) : packages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <InventoryIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                            No packages found for this brand.
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#475569', mt: 0.5 }}>
                            Create a service package first, then come back to generate tasks.
                        </Typography>
                    </Box>
                ) : (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <Select
                            value={selectedPackageId || ''}
                            onChange={(e) => setSelectedPackageId(e.target.value as number)}
                            displayEmpty
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.04)',
                                color: '#e2e8f0',
                                fontSize: '0.85rem',
                                border: '1px solid rgba(52, 58, 68, 0.35)',
                                borderRadius: 2,
                                '& .MuiSelect-icon': { color: '#64748b' },
                                '&:hover': { borderColor: 'rgba(167, 139, 250, 0.4)' },
                            }}
                        >
                            <MenuItem value="" disabled>
                                <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>Choose a package...</Typography>
                            </MenuItem>
                            {packages.filter(p => p.is_active).map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <Typography sx={{ fontSize: '0.85rem', flex: 1 }}>
                                            {p.name}
                                        </Typography>
                                        {p.base_price > 0 && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                                £{Number(p.base_price).toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Selected package info chip */}
                {selectedPackage && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip
                            icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                            label={selectedPackage.name}
                            size="small"
                            sx={{
                                height: 24, fontSize: '0.7rem', fontWeight: 600,
                                bgcolor: 'rgba(167, 139, 250, 0.08)', color: '#a78bfa',
                                border: '1px solid rgba(167, 139, 250, 0.2)',
                                '& .MuiChip-icon': { color: '#a78bfa' },
                            }}
                        />
                        {selectedPackage.base_price > 0 && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                £{Number(selectedPackage.base_price).toLocaleString()}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Preview Loading */}
                {previewLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: '#a78bfa' }} />
                    </Box>
                )}

                {/* Preview Error */}
                {previewError && (
                    <Alert severity="error" sx={{ mb: 1.5, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                        {previewError}
                    </Alert>
                )}

                {/* Preview Content */}
                {!previewLoading && !previewError && preview && (
                    <>
                        {/* Summary Stats */}
                        <Box sx={{
                            display: 'flex', gap: 1.5, mb: 2,
                            p: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(167, 139, 250, 0.04)',
                            border: '1px solid rgba(167, 139, 250, 0.12)',
                        }}>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa' }}>
                                    {preview.summary.total_generated_tasks}
                                </Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Tasks
                                </Typography>
                            </Box>
                            <Box sx={{ width: '1px', bgcolor: 'rgba(167, 139, 250, 0.15)' }} />
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#22d3ee' }}>
                                    {preview.summary.total_estimated_hours}h
                                </Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Est. Hours
                                </Typography>
                            </Box>
                            <Box sx={{ width: '1px', bgcolor: 'rgba(167, 139, 250, 0.15)' }} />
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                                    {preview.summary.total_library_tasks}
                                </Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Library Tasks
                                </Typography>
                            </Box>
                        </Box>

                        {/* Content Counts (trigger multipliers) */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                            {contentCountItems.map(item => (
                                <Chip
                                    key={item.label}
                                    icon={item.icon}
                                    label={`${item.count} ${item.label}`}
                                    size="small"
                                    sx={{
                                        height: 24, fontSize: '0.68rem', fontWeight: 600,
                                        bgcolor: item.count > 0 ? `${item.color}12` : 'rgba(255,255,255,0.03)',
                                        color: item.count > 0 ? item.color : '#475569',
                                        border: `1px solid ${item.count > 0 ? `${item.color}30` : 'rgba(52, 58, 68, 0.2)'}`,
                                        '& .MuiChip-icon': { color: item.count > 0 ? item.color : '#475569' },
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Phase breakdown — table layout */}
                        <Box sx={{ mb: 2 }}>
                            {/* Sticky column headers */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 120px 140px 50px',
                                    gap: 1,
                                    px: 1, py: 0.75,
                                    mb: 0.5,
                                    borderBottom: '1px solid rgba(100, 116, 139, 0.25)',
                                    position: 'sticky', top: 0, zIndex: 1,
                                    bgcolor: '#0f1117',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Task
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <WorkIcon sx={{ fontSize: 11 }} />Role
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <PersonIcon sx={{ fontSize: 11 }} />Crew Member
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>
                                    Hours
                                </Typography>
                            </Box>

                            {/* Phase groups */}
                            {Object.entries(preview.byPhase).map(([phase, tasks]) => {
                                const phaseLabel = PHASE_LABELS[phase as ProjectPhase] || phase;
                                const phaseColor = PHASE_COLORS[phase] || '#94a3b8';
                                const isExpanded = expandedPhases.has(phase);
                                const phaseHours = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + t.total_hours, 0);
                                const phaseTaskCount = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + t.total_instances, 0);

                                return (
                                    <Box key={phase} sx={{ mb: 0.25 }}>
                                        {/* Phase header row — spans all columns */}
                                        <Box
                                            onClick={() => togglePhase(phase)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1,
                                                p: 1, borderRadius: 1.5, cursor: 'pointer',
                                                bgcolor: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(52, 58, 68, 0.2)',
                                                transition: 'all 0.15s ease',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: `${phaseColor}40` },
                                            }}
                                        >
                                            <Box sx={{ width: 4, height: 20, borderRadius: 1, bgcolor: phaseColor, flexShrink: 0 }} />
                                            <Typography sx={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                                                {phaseLabel}
                                            </Typography>
                                            <Chip
                                                label={`${phaseTaskCount} tasks · ${Math.round(phaseHours * 10) / 10}h`}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.6rem', fontWeight: 600,
                                                    bgcolor: `${phaseColor}12`, color: phaseColor,
                                                    border: `1px solid ${phaseColor}25`,
                                                    '& .MuiChip-label': { px: 0.6 },
                                                }}
                                            />
                                            {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: '#64748b' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#64748b' }} />}
                                        </Box>

                                        {/* Expanded task rows — same grid as header */}
                                        <Collapse in={isExpanded}>
                                            <Box sx={{ mt: 0.25 }}>
                                                {tasks.map((task: TaskAutoGenerationPreviewTask, idx: number) => (
                                                    <Box
                                                        key={`${task.task_library_id}-${idx}`}
                                                        sx={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 120px 140px 50px',
                                                            gap: 1,
                                                            alignItems: 'center',
                                                            py: 0.5, px: 1, ml: 1.5,
                                                            borderLeft: `2px solid ${phaseColor}30`,
                                                            borderBottom: '1px solid rgba(52, 58, 68, 0.1)',
                                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                                        }}
                                                    >
                                                        {/* Task name */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                            {triggerIcon(task.trigger_type as TriggerType)}
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1', minWidth: 0 }} noWrap>
                                                                {task.name}
                                                            </Typography>
                                                            {task.multiplier > 1 && (
                                                                <Chip
                                                                    label={`×${task.multiplier}`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 16, fontSize: '0.55rem', fontWeight: 700,
                                                                        bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                                                                        '& .MuiChip-label': { px: 0.4 },
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                        {/* Role column */}
                                                        <Box sx={{ minWidth: 0 }}>
                                                            {task.role_name ? (
                                                                <Tooltip title={`Role: ${task.role_name}`} arrow placement="top">
                                                                    <Chip
                                                                        icon={<WorkIcon sx={{ fontSize: 10 }} />}
                                                                        label={task.role_name}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 22, fontSize: '0.65rem', fontWeight: 600,
                                                                            bgcolor: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa',
                                                                            border: '1px solid rgba(167, 139, 250, 0.25)',
                                                                            '& .MuiChip-icon': { color: '#a78bfa' },
                                                                            '& .MuiChip-label': { px: 0.5 },
                                                                            maxWidth: '100%',
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            ) : (
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#334155', pl: 0.5 }}>—</Typography>
                                                            )}
                                                        </Box>
                                                        {/* Crew column */}
                                                        <Box sx={{ minWidth: 0 }}>
                                                            {task.assigned_to_name ? (
                                                                <Tooltip title={`Assigned to: ${task.assigned_to_name}`} arrow placement="top">
                                                                    <Chip
                                                                        icon={<PersonIcon sx={{ fontSize: 10 }} />}
                                                                        label={task.assigned_to_name}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 22, fontSize: '0.65rem', fontWeight: 600,
                                                                            bgcolor: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee',
                                                                            border: '1px solid rgba(34, 211, 238, 0.25)',
                                                                            '& .MuiChip-icon': { color: '#22d3ee' },
                                                                            '& .MuiChip-label': { px: 0.5 },
                                                                            maxWidth: '100%',
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            ) : (
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#334155', pl: 0.5 }}>—</Typography>
                                                            )}
                                                        </Box>
                                                        {/* Hours column */}
                                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>
                                                            {task.total_hours > 0 ? `${Math.round(task.total_hours * 10) / 10}h` : '—'}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Empty state */}
                        {preview.summary.total_generated_tasks === 0 && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <AssignmentIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    No tasks in your library yet.
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#475569', mt: 0.5 }}>
                                    Add tasks to your Task Library to see auto-generation previews.
                                </Typography>
                            </Box>
                        )}

                        {/* Generate Button */}
                        {preview.summary.total_generated_tasks > 0 && !executeResult?.success && (
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={executing ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                                onClick={handleExecute}
                                disabled={executing}
                                sx={{
                                    bgcolor: '#a78bfa', borderRadius: 2, fontWeight: 700,
                                    textTransform: 'none', fontSize: '0.85rem', py: 1.2,
                                    '&:hover': { bgcolor: '#8b5cf6' },
                                    '&.Mui-disabled': { bgcolor: 'rgba(167, 139, 250, 0.15)', color: 'rgba(167, 139, 250, 0.4)' },
                                }}
                            >
                                {executing ? 'Generating Tasks...' : `Generate ${preview.summary.total_generated_tasks} Tasks`}
                            </Button>
                        )}

                        {executing && <LinearProgress sx={{ mt: 1, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: '#a78bfa' } }} />}
                    </>
                )}

                {/* No package selected state */}
                {!selectedPackageId && !packagesLoading && packages.length > 0 && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Select a package above to preview task generation.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
