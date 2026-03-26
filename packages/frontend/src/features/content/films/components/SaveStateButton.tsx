import React, { useCallback } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import {
    Save as SaveIcon,
    CloudDone as SavedIcon,
    Warning as UnsavedIcon,
} from '@mui/icons-material';
import type { SaveState } from '@/lib/types/timeline';

interface SaveStateButtonProps {
    saveState: SaveState;
    onSave: () => void;
    readOnly?: boolean;
}

export const SaveStateButton: React.FC<SaveStateButtonProps> = ({ saveState, onSave, readOnly }) => {
    const handleSave = useCallback(async () => {
        try { await onSave(); } catch (error) { console.error('Save failed:', error); }
    }, [onSave]);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
                variant="contained"
                onClick={handleSave}
                disabled={readOnly || saveState.isSaving || !saveState.hasUnsavedChanges}
                startIcon={
                    saveState.isSaving ? (
                        <CircularProgress size={14} sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    ) : saveState.hasUnsavedChanges ? (
                        <SaveIcon sx={{ fontSize: 16 }} />
                    ) : (
                        <SavedIcon sx={{ fontSize: 16 }} />
                    )
                }
                sx={{
                    bgcolor: saveState.hasUnsavedChanges ? 'rgba(255, 193, 7, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                    color: saveState.hasUnsavedChanges ? 'rgba(255, 193, 7, 0.9)' : 'rgba(76, 175, 80, 0.9)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5,
                    height: 28,
                    minWidth: 72,
                    borderRadius: 1,
                    border: saveState.hasUnsavedChanges
                        ? '1px solid rgba(255, 193, 7, 0.2)'
                        : '1px solid rgba(76, 175, 80, 0.2)',
                    textTransform: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        bgcolor: saveState.hasUnsavedChanges ? 'rgba(255, 193, 7, 0.25)' : 'rgba(76, 175, 80, 0.25)',
                    },
                    '&:disabled': {
                        bgcolor: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.3)',
                        borderColor: 'rgba(255,255,255,0.05)',
                    },
                }}
            >
                {saveState.isSaving ? 'Saving' : saveState.hasUnsavedChanges ? 'Save' : 'Saved'}
            </Button>

            {saveState.hasUnsavedChanges && !saveState.isSaving && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1, py: 0.25, borderRadius: 0.5,
                    bgcolor: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                }}>
                    <UnsavedIcon sx={{ fontSize: 12, color: 'rgba(255, 193, 7, 0.8)' }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'rgba(255, 193, 7, 0.9)', lineHeight: 1 }}>
                        Unsaved
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
