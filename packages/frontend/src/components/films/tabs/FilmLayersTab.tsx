/**
 * Film Layers Tab - Display timeline layers
 */
import React from "react";
import { Box, Typography } from "@mui/material";

interface FilmLayersTabProps {
    layers: any[];
}

export const FilmLayersTab: React.FC<FilmLayersTabProps> = ({ layers }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Timeline Layers
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {layers.map((layer) => (
                    <Box
                        key={layer.id}
                        sx={{
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 1,
                            p: 1,
                        }}
                    >
                        <Typography variant="subtitle2">{layer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Order: {layer.order_index}
                        </Typography>
                    </Box>
                ))}
                {!layers.length && (
                    <Typography variant="body2" color="text.secondary">
                        No timeline layers found.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};
