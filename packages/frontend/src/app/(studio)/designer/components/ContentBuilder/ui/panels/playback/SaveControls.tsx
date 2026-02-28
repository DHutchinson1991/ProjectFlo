"use client";

import React from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import {
    Save as SaveIcon,
    CloudDone as SavedIcon,
    Warning as UnsavedIcon,
} from "@mui/icons-material";
import { SaveState } from "@/lib/types/timeline";

interface SaveControlsProps {
    saveState: SaveState;
    onSave: () => void;
    onAutoSaveToggle?: () => void;
    autoSaveEnabled?: boolean;
    readOnly?: boolean;
}

const SaveControls: React.FC<SaveControlsProps> = ({
    saveState,
    onSave,
    onAutoSaveToggle, // eslint-disable-line @typescript-eslint/no-unused-vars
    autoSaveEnabled, // eslint-disable-line @typescript-eslint/no-unused-vars
    readOnly = false,
}) => {
    const handleSaveClick = React.useCallback(async () => {
        console.log('💾 [SAVECONTROLS] Clicked save button');
        console.log('💾 [SAVECONTROLS] Before save - hasUnsavedChanges:', saveState?.hasUnsavedChanges);
        try {
            console.log('💾 [SAVECONTROLS] Awaiting onSave callback...');
            await onSave();
            console.log('✅ [SAVECONTROLS] Save completed');
            console.log('💾 [SAVECONTROLS] After save - hasUnsavedChanges:', saveState?.hasUnsavedChanges);
        } catch (error) {
            console.error('❌ [SAVECONTROLS] Save failed:', error);
        }
    }, [onSave, saveState]);

    const formatLastSaved = (date?: Date) => {
        if (!date) return "Never";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return "Just now";
        if (minutes === 1) return "1 minute ago";
        if (minutes < 60) return `${minutes} minutes ago`;

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return "1 hour ago";
        if (hours < 24) return `${hours} hours ago`;

        return date.toLocaleDateString();
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                // Remove background styling - handled by parent container
            }}
        >
            {/* Compact Save Button */}
            <Button
                variant="contained"
                onClick={handleSaveClick}
                disabled={readOnly || saveState.isSaving || !saveState.hasUnsavedChanges}
                startIcon={
                    saveState.isSaving ? (
                        <CircularProgress size={14} sx={{ color: "rgba(255, 255, 255, 0.8)" }} />
                    ) : saveState.hasUnsavedChanges ? (
                        <SaveIcon sx={{ fontSize: 16 }} />
                    ) : (
                        <SavedIcon sx={{ fontSize: 16 }} />
                    )
                }
                sx={{
                    bgcolor: saveState.hasUnsavedChanges
                        ? "rgba(255, 193, 7, 0.15)" // Amber warning color, subtle
                        : "rgba(76, 175, 80, 0.15)", // Green success color, subtle
                    color: saveState.hasUnsavedChanges
                        ? "rgba(255, 193, 7, 0.9)"
                        : "rgba(76, 175, 80, 0.9)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5,
                    height: "28px", // Smaller height to match compact design
                    minWidth: "72px", // Compact width
                    borderRadius: 1,
                    border: saveState.hasUnsavedChanges
                        ? "1px solid rgba(255, 193, 7, 0.2)"
                        : "1px solid rgba(76, 175, 80, 0.2)",
                    textTransform: "none",
                    backdropFilter: "blur(4px)",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                        bgcolor: saveState.hasUnsavedChanges
                            ? "rgba(255, 193, 7, 0.25)"
                            : "rgba(76, 175, 80, 0.25)",
                        borderColor: saveState.hasUnsavedChanges
                            ? "rgba(255, 193, 7, 0.4)"
                            : "rgba(76, 175, 80, 0.4)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    },
                    "&:disabled": {
                        bgcolor: "rgba(255, 255, 255, 0.03)",
                        color: "rgba(255, 255, 255, 0.3)",
                        borderColor: "rgba(255, 255, 255, 0.05)",
                        transform: "none",
                        boxShadow: "none",
                    },
                }}
            >
                {saveState.isSaving
                    ? "Saving"
                    : saveState.hasUnsavedChanges
                        ? "Save"
                        : "Saved"}
            </Button>

            {/* Compact Status Indicators */}
            {(saveState.hasUnsavedChanges || saveState.saveError) && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {saveState.hasUnsavedChanges && !saveState.isSaving && (
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            bgcolor: "rgba(255, 193, 7, 0.1)",
                            border: "1px solid rgba(255, 193, 7, 0.2)",
                        }}>
                            <UnsavedIcon sx={{
                                fontSize: 12,
                                color: "rgba(255, 193, 7, 0.8)"
                            }} />
                            <Typography sx={{
                                fontSize: "0.65rem",
                                fontWeight: 500,
                                color: "rgba(255, 193, 7, 0.9)",
                                lineHeight: 1,
                            }}>
                                Unsaved
                            </Typography>
                        </Box>
                    )}

                    {saveState.saveError && (
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            bgcolor: "rgba(244, 67, 54, 0.1)",
                            border: "1px solid rgba(244, 67, 54, 0.2)",
                        }}>
                            <Typography sx={{
                                fontSize: "0.65rem",
                                fontWeight: 500,
                                color: "rgba(244, 67, 54, 0.9)",
                                lineHeight: 1,
                            }}>
                                Error
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Compact Last Saved Info - only show if no unsaved changes */}
            {!saveState.hasUnsavedChanges && !saveState.saveError && saveState.lastSavedAt && (
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.4)",
                        fontSize: "0.6rem",
                        fontWeight: 400,
                        lineHeight: 1,
                    }}
                >
                    {formatLastSaved(saveState.lastSavedAt || undefined)}
                </Typography>
            )}
        </Box>
    );
};

export default SaveControls;
