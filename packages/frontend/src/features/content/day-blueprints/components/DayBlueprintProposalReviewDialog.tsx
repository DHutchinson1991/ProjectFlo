'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  useApplyDayBlueprintAiProposal,
  usePreviewDayBlueprintAiProposal,
} from '../hooks';
import type { DayBlueprintAiProposal, DayBlueprintDiffOp } from '../types';

interface Props {
  open: boolean;
  blueprintId: number;
  versionId: number;
  proposal: DayBlueprintAiProposal | null;
  onClose: () => void;
}

/**
 * Review dialog for a single AI proposal.
 *
 * Runs a guardrail preflight (`POST /versions/:versionId/ai-preview`)
 * on open and disables Apply if any blocking violations are returned.
 * Violations surface inline so the user can decide whether to reject
 * or ask the AI to rework the diff.
 */
export function DayBlueprintProposalReviewDialog({
  open,
  blueprintId,
  versionId,
  proposal,
  onClose,
}: Props) {
  const preview = usePreviewDayBlueprintAiProposal(versionId);
  const apply = useApplyDayBlueprintAiProposal(blueprintId, versionId);

  const [violations, setViolations] = useState<string[] | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Preflight whenever the dialog opens with a fresh proposal.
  useEffect(() => {
    if (!open || !proposal) {
      setViolations(null);
      setApplyError(null);
      return;
    }
    let cancelled = false;
    preview.mutateAsync(proposal.diff_json).then(
      (result) => { if (!cancelled) setViolations(result.violations); },
      (err) => { if (!cancelled) setViolations([(err as Error).message || 'Preview failed']); },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, proposal?.id]);

  const opsByResource = useMemo(() => {
    if (!proposal) return new Map<string, DayBlueprintDiffOp[]>();
    const m = new Map<string, DayBlueprintDiffOp[]>();
    for (const op of proposal.diff_json.ops) {
      const key = op.resource;
      const list = m.get(key) ?? [];
      list.push(op);
      m.set(key, list);
    }
    return m;
  }, [proposal]);

  const blocked = (violations?.length ?? 0) > 0;
  const isTerminal = proposal && proposal.status !== 'PROPOSED';
  const canApply = !blocked && !isTerminal && !preview.isPending;

  const handleApply = async () => {
    if (!proposal) return;
    setApplyError(null);
    try {
      await apply.mutateAsync({ proposalId: proposal.id, data: {} });
      onClose();
    } catch (err) {
      setApplyError((err as Error).message || 'Apply failed');
    }
  };

  if (!proposal) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(9, 12, 18, 0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ px: 2.5, py: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography sx={{ color: '#f8fafc', fontWeight: 800 }}>
              Review AI proposal #{proposal.id}
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.35 }}>
              {proposal.diff_json.ops.length} op{proposal.diff_json.ops.length === 1 ? '' : 's'} ·
              status {proposal.status}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#cbd5e1' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pb: 2, display: 'grid', gap: 2 }}>
        {proposal.rationale_text && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(148,163,184,0.18)',
              bgcolor: 'rgba(15,23,42,0.5)',
              p: 1.5,
            }}
          >
            <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
              AI rationale
            </Typography>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {proposal.rationale_text}
            </Typography>
          </Paper>
        )}

        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.82rem', mb: 0.75 }}>
            Guardrail preflight
          </Typography>
          {preview.isPending ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#94a3b8' }}>
              <CircularProgress size={14} />
              <Typography sx={{ fontSize: '0.78rem' }}>Checking guardrails…</Typography>
            </Stack>
          ) : violations === null ? (
            <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
              Preflight has not run yet.
            </Typography>
          ) : violations.length === 0 ? (
            <Alert severity="success" sx={{ bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.24)' }}>
              No guardrail violations. Safe to apply.
            </Alert>
          ) : (
            <Stack spacing={0.6}>
              {violations.map((v, i) => (
                <Chip
                  key={i}
                  icon={<WarningAmberRoundedIcon />}
                  label={v}
                  sx={{
                    justifyContent: 'flex-start',
                    bgcolor: alpha('#fb7185', 0.12),
                    color: '#fecaca',
                    border: '1px solid rgba(251,113,133,0.28)',
                    '& .MuiChip-icon': { color: '#fb7185' },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.82rem', mb: 0.75 }}>
            Operations
          </Typography>
          <Stack spacing={1}>
            {Array.from(opsByResource.entries()).map(([resource, ops]) => (
              <Paper
                key={resource}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(148,163,184,0.18)',
                  bgcolor: 'rgba(15,23,42,0.5)',
                  p: 1.25,
                }}
              >
                <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                  {resource} · {ops.length} op{ops.length === 1 ? '' : 's'}
                </Typography>
                <Stack spacing={0.5}>
                  {ops.map((op, i) => <OpRow key={i} op={op} />)}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>

        {applyError && (
          <Alert severity="error" onClose={() => setApplyError(null)}>
            {applyError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#cbd5e1' }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!canApply || apply.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: canApply ? '#22c55e' : undefined,
            '&:hover': { bgcolor: canApply ? '#16a34a' : undefined },
          }}
        >
          {apply.isPending ? 'Applying…' : blocked ? 'Blocked by guardrails' : 'Apply proposal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OpRow({ op }: { op: DayBlueprintDiffOp }) {
  const color = opColor(op.op);
  const summary = (() => {
    if (op.op === 'add') return `add on parent ${op.parent_id}`;
    if (op.op === 'update') return `update id ${op.id}`;
    if (op.op === 'remove') return `remove id ${op.id}`;
    if (op.op === 'reorder') return `reorder ${op.order.length} rows`;
    return op.op;
  })();

  const detail = (() => {
    if (op.op === 'add') return op.data;
    if (op.op === 'update') return op.patch;
    if (op.op === 'reorder') return op.order;
    return null;
  })();

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={op.op}
          size="small"
          sx={{
            bgcolor: alpha(color, 0.14),
            color,
            border: `1px solid ${alpha(color, 0.28)}`,
            fontWeight: 800,
            textTransform: 'uppercase',
            fontSize: '0.62rem',
          }}
        />
        <Typography sx={{ color: '#e2e8f0', fontSize: '0.76rem' }}>{summary}</Typography>
      </Stack>
      {detail != null && (
        <Box
          component="pre"
          sx={{
            m: 0,
            mt: 0.5,
            p: 0.9,
            borderRadius: 1.5,
            bgcolor: 'rgba(2,6,23,0.72)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#cbd5e1',
            fontSize: '0.68rem',
            lineHeight: 1.5,
            fontFamily: 'Consolas, "SFMono-Regular", monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(detail, null, 2)}
        </Box>
      )}
    </Box>
  );
}

function opColor(op: DayBlueprintDiffOp['op']): string {
  switch (op) {
    case 'add':
      return '#22c55e';
    case 'update':
      return '#60a5fa';
    case 'remove':
      return '#fb7185';
    case 'reorder':
      return '#f59e0b';
    default:
      return '#94a3b8';
  }
}
