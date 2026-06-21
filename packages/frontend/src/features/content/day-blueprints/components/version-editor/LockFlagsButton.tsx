import { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

export const ACTIVITY_LOCK_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'order', label: 'Order' },
  { key: 'duration', label: 'Duration' },
];

export const MOMENT_LOCK_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'order', label: 'Order' },
  { key: 'duration', label: 'Duration' },
  { key: 'required_subjects', label: 'Required subjects' },
];

export function parseLockFlags(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = Boolean(v);
  }
  return out;
}

export function activeLockLabels(
  lockFlags: unknown,
  options: Array<{ key: string; label: string }>,
): string[] {
  const parsed = parseLockFlags(lockFlags);
  return options.filter((option) => parsed[option.key]).map((option) => option.label);
}

export function LockFlagsButton({
  lockFlags,
  options,
  onChange,
  disabled,
  small,
}: {
  lockFlags: unknown;
  options: Array<{ key: string; label: string }>;
  onChange: (next: Record<string, boolean>) => void;
  disabled?: boolean;
  small?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const flags = parseLockFlags(lockFlags);
  const activeCount = Object.values(flags).filter(Boolean).length;
  const hasAny = activeCount > 0;
  const iconSize = small ? 14 : 18;

  const toggle = (key: string) => {
    const next = { ...flags, [key]: !flags[key] };
    onChange(next);
  };

  return (
    <>
      <Tooltip title={hasAny ? `${activeCount} lock${activeCount === 1 ? '' : 's'}` : 'Lock fields'}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={disabled}
          sx={{ p: small ? 0.25 : 0.5 }}
        >
          {hasAny ? (
            <LockRoundedIcon sx={{ fontSize: iconSize, color: '#fbbf24' }} />
          ) : (
            <LockOpenRoundedIcon sx={{ fontSize: iconSize, color: '#94a3b8' }} />
          )}
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(9,12,18,0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            p: 1.25,
            minWidth: 180,
          },
        }}
      >
        <Typography sx={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 700, mb: 0.5 }}>
          Lock fields
        </Typography>
        <Stack>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.key}
              control={
                <Checkbox
                  size="small"
                  checked={Boolean(flags[opt.key])}
                  onChange={() => toggle(opt.key)}
                />
              }
              label={
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{opt.label}</Typography>
              }
              sx={{ m: 0 }}
            />
          ))}
        </Stack>
      </Popover>
    </>
  );
}
