'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    CircularProgress, Alert, IconButton, Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useBrand } from '@/features/platform/brand';
import { taskLibraryApi } from '@/features/catalog/task-library/api';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { formatCurrency } from '@/shared/utils/formatUtils';
import {
    TaskAutoGenerationPreview,
    TaskAutoGenerationPreviewTask,
    PHASE_LABELS,
    ProjectPhase,
} from '@/features/catalog/task-library/types';

// ─── Phase colors ─────────────────────────────────────────────
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

const EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

interface TasksCardProps {
    packageId: number;
    brandId: number;
}

export function TasksCard({ packageId, brandId }: TasksCardProps) {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency || DEFAULT_CURRENCY;
    const [preview, setPreview] = useState<TaskAutoGenerationPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPreview = useCallback(async () => {
        if (!packageId || !brandId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await taskLibraryApi.previewAutoGeneration(packageId, brandId);
            setPreview(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load task preview');
        } finally {
            setLoading(false);
        }
    }, [packageId, brandId]);

    useEffect(() => { loadPreview(); }, [loadPreview]);

    const hCellSx = { py: 1, fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as const;
    const bCellSx = { py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.72rem' } as const;

    // Filter to project phases only
    const phaseEntries = preview
        ? Object.entries(preview.byPhase).filter(([phase]) => !EXCLUDED_PHASES.has(phase))
        : [];
    const allTasks = phaseEntries.flatMap(([, tasks]) => tasks as TaskAutoGenerationPreviewTask[]);
    const totalHours = allTasks.reduce((s, t) => s + t.total_hours, 0);
    const totalCost = allTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);

    return (
        <Box>
            {/* Section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                    Tasks
                </Typography>
                <Tooltip title="Refresh preview">
                    <span>
                        <IconButton size="small" onClick={loadPreview} disabled={loading} sx={{ color: '#64748b', '&:hover': { color: '#a78bfa' } }}>
                            <RefreshIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

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

            {!loading && !error && preview && allTasks.length === 0 && (
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', py: 3, textAlign: 'center' }}>
                    No tasks in your library yet.
                </Typography>
            )}

            {!loading && !error && preview && allTasks.length > 0 && (
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '14%' }} />
                    </colgroup>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                            <TableCell sx={hCellSx}>Task</TableCell>
                            <TableCell sx={hCellSx}>Role</TableCell>
                            <TableCell sx={hCellSx}>Crew</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Phase</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Hours</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'right' }}>Cost</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {phaseEntries.map(([phase, tasks]) => {
                            const phaseTasks = tasks as TaskAutoGenerationPreviewTask[];
                            const phaseLabel = PHASE_LABELS[phase as ProjectPhase] || phase;
                            const phaseColor = PHASE_COLORS[phase] || '#94a3b8';
                            const phaseHours = phaseTasks.reduce((s, t) => s + t.total_hours, 0);
                            const phaseCost = phaseTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);

                            return (
                                <React.Fragment key={phase}>
                                    {/* Phase group header */}
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{ ...bCellSx, borderBottom: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: phaseColor, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                    {phaseLabel}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>
                                                    {phaseTasks.reduce((s, t) => s + t.total_instances, 0)} tasks
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ ...bCellSx, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.6rem', fontVariantNumeric: 'tabular-nums' }}>
                                                {phaseHours > 0 ? `${Math.round(phaseHours * 10) / 10}h` : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ ...bCellSx, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
                                            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums' }}>
                                                {phaseCost > 0 ? formatCurrency(phaseCost, currency) : '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>

                                    {/* Task rows */}
                                    {phaseTasks.map((task, idx) => (
                                        <TableRow key={`${task.task_library_id}-${idx}`} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                            <TableCell sx={bCellSx}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 600, fontSize: '0.73rem', color: '#94a3b8',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {task.name}
                                                    {task.multiplier > 1 && (
                                                        <Typography component="span" sx={{ fontSize: '0.6rem', color: '#64748b', ml: 0.5 }}>
                                                            ×{task.multiplier}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={bCellSx}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 600, fontSize: '0.73rem', color: '#94a3b8',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {task.role_name || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={bCellSx}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 600, fontSize: '0.73rem', color: '#94a3b8',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {task.assigned_to_name || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>
                                                    {phaseLabel}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                                <Typography variant="caption" sx={{
                                                    fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8',
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {task.onsite_band
                                                        ? (task.onsite_band === 'Half Day' ? '½ Day' : task.onsite_band)
                                                        : (task.total_hours > 0 ? `${Math.round(task.total_hours * 10) / 10}h` : '—')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ ...bCellSx, textAlign: 'right' }}>
                                                <Typography variant="caption" sx={{
                                                    color: (task.estimated_cost ?? 0) > 0 ? '#f59e0b' : '#475569',
                                                    fontWeight: 600, fontSize: '0.65rem',
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {(task.estimated_cost ?? 0) > 0 ? formatCurrency(task.estimated_cost!, currency) : '—'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            );
                        })}

                        {/* Total row */}
                        <TableRow>
                            <TableCell colSpan={4} sx={{ ...bCellSx, borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    Total
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ ...bCellSx, textAlign: 'center', borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums' }}>
                                    {totalHours > 0 ? `${Math.round(totalHours * 10) / 10}h` : '—'}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ ...bCellSx, textAlign: 'right', borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                <Typography variant="caption" sx={{
                                    color: totalCost > 0 ? '#f59e0b' : '#475569',
                                    fontWeight: 700, fontSize: '0.75rem',
                                    fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {totalCost > 0 ? formatCurrency(totalCost, currency) : '—'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}
        </Box>
    );
}

export default TasksCard;
