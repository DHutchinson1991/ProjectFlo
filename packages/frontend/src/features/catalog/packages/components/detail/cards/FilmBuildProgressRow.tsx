'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, TableRow, TableCell } from '@mui/material';
import { useFilmPrepProgress } from '@/features/content/films/hooks/useFilmPrepProgress';

const LONG_RUNNING_AI_STEPS = new Set(['casting', 'actions', 'coverage', 'director']);

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
}

function getStepLabel(step: string): string {
    switch (step) {
        case 'scene-prep':
            return 'Scene prep';
        case 'casting':
            return 'Casting';
        case 'actions':
            return 'Actions';
        case 'coverage':
            return 'Coverage';
        case 'spatial':
            return 'Spatial';
        case 'director':
            return 'Director';
        case 'persist':
            return 'Save';
        default:
            return step;
    }
}

function summarizeStage(entry: {
    step: string;
    status: 'started' | 'completed' | 'failed';
    durationMs?: number;
}) {
    const base = getStepLabel(entry.step);
    if (entry.status === 'failed') {
        return entry.durationMs != null
            ? `${base} failed after ${formatDuration(entry.durationMs)}`
            : `${base} failed`;
    }

    if (entry.durationMs != null) {
        return `${base} ${formatDuration(entry.durationMs)}`;
    }

    return `${base} running`;
}

// ─── Props ──────────────────────────────────────────────────────────

interface FilmBuildProgressRowProps {
    filmId: number;
    /** Parent says a build/plan is in flight — we connect SSE only while true. */
    enabled: boolean;
    /** Fallback label used before any AI-prep event arrives. */
    fallbackLabel: string;
    /**
     * Optional determinate progress fraction (0–1) from a non-AI source
     * (e.g. the planning progress bar). Used only if AI-prep hasn't reported
     * scene totals yet.
     */
    fallbackProgress?: number | null;
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * Per-film SSE progress row.
 *
 * Subscribes to `/api/content/shot-previews/prep-events/:filmId` and surfaces
 * the current Gemma AI-prep stage (Casting → Actions → Coverage → Spatial →
 * Director → Persist) as a live label + scene-level progress bar.
 *
 * When no prep event has arrived yet, falls back to the provided planning label.
 */
export function FilmBuildProgressRow({
    filmId,
    enabled,
    fallbackLabel,
    fallbackProgress,
}: FilmBuildProgressRowProps) {
    const [streamEnabled, setStreamEnabled] = useState(enabled);
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        if (enabled) setStreamEnabled(true);
    }, [enabled]);

    const prep = useFilmPrepProgress(filmId, streamEnabled);

    useEffect(() => {
        if (prep.status === 'complete' || prep.status === 'failed') {
            setStreamEnabled(false);
        }
    }, [prep.status]);

    useEffect(() => {
        const visible = streamEnabled || prep.status === 'connecting' || prep.status === 'preparing' || prep.status === 'failed';
        if (!visible) return;

        setNowMs(Date.now());
        const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, [prep.status, streamEnabled]);

    // Stay visible while the parent is actively building/planning OR while the
    // SSE stream still reports an in-flight AI pipeline.
    const visible = streamEnabled || prep.status === 'connecting' || prep.status === 'preparing' || prep.status === 'failed';
    if (!visible) return null;

    const hasPrepData = prep.totalScenes > 0;
    const label = prep.currentLabel || fallbackLabel;
    const isDeterminate = hasPrepData || (fallbackProgress != null);
    const value = hasPrepData
        ? prep.progress * 100
        : fallbackProgress != null
            ? fallbackProgress * 100
            : undefined;
    const activeStage = [...prep.stageHistory].reverse().find((entry) => entry.completedAtMs == null) ?? null;
    const activeElapsedMs = activeStage ? Math.max(0, nowMs - activeStage.startedAtMs) : null;
    const lastEventAgeMs = prep.lastEventAtMs != null ? Math.max(0, nowMs - prep.lastEventAtMs) : null;
    const recentFinishedStages = prep.stageHistory.filter((entry) => entry.completedAtMs != null).slice(-2);
    const isLongRunningStage = activeStage != null && activeElapsedMs != null && activeElapsedMs >= 15000 && LONG_RUNNING_AI_STEPS.has(activeStage.step);
    const secondaryLabel = prep.error
        ? prep.error
        : isLongRunningStage && activeElapsedMs != null
            ? `Still working in the local AI model. ${getStepLabel(activeStage.step)} has been running for ${formatDuration(activeElapsedMs)}.`
            : recentFinishedStages.length > 0
                ? recentFinishedStages.map((entry) => summarizeStage(entry)).join(' • ')
                : prep.status === 'connecting'
                    ? 'Connecting to live prep events...'
                    : activeStage && lastEventAgeMs != null
                        ? `Last update ${formatDuration(lastEventAgeMs)} ago.`
                        : null;
    const isFailed = prep.status === 'failed';

    return (
        <TableRow>
            <TableCell colSpan={6} sx={{ p: 0, border: 'none' }}>
                <Box sx={{ mx: 1.5, my: 0.5, borderRadius: 1, overflow: 'hidden', bgcolor: isFailed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(100, 140, 255, 0.04)' }}>
                    <LinearProgress
                        variant={isDeterminate ? 'determinate' : 'indeterminate'}
                        value={value}
                        sx={{
                            height: 3,
                            bgcolor: isFailed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 140, 255, 0.08)',
                            '& .MuiLinearProgress-bar': {
                                background: isFailed
                                    ? 'linear-gradient(90deg, rgba(239,68,68,0.55), rgba(248,113,113,0.95))'
                                    : 'linear-gradient(90deg, rgba(100,140,255,0.5), #648CFF)',
                                transition: 'transform 0.4s ease',
                            },
                        }}
                    />
                    <Box sx={{ px: 1, py: 0.35, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    border: isFailed ? '1.5px solid rgba(248,113,113,0.9)' : '1.5px solid rgba(100,140,255,0.6)',
                                    borderTopColor: isFailed ? 'rgba(248,113,113,0.9)' : 'transparent',
                                    bgcolor: isFailed ? 'rgba(248,113,113,0.9)' : 'transparent',
                                    animation: isFailed ? 'none' : 'filmBuildSpin 0.8s linear infinite',
                                    '@keyframes filmBuildSpin': { to: { transform: 'rotate(360deg)' } },
                                }}
                            />
                            <Typography sx={{ fontSize: '0.58rem', color: isFailed ? '#fecaca' : '#94a3b8', fontWeight: 500, letterSpacing: '0.2px', minWidth: 0, flex: 1 }}>
                                {label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                                {activeElapsedMs != null && !isFailed && (
                                    <Typography sx={{ fontSize: '0.55rem', color: isLongRunningStage ? '#cbd5e1' : '#64748b', fontFamily: 'monospace' }}>
                                        {formatDuration(activeElapsedMs)}
                                    </Typography>
                                )}
                                {hasPrepData && (
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontFamily: 'monospace' }}>
                                        {prep.completedScenes}/{prep.totalScenes}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        {secondaryLabel && (
                            <Typography sx={{ fontSize: '0.53rem', color: isFailed ? '#fca5a5' : '#64748b', pl: 1.4, lineHeight: 1.3 }}>
                                {secondaryLabel}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </TableCell>
        </TableRow>
    );
}
