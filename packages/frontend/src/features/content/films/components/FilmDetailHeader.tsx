import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import type { Film } from "@/features/content/films/types";
import { FilmMetaDataGrid } from "./FilmMetaDataGrid";
import type { SaveState } from "@/lib/types/timeline";
import { SaveStateButton } from "./SaveStateButton";

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
                        <SaveStateButton saveState={saveState} onSave={onSaveContent} readOnly={readOnly} />
                    )}
                </Box>
            </Box>
        </Box>
    );
};
