'use client';

/**
 * ScheduleDiffView — shows what changed in an instance schedule since cloning.
 *
 * Compares the current project/inquiry schedule instance against its original
 * source package schedule. Uses the backend diff endpoint which returns
 * categorized changes: added (green), removed (red), modified (amber).
 *
 * Opened as a Dialog from the InstanceScheduleEditor "View Changes" button.
 */

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Chip, Stack, Button, CircularProgress,
    Alert, Divider, Collapse, IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CompareArrows as DiffIcon,
    Close as CloseIcon,
    CalendarToday as DayIcon,
    Schedule as ActivityIcon,
    People as SubjectIcon,
    Person as CrewIcon,
    Place as LocationIcon,
} from '@mui/icons-material';
import api from '@/lib/api';
import type { InstanceOwner } from '../hooks/useInstanceScheduleData';

// ─── Types ────────────────────────────────────────────────────────────

interface DiffItem {
    change: 'added' | 'removed' | 'modified';
    name: string;
    detail?: string;
}

interface DiffCategory {
    items: DiffItem[];
}

interface ScheduleDiffData {
    has_source_package: boolean;
    source_package_id: number | null;
    counts: {
        package: Record<string, number>;
        instance: Record<string, number>;
    };
    diffs: {
        event_days: DiffItem[];
        activities: DiffItem[];
        subjects: DiffItem[];
        operators: DiffItem[];
        location_slots: DiffItem[];
    };
    summary: {
        total_changes: number;
        added: number;
        removed: number;
        modified: number;
    };
}

interface ScheduleDiffViewProps {
    open: boolean;
    onClose: () => void;
    owner: InstanceOwner;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const changeColors: Record<string, string> = {
    added: '#4caf50',
    removed: '#f44336',
    modified: '#ff9800',
};

const changeIcons: Record<string, React.ReactNode> = {
    added: <AddIcon sx={{ fontSize: 14 }} />,
    removed: <RemoveIcon sx={{ fontSize: 14 }} />,
    modified: <EditIcon sx={{ fontSize: 14 }} />,
};

const categoryMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    event_days: { label: 'Event Days', icon: <DayIcon sx={{ fontSize: 16 }} /> },
    activities: { label: 'Activities', icon: <ActivityIcon sx={{ fontSize: 16 }} /> },
    subjects: { label: 'Subjects', icon: <SubjectIcon sx={{ fontSize: 16 }} /> },
    operators: { label: 'Crew / Operators', icon: <CrewIcon sx={{ fontSize: 16 }} /> },
    location_slots: { label: 'Locations', icon: <LocationIcon sx={{ fontSize: 16 }} /> },
};

// ─── Component ────────────────────────────────────────────────────────

