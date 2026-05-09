'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { buildAuthHeaders, getApiBaseUrl } from '@/shared/api/client';
import { StatusChip } from '@/shared/ui';
import { usePackageAiRun, usePackageAiRuns } from '../../hooks';
import type {
    BlockingPlanningSubstep,
    PlanningEventRecord,
    PlanningStep,
    UsePlanningProgressReturn,
} from '../../hooks/usePlanningProgress';
import type {
    PackageAiPlannerSummaryStep,
    PackageAiRunStatus,
} from '../../types';
import { PackageAiLiveChatFeed } from './PackageAiLiveChatFeed';
import { PackageAiRunArtifactsView } from './PackageAiRunArtifactsView';

interface PackageAiRunsPanelProps {
    packageId: number | null;
    packageName?: string | null;
    planning: UsePlanningProgressReturn;
}

type StepRow = PackageAiPlannerSummaryStep;
type HistoryLogTab = 'realtime' | 'master-log' | 'artifacts';

interface BlockingMomentRow {
    key: string;
    activityName?: string;
    momentId?: number;
    momentName: string;
    spaceName?: string;
    status: 'active' | 'completed' | 'failed';
    currentSubstep?: BlockingPlanningSubstep;
    notices: string[];
    llmDurationMs?: number;
    queueWaitMs?: number;
    traceLogPath?: string;
    error?: string;
    startedAtMs: number;
    lastUpdatedAtMs: number;
}

interface BlockingSummaryCardData {
    completedMoments: number;
    failedMoments: number;
    totalMoments: number;
    averageAiTimeMs?: number;
    correctedCameraAssignments: number;
    warningCount: number;
    traceLogPath?: string;
}

interface BlockingViewModel {
    activeEvent: PlanningEventRecord | null;
    moments: BlockingMomentRow[];
    summary: BlockingSummaryCardData | null;
    isBlockingActive: boolean;
}

const DRAWER_WIDTH = { xs: 'calc(100vw - 24px)', sm: 540 };
const BLOCKING_SUBSTEPS: BlockingPlanningSubstep[] = [
    'pre-seed',
    'llm-request-started',
    'llm-response-received',
    'parse-complete',
    'guardrails-applied',
    'persisted',
];

