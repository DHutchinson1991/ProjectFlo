'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Portal,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import StopCircleRoundedIcon from '@mui/icons-material/StopCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { StatusChip } from '@/shared/ui';
import {
  useCancelDayBlueprintAiRun,
  useDayBlueprintAiProgress,
  useDayBlueprintAiRuns,
} from '../hooks';
import type {
  DayBlueprintAiRun,
  DayBlueprintAiRunStatus,
  DayBlueprintDay,
} from '../types';
import { getApiBaseUrl } from '@/shared/api/client';

interface Props {
  blueprintId: number;
  versionId: number;
  versionLabel: string;
  activeDay: DayBlueprintDay | null;
  readOnly: boolean;
  onGenerate?: () => void;
  generateLabel?: string;
  generateTooltip?: string;
  generatePending?: boolean;
  generateDisabled?: boolean;
}

/** Matches `StudioSidebar` width and `(studio)/layout.tsx` main `marginLeft`. */
const STUDIO_NAV_RAIL_PX = 280;

/** Matches `DayBlueprintVersionEditor` activities rail `width: { lg: '26%' }`. */
const ACTIVITIES_RAIL_FRACTION = 0.26;

/** Studio content inner width (nav + symmetric page padding from layout `p: 3`). */
function studioContentInnerWidth(theme: { spacing: (v: number) => string }): string {
  return `calc(100vw - ${STUDIO_NAV_RAIL_PX}px - ${theme.spacing(3)} - ${theme.spacing(3)})`;
}

function activitiesRailStripWidth(theme: { spacing: (v: number) => string }): string {
  return `calc(${studioContentInnerWidth(theme)} * ${ACTIVITIES_RAIL_FRACTION})`;
}

function activitiesRailStripLeft(theme: { spacing: (v: number) => string }): string {
  return `calc(${STUDIO_NAV_RAIL_PX}px + ${theme.spacing(3)})`;
}

