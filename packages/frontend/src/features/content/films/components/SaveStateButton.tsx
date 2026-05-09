import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
    CloudDone as SavedIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import type { SaveState } from '@/features/content/content-builder/types/timeline';

interface SaveStateButtonProps {
    saveState: SaveState;
    onSave?: () => void;
    readOnly?: boolean;
}

export const SaveStateButton: React.FC<SaveStateButtonProps> = ({ saveState }) => {
    if (saveState.saveError) {
        return (
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.5, borderRadius: 1,
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
            }}>
                <ErrorIcon sx={{ fontSize: 14, color: 'rgba(244, 67, 54, 0.9)' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'rgba(244, 67, 54, 0.9)', lineHeight: 1 }}>
                    Save failed
                </Typography>
            </Box>
        );
    }

    if (saveState.isSaving) {
        return (
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.5, borderRadius: 1,
                bgcolor: 'rgba(255, 193, 7, 0.08)',
                border: '1px solid rgba(255, 193, 7, 0.15)',
            }}>
                <CircularProgress size={12} sx={{ color: 'rgba(255, 193, 7, 0.8)' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'rgba(255, 193, 7, 0.8)', lineHeight: 1 }}>
                    Saving…
                </Typography>
            </Box>
        );
    }

    if (!saveState.hasUnsavedChanges) {
        return (
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.5, borderRadius: 1,
                bgcolor: 'rgba(76, 175, 80, 0.08)',
                border: '1px solid rgba(76, 175, 80, 0.15)',
            }}>
                <SavedIcon sx={{ fontSize: 14, color: 'rgba(76, 175, 80, 0.8)' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'rgba(76, 175, 80, 0.8)', lineHeight: 1 }}>
                    Saved
                </Typography>
            </Box>
        );
    }

    // hasUnsavedChanges but not saving yet (waiting for debounce)
    return null;
};
