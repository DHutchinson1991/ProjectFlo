'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Stack, Typography, LinearProgress, Box, Alert, Chip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { usePrepareScene } from '../hooks/useShotPreviews';
import type { PrepareSceneResult } from '../api/shot-previews.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanStep {
  label: string;
  durationMs: number; // Approximate duration for progress animation
}

const STEPS: PlanStep[] = [
  { label: 'Casting presence across moments…', durationMs: 7_000 },
  { label: 'Generating narrative actions…', durationMs: 10_000 },
  { label: 'Directing cameras & compositions…', durationMs: 12_000 },
  { label: 'Analysing spatial layout…', durationMs: 5_000 },
  { label: 'Writing shot data…', durationMs: 3_000 },
];

interface Props {
  open: boolean;
  filmSceneId: number | null;
  filmId: number | null;
  activityName?: string;
  sourceType?: 'package' | 'project';
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ActivityPlannerDialog: React.FC<Props> = ({
  open,
  filmSceneId,
  filmId,
  activityName = 'Activity',
  sourceType = 'package',
  onClose,
}) => {
  const { mutate, isPending, data, error, reset } = usePrepareScene();

  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setStepProgress(0);
      reset();
    }
  }, [open, reset]);

  // Animate progress steps while pending
  useEffect(() => {
    if (!isPending) return;
    let cancelled = false;
    let stepIdx = 0;
    let elapsed = 0;

    const tick = () => {
      if (cancelled || stepIdx >= STEPS.length) return;
      const step = STEPS[stepIdx];
      elapsed += 100;
      const pct = Math.min((elapsed / step.durationMs) * 100, 99);
      setStepProgress(pct);
      if (elapsed >= step.durationMs && stepIdx < STEPS.length - 1) {
        stepIdx++;
        elapsed = 0;
        setCurrentStep(stepIdx);
        setStepProgress(0);
      }
      setTimeout(tick, 100);
    };
    tick();
    return () => { cancelled = true; };
  }, [isPending]);

  const handleStart = () => {
    if (!filmSceneId || !filmId) return;
    mutate({ filmSceneId, filmId, sourceType });
  };

  const isDone = !!data && !isPending;
  const hasError = !!error && !isPending;

  const totalPrepared = isDone
    ? data.moments.reduce((sum, m) => sum + m.assignments.filter((a) => a.prepared).length, 0)
    : 0;
  const totalAssignments = isDone
    ? data.moments.reduce((sum, m) => sum + m.assignments.length, 0)
    : 0;

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(16, 18, 26, 0.97)',
          border: '1px solid rgba(52, 58, 80, 0.5)',
          backdropFilter: 'blur(12px)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <AutoAwesomeIcon sx={{ color: '#10b981', fontSize: 22 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Activity Planner — {activityName}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* ── Idle state ── */}
        {!isPending && !isDone && !hasError && (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              The AI planner will analyse all moments in this activity together and produce:
            </Typography>
            <Stack spacing={0.75} sx={{ pl: 1 }}>
              {[
                'Presence matrix — who appears in each moment',
                'Continuous narrative actions for every subject',
                'Camera compositions & emotional arc across the full activity',
              ].map((item) => (
                <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', '&::before': { content: '"→ "', color: '#10b981' } }}>
                  {item}
                </Typography>
              ))}
            </Stack>
          </Stack>
        )}

        {/* ── In progress ── */}
        {isPending && (
          <Stack spacing={2.5} sx={{ py: 1 }}>
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isDoneStep = idx < currentStep || isDone;
              return (
                <Box key={step.label}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: isActive ? '#10b981' : isDoneStep ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)', fontWeight: isActive ? 600 : 400, fontSize: '0.8rem' }}
                    >
                      {isDoneStep && !isActive ? '✓ ' : ''}{step.label}
                    </Typography>
                    {isActive && (
                      <Typography variant="caption" sx={{ color: '#10b981' }}>
                        {Math.round(stepProgress)}%
                      </Typography>
                    )}
                  </Stack>
                  {isActive && (
                    <LinearProgress
                      variant="determinate"
                      value={stepProgress}
                      sx={{
                        height: 3, borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 2 },
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}

        {/* ── Done ── */}
        {isDone && (
          <Stack spacing={2} sx={{ py: 1 }}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Planning complete
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {totalPrepared} of {totalAssignments} camera assignments prepared
                </Typography>
              </Box>
            </Stack>

            {data.overallArc && (
              <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.07)', borderRadius: 2, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Overall arc
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                  {data.overallArc}
                </Typography>
              </Box>
            )}

            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {data.moments.map((m) => (
                <Chip
                  key={m.momentId}
                  label={`${m.momentName} (${m.assignments.filter((a) => a.prepared).length}/${m.assignments.length})`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.72rem',
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {/* ── Error ── */}
        {hasError && (
          <Alert
            severity="error"
            icon={<ErrorOutlineIcon />}
            sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            {error?.message ?? 'An unexpected error occurred. Please try again.'}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isPending}
          variant="text"
          sx={{ color: 'text.secondary' }}
        >
          {isDone ? 'Close' : 'Cancel'}
        </Button>
        {!isDone && !isPending && (
          <Button
            onClick={handleStart}
            disabled={!filmSceneId || !filmId}
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              fontWeight: 600,
            }}
          >
            Start planning
          </Button>
        )}
        {hasError && (
          <Button
            onClick={handleStart}
            variant="contained"
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            Retry
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ActivityPlannerDialog;
