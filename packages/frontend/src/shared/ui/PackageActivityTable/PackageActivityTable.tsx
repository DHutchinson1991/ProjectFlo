'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MovieIcon from '@mui/icons-material/Movie';
import { keyframes } from '@mui/material/styles';

const packageActivityMomentNameShimmer = keyframes`
  0% { background-position: -180% 0; }
  100% { background-position: 180% 0; }
`;

export interface PackageActivityTableMetricColumn {
  key: string;
  label: string;
  width?: string;
}

export interface PackageActivityTableMoment {
  id: number;
  name: string;
  durationLabel: string;
  /** Persisted duration in seconds; enables drag-to-adjust when `onCommitMomentDuration` is set. */
  durationSeconds?: number;
  isActive?: boolean;
  activeColor?: string;
  /** When true, moment title uses a subtle shimmer (e.g. AI streaming preview rows). */
  nameShimmer?: boolean;
}

export interface PackageActivityTableActivity {
  id: number;
  name: string;
  color: string;
  durationLabel: string;
  metrics?: Record<string, React.ReactNode>;
  moments?: PackageActivityTableMoment[];
}

export interface PackageActivityTableProps {
  activities: PackageActivityTableActivity[];
  metricColumns: PackageActivityTableMetricColumn[];
  selectedActivityId?: number | null;
  selectedMomentId?: number | null;
  readOnly?: boolean;
  addActivityLabel?: string;
  addMomentDurationDefault?: string;
  addAccentColor?: string;
  emptyTitle?: string;
  emptyMomentLabel?: string;
  emptyAddLabel?: string;
  /** Activity rows to expand while set (e.g. during AI generation); does not collapse when cleared. */
  autoExpandActivityIds?: readonly number[];
  onSelectActivity?: (activityId: number) => void;
  onSelectMoment?: (activityId: number, momentId: number) => void;
  onAddActivity?: (name: string) => void | Promise<void>;
  onDeleteActivity?: (activityId: number) => void | Promise<void>;
  onAddMoment?: (activityId: number, name: string, durationSeconds: number) => void | Promise<void>;
  onDeleteMoment?: (activityId: number, momentId: number) => void | Promise<void>;
  /** Horizontal drag on a persisted moment's duration cell commits new `duration_seconds`. */
  onCommitMomentDuration?: (activityId: number, momentId: number, durationSeconds: number) => void | Promise<void>;
}

function hasMetricValue(value: React.ReactNode) {
  return value !== null && value !== undefined && value !== '' && value !== 0 && value !== '—';
}

const MIN_MOMENT_SECONDS = 5;
const MAX_MOMENT_SECONDS = 3600;
const PX_PER_SECOND_DRAG = 4;

function formatMomentDurationSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m <= 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function MomentDurationScrub({
  activityId,
  momentId,
  durationSeconds,
  durationLabel,
  readOnly,
  onCommit,
}: {
  activityId: number;
  momentId: number;
  durationSeconds?: number;
  durationLabel: string;
  readOnly: boolean;
  onCommit?: (activityId: number, momentId: number, nextSeconds: number) => void | Promise<void>;
}) {
  const dragging = useRef(false);
  const originX = useRef(0);
  const originSec = useRef(0);
  const [preview, setPreview] = useState<number | null>(null);

  if (readOnly || !onCommit || momentId < 0 || durationSeconds == null || !Number.isFinite(durationSeconds)) {
    return (
      <Typography sx={{ fontSize: '0.68rem', color: '#535e6e', fontFamily: 'monospace' }}>
        {durationLabel}
      </Typography>
    );
  }

  const clampSec = (v: number) => Math.min(MAX_MOMENT_SECONDS, Math.max(MIN_MOMENT_SECONDS, Math.round(v)));
  const displaySec = preview ?? durationSeconds;

  return (
    <Box
      component="span"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = true;
        originX.current = event.clientX;
        originSec.current = durationSeconds;
        setPreview(durationSeconds);
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const dx = event.clientX - originX.current;
        const next = clampSec(originSec.current + dx / PX_PER_SECOND_DRAG);
        setPreview(next);
      }}
      onPointerUp={(event) => {
        if (!dragging.current) return;
        dragging.current = false;
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
        const dx = event.clientX - originX.current;
        const next = clampSec(originSec.current + dx / PX_PER_SECOND_DRAG);
        setPreview(null);
        if (next !== durationSeconds) {
          void onCommit(activityId, momentId, next);
        }
      }}
      onPointerCancel={(event) => {
        dragging.current = false;
        setPreview(null);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* */
        }
      }}
      sx={{
        display: 'inline-block',
        minWidth: 52,
        cursor: 'ew-resize',
        userSelect: 'none',
        touchAction: 'none',
        px: 0.5,
        py: 0.15,
        borderRadius: 0.5,
        '&:hover': { bgcolor: 'rgba(148,163,184,0.12)' },
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', pointerEvents: 'none' }}>
        {formatMomentDurationSeconds(displaySec)}
      </Typography>
    </Box>
  );
}

