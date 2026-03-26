/**
 * Film Scenes Tab - Display film scenes list
 */
import React from "react";
import { Box, Typography } from "@mui/material";
import type { Film } from "@/features/content/films/types";

interface FilmScenesTabProps {
    film: Film;
}

export const FilmScenesTab: React.FC<FilmScenesTabProps> = ({ film }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Scenes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {film.scenes?.length ?? 0} scenes in this film
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {(film.scenes || []).map((scene) => (
                    <Box
                        key={scene.id}
                        sx={{
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 1,
                            p: 1,
                        }}
                    >
                        <Typography variant="subtitle2">{scene.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {scene.moments?.length ?? 0} moments
                        </Typography>
                    </Box>
                ))}
                {!film.scenes?.length && (
                    <Typography variant="body2" color="text.secondary">
                        No scenes yet. Use Add Scene to create one.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};