function formatDurationMs(ms: number): string {
  if (ms < 1000) return '<1s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

/**
 * Day Designer AI runs drawer.
 *
 * Floating bottom widget, horizontally centered over the activities rail
 * (left ~26% column) so it stays out of the floor plan / People strip.
 * Includes a modal for run history and a live timeline.
 * Generation is triggered from this launcher; cancel rolls back via an
 * in-flight AbortController on the backend.
 */
export function DayBlueprintAiRunsPanel({
  blueprintId: _blueprintId,
  versionId,
  versionLabel,
  activeDay: _activeDay,
  readOnly: _readOnly,
  onGenerate,
  generateLabel = 'Generate',
  generateTooltip = 'Run Day Designer AI generation',
  generatePending = false,
  generateDisabled = false,
}: Props) {
  void _blueprintId;
  void _activeDay;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const runsQuery = useDayBlueprintAiRuns(versionId, { live: historyOpen || undefined });
  const runs = runsQuery.data ?? [];
  const latestRun = runs[0] ?? null;
  const activeRun = useMemo(() => runs.find((r) => r.status === 'RUNNING') ?? null, [runs]);
  const hasActiveRun = Boolean(activeRun);
  const aiProgress = useDayBlueprintAiProgress(versionId, activeRun?.id ?? null);
  const cancelMutation = useCancelDayBlueprintAiRun(versionId);

  // Keep widget elapsed time ticking while a run is live
  useEffect(() => {
    if (!hasActiveRun) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasActiveRun, activeRun?.id]);

  useEffect(() => {
    if (historyOpen && latestRun && selectedRunId == null) {
      setSelectedRunId(latestRun.id);
    }
  }, [historyOpen, latestRun, selectedRunId]);

  // Reset cancel confirm dialog when run finishes
  useEffect(() => {
    if (!hasActiveRun) setCancelConfirm(false);
  }, [hasActiveRun]);

  const openHistoryModal = () => {
    if (latestRun) setSelectedRunId(latestRun.id);
    setHistoryOpen(true);
  };

  const handleCancel = async () => {
    if (!activeRun) return;
    try {
      await cancelMutation.mutateAsync(activeRun.id);
    } finally {
      setCancelConfirm(false);
    }
  };

  const launcherColor = latestRun?.status === 'FAILED'
    ? '#fb7185'
    : latestRun?.status === 'CANCELLED'
      ? '#94a3b8'
      : '#60a5fa';
  const runCountLabel = runs.length > 0
    ? `${runs.length} run${runs.length === 1 ? '' : 's'}`
    : 'No runs';
  const idleLabel = runs.length > 0 ? runCountLabel : 'Day structure AI';

  const activeStartedMs = activeRun ? new Date(activeRun.started_at).getTime() : 0;
  const activeElapsedMs = activeRun ? Math.max(0, nowMs - activeStartedMs) : 0;
  const activeHeadline = aiProgress.currentLabel || (activeRun
    ? (activeRun.prompt_summary?.trim() || `${activeRun.run_kind} run in progress`)
    : '');
  const latestCoverage = aiProgress.latestEvent?.data;
  const activeMeta = activeRun
    ? `${activeRun.run_kind} · ${formatDurationMs(activeElapsedMs)} elapsed${
        latestCoverage?.momentsCreated != null
          ? ` · ${latestCoverage.momentsCreated} moments · ${latestCoverage.actionsCreated ?? 0} actions · ${latestCoverage.placementsCreated ?? 0} placements`
          : ''
      }`
    : '';

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? latestRun,
    [runs, selectedRunId, latestRun],
  );

  return (
    <Portal>
      <Box
        sx={(theme) => ({
          position: 'fixed',
          left: activitiesRailStripLeft(theme),
          width: {
            xs: studioContentInnerWidth(theme),
            lg: activitiesRailStripWidth(theme),
          },
          right: 'auto',
          bottom: { xs: theme.spacing(2.5), sm: theme.spacing(3) },
          transform: 'none',
          zIndex: theme.zIndex.tooltip + 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        })}
        data-testid="day-blueprint-ai-launcher"
      >
        {hasActiveRun ? (
          <Paper
            elevation={0}
            onClick={openHistoryModal}
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: 540 },
              alignSelf: 'center',
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
                background:
                  'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(34,197,94,0.08) 55%, rgba(15,23,42,0.95))',
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
                        Day Designer AI is running
                      </Typography>
                      <StatusChip status="In Progress" label="Live" statusColor="#fbbf24" />
                    </Stack>
                    <Tooltip title="Cancel run and roll back">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openHistoryModal();
                          setCancelConfirm(true);
                        }}
                        size="small"
                        startIcon={<StopCircleRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#fca5a5',
                          py: 0.25,
                          px: 1,
                          minWidth: 0,
                        }}
                      >
                        Cancel
                      </Button>
                    </Tooltip>
                  </Stack>
                  <Typography
                    sx={{
                      color: '#e2e8f0',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      mt: 0.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeHeadline}
                  </Typography>
                  {activeMeta && (
                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.7rem', mt: 0.35 }}>
                      {activeMeta}
                    </Typography>
                  )}
                  <LinearProgress
                    variant={aiProgress.progress > 0 ? 'determinate' : 'indeterminate'}
                    value={Math.round(aiProgress.progress * 100)}
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
          <Stack spacing={0.75} sx={{ pointerEvents: 'auto', alignItems: 'center', width: '100%' }}>
            <Tooltip title="Open Day Designer AI run history">
              <Button
                aria-label="Open Day Designer AI run history"
                onClick={openHistoryModal}
                size="small"
                variant="text"
                sx={{
                  textTransform: 'none',
                  color: '#cbd5e1',
                  minWidth: 0,
                  px: 1.2,
                  py: 0.15,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {idleLabel}
              </Button>
            </Tooltip>
            <Tooltip title={generatePending ? 'Generating…' : generateTooltip}>
              <span>
                <Button
                  aria-label="Run Day Designer AI generation"
                  onClick={onGenerate}
                  disabled={_readOnly || generateDisabled || !onGenerate}
                  variant="contained"
                  startIcon={generatePending
                    ? <CircularProgress size={12} thickness={6} sx={{ color: '#0f172a' }} />
                    : <AutoAwesomeRoundedIcon />}
                  sx={{
                    minWidth: 0,
                    px: 1.75,
                    py: 1,
                    borderRadius: 99,
                    color: '#0f172a',
                    bgcolor: launcherColor,
                    boxShadow: `0 18px 48px ${alpha(launcherColor, 0.32)}`,
                    textTransform: 'none',
                    fontWeight: 800,
                    '&:hover': {
                      bgcolor: launcherColor,
                      filter: 'brightness(0.96)',
                    },
                    '&.Mui-disabled': {
                      color: '#475569',
                      bgcolor: 'rgba(148,163,184,0.22)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {generatePending ? 'Generating…' : generateLabel}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(9, 12, 18, 0.98)',
            backgroundImage:
              'linear-gradient(140deg, rgba(96,165,250,0.08), rgba(15,23,42,0.95) 38%)',
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
                Day Designer AI runs
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.35 }}>
                {versionLabel} · live progress and run history
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasActiveRun && (
                <Button
                  onClick={() => setCancelConfirm(true)}
                  variant="outlined"
                  size="small"
                  startIcon={<StopCircleRoundedIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#fca5a5',
                    borderColor: alpha('#fca5a5', 0.4),
                    '&:hover': {
                      borderColor: '#fca5a5',
                      bgcolor: alpha('#fca5a5', 0.08),
                    },
                  }}
                >
                  Cancel run
                </Button>
              )}
              <IconButton onClick={() => setHistoryOpen(false)} sx={{ color: '#cbd5e1' }}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Collapse in={cancelConfirm && hasActiveRun}>
            <Paper
              elevation={0}
              sx={{
                mt: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: 2,
                border: `1px solid ${alpha('#fca5a5', 0.3)}`,
                bgcolor: alpha('#fca5a5', 0.06),
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                <Typography sx={{ color: '#fecaca', fontSize: '0.8rem', fontWeight: 600 }}>
                  Cancel this run? Already-streamed moments will be rolled back to the previous state.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() => setCancelConfirm(false)}
                    size="small"
                    sx={{ textTransform: 'none', color: '#cbd5e1' }}
                  >
                    Keep running
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    variant="contained"
                    size="small"
                    startIcon={
                      cancelMutation.isPending
                        ? <CircularProgress size={12} thickness={6} sx={{ color: '#fff' }} />
                        : <StopCircleRoundedIcon sx={{ fontSize: 16 }} />
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#dc2626',
                      '&:hover': { bgcolor: '#b91c1c' },
                    }}
                  >
                    Cancel & restore
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Collapse>
        </DialogTitle>

        <DialogContent sx={{ px: 2.5, pb: 2.5 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)' },
              gap: 2,
              minHeight: 480,
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
              <Box sx={{ maxHeight: 620, overflowY: 'auto' }}>
                {runsQuery.isLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, color: '#94a3b8' }}>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: '0.75rem' }}>Loading…</Typography>
                  </Stack>
                ) : runs.length === 0 ? (
                  <Typography sx={{ p: 1.5, color: '#64748b', fontSize: '0.75rem' }}>
                    No AI runs have been recorded yet.
                  </Typography>
                ) : (
                  runs.map((run) => (
                    <Box
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: selectedRun?.id === run.id ? alpha('#60a5fa', 0.1) : 'transparent',
                        borderLeft: selectedRun?.id === run.id
                          ? '2px solid #60a5fa'
                          : '2px solid transparent',
                        '&:hover': { bgcolor: alpha('#60a5fa', 0.06) },
                      }}
                    >
                      <RunSidebarCard run={run} />
                    </Box>
                  ))
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
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <RunDetailPanel
                run={selectedRun}
                isActive={Boolean(activeRun && selectedRun?.id === activeRun.id)}
                progress={aiProgress}
                elapsedMs={activeRun && selectedRun?.id === activeRun.id ? activeElapsedMs : null}
              />
            </Paper>
          </Box>
        </DialogContent>
      </Dialog>
    </Portal>
  );
}