export function PackageAiRunsPanel({ packageId, packageName, planning }: PackageAiRunsPanelProps) {
    const isPlanningActive = planning.status === 'connecting' || planning.status === 'planning';
    const [historyOpen, setHistoryOpen] = useState(false);
    const [blockingExpanded, setBlockingExpanded] = useState(true);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [traceLogOpen, setTraceLogOpen] = useState(false);
    const [traceLogPath, setTraceLogPath] = useState<string | null>(null);
    const [traceLogContent, setTraceLogContent] = useState('');
    const [traceLogError, setTraceLogError] = useState<string | null>(null);
    const [traceLogLoading, setTraceLogLoading] = useState(false);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [selectedLogTab, setSelectedLogTab] = useState<HistoryLogTab>('realtime');
    const livePollMs = isPlanningActive ? 2_000 : 5_000;

    const runsQuery = usePackageAiRuns(packageId, {
        enabled: Boolean(packageId),
        live: isPlanningActive || historyOpen,
        pollMs: livePollMs,
    });
    const runs = runsQuery.data ?? [];
    const latestRun = runs[0] ?? null;

    useEffect(() => {
        if (!latestRun) {
            return;
        }
        setSelectedRunId((current) => current ?? latestRun.runId);
    }, [latestRun]);

    useEffect(() => {
        if (isPlanningActive && latestRun) {
            setSelectedRunId(latestRun.runId);
        }
    }, [isPlanningActive, latestRun]);

    const selectedRunQuery = usePackageAiRun(packageId, selectedRunId, {
        enabled: Boolean(packageId && selectedRunId && (historyOpen || isPlanningActive)),
        live: Boolean(selectedRunId && selectedRunId === latestRun?.runId && (historyOpen || isPlanningActive)),
        pollMs: livePollMs,
    });
    const selectedRun = selectedRunQuery.data ?? null;

    const progressPercent = getPlanningPercent(planning);
    const drawerSteps = useMemo(() => getDrawerSteps(planning.steps), [planning.steps]);
    const blockingView = useMemo(() => buildBlockingView(planning.eventHistory), [planning.eventHistory]);
    const showLiveSummaryWidget = isPlanningActive;
    const historySteps = useMemo(
        () => getHistorySteps(selectedRun?.plannerSummary?.steps, planning.steps, selectedRunId, latestRun?.runId, isPlanningActive),
        [selectedRun?.plannerSummary?.steps, planning.steps, selectedRunId, latestRun?.runId, isPlanningActive],
    );
    const transcriptSteps = selectedRun?.transcriptSteps ?? [];
    const hasArtifactsTab = Boolean(
        transcriptSteps.length > 0
        || selectedRun?.request != null
        || selectedRun?.builderSummary != null
        || selectedRun?.plannerSummary != null,
    );
    const completedHistorySteps = useMemo(
        () => historySteps.filter((step) => step.status === 'completed'),
        [historySteps],
    );
    const remainingHistorySteps = useMemo(
        () => historySteps.filter((step) => step.status !== 'completed'),
        [historySteps],
    );
    const isSelectedRunLive = Boolean(selectedRunId && selectedRunId === latestRun?.runId && isPlanningActive);
    const liveWidgetHeadline = getPlanningHeadline(planning, blockingView, nowMs);
    const liveWidgetMeta = getPlanningMeta(planning, blockingView) || getWidgetTaskSummary(drawerSteps);
    const realtimeProgressPercent = isSelectedRunLive
        ? progressPercent
        : getRecordedProgressPercent(selectedRun?.completedSteps, selectedRun?.totalSteps, selectedRun?.status);
    const realtimeHeadline = isSelectedRunLive
        ? liveWidgetHeadline
        : getRecordedRunHeadline(selectedRun?.status, selectedRun?.error);
    const realtimeMeta = isSelectedRunLive
        ? liveWidgetMeta
        : getRecordedRunMeta(selectedRun?.completedSteps, selectedRun?.totalSteps, historySteps.length);

    useEffect(() => {
        if (!blockingView.isBlockingActive) {
            return;
        }
        setBlockingExpanded(true);
    }, [blockingView.isBlockingActive]);

    useEffect(() => {
        if (blockingView.activeEvent?.data?.substep !== 'llm-request-started') {
            return;
        }
        setNowMs(Date.now());
        const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, [blockingView.activeEvent?.emittedAt, blockingView.activeEvent?.data?.substep]);

    useEffect(() => {
        if (selectedLogTab === 'artifacts' && !hasArtifactsTab) {
            setSelectedLogTab('realtime');
        }
    }, [hasArtifactsTab, selectedLogTab]);

    if (!packageId) {
        return null;
    }

    const openHistoryModal = () => {
        if (latestRun) {
            setSelectedRunId(latestRun.runId);
        }
        setSelectedLogTab('realtime');
        setHistoryOpen(true);
    };

    const openTraceLog = async (path: string | undefined) => {
        if (!packageId || !path) {
            return;
        }

        setTraceLogOpen(true);
        setTraceLogPath(path);
        setTraceLogContent('');
        setTraceLogError(null);
        setTraceLogLoading(true);

        try {
            const response = await fetch(
                `${getApiBaseUrl()}/api/packages/${packageId}/planning-log?path=${encodeURIComponent(path)}`,
                {
                    headers: buildAuthHeaders(false),
                },
            );

            if (!response.ok) {
                throw new Error(`Trace log request failed (${response.status})`);
            }

            const content = await response.text();
            setTraceLogContent(content);
        } catch (error) {
            setTraceLogError(error instanceof Error ? error.message : 'Failed to load trace log');
        } finally {
            setTraceLogLoading(false);
        }
    };

    const latestRunStatus: PackageAiRunStatus = latestRun?.status ?? (planning.status === 'failed' ? 'failed' : 'completed');
    const historyCountLabel = runs.length === 1 ? '1 run' : `${runs.length} runs`;

    return (
        <>
            <Box
                sx={{
                    position: 'fixed',
                    left: '50%',
                    bottom: { xs: 16, sm: 18 },
                    transform: 'translateX(-50%)',
                    zIndex: 1295,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                {showLiveSummaryWidget ? (
                    <Paper
                        elevation={0}
                        onClick={openHistoryModal}
                        sx={{
                            width: DRAWER_WIDTH,
                            pointerEvents: 'auto',
                            borderRadius: 3,
                            border: `1px solid ${alpha('#f59e0b', 0.24)}`,
                            bgcolor: 'rgba(13, 18, 28, 0.96)',
                            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.46)',
                            overflow: 'hidden',
                            backdropFilter: 'blur(18px)',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: alpha('#f59e0b', 0.38),
                                transform: 'translateY(-1px)',
                            },
                            transition: 'transform 0.16s ease, border-color 0.16s ease',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1.35,
                                background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(34,197,94,0.08) 55%, rgba(15,23,42,0.95))',
                            }}
                        >
                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                <Box
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 2,
                                        display: 'grid',
                                        placeItems: 'center',
                                        bgcolor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <AutoAwesomeRoundedIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                            <Typography sx={{ color: '#f8fafc', fontSize: '0.92rem', fontWeight: 700 }}>
                                                Package creator AI is running
                                            </Typography>
                                            <StatusChip
                                                status="In Progress"
                                                label="Live"
                                                statusColor="#fbbf24"
                                            />
                                        </Stack>
                                        <Typography sx={{ color: '#f8fafc', fontSize: '0.92rem', fontWeight: 700 }}>
                                            {progressPercent}%
                                        </Typography>
                                    </Stack>
                                    <Typography sx={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, mt: 0.35 }}>
                                        {liveWidgetHeadline}
                                    </Typography>
                                    {liveWidgetMeta && (
                                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.7rem', mt: 0.35 }}>
                                            {liveWidgetMeta}
                                        </Typography>
                                    )}
                                    <LinearProgress
                                        variant={planning.status === 'connecting' ? 'indeterminate' : 'determinate'}
                                        value={planning.status === 'connecting' ? undefined : progressPercent}
                                        sx={{
                                            mt: 1.05,
                                            height: 8,
                                            borderRadius: 999,
                                            bgcolor: 'rgba(255,255,255,0.08)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 999,
                                                background: 'linear-gradient(90deg, #f59e0b 0%, #22c55e 100%)',
                                            },
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>
                ) : (
                    <Tooltip title={isPlanningActive ? 'Open live AI view' : 'Open package AI run history'}>
                        <Button
                            onClick={() => {
                                openHistoryModal();
                            }}
                            variant="contained"
                            startIcon={<AutoAwesomeRoundedIcon />}
                            sx={{
                                pointerEvents: 'auto',
                                minWidth: 0,
                                px: 1.75,
                                py: 1,
                                borderRadius: 99,
                                color: '#0f172a',
                                bgcolor: getLauncherColor(latestRunStatus),
                                boxShadow: `0 18px 48px ${alpha(getLauncherColor(latestRunStatus), 0.32)}`,
                                textTransform: 'none',
                                fontWeight: 800,
                                '&:hover': {
                                    bgcolor: getLauncherColor(latestRunStatus),
                                    filter: 'brightness(0.96)',
                                },
                            }}
                        >
                            {isPlanningActive ? 'AI running' : historyCountLabel}
                        </Button>
                    </Tooltip>
                )}
            </Box>

            <Dialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(9, 12, 18, 0.98)',
                        backgroundImage: 'linear-gradient(140deg, rgba(245,158,11,0.08), rgba(15,23,42,0.95) 38%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 3,
                        boxShadow: '0 28px 80px rgba(0, 0, 0, 0.56)',
                    },
                }}
            >
                <DialogTitle sx={{ px: 2.5, py: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography sx={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 800 }}>
                                Package AI runs
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.35 }}>
                                {packageName || latestRun?.packageName || 'This package'} · package creator history and logs
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setHistoryOpen(false)} sx={{ color: '#cbd5e1' }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ px: 2.5, pb: 2.5 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: '280px 300px minmax(0, 1fr)' },
                            gap: 2,
                            minHeight: { xs: 'auto', lg: 560 },
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2.5,
                                border: '1px solid rgba(255,255,255,0.08)',
                                bgcolor: 'rgba(2, 6, 23, 0.48)',
                                overflow: 'hidden',
                            }}
                        >
                            <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <Typography sx={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 700 }}>
                                    Runs
                                </Typography>
                                <Typography sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.25 }}>
                                    Latest first
                                </Typography>
                            </Box>

                            <Box sx={{ maxHeight: { xs: 280, md: 580 }, overflowY: 'auto' }}>
                                {runsQuery.isLoading ? (
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, color: '#94a3b8' }}>
                                        <CircularProgress size={16} />
                                        <Typography sx={{ fontSize: '0.75rem' }}>Loading AI runs…</Typography>
                                    </Stack>
                                ) : runs.length === 0 ? (
                                    <Typography sx={{ p: 1.5, color: '#64748b', fontSize: '0.75rem' }}>
                                        No package AI runs have been recorded yet.
                                    </Typography>
                                ) : (
                                    runs.map((run) => {
                                        const isSelected = run.runId === selectedRunId;
                                        return (
                                            <Box
                                                key={run.runId}
                                                onClick={() => setSelectedRunId(run.runId)}
                                                sx={{
                                                    px: 1.5,
                                                    py: 1.25,
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                                    bgcolor: isSelected ? 'rgba(245,158,11,0.12)' : 'transparent',
                                                    '&:hover': { bgcolor: isSelected ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.04)' },
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                                    <StatusChip
                                                        status={getStatusChipLabel(run.status)}
                                                        label={getStatusChipLabel(run.status)}
                                                        statusColor={getLauncherColor(run.status)}
                                                    />
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem' }}>
                                                        {formatTimestamp(run.startedAt)}
                                                    </Typography>
                                                </Stack>
                                                <Typography sx={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 700, mt: 0.9 }}>
                                                    {run.route.replace('POST /api/', '')}
                                                </Typography>
                                                <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', mt: 0.35 }}>
                                                    {run.totalSteps > 0 ? `${run.completedSteps}/${run.totalSteps} tasks completed` : 'Task summary pending'}
                                                </Typography>
                                                {run.error && (
                                                    <Typography sx={{ color: '#fca5a5', fontSize: '0.68rem', mt: 0.35 }}>
                                                        {run.error}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2.5,
                                border: '1px solid rgba(255,255,255,0.08)',
                                bgcolor: 'rgba(2, 6, 23, 0.48)',
                                overflow: 'hidden',
                            }}
                        >
                            <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <Typography sx={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 700 }}>
                                    Tasks
                                </Typography>
                                <Typography sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.25 }}>
                                    Completed tasks first
                                </Typography>
                            </Box>

                            {!selectedRunId ? (
                                <Box sx={{ p: 1.5 }}>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                                        Select an AI run to inspect its completed tasks.
                                    </Typography>
                                </Box>
                            ) : selectedRunQuery.isLoading && !selectedRun ? (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, color: '#94a3b8' }}>
                                    <CircularProgress size={18} />
                                    <Typography sx={{ fontSize: '0.8rem' }}>Loading tasks…</Typography>
                                </Stack>
                            ) : (
                                <Box sx={{ maxHeight: { xs: 280, lg: 620 }, overflowY: 'auto', p: 1.1, display: 'grid', gap: 1 }}>
                                    {historySteps.length === 0 ? (
                                        <Typography sx={{ p: 0.4, color: '#64748b', fontSize: '0.74rem' }}>
                                            This run has not written a planner summary yet.
                                        </Typography>
                                    ) : (
                                        <>
                                            {completedHistorySteps.length > 0 && (
                                                <Box>
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', px: 0.4, mb: 0.7 }}>
                                                        Completed
                                                    </Typography>
                                                    <Stack spacing={0.8}>
                                                        {completedHistorySteps.map((step, index) => (
                                                            <TaskSidebarCard key={`${step.stepIndex}-${step.step}-${index}`} step={step} />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {remainingHistorySteps.length > 0 && (
                                                <Box>
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', px: 0.4, mb: 0.7, mt: completedHistorySteps.length > 0 ? 1.15 : 0 }}>
                                                        In progress or failed
                                                    </Typography>
                                                    <Stack spacing={0.8}>
                                                        {remainingHistorySteps.map((step, index) => (
                                                            <TaskSidebarCard key={`${step.stepIndex}-${step.step}-remaining-${index}`} step={step} />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            )}
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2.5,
                                border: '1px solid rgba(255,255,255,0.08)',
                                bgcolor: 'rgba(2, 6, 23, 0.48)',
                                overflow: 'hidden',
                            }}
                        >
                            {!selectedRunId ? (
                                <Box sx={{ p: 2.5 }}>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                                        Select an AI run to inspect its logs.
                                    </Typography>
                                </Box>
                            ) : selectedRunQuery.isLoading && !selectedRun ? (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2.5, color: '#94a3b8' }}>
                                    <CircularProgress size={18} />
                                    <Typography sx={{ fontSize: '0.8rem' }}>Loading run detail…</Typography>
                                </Stack>
                            ) : (
                                <>
                                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                    <Typography sx={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 800 }}>
                                                        {selectedRun?.packageName || packageName || 'Package AI run'}
                                                    </Typography>
                                                    <StatusChip
                                                        status={getStatusChipLabel(selectedRun?.status ?? 'completed')}
                                                        label={getStatusChipLabel(selectedRun?.status ?? 'completed')}
                                                        statusColor={getLauncherColor(selectedRun?.status ?? 'completed')}
                                                    />
                                                    {selectedRun?.plannerStatus && (
                                                        <StatusChip status={selectedRun.plannerStatus} label={selectedRun.plannerStatus} />
                                                    )}
                                                </Stack>
                                                <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', mt: 0.55 }}>
                                                    Started {selectedRun ? formatTimestamp(selectedRun.startedAt) : 'just now'}
                                                    {selectedRun?.completedAt ? ` · Finished ${formatTimestamp(selectedRun.completedAt)}` : ''}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography sx={{ color: '#64748b', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    Route
                                                </Typography>
                                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.72rem', mt: 0.35 }}>
                                                    {selectedRun?.route?.replace('POST /api/', '') || 'Unknown route'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Tabs
                                        value={selectedLogTab}
                                        onChange={(_, value: HistoryLogTab) => setSelectedLogTab(value)}
                                        variant="scrollable"
                                        allowScrollButtonsMobile
                                        sx={{
                                            px: 1.25,
                                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                                            '& .MuiTab-root': {
                                                color: '#94a3b8',
                                                textTransform: 'none',
                                                minHeight: 44,
                                                fontWeight: 700,
                                            },
                                            '& .Mui-selected': {
                                                color: '#f8fafc',
                                            },
                                            '& .MuiTabs-indicator': {
                                                backgroundColor: '#f59e0b',
                                                height: 3,
                                                borderRadius: 999,
                                            },
                                        }}
                                    >
                                        <Tab value="realtime" label="Realtime view" />
                                        <Tab value="master-log" label="Master log" />
                                        {hasArtifactsTab && <Tab value="artifacts" label="Artifacts" />}
                                    </Tabs>

                                    <Box sx={{ minHeight: 460, maxHeight: { xs: 480, lg: 620 }, overflow: 'auto' }}>
                                        {selectedLogTab === 'realtime' && (
                                            <Box sx={{ p: 1.5 }}>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        borderRadius: 2,
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        bgcolor: 'rgba(15, 23, 42, 0.52)',
                                                        overflow: 'hidden',
                                                        mb: 1.5,
                                                    }}
                                                >
                                                    <Box sx={{ px: 1.5, py: 1.2 }}>
                                                        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                <Typography sx={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 700 }}>
                                                                    {realtimeHeadline}
                                                                </Typography>
                                                                {realtimeMeta && (
                                                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', mt: 0.28 }}>
                                                                        {realtimeMeta}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Typography sx={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 800 }}>
                                                                {realtimeProgressPercent}%
                                                            </Typography>
                                                        </Stack>

                                                        <LinearProgress
                                                            variant={isSelectedRunLive && planning.status === 'connecting' ? 'indeterminate' : 'determinate'}
                                                            value={isSelectedRunLive && planning.status === 'connecting' ? undefined : realtimeProgressPercent}
                                                            sx={{
                                                                mt: 1.05,
                                                                height: 8,
                                                                borderRadius: 999,
                                                                bgcolor: 'rgba(255,255,255,0.08)',
                                                                '& .MuiLinearProgress-bar': {
                                                                    borderRadius: 999,
                                                                    background: 'linear-gradient(90deg, #f59e0b 0%, #22c55e 100%)',
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </Paper>

                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        borderRadius: 2,
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        bgcolor: 'rgba(2, 6, 23, 0.78)',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <Box sx={{ px: 1.25, py: 1.05, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                                                            <Box>
                                                                <Typography sx={{ color: '#f8fafc', fontSize: '0.76rem', fontWeight: 700 }}>
                                                                    Realtime view
                                                                </Typography>
                                                                <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem', mt: 0.2 }}>
                                                                    Prompt and response feed, newest exchanges first
                                                                </Typography>
                                                            </Box>
                                                            <Typography sx={{ color: selectedRunQuery.isFetching ? '#86efac' : '#64748b', fontSize: '0.64rem', fontWeight: 700 }}>
                                                                {selectedRunQuery.isFetching ? 'Updating…' : isSelectedRunLive ? 'Live' : 'Recorded'}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                    <PackageAiLiveChatFeed
                                                        transcriptSteps={transcriptSteps}
                                                        isLive={isSelectedRunLive}
                                                        isLoading={selectedRunQuery.isLoading && !selectedRun}
                                                    />
                                                </Paper>

                                                {isSelectedRunLive && (blockingView.moments.length > 0 || blockingView.summary) && (
                                                    <BlockingTimelinePanel
                                                        blockingView={blockingView}
                                                        blockingExpanded={blockingExpanded}
                                                        setBlockingExpanded={setBlockingExpanded}
                                                        nowMs={nowMs}
                                                        onOpenTraceLog={openTraceLog}
                                                    />
                                                )}
                                            </Box>
                                        )}

                                        {selectedLogTab === 'master-log' && (
                                            <Box sx={{ p: 1.5 }}>
                                                <Box
                                                    component="pre"
                                                    sx={{
                                                        m: 0,
                                                        p: 1.5,
                                                        minHeight: 320,
                                                        overflow: 'auto',
                                                        borderRadius: 2,
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        bgcolor: 'rgba(2, 6, 23, 0.78)',
                                                        color: '#cbd5e1',
                                                        fontSize: '0.72rem',
                                                        lineHeight: 1.55,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        fontFamily: 'Consolas, "SFMono-Regular", monospace',
                                                    }}
                                                >
                                                    {selectedRun?.masterLog || 'No log file captured for this run yet.'}
                                                </Box>
                                            </Box>
                                        )}

                                        {selectedLogTab === 'artifacts' && hasArtifactsTab && (
                                            <PackageAiRunArtifactsView
                                                transcriptSteps={transcriptSteps}
                                                request={selectedRun?.request ?? null}
                                                builderSummary={selectedRun?.builderSummary ?? null}
                                                plannerSummary={selectedRun?.plannerSummary ?? null}
                                            />
                                        )}
                                    </Box>
                                </>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog
                open={traceLogOpen}
                onClose={() => setTraceLogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(9, 12, 18, 0.98)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 3,
                        boxShadow: '0 28px 80px rgba(0, 0, 0, 0.56)',
                    },
                }}
            >
                <DialogTitle sx={{ px: 2.25, py: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: '#f8fafc', fontSize: '0.92rem', fontWeight: 800 }}>
                                AI trace log
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', mt: 0.35, wordBreak: 'break-all' }}>
                                {traceLogPath || 'No trace log selected'}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setTraceLogOpen(false)} sx={{ color: '#cbd5e1' }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ px: 2.25, pb: 2.25 }}>
                    {traceLogLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#94a3b8' }}>
                            <CircularProgress size={18} />
                            <Typography sx={{ fontSize: '0.8rem' }}>Loading trace log…</Typography>
                        </Stack>
                    ) : traceLogError ? (
                        <Typography sx={{ color: '#fca5a5', fontSize: '0.78rem' }}>
                            {traceLogError}
                        </Typography>
                    ) : (
                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                p: 1.5,
                                minHeight: 240,
                                maxHeight: 520,
                                overflow: 'auto',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                bgcolor: 'rgba(2, 6, 23, 0.78)',
                                color: '#cbd5e1',
                                fontSize: '0.72rem',
                                lineHeight: 1.55,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: 'Consolas, "SFMono-Regular", monospace',
                            }}
                        >
                            {traceLogContent || 'No trace log content was returned.'}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function TaskSidebarCard({ step }: { step: StepRow }) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: `1px solid ${getTaskCardBorder(step.status)}`,
                bgcolor: getTaskCardBackground(step.status),
                px: 1.05,
                py: 0.95,
            }}
        >
            <Stack direction="row" spacing={0.9} alignItems="flex-start">
                <Box sx={{ mt: 0.15 }}>{renderStepIcon(step.status)}</Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 700 }}>
                        {step.label}
                    </Typography>
                    {step.activityName && (
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', mt: 0.22 }}>
                            {step.activityName}
                        </Typography>
                    )}
                    {step.error && (
                        <Typography sx={{ color: '#fca5a5', fontSize: '0.64rem', mt: 0.32 }}>
                            {step.error}
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}

function getTaskCardBorder(status: StepRow['status']): string {
    switch (status) {
    case 'completed':
        return alpha('#22c55e', 0.22);
    case 'failed':
        return alpha('#ef4444', 0.24);
    case 'active':
        return alpha('#f59e0b', 0.26);
    case 'pending':
    default:
        return alpha('#94a3b8', 0.18);
    }
}

function getTaskCardBackground(status: StepRow['status']): string {
    switch (status) {
    case 'completed':
        return 'rgba(21, 128, 61, 0.12)';
    case 'failed':
        return 'rgba(127, 29, 29, 0.18)';
    case 'active':
        return 'rgba(120, 53, 15, 0.18)';
    case 'pending':
    default:
        return 'rgba(15, 23, 42, 0.48)';
    }
}

function getWidgetTaskSummary(steps: StepRow[]): string {
    if (steps.length === 0) {
        return '';
    }

    return steps
        .slice(0, 2)
        .map((step) => (step.activityName ? `${step.label} (${step.activityName})` : step.label))
        .join(' · ');
}

function getRecordedProgressPercent(
    completedSteps: number | undefined,
    totalSteps: number | undefined,
    status: PackageAiRunStatus | undefined,
): number {
    if (totalSteps && totalSteps > 0 && completedSteps != null) {
        return Math.min(100, Math.round((completedSteps / totalSteps) * 100));
    }

    if (status === 'running') {
        return 18;
    }

    return 100;
}

function getRecordedRunHeadline(status: PackageAiRunStatus | undefined, error: string | null | undefined): string {
    if (status === 'failed') {
        return error ? `AI run failed: ${error}` : 'AI run failed';
    }

    if (status === 'running') {
        return 'This AI run is still in progress';
    }

    return 'Recorded AI run';
}

function getRecordedRunMeta(
    completedSteps: number | undefined,
    totalSteps: number | undefined,
    fallbackCount: number,
): string {
    if (totalSteps && totalSteps > 0 && completedSteps != null) {
        return `${completedSteps}/${totalSteps} tasks complete`;
    }

    if (fallbackCount > 0) {
        return `${fallbackCount} tasks recorded`;
    }

    return 'No task summary recorded yet.';
}

function BlockingTimelinePanel({
    blockingView,
    blockingExpanded,
    setBlockingExpanded,
    nowMs,
    onOpenTraceLog,
}: {
    blockingView: BlockingViewModel;
    blockingExpanded: boolean;
    setBlockingExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    nowMs: number;
    onOpenTraceLog: (path: string | undefined) => void;
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                mt: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                bgcolor: 'rgba(15, 23, 42, 0.52)',
                overflow: 'hidden',
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.25, py: 1.1, borderBottom: blockingExpanded ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
            >
                <Box>
                    <Typography sx={{ color: '#f8fafc', fontSize: '0.74rem', fontWeight: 700 }}>
                        Blocking by moment
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem', mt: 0.2 }}>
                        Live substeps: pre-seed, LM Studio, parse, guardrails, persist
                    </Typography>
                </Box>
                <Button
                    onClick={() => setBlockingExpanded((current) => !current)}
                    endIcon={<KeyboardArrowDownRoundedIcon sx={{ transform: blockingExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }} />}
                    sx={{ minWidth: 0, px: 1, color: '#e2e8f0', textTransform: 'none', fontWeight: 700 }}
                >
                    {blockingExpanded ? 'Hide timeline' : 'Show timeline'}
                </Button>
            </Stack>

            {blockingExpanded && (
                <Box sx={{ p: 1.1, display: 'grid', gap: 1 }}>
                    {blockingView.moments.map((moment) => (
                        <Paper
                            key={moment.key}
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: `1px solid ${getBlockingRowBorder(moment.status)}`,
                                bgcolor: getBlockingRowBackground(moment.status),
                                px: 1.15,
                                py: 1,
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography sx={{ color: '#f8fafc', fontSize: '0.76rem', fontWeight: 700 }}>
                                        {moment.momentName}
                                    </Typography>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.67rem', mt: 0.2 }}>
                                        {[moment.spaceName, formatBlockingSubstep(moment.currentSubstep), moment.activityName].filter(Boolean).join(' · ')}
                                    </Typography>
                                </Box>
                                {renderBlockingMomentIcon(moment.status)}
                            </Stack>

                            <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ mt: 0.9 }}>
                                {BLOCKING_SUBSTEPS.map((substep) => {
                                    const state = getBlockingSubstepState(moment, substep);
                                    return (
                                        <Box
                                            key={`${moment.key}-${substep}`}
                                            sx={{
                                                px: 0.75,
                                                py: 0.35,
                                                borderRadius: 99,
                                                border: `1px solid ${getBlockingSubstepBorder(state)}`,
                                                bgcolor: getBlockingSubstepBackground(state),
                                            }}
                                        >
                                            <Typography sx={{ color: getBlockingSubstepText(state), fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                                {formatBlockingSubstep(substep)}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>

                            {(moment.queueWaitMs != null || moment.llmDurationMs != null) && (
                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.66rem', mt: 0.85 }}>
                                    {[
                                        moment.queueWaitMs != null ? `Queue ${formatDurationMs(moment.queueWaitMs)}` : null,
                                        moment.llmDurationMs != null ? `AI ${formatDurationMs(moment.llmDurationMs)}` : null,
                                    ].filter(Boolean).join(' · ')}
                                </Typography>
                            )}

                            {moment.notices.length > 0 && (
                                <Box sx={{ mt: 0.9, display: 'grid', gap: 0.45 }}>
                                    {moment.notices.map((notice, index) => (
                                        <Typography key={`${moment.key}-notice-${index}`} sx={{ color: '#fde68a', fontSize: '0.66rem', lineHeight: 1.45 }}>
                                            Info: {notice}
                                        </Typography>
                                    ))}
                                </Box>
                            )}

                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 0.9 }}>
                                <Typography sx={{ color: moment.error ? '#fca5a5' : '#64748b', fontSize: '0.64rem' }}>
                                    {moment.error || `Updated ${formatRelativeAge(nowMs - moment.lastUpdatedAtMs)} ago`}
                                </Typography>
                                {moment.traceLogPath && (
                                    <Button
                                        size="small"
                                        onClick={() => onOpenTraceLog(moment.traceLogPath)}
                                        sx={{ minWidth: 0, px: 0.75, color: '#7dd3fc', textTransform: 'none', fontWeight: 700 }}
                                    >
                                        View trace log
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    ))}

                    {blockingView.summary && (
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid rgba(56, 189, 248, 0.26)',
                                bgcolor: 'rgba(14, 165, 233, 0.08)',
                                px: 1.15,
                                py: 1,
                            }}
                        >
                            <Typography sx={{ color: '#f8fafc', fontSize: '0.76rem', fontWeight: 800 }}>
                                Blocking summary
                            </Typography>
                            <Box
                                sx={{
                                    mt: 0.95,
                                    display: 'grid',
                                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                                    gap: 0.85,
                                }}
                            >
                                {[
                                    { label: 'Moments processed', value: `${blockingView.summary.completedMoments}/${blockingView.summary.totalMoments}` },
                                    { label: 'Failures', value: String(blockingView.summary.failedMoments) },
                                    { label: 'Average AI time', value: blockingView.summary.averageAiTimeMs != null ? formatDurationMs(blockingView.summary.averageAiTimeMs) : '—' },
                                    { label: 'Corrected cameras', value: String(blockingView.summary.correctedCameraAssignments) },
                                ].map((metric) => (
                                    <Box
                                        key={metric.label}
                                        sx={{
                                            borderRadius: 1.5,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            bgcolor: 'rgba(2, 6, 23, 0.4)',
                                            px: 0.9,
                                            py: 0.75,
                                        }}
                                    >
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {metric.label}
                                        </Typography>
                                        <Typography sx={{ color: '#f8fafc', fontSize: '0.84rem', fontWeight: 800, mt: 0.35 }}>
                                            {metric.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 0.95 }}>
                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.67rem' }}>
                                    {blockingView.summary.warningCount > 0
                                        ? `${blockingView.summary.warningCount} informational correction notice${blockingView.summary.warningCount === 1 ? '' : 's'}`
                                        : 'No correction notices were raised.'}
                                </Typography>
                                {blockingView.summary.traceLogPath && (
                                    <Button
                                        size="small"
                                        onClick={() => onOpenTraceLog(blockingView.summary.traceLogPath)}
                                        sx={{ minWidth: 0, px: 0.75, color: '#7dd3fc', textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Open latest trace log
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    )}
                </Box>
            )}
        </Paper>
    );
}

function getPlanningPercent(planning: UsePlanningProgressReturn): number {
    if (planning.status === 'complete') {
        return 100;
    }

    if (planning.totalSteps <= 0) {
        return 12;
    }

    return Math.min(
        100,
        Math.round(((planning.completedSteps + (planning.activeStep ? 0.45 : 0)) / planning.totalSteps) * 100),
    );
}

function getPlanningHeadline(
    planning: UsePlanningProgressReturn,
    blockingView: BlockingViewModel,
    nowMs: number,
): string {
    const activeBlockingEvent = blockingView.activeEvent;
    if (activeBlockingEvent) {
        const momentName = activeBlockingEvent.momentName || activeBlockingEvent.activityName || 'this moment';
        switch (activeBlockingEvent.data?.substep) {
        case 'pre-seed':
            return `Preparing blocking for ${momentName}`;
        case 'llm-request-started':
            return `Generating blocking for ${momentName}, ${formatDurationMs(Math.max(nowMs - activeBlockingEvent.receivedAtMs, 0))}`;
        case 'llm-response-received':
            return `LM Studio responded for ${momentName}`;
        case 'parse-complete':
            return `Parsed blocking for ${momentName}`;
        case 'guardrails-applied':
            return `Applied guardrails for ${momentName}`;
        case 'persisted':
            return `Saved blocking for ${momentName}`;
        default:
            return `Generating camera blocking for ${momentName}`;
        }
    }

    const step = planning.activeStep;
    const fallback = planning.currentLabel;
    if (!step) {
        return fallback || 'AI planner is warming up';
    }

    if (step.step === 'activity-casting' && step.activityName && step.momentName) {
        return `${step.activityName} — deciding subjects for ${step.momentName}`;
    }

    if (step.step === 'activity-actions' && step.activityName && step.momentName) {
        return `${step.activityName} — writing actions for ${step.momentName}`;
    }

    if (step.step === 'activity-moments' && step.activityName) {
        return `${step.activityName} — generating moments`;
    }

    return step.label || fallback || 'AI planner is working';
}

function getPlanningMeta(planning: UsePlanningProgressReturn, blockingView: BlockingViewModel): string {
    const parts: string[] = [];

    if (blockingView.activeEvent?.data?.substep === 'llm-request-started') {
        parts.push('Waiting on LM Studio');
    }

    if (blockingView.activeEvent?.data?.spaceName) {
        parts.push(blockingView.activeEvent.data.spaceName);
    }

    const blockingCompleted = blockingView.activeEvent?.data?.completedMoments;
    const blockingTotal = blockingView.activeEvent?.data?.totalMoments;
    if (blockingCompleted != null && blockingTotal != null) {
        parts.push(`${blockingCompleted}/${blockingTotal} moments complete`);
    }

    if (planning.totalSteps > 0) {
        parts.push(`${planning.completedSteps}/${planning.totalSteps} tasks complete`);
    }

    if (!blockingView.activeEvent && planning.activeStep?.momentName) {
        parts.push(planning.activeStep.momentName);
    }

    return parts.join(' · ');
}

function buildBlockingView(eventHistory: PlanningEventRecord[]): BlockingViewModel {
    const rows = new Map<string, BlockingMomentRow>();
    let summary: BlockingSummaryCardData | null = null;
    let activeEvent: PlanningEventRecord | null = null;

    for (const event of eventHistory) {
        if (event.step !== 'blocking') {
            continue;
        }

        if (event.data?.substep === 'summary') {
            summary = {
                completedMoments: event.data.completedMoments ?? 0,
                failedMoments: event.data.failedMoments ?? 0,
                totalMoments: event.data.totalMoments ?? 0,
                averageAiTimeMs: event.data.averageAiTimeMs,
                correctedCameraAssignments: event.data.correctedCameraAssignments ?? 0,
                warningCount: event.data.warningCount ?? 0,
                traceLogPath: event.data.traceLogPath,
            };
            continue;
        }

        if (!event.momentName && !event.momentId) {
            continue;
        }

        const key = String(event.momentId ?? `${event.activityName ?? 'blocking'}:${event.momentName}`);
        const existing = rows.get(key);
        const next: BlockingMomentRow = existing ?? {
            key,
            activityName: event.activityName,
            momentId: event.momentId,
            momentName: event.momentName ?? event.activityName ?? 'Moment',
            spaceName: event.data?.spaceName,
            status: 'active',
            currentSubstep: event.data?.substep,
            notices: [],
            llmDurationMs: event.data?.llmDurationMs,
            queueWaitMs: event.data?.queueWaitMs,
            traceLogPath: event.data?.traceLogPath,
            error: event.error,
            startedAtMs: event.receivedAtMs,
            lastUpdatedAtMs: event.receivedAtMs,
        };

        next.activityName = event.activityName ?? next.activityName;
        next.momentId = event.momentId ?? next.momentId;
        next.momentName = event.momentName ?? next.momentName;
        next.spaceName = event.data?.spaceName ?? next.spaceName;
        next.currentSubstep = event.data?.substep ?? next.currentSubstep;
        next.llmDurationMs = event.data?.llmDurationMs ?? next.llmDurationMs;
        next.queueWaitMs = event.data?.queueWaitMs ?? next.queueWaitMs;
        next.traceLogPath = event.data?.traceLogPath ?? next.traceLogPath;
        next.error = event.error ?? next.error;
        next.lastUpdatedAtMs = event.receivedAtMs;

        if (event.data?.notices?.length) {
            next.notices = Array.from(new Set([...next.notices, ...event.data.notices]));
        }

        if (event.status === 'failed') {
            next.status = 'failed';
        } else if (event.data?.substep === 'persisted' || event.status === 'completed') {
            next.status = 'completed';
        } else {
            next.status = 'active';
            activeEvent = event;
        }

        rows.set(key, next);
    }

    const moments = [...rows.values()].sort((left, right) => left.startedAtMs - right.startedAtMs);
    const hasActiveMoment = moments.some((moment) => moment.status === 'active');

    return {
        activeEvent,
        moments,
        summary,
        isBlockingActive: hasActiveMoment,
    };
}

function formatBlockingSubstep(substep: BlockingPlanningSubstep | undefined): string {
    if (!substep) {
        return 'Queued';
    }

    switch (substep) {
    case 'pre-seed':
        return 'Pre-seed';
    case 'llm-request-started':
        return 'LM Studio';
    case 'llm-response-received':
        return 'Response';
    case 'parse-complete':
        return 'Parse';
    case 'guardrails-applied':
        return 'Guardrails';
    case 'persisted':
        return 'Persisted';
    case 'summary':
        return 'Summary';
    default:
        return substep;
    }
}

function renderBlockingMomentIcon(status: BlockingMomentRow['status']) {
    if (status === 'completed') {
        return <CheckCircleOutlineRoundedIcon sx={{ color: '#22c55e', fontSize: 18, flexShrink: 0 }} />;
    }

    if (status === 'failed') {
        return <ErrorOutlineRoundedIcon sx={{ color: '#fb7185', fontSize: 18, flexShrink: 0 }} />;
    }

    return <CircularProgress size={16} thickness={5} sx={{ color: '#fbbf24', flexShrink: 0 }} />;
}

function getBlockingRowBorder(status: BlockingMomentRow['status']): string {
    if (status === 'completed') {
        return 'rgba(34, 197, 94, 0.22)';
    }

    if (status === 'failed') {
        return 'rgba(251, 113, 133, 0.24)';
    }

    return 'rgba(245, 158, 11, 0.24)';
}

function getBlockingRowBackground(status: BlockingMomentRow['status']): string {
    if (status === 'completed') {
        return 'rgba(34, 197, 94, 0.06)';
    }

    if (status === 'failed') {
        return 'rgba(251, 113, 133, 0.07)';
    }

    return 'rgba(245, 158, 11, 0.06)';
}

function getBlockingSubstepState(
    moment: BlockingMomentRow,
    substep: BlockingPlanningSubstep,
): 'pending' | 'active' | 'completed' | 'failed' {
    const currentIndex = BLOCKING_SUBSTEPS.indexOf(moment.currentSubstep ?? 'pre-seed');
    const targetIndex = BLOCKING_SUBSTEPS.indexOf(substep);

    if (moment.status === 'failed') {
        if (targetIndex < currentIndex) return 'completed';
        if (targetIndex === currentIndex) return 'failed';
        return 'pending';
    }

    if (moment.status === 'completed') {
        return targetIndex <= currentIndex ? 'completed' : 'pending';
    }

    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'active';
    return 'pending';
}

function getBlockingSubstepBorder(state: 'pending' | 'active' | 'completed' | 'failed'): string {
    if (state === 'completed') return 'rgba(34, 197, 94, 0.24)';
    if (state === 'active') return 'rgba(245, 158, 11, 0.36)';
    if (state === 'failed') return 'rgba(251, 113, 133, 0.34)';
    return 'rgba(148, 163, 184, 0.16)';
}

function getBlockingSubstepBackground(state: 'pending' | 'active' | 'completed' | 'failed'): string {
    if (state === 'completed') return 'rgba(34, 197, 94, 0.12)';
    if (state === 'active') return 'rgba(245, 158, 11, 0.16)';
    if (state === 'failed') return 'rgba(251, 113, 133, 0.16)';
    return 'rgba(148, 163, 184, 0.06)';
}

function getBlockingSubstepText(state: 'pending' | 'active' | 'completed' | 'failed'): string {
    if (state === 'completed') return '#bbf7d0';
    if (state === 'active') return '#fde68a';
    if (state === 'failed') return '#fecdd3';
    return '#94a3b8';
}

function formatDurationMs(value: number): string {
    if (value < 1000) {
        return `${Math.max(Math.round(value), 0)}ms`;
    }

    const seconds = Math.round(value / 1000);
    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return remainderSeconds > 0 ? `${minutes}m ${remainderSeconds}s` : `${minutes}m`;
}

function formatRelativeAge(value: number): string {
    if (value < 1000) {
        return 'moments';
    }

    const seconds = Math.round(value / 1000);
    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return remainderSeconds > 0 ? `${minutes}m ${remainderSeconds}s` : `${minutes}m`;
}

function getDrawerSteps(steps: PlanningStep[]): StepRow[] {
    return steps.slice(-4).reverse().map((step, index) => ({
        step: step.step,
        label: step.label,
        status: step.status,
        stepIndex: steps.length - index,
        activityName: step.activityName,
        error: step.error,
    }));
}

function getHistorySteps(
    persistedSteps: PackageAiPlannerSummaryStep[] | undefined,
    liveSteps: PlanningStep[],
    selectedRunId: string | null,
    latestRunId: string | undefined,
    isPlanningActive: boolean,
): StepRow[] {
    if (persistedSteps && persistedSteps.length > 0) {
        return persistedSteps;
    }

    if (isPlanningActive && selectedRunId && selectedRunId === latestRunId) {
        return liveSteps.map((step, index) => ({
            step: step.step,
            label: step.label,
            status: step.status,
            stepIndex: index,
            activityName: step.activityName,
            error: step.error,
        }));
    }

    return [];
}

function getStatusChipLabel(status: PackageAiRunStatus): string {
    if (status === 'running') {
        return 'In Progress';
    }

    if (status === 'failed') {
        return 'Failed';
    }

    return 'Completed';
}

function getLauncherColor(status: PackageAiRunStatus): string {
    if (status === 'failed') {
        return '#fb7185';
    }

    if (status === 'running') {
        return '#fbbf24';
    }

    return '#38bdf8';
}

function renderStepIcon(status: string) {
    if (status === 'completed') {
        return <CheckCircleOutlineRoundedIcon sx={{ color: '#22c55e', fontSize: 18, flexShrink: 0 }} />;
    }

    if (status === 'failed') {
        return <ErrorOutlineRoundedIcon sx={{ color: '#fb7185', fontSize: 18, flexShrink: 0 }} />;
    }

    if (status === 'active' || status === 'started' || status === 'running') {
        return <PlayArrowRoundedIcon sx={{ color: '#fbbf24', fontSize: 18, flexShrink: 0 }} />;
    }

    if (status === 'pending') {
        return <ScheduleRoundedIcon sx={{ color: '#94a3b8', fontSize: 18, flexShrink: 0 }} />;
    }

    return <RadioButtonUncheckedRoundedIcon sx={{ color: '#64748b', fontSize: 16, flexShrink: 0 }} />;
}

function formatTimestamp(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export default PackageAiRunsPanel;