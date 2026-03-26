/**
 * Film Settings Tab - Edit film metadata
 */
import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import type { Film } from "@/features/content/films/types";

interface FilmSettingsTabProps {
    film: Film;
    onSave: (name: string) => Promise<void>;
}

export const FilmSettingsTab: React.FC<FilmSettingsTabProps> = ({ film, onSave }) => {
    const [editName, setEditName] = useState(film.name);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEditName(film.name);
    }, [film.name]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(editName.trim());
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Film Settings
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                    label="Film Name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    size="small"
                    fullWidth
                />
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !editName.trim() || editName.trim() === film.name}
                >
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </Box>
        </Box>
    );
};