interface RunDetailProps {
  run: DayBlueprintAiRun | null;
  isActive: boolean;
  progress: ReturnType<typeof useDayBlueprintAiProgress>;
  elapsedMs: number | null;
}

function RunDetailPanel({ run, isActive, progress, elapsedMs }: RunDetailProps) {
  if (!run) {
    return (
      <Box sx={{ p: 2.5 }}>
        <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
          Select a run on the left to inspect its timeline.
        </Typography>
      </Box>
    );
  }

  const events = isActive ? progress.events : [];
  const momentEvents = events.filter(
    (e) => e.data?.eventKind === 'moment-persisted' || e.data?.eventKind === 'moment-streaming',
  );
  // Duration-only updates piggyback on the moment-streaming step so the
  // activities rail can refresh the placeholder duration without emitting
  // a noisy "moment X of Y" timeline row in the runs panel.
  const momentTimelineEvents = momentEvents.filter(
    (e) => e.data?.eventKind !== 'moment-streaming-duration',
  );
  const subjectEvents = events.filter(
    (e) => e.data?.eventKind === 'subject-spatial-result' || e.data?.eventKind === 'subject-spatial-start',
  );
  const guardrailWarnings = events.filter((e) => e.data?.eventKind === 'guardrail-warning');
  const summaryEvent = events.find((e) => e.step === 'done') ?? null;
  const cancelledEvent = events.find((e) => e.data?.eventKind === 'cancelled') ?? null;
  const errorEvent = events.find((e) => e.step === 'error') ?? null;

  const liveCounts = (summaryEvent?.data ?? events[events.length - 1]?.data) as
    | { momentsCreated?: number; actionsCreated?: number; placementsCreated?: number; momentsWithCoverage?: number }
    | undefined;

  const finalCounts = isActive
    ? liveCounts
    : run.status === 'SUCCESS'
      ? parseCountsFromSummary(run.prompt_summary)
      : null;

  const reportUrl = run.id
    ? `${getApiBaseUrl()}/api/day-blueprints/ai-runs/${run.id}/report`
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={1} alignItems="center">
            {renderStatusIcon(run.status)}
            <Typography sx={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 800 }}>
              {run.run_kind} run #{run.id}
            </Typography>
            <StatusChip
              status={run.status === 'SUCCESS' ? 'Completed' : run.status === 'RUNNING' ? 'In Progress' : run.status}
              label={run.status}
              statusColor={statusToColor(run.status)}
            />
          </Stack>
          {reportUrl && run.status !== 'RUNNING' && (
            <Button
              component="a"
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              size="small"
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', color: '#60a5fa', fontSize: '0.72rem' }}
            >
              Open full report
            </Button>
          )}
        </Stack>
        {run.prompt_summary && (
          <Typography sx={{ color: '#cbd5e1', fontSize: '0.74rem', mt: 0.5, lineHeight: 1.45 }}>
            {run.prompt_summary}
          </Typography>
        )}
      </Box>

      {/* Stats strip */}
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Stat label="Started" value={formatTimestamp(run.started_at)} />
        <Stat label="Elapsed" value={elapsedMs != null ? formatDurationMs(elapsedMs) : run.finished_at ? formatDurationMs(new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) : '—'} />
        {finalCounts?.momentsCreated != null && (
          <Stat label="Moments" value={String(finalCounts.momentsCreated)} />
        )}
        {finalCounts?.actionsCreated != null && (
          <Stat label="Actions" value={String(finalCounts.actionsCreated)} />
        )}
        {finalCounts?.placementsCreated != null && (
          <Stat label="Placements" value={String(finalCounts.placementsCreated)} />
        )}
        {momentTimelineEvents.length > 0 && elapsedMs && elapsedMs > 1000 && (
          <Stat
            label="Moments / sec"
            value={(momentTimelineEvents.length / (elapsedMs / 1000)).toFixed(2)}
          />
        )}
      </Box>

      {/* Live timeline / final summary */}
      <Box sx={{ px: 2, py: 1.5, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {!isActive && run.status !== 'RUNNING' ? (
          <FinalSummaryCard run={run} reportUrl={reportUrl} />
        ) : (
          <Stack spacing={1}>
            <TimelineRow
              icon={<CheckCircleOutlineRoundedIcon sx={{ color: '#22c55e', fontSize: 16 }} />}
              label="Snapshot taken — moments cleared inside transaction"
            />
            <TimelineRow
              icon={momentTimelineEvents.length === 0
                ? <CircularProgress size={12} thickness={6} sx={{ color: '#fbbf24' }} />
                : <CheckCircleOutlineRoundedIcon sx={{ color: '#22c55e', fontSize: 16 }} />}
              label={`Generating moments — ${momentTimelineEvents.length} written`}
            />
            {momentTimelineEvents.map((event) => (
              <MomentEventRow key={`${event.runId}-${event.data?.previewKey}`} event={event} />
            ))}
            {subjectEvents.length > 0 && (
              <TimelineRow
                icon={<CircularProgress size={12} thickness={6} sx={{ color: '#a78bfa' }} />}
                label={`Generating spatial — ${subjectEvents.filter((e) => e.data?.eventKind === 'subject-spatial-result').length} subjects placed`}
              />
            )}
            {guardrailWarnings.map((event, idx) => (
              <Stack key={`gw-${idx}`} direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
                <WarningAmberRoundedIcon sx={{ color: '#fbbf24', fontSize: 16 }} />
                <Typography sx={{ color: '#fde68a', fontSize: '0.74rem' }}>
                  {String(event.data?.warning ?? event.label)}
                </Typography>
              </Stack>
            ))}
            {cancelledEvent && (
              <TimelineRow
                icon={<StopCircleRoundedIcon sx={{ color: '#fca5a5', fontSize: 16 }} />}
                label="Cancelled — moments restored"
              />
            )}
            {errorEvent && (
              <TimelineRow
                icon={<ErrorOutlineRoundedIcon sx={{ color: '#fb7185', fontSize: 16 }} />}
                label={errorEvent.error ?? errorEvent.label ?? 'Generation failed'}
              />
            )}
            {summaryEvent && !cancelledEvent && !errorEvent && (
              <TimelineRow
                icon={<CheckCircleOutlineRoundedIcon sx={{ color: '#22c55e', fontSize: 16 }} />}
                label={summaryEvent.label}
              />
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function MomentEventRow({ event }: { event: { label: string; data?: Record<string, unknown> } }) {
  const [expanded, setExpanded] = useState(false);
  const data = event.data ?? {};
  const actions = data.previewActionCount;
  const placements = data.previewPlacementCount;
  const duration = data.previewDurationSeconds;
  const fmt = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : '—');
  const previewHint =
    'Preview counts from this pipeline step: act = subject actions written, place = placement slots predicted, sec = outline duration (Phase 1). “—” means not available yet for streaming rows.';
  return (
    <Box sx={{ pl: 2.5, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          cursor: 'pointer',
          py: 0.4,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': { color: '#f8fafc' },
        }}
      >
        <Typography sx={{ color: '#cbd5e1', fontSize: '0.74rem', flex: 1 }}>
          {String(data.activityName ?? '')} → {String(data.momentName ?? '')}
        </Typography>
        <Tooltip title={previewHint}>
          <Typography sx={{ color: '#64748b', fontSize: '0.66rem', whiteSpace: 'nowrap' }}>
            {fmt(actions)} act · {fmt(placements)} pl · {fmt(duration)}s
          </Typography>
        </Tooltip>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pl: 1, pb: 0.75 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: 1.5 }}>
            {event.label}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

function TimelineRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
      <Box sx={{ width: 18, display: 'grid', placeItems: 'center' }}>{icon}</Box>
      <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ color: '#f8fafc', fontSize: '0.82rem', fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

function FinalSummaryCard({ run, reportUrl }: { run: DayBlueprintAiRun; reportUrl: string | null }) {
  const counts = parseCountsFromSummary(run.prompt_summary);
  const elapsedMs = run.started_at && run.finished_at
    ? new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
    : null;
  const accent = statusToColor(run.status);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: `1px solid ${alpha(accent, 0.32)}`,
        bgcolor: alpha(accent, 0.06),
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center">
          {renderStatusIcon(run.status)}
          <Typography sx={{ color: '#f8fafc', fontSize: '0.92rem', fontWeight: 800 }}>
            {run.status === 'SUCCESS'
              ? 'Run completed'
              : run.status === 'CANCELLED'
                ? 'Run cancelled — restored'
                : run.status === 'FAILED'
                  ? 'Run failed'
                  : run.status}
          </Typography>
        </Stack>
        {run.error && (
          <Typography sx={{ color: '#fca5a5', fontSize: '0.78rem' }}>{run.error}</Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {counts?.momentsCreated != null && <Stat label="Moments" value={String(counts.momentsCreated)} />}
          {counts?.actionsCreated != null && <Stat label="Actions" value={String(counts.actionsCreated)} />}
          {counts?.placementsCreated != null && <Stat label="Placements" value={String(counts.placementsCreated)} />}
          {elapsedMs != null && <Stat label="Elapsed" value={formatDurationMs(elapsedMs)} />}
        </Box>
        {reportUrl && (
          <Button
            component="a"
            href={reportUrl}
            target="_blank"
            rel="noreferrer"
            size="small"
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
            sx={{
              alignSelf: 'flex-start',
              textTransform: 'none',
              color: '#60a5fa',
              fontWeight: 700,
              fontSize: '0.74rem',
              px: 0,
            }}
          >
            Open full report
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function parseCountsFromSummary(summary: string | null | undefined):
  | { momentsCreated: number; actionsCreated: number; placementsCreated: number }
  | null {
  if (!summary) return null;
  const match = summary.match(/(\d+)\s+moments?,\s*(\d+)\s+actions?,\s*(\d+)\s+placements?/i);
  if (!match) return null;
  return {
    momentsCreated: parseInt(match[1], 10),
    actionsCreated: parseInt(match[2], 10),
    placementsCreated: parseInt(match[3], 10),
  };
}

function RunSidebarCard({ run }: { run: DayBlueprintAiRun }) {
  const accent = statusToColor(run.status);
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.75} alignItems="center">
          {renderStatusIcon(run.status)}
          <Typography sx={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 700 }}>
            {run.run_kind}
          </Typography>
        </Stack>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem' }}>
          {formatTimestamp(run.started_at)}
        </Typography>
      </Stack>
      {run.prompt_summary && (
        <Typography
          sx={{
            color: '#94a3b8',
            fontSize: '0.7rem',
            mt: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {run.prompt_summary}
        </Typography>
      )}
      <Typography sx={{ color: alpha(accent, 0.95), fontSize: '0.62rem', mt: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {run.status}
        {run.error ? ` · ${run.error.slice(0, 60)}` : ''}
      </Typography>
    </Box>
  );
}

function statusToColor(status: DayBlueprintAiRunStatus): string {
  switch (status) {
    case 'SUCCESS':
      return '#22c55e';
    case 'FAILED':
      return '#fb7185';
    case 'CANCELLED':
      return '#94a3b8';
    case 'RUNNING':
      return '#fbbf24';
    default:
      return '#64748b';
  }
}

function renderStatusIcon(status: DayBlueprintAiRunStatus) {
  if (status === 'SUCCESS')
    return <CheckCircleOutlineRoundedIcon sx={{ color: '#22c55e', fontSize: 16 }} />;
  if (status === 'FAILED')
    return <ErrorOutlineRoundedIcon sx={{ color: '#fb7185', fontSize: 16 }} />;
  if (status === 'CANCELLED')
    return <StopCircleRoundedIcon sx={{ color: '#94a3b8', fontSize: 16 }} />;
  if (status === 'RUNNING')
    return <CircularProgress size={12} thickness={6} sx={{ color: '#fbbf24' }} />;
  return <RadioButtonUncheckedRoundedIcon sx={{ color: '#64748b', fontSize: 16 }} />;
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
