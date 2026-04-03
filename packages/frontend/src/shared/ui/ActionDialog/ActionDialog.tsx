'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';

export interface ActionDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  primaryLabel: string;
  primaryAction: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  loading?: boolean;
  error?: string | null;
  primaryDisabled?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function ActionDialog({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  primaryLabel,
  primaryAction,
  secondaryLabel = 'Cancel',
  secondaryAction,
  loading = false,
  error,
  primaryDisabled = false,
  maxWidth = 'sm',
}: ActionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(16, 18, 24, 0.98), rgba(12, 14, 18, 0.99))',
          border: '1px solid rgba(52, 58, 68, 0.4)',
          borderRadius: 2.5,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.25,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          {icon}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>{title}</Typography>
            {subtitle && (
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{subtitle}</Typography>
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: '#94a3b8' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        {children}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.25, pt: 0.5 }}>
        <Button
          variant="text"
          onClick={secondaryAction ?? onClose}
          disabled={loading}
          sx={{ color: '#94a3b8' }}
        >
          {secondaryLabel}
        </Button>
        <Button
          variant="contained"
          onClick={primaryAction}
          disabled={loading || primaryDisabled}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {primaryLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
