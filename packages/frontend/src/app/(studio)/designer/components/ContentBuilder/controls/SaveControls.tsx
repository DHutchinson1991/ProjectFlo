"use client";

import React from "react";
import { Box, Button, CircularProgress, Typography, Chip } from "@mui/material";
import {
    Save as SaveIcon,
    CloudDone as SavedIcon,
    Warning as UnsavedIcon,
} from "@mui/icons-material";
import { SaveState } from "../types/controlTypes";

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
    onAutoSaveToggle,
    autoSaveEnabled = true,
    readOnly = false,
}) => {
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
                gap: 2,
                p: 2,
                bgcolor: "rgba(8, 8, 12, 0.9)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
        >
            {/* Save Button */}
            <Button
                variant="contained"
                onClick={onSave}
                disabled={readOnly || saveState.isSaving || !saveState.hasUnsavedChanges}
                startIcon={
                    saveState.isSaving ? (
                        <CircularProgress size={16} sx={{ color: "white" }} />
                    ) : saveState.hasUnsavedChanges ? (
                        <SaveIcon />
                    ) : (
                        <SavedIcon />
                    )
                }
                sx={{
                    bgcolor: saveState.hasUnsavedChanges
                        ? "rgba(123, 97, 255, 0.8)"
                        : "rgba(76, 175, 80, 0.8)",
                    color: "white",
                    fontSize: "0.875rem",
                    px: 2,
                    py: 1,
                    "&:hover": {
                        bgcolor: saveState.hasUnsavedChanges
                            ? "rgba(123, 97, 255, 0.9)"
                            : "rgba(76, 175, 80, 0.9)",
                    },
                    "&:disabled": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.5)",
                    },
                }}
            >
                {saveState.isSaving
                    ? "Saving..."
                    : saveState.hasUnsavedChanges
                        ? "Save Changes"
                        : "Saved"}
            </Button>

            {/* Save Status */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {saveState.hasUnsavedChanges && !saveState.isSaving && (
                    <Chip
                        icon={<UnsavedIcon sx={{ fontSize: 14 }} />}
                        label="Unsaved Changes"
                        size="small"
                        sx={{
                            bgcolor: "rgba(255, 152, 0, 0.2)",
                            color: "rgba(255, 152, 0, 0.9)",
                            border: "1px solid rgba(255, 152, 0, 0.3)",
                            fontSize: "0.7rem",
                            height: 24,
                        }}
                    />
                )}

                {saveState.saveError && (
                    <Chip
                        label={saveState.saveError}
                        size="small"
                        sx={{
                            bgcolor: "rgba(244, 67, 54, 0.2)",
                            color: "rgba(244, 67, 54, 0.9)",
                            border: "1px solid rgba(244, 67, 54, 0.3)",
                            fontSize: "0.7rem",
                            height: 24,
                        }}
                    />
                )}
            </Box>

            {/* Last Saved Info */}
            <Typography
                variant="caption"
                sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.7rem",
                }}
            >
                Last saved: {formatLastSaved(saveState.lastSavedAt || undefined)}
            </Typography>

            {/* Auto Save Toggle */}
            {onAutoSaveToggle && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            fontSize: "0.7rem",
                        }}
                    >
                        Auto-save:
                    </Typography>
                    <Chip
                        label={autoSaveEnabled ? "ON" : "OFF"}
                        size="small"
                        onClick={!readOnly ? onAutoSaveToggle : undefined}
                        sx={{
                            bgcolor: autoSaveEnabled
                                ? "rgba(76, 175, 80, 0.2)"
                                : "rgba(158, 158, 158, 0.2)",
                            color: autoSaveEnabled
                                ? "rgba(76, 175, 80, 0.9)"
                                : "rgba(158, 158, 158, 0.9)",
                            border: autoSaveEnabled
                                ? "1px solid rgba(76, 175, 80, 0.3)"
                                : "1px solid rgba(158, 158, 158, 0.3)",
                            fontSize: "0.65rem",
                            height: 20,
                            cursor: readOnly ? "default" : "pointer",
                            "&:hover": readOnly ? {} : {
                                bgcolor: autoSaveEnabled
                                    ? "rgba(76, 175, 80, 0.3)"
                                    : "rgba(158, 158, 158, 0.3)",
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default SaveControls;
