import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import type { Film } from "@/lib/types/domains/film";
import { FilmMetaDataGrid } from "./FilmMetaDataGrid";

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
            </Box>
        </Box>
    );
};
