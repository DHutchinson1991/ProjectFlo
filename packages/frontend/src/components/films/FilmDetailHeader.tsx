import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
    Button,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Save as SaveIcon,
    CloudDone as SavedIcon,
    Warning as UnsavedIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import type { Film } from "@/lib/types/domains/film";
import { FilmMetaDataGrid } from "./FilmMetaDataGrid";
import type { SaveState } from "@/lib/types/timeline";

interface FilmDetailHeaderProps {
    film: Film;
    filmId: number;
    sceneCount: number;
    totalDuration: number;
    trackCount: number;
    subjectCount: number;
    locationCount: number;
    onSceneCreated: () => void;
    onSaveFilm: (name: string) => Promise<void>;
    /** Save state for the film (save button + unsaved indicator) */
    saveState?: SaveState;
    /** Callback to trigger film save */
    onSaveContent?: () => void;
    /** Callback to open the Add Scenes dialog */
    onAddScenes?: () => void;
    /** Whether the film is read-only */
    readOnly?: boolean;
}

/**
 * FilmDetailHeader - Global project header for the Film Designer
 * Handles film title editing and displays real-time metadata summary
 */
export const FilmDetailHeader: React.FC<FilmDetailHeaderProps> = ({
    film,
    filmId,
    sceneCount,
    totalDuration,
    trackCount,
    subjectCount,
    locationCount,
    onSceneCreated,
    onSaveFilm,
    saveState,
    onSaveContent,
    onAddScenes,
    readOnly = false,
}) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(film.name);
    const [isSaving, setIsSaving] = useState(false);

    // Update local edit name if prop changes
    useEffect(() => {
        setEditName(film.name);
    }, [film.name]);

    const handleSave = async () => {
        if (!editName.trim() || editName === film.name) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSaveFilm(editName.trim());
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save film name:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditName(film.name);
        setIsEditing(false);
    };

    const handleSaveContent = useCallback(async () => {
        if (onSaveContent) {
            try {
                await onSaveContent();
            } catch (error) {
                console.error('Save failed:', error);
            }
        }
    }, [onSaveContent]);

    return (
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, py: 1.5, bgcolor: "#111" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <IconButton onClick={() => router.push("/designer/films")} size="large" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    <ArrowBackIcon />
                </IconButton>
                
                <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 4 }}>
                    {/* Title Section */}
                    <Box sx={{ minWidth: "200px" }}>
                        {isEditing ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <TextField
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSave();
                                        if (e.key === "Escape") handleCancel();
                                    }}
                                    autoFocus
                                    size="small"
                                    variant="standard"
                                    sx={{ 
                                        "& .MuiInput-root": {
                                            fontSize: "1.5rem", // slightly smaller to fit inline better
                                            fontWeight: 700,
                                            color: "white"
                                        }
                                    }}
                                />
                                <IconButton onClick={handleSave} disabled={isSaving || !editName.trim()} color="primary" size="small">
                                    {isSaving ? <CircularProgress size={20} /> : <CheckIcon fontSize="small" />}
                                </IconButton>
                                <IconButton onClick={handleCancel} disabled={isSaving} color="error" size="small">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {film.name}
                                </Typography>
                                <IconButton 
                                    onClick={() => setIsEditing(true)} 
                                    size="small" 
                                    sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Metadata Section - Shared inline */}
                    <FilmMetaDataGrid 
                        sceneCount={sceneCount}
                        totalDuration={totalDuration}
                        trackCount={trackCount}
                        subjectCount={subjectCount}
                        locationCount={locationCount}
                    />
                </Box>

                {/* Right Actions — Add Scenes + Save */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    {onAddScenes && (
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                            onClick={onAddScenes}
                            disabled={readOnly}
                            sx={{
                                height: 30,
                                px: 1.5,
                                borderRadius: 1.5,
                                borderColor: 'rgba(123, 97, 255, 0.4)',
                                color: 'rgba(200, 180, 255, 0.9)',
                                bgcolor: 'rgba(123, 97, 255, 0.08)',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                letterSpacing: '0.02em',
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    borderColor: 'rgba(123, 97, 255, 0.65)',
                                    bgcolor: 'rgba(123, 97, 255, 0.15)',
                                },
                                '&.Mui-disabled': {
                                    borderColor: 'rgba(100, 116, 139, 0.2)',
                                    color: 'rgba(148, 163, 184, 0.45)',
                                },
                            }}
                        >
                            Add Scenes
                        </Button>
                    )}

                    {saveState && onSaveContent && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleSaveContent}
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
                                    bgcolor: saveState.hasUnsavedChanges
                                        ? 'rgba(255, 193, 7, 0.15)'
                                        : 'rgba(76, 175, 80, 0.15)',
                                    color: saveState.hasUnsavedChanges
                                        ? 'rgba(255, 193, 7, 0.9)'
                                        : 'rgba(76, 175, 80, 0.9)',
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
                                        bgcolor: saveState.hasUnsavedChanges
                                            ? 'rgba(255, 193, 7, 0.25)'
                                            : 'rgba(76, 175, 80, 0.25)',
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 0.5,
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
                    )}
                </Box>
            </Box>
        </Box>
    );
};