export function PackageActivityTable({
  activities,
  metricColumns,
  selectedActivityId,
  selectedMomentId,
  readOnly = false,
  addActivityLabel = 'Add Activity',
  addMomentDurationDefault = '30',
  addAccentColor = '#a855f7',
  emptyTitle = 'No activities yet. Add your first activity to get started.',
  emptyMomentLabel = 'No moments yet',
  emptyAddLabel = 'Add Activity',
  autoExpandActivityIds,
  onSelectActivity,
  onSelectMoment,
  onAddActivity,
  onDeleteActivity,
  onAddMoment,
  onDeleteMoment,
  onCommitMomentDuration,
}: PackageActivityTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [addingMomentForId, setAddingMomentForId] = useState<number | null>(null);
  const [newMomentName, setNewMomentName] = useState('');
  const [newMomentDuration, setNewMomentDuration] = useState(addMomentDurationDefault);

  useEffect(() => {
    if (selectedActivityId == null) return;
    setExpandedIds((previous) => {
      if (previous.has(selectedActivityId)) return previous;
      const next = new Set(previous);
      next.add(selectedActivityId);
      return next;
    });
  }, [selectedActivityId]);

  const autoExpandSerialized =
    autoExpandActivityIds && autoExpandActivityIds.length > 0
      ? [...autoExpandActivityIds].sort((left, right) => left - right).join(',')
      : '';

  useEffect(() => {
    if (!autoExpandSerialized) return;
    const ids = autoExpandSerialized.split(',').map((part) => Number(part));
    setExpandedIds((previous) => {
      const next = new Set(previous);
      let changed = false;
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [autoExpandSerialized]);

  useEffect(() => {
    setNewMomentDuration(addMomentDurationDefault);
  }, [addMomentDurationDefault]);

  const totalColumnCount = 3 + metricColumns.length;
  const activityColumnWidth = useMemo(() => {
    const usedWidth = metricColumns.reduce((sum, column) => {
      if (!column.width?.endsWith('%')) return sum;
      return sum + Number(column.width.slice(0, -1));
    }, 0);
    return `${Math.max(28, 100 - usedWidth - 24)}%`;
  }, [metricColumns]);

  const openAddActivity = () => {
    setAddingActivity(true);
    setNewActivityName('');
  };

  const toggleExpand = (activityId: number) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const submitActivity = async () => {
    const name = newActivityName.trim();
    if (!name || !onAddActivity) return;
    await onAddActivity(name);
    setAddingActivity(false);
    setNewActivityName('');
  };

  const openAddMoment = (activityId: number) => {
    setExpandedIds((previous) => new Set(previous).add(activityId));
    setAddingMomentForId(activityId);
    setNewMomentName('');
    setNewMomentDuration(addMomentDurationDefault);
  };

  const submitMoment = async (activityId: number) => {
    const name = newMomentName.trim();
    if (!name || !onAddMoment) return;
    await onAddMoment(activityId, name, Number(newMomentDuration) || Number(addMomentDurationDefault) || 30);
    setAddingMomentForId(null);
    setNewMomentName('');
    setNewMomentDuration(addMomentDurationDefault);
    setExpandedIds((previous) => new Set(previous).add(activityId));
  };

  const canAddActivity = !readOnly && Boolean(onAddActivity);
  const canAddMoment = !readOnly && Boolean(onAddMoment);
  const canDeleteActivity = !readOnly && Boolean(onDeleteActivity);
  const canDeleteMoment = !readOnly && Boolean(onDeleteMoment);

  return (
    <Box>
      {activities.length === 0 ? (
        <Box
          sx={{
            p: 5,
            textAlign: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 2,
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <MovieIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.3 }} />
          <Typography variant="body2" sx={{ color: '#64748b', mb: canAddActivity ? 2 : 0 }}>
            {emptyTitle}
          </Typography>
          {canAddActivity && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openAddActivity}
              size="small"
              sx={{
                borderColor: `${addAccentColor}55`,
                color: addAccentColor,
                textTransform: 'none',
                '&:hover': { borderColor: `${addAccentColor}88`, bgcolor: `${addAccentColor}14` },
              }}
            >
              {emptyAddLabel}
            </Button>
          )}
        </Box>
      ) : (
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: activityColumnWidth }} />
            {metricColumns.map((column) => (
              <col key={column.key} style={{ width: column.width ?? '11%' }} />
            ))}
            <col style={{ width: '16%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Activity
              </TableCell>
              {metricColumns.map((column) => (
                <TableCell key={column.key} sx={{ py: 1.25, fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {column.label}
                </TableCell>
              ))}
              <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Duration
              </TableCell>
              <TableCell sx={{ py: 1.25, textAlign: 'center' }}>
                {canAddActivity && (
                  <Tooltip title={addActivityLabel}>
                    <IconButton size="small" onClick={openAddActivity} sx={{ p: 0.25, color: addAccentColor, '&:hover': { bgcolor: `${addAccentColor}1A` } }}>
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity) => {
              const isExpanded = expandedIds.has(activity.id);
              const moments = activity.moments ?? [];

              return (
                <React.Fragment key={activity.id}>
                  <TableRow
                    onClick={() => onSelectActivity?.(activity.id)}
                    sx={{
                      transition: 'all 0.2s ease',
                      borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                      bgcolor: selectedActivityId === activity.id ? `${activity.color}14` : `${activity.color}08`,
                      borderLeft: `3px solid ${activity.color}`,
                      '&:hover': {
                        bgcolor: selectedActivityId === activity.id ? `${activity.color}20` : `${activity.color}10`,
                        '& .action-btns': { opacity: 1 },
                      },
                      cursor: onSelectActivity ? 'pointer' : 'default',
                    }}
                  >
                    <TableCell sx={{ py: 1, px: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpand(activity.id);
                          }}
                          sx={{ p: 0, color: '#64748b', minWidth: 20 }}
                        >
                          {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activity.name}
                        </Typography>
                      </Box>
                    </TableCell>

                    {metricColumns.map((column) => {
                      const value = activity.metrics?.[column.key];
                      const metricValue = hasMetricValue(value) ? value : '—';
                      return (
                        <TableCell key={column.key} sx={{ py: 1, px: 0.5, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '0.7rem', color: hasMetricValue(value) ? '#e2e8f0' : '#334155', fontFamily: 'monospace' }}>
                            {metricValue}
                          </Typography>
                        </TableCell>
                      );
                    })}

                    <TableCell sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {activity.durationLabel || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1, px: 0.5 }}>
                      <Box className="action-btns" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', opacity: 0.3, transition: 'opacity 0.15s' }}>
                        {canAddMoment && (
                          <Tooltip title="Add moment">
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAddMoment(activity.id);
                              }}
                              sx={{ p: 0.25, color: '#64748b', '&:hover': { color: addAccentColor } }}
                            >
                              <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDeleteActivity && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                void onDeleteActivity?.(activity.id);
                              }}
                              sx={{ p: 0.25, color: '#ef4444' }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {isExpanded && moments.map((moment, index) => (
                    <TableRow
                      key={`moment-${moment.id}`}
                      onClick={() => onSelectMoment?.(activity.id, moment.id)}
                      sx={{
                        bgcolor: moment.isActive
                          ? 'rgba(34, 197, 94, 0.08)'
                          : selectedMomentId === moment.id
                            ? 'rgba(14, 165, 233, 0.08)'
                            : 'rgba(255,255,255,0.012)',
                        borderBottom: '1px solid rgba(255,255,255,0.025)',
                        borderLeft: moment.isActive
                          ? '2px solid #22c55e'
                          : selectedMomentId === moment.id
                            ? '2px solid #0ea5e9'
                            : '2px solid transparent',
                        cursor: onSelectMoment ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: moment.isActive
                            ? 'rgba(34, 197, 94, 0.12)'
                            : selectedMomentId === moment.id
                              ? 'rgba(14, 165, 233, 0.12)'
                              : 'rgba(255,255,255,0.03)',
                          '& .moment-actions': { opacity: 1 },
                        },
                      }}
                    >
                      <TableCell colSpan={1 + metricColumns.length} sx={{ py: 0.4, pl: 1, pr: 1, border: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 22, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: '0.6rem', color: '#e2e8f0', fontFamily: 'monospace', minWidth: 14, textAlign: 'right', flexShrink: 0 }}>
                            {index + 1}.
                          </Typography>
                          <Typography
                            component="span"
                            sx={
                              moment.nameShimmer
                                ? {
                                    flex: 1,
                                    minWidth: 0,
                                    display: 'block',
                                    fontSize: '0.72rem',
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    backgroundImage:
                                      'linear-gradient(90deg, #64748b 0%, #94a3b8 32%, #f1f5f9 50%, #94a3b8 68%, #64748b 100%)',
                                    backgroundSize: '220% 100%',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: 'transparent',
                                    animation: `${packageActivityMomentNameShimmer} 2.2s ease-in-out infinite`,
                                  }
                                : {
                                    fontSize: '0.72rem',
                                    color: '#94a3b8',
                                    fontWeight: 400,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0,
                                  }
                            }
                          >
                            {moment.name}
                          </Typography>
                          {moment.isActive && (
                            <CircularProgress size={10} thickness={6} sx={{ color: moment.activeColor ?? '#22c55e', ml: 0.5 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                        <MomentDurationScrub
                          activityId={activity.id}
                          momentId={moment.id}
                          durationSeconds={moment.durationSeconds}
                          durationLabel={moment.durationLabel}
                          readOnly={readOnly}
                          onCommit={onCommitMomentDuration}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.4, px: 0.5, border: 'none' }}>
                        {canDeleteMoment && (
                          <Box className="moment-actions" sx={{ display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 0.15s', justifyContent: 'center' }}>
                            <Tooltip title="Delete moment">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void onDeleteMoment?.(activity.id, moment.id);
                                }}
                                sx={{ p: 0.25, color: '#b04646' }}
                              >
                                <DeleteIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {isExpanded && moments.length === 0 && (
                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.012)' }}>
                      <TableCell colSpan={totalColumnCount} sx={{ py: 0.75, pl: 1, border: 'none' }}>
                        <Typography sx={{ fontSize: '0.68rem', color: '#475569', fontStyle: 'italic', pl: '40px' }}>
                          {emptyMomentLabel}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {isExpanded && addingMomentForId === activity.id && canAddMoment && (
                    <TableRow sx={{ bgcolor: `${addAccentColor}08` }}>
                      <TableCell colSpan={1 + metricColumns.length} sx={{ py: 0.4, pl: 1, pr: 1, border: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 22, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                            <AddIcon sx={{ fontSize: 13, color: addAccentColor }} />
                          </Box>
                          <Box sx={{ width: 14, flexShrink: 0 }} />
                          <TextField
                            placeholder="Moment name..."
                            value={newMomentName}
                            onChange={(event) => setNewMomentName(event.target.value)}
                            size="small"
                            variant="standard"
                            autoFocus
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') void submitMoment(activity.id);
                              if (event.key === 'Escape') {
                                setAddingMomentForId(null);
                                setNewMomentName('');
                              }
                            }}
                            sx={{ flex: 1, '& .MuiInput-input': { fontSize: '0.72rem', color: '#e2e8f0', py: 0.25 } }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                        <TextField
                          value={newMomentDuration}
                          onChange={(event) => setNewMomentDuration(event.target.value.replace(/[^0-9]/g, ''))}
                          size="small"
                          variant="standard"
                          sx={{ width: 48, '& .MuiInput-input': { fontSize: '0.68rem', color: '#94a3b8', py: 0.25, textAlign: 'right' } }}
                          InputProps={{ endAdornment: <Typography sx={{ fontSize: '0.58rem', color: '#475569', ml: 0.25 }}>s</Typography> }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton size="small" onClick={() => void submitMoment(activity.id)} sx={{ p: 0.25, color: '#10b981' }}>
                            <CheckIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAddingMomentForId(null);
                              setNewMomentName('');
                              setNewMomentDuration(addMomentDurationDefault);
                            }}
                            sx={{ p: 0.25, color: '#64748b' }}
                          >
                            <CloseIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      {addingActivity && canAddActivity && (
        <Box
          sx={{
            mx: 0.5,
            mt: activities.length > 0 ? 1.25 : 1,
            mb: 1,
            py: 1,
            px: 1.5,
            borderRadius: 1.5,
            border: `1px solid ${addAccentColor}40`,
            bgcolor: `${addAccentColor}0A`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TextField
            placeholder="Activity name..."
            value={newActivityName}
            onChange={(event) => setNewActivityName(event.target.value)}
            size="small"
            variant="standard"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitActivity();
              if (event.key === 'Escape') {
                setAddingActivity(false);
                setNewActivityName('');
              }
            }}
            sx={{ flex: 1, '& .MuiInput-input': { fontSize: '0.82rem', color: '#e2e8f0', py: 0.25 } }}
          />
          <IconButton size="small" onClick={() => void submitActivity()} sx={{ p: 0.25, color: '#10b981' }}>
            <CheckIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setAddingActivity(false);
              setNewActivityName('');
            }}
            sx={{ p: 0.25, color: '#64748b' }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default PackageActivityTable;
