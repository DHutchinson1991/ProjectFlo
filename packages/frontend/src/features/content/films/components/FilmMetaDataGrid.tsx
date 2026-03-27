import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import {
    Movie as MovieIcon,
    AccessTime as TimeIcon,
    Layers as TracksIcon,
    People as SubjectsIcon,
    PlaceOutlined as LocationsIcon,
} from "@mui/icons-material";
import { formatDuration } from "@/shared/utils/formatUtils";

interface FilmMetaDataGridProps {
    sceneCount: number;
    totalDuration: number;
    trackCount: number;
    subjectCount: number;
    locationCount: number;
}

/**
 * FilmMetaDataGrid - A horizontal grid of key metrics for the current film
 */
export const FilmMetaDataGrid: React.FC<FilmMetaDataGridProps> = ({
    sceneCount,
    totalDuration,
    trackCount,
    subjectCount,
    locationCount,
}) => {
    const metaItems: Array<{ label: string; value: string | number; icon: React.ReactElement; isPlaceholder?: boolean }> = [
        {
            label: "Scenes",
            value: sceneCount,
            icon: <MovieIcon sx={{ fontSize: 16, color: "primary.main" }} />,
        },
        {
            label: "Length",
            value: formatDuration(totalDuration),
            icon: <TimeIcon sx={{ fontSize: 16, color: "success.main" }} />,
        },
        {
            label: "Tracks",
            value: trackCount,
            icon: <TracksIcon sx={{ fontSize: 16, color: "warning.main" }} />,
        },
        {
            label: "Subjects",
            value: subjectCount,
            icon: <SubjectsIcon sx={{ fontSize: 16, color: "info.main" }} />,
        },
        {
            label: "Locations",
            value: locationCount,
            icon: <LocationsIcon sx={{ fontSize: 16, color: "secondary.main" }} />,
        },
    ];

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                mt: 1,
                py: 1,
                px: 2,
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.03)",
                width: "fit-content",
            }}
        >
            {metaItems.map((item, index) => (
                <React.Fragment key={item.label}>
                    {index > 0 && (
                        <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {item.icon}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    fontSize: "0.65rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: "rgba(255, 255, 255, 0.5)",
                                    lineHeight: 1,
                                    mb: 0.5,
                                }}
                            >
                                {item.label}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: item.isPlaceholder ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.9)",
                                    lineHeight: 1,
                                }}
                            >
                                {item.value}
                            </Typography>
                        </Box>
                    </Box>
                </React.Fragment>
            ))}
        </Box>
    );
};