export default function ScheduleDiffView({ open, onClose, owner }: ScheduleDiffViewProps) {
    const [data, setData] = useState<ScheduleDiffData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Fetch diff when opened
    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        const fetchDiff = owner.type === 'project'
            ? api.schedule.scheduleDiff.project(owner.id)
            : api.schedule.scheduleDiff.inquiry(owner.id);

        fetchDiff
            .then((res: ScheduleDiffData) => {
                if (!cancelled) {
                    setData(res);
                    // Auto-expand categories that have changes
                    const expanded: Record<string, boolean> = {};
                    if (res.diffs) {
                        for (const [key, items] of Object.entries(res.diffs)) {
                            expanded[key] = (items as DiffItem[]).length > 0;
                        }
                    }
                    setExpandedCategories(expanded);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || 'Failed to load diff');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [open, owner]);

    const toggleCategory = (key: string) => {
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // ─── Render ───────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { bgcolor: '#1a1a2e', color: '#eee', maxHeight: '80vh' },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                <DiffIcon sx={{ color: '#64b5f6' }} />
                <Typography variant="h6" component="span">Schedule Changes</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton size="small" onClick={onClose} sx={{ color: '#888' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: '#333', p: 0 }}>
                {/* Loading */}
                {loading && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Comparing schedules…
                        </Typography>
                    </Box>
                )}

                {/* Error */}
                {error && (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                )}

                {/* No source package */}
                {data && !data.has_source_package && (
                    <Alert severity="info" sx={{ m: 2 }}>
                        This schedule was not cloned from a package — no diff available.
                    </Alert>
                )}

                {/* No changes */}
                {data && data.has_source_package && data.summary.total_changes === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            No changes detected
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            The schedule matches the original package template.
                        </Typography>
                    </Box>
                )}

                {/* Has changes */}
                {data && data.has_source_package && data.summary.total_changes > 0 && (
                    <>
                        {/* Summary bar */}
                        <Box sx={{
                            px: 2,
                            py: 1.5,
                            bgcolor: 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            borderBottom: '1px solid #333',
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                {data.summary.total_changes} change{data.summary.total_changes !== 1 ? 's' : ''}:
                            </Typography>
                            {data.summary.added > 0 && (
                                <Chip
                                    icon={<AddIcon sx={{ fontSize: 14 }} />}
                                    label={`${data.summary.added} added`}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(76,175,80,0.15)',
                                        color: '#4caf50',
                                        borderRadius: 1,
                                        fontSize: '0.7rem',
                                    }}
                                />
                            )}
                            {data.summary.removed > 0 && (
                                <Chip
                                    icon={<RemoveIcon sx={{ fontSize: 14 }} />}
                                    label={`${data.summary.removed} removed`}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(244,67,54,0.15)',
                                        color: '#f44336',
                                        borderRadius: 1,
                                        fontSize: '0.7rem',
                                    }}
                                />
                            )}
                            {data.summary.modified > 0 && (
                                <Chip
                                    icon={<EditIcon sx={{ fontSize: 14 }} />}
                                    label={`${data.summary.modified} modified`}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255,152,0,0.15)',
                                        color: '#ff9800',
                                        borderRadius: 1,
                                        fontSize: '0.7rem',
                                    }}
                                />
                            )}
                        </Box>

                        {/* Category breakdowns */}
                        <Box>
                            {Object.entries(data.diffs).map(([key, items]) => {
                                const meta = categoryMeta[key];
                                if (!meta || (items as DiffItem[]).length === 0) return null;
                                const diffItems = items as DiffItem[];
                                const isExpanded = expandedCategories[key] ?? false;

                                return (
                                    <Box key={key}>
                                        <Box
                                            onClick={() => toggleCategory(key)}
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                                                borderBottom: '1px solid #2a2a2a',
                                            }}
                                        >
                                            {meta.icon}
                                            <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>
                                                {meta.label}
                                            </Typography>
                                            <Chip
                                                label={diffItems.length}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    bgcolor: 'rgba(255,255,255,0.08)',
                                                }}
                                            />
                                            {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: '#888' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#888' }} />}
                                        </Box>

                                        <Collapse in={isExpanded}>
                                            <Stack spacing={0} sx={{ px: 2, pb: 1 }}>
                                                {diffItems.map((item, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 1,
                                                            py: 0.75,
                                                            pl: 1,
                                                            borderLeft: `2px solid ${changeColors[item.change]}`,
                                                            ml: 1,
                                                        }}
                                                    >
                                                        <Box sx={{ color: changeColors[item.change], mt: 0.25 }}>
                                                            {changeIcons[item.change]}
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                                {item.name}
                                                            </Typography>
                                                            {item.detail && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                                    {item.detail}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Count comparison */}
                        <Divider sx={{ borderColor: '#333' }} />
                        <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                ENTITY COUNTS
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" />
                                <Typography variant="caption" color="text.secondary" textAlign="center">Package</Typography>
                                <Typography variant="caption" color="text.secondary" textAlign="center">Current</Typography>
                                {Object.entries(categoryMeta).map(([key, meta]) => (
                                    <React.Fragment key={key}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {meta.icon}
                                            <Typography variant="caption">{meta.label}</Typography>
                                        </Box>
                                        <Typography variant="caption" textAlign="center" color="text.secondary">
                                            {data.counts.package[key] ?? 0}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            textAlign="center"
                                            sx={{
                                                color: (data.counts.instance[key] ?? 0) !== (data.counts.package[key] ?? 0)
                                                    ? '#ff9800'
                                                    : 'text.secondary',
                                                fontWeight: (data.counts.instance[key] ?? 0) !== (data.counts.package[key] ?? 0)
                                                    ? 600
                                                    : 400,
                                            }}
                                        >
                                            {data.counts.instance[key] ?? 0}
                                        </Typography>
                                    </React.Fragment>
                                ))}
                            </Box>
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ borderTop: '1px solid #333', bgcolor: '#1a1a2e' }}>
                <Button onClick={onClose} sx={{ color: '#aaa' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
