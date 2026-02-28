import React from 'react';
import { Box } from '@mui/material';

interface FilmDetailsPanelProps {
    scenes?: any[];
    totalDuration?: number;
    rightPanel?: React.ReactNode;
}

/**
 * FilmDetailsPanel Component
 * Displays film metadata and details on the right sidebar
 * Extracted for cleaner main component structure
 */
export const FilmDetailsPanel: React.FC<FilmDetailsPanelProps> = ({
    scenes,
    totalDuration,
    rightPanel,
}) => {
    const safeScenes = Array.isArray(scenes) ? scenes : [];
    const safeDuration = Number.isFinite(totalDuration) ? (totalDuration as number) : 0;
    // If custom panel provided, use it
    if (rightPanel) {
        return (
            <Box sx={{
                width: "25%",
                minWidth: "280px",
                maxWidth: "400px",
                borderRight: "1px solid #333",
                background: "#151515",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "12px",
                flexShrink: 0,
                overflow: "hidden",
                '@media (max-width: 1200px)': {
                    width: '100%',
                    maxWidth: '100%',
                    borderRight: 'none',
                    borderBottom: '1px solid #333'
                }
            }}>
                <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
                    {rightPanel}
                </Box>
            </Box>
        );
    }

    // Default film details panel
    return (
        <Box sx={{
            width: "25%",
            minWidth: "280px",
            maxWidth: "400px",
            borderRight: "1px solid #333",
            background: "#151515",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "12px",
            flexShrink: 0,
            overflow: "hidden",
            '@media (max-width: 1200px)': {
                width: '100%',
                maxWidth: '100%',
                borderRight: 'none',
                borderBottom: '1px solid #333'
            }
        }}>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%"
            }}>
                {/* Header */}
                <Box sx={{
                    borderBottom: "1px solid #333",
                    paddingBottom: 1,
                    marginBottom: 1
                }}>
                    <Box sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 0.5
                    }}>
                        Film Details
                    </Box>
                    <Box sx={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.7)"
                    }}>
                        Project information and metadata
                    </Box>
                </Box>

                {/* Film Info Sections */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flex: 1,
                    overflow: "auto"
                }}>
                    {/* Project Info */}
                    <Box>
                        <Box sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginBottom: 0.5
                        }}>
                            Project
                        </Box>
                        <Box sx={{
                            fontSize: "11px",
                            color: "rgba(255, 255, 255, 0.6)",
                            padding: "4px 8px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: 1,
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            Untitled Project
                        </Box>
                    </Box>

                    {/* Duration */}
                    <Box>
                        <Box sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginBottom: 0.5
                        }}>
                            Duration
                        </Box>
                        <Box sx={{
                            fontSize: "11px",
                            color: "rgba(255, 255, 255, 0.6)",
                            padding: "4px 8px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: 1,
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            {Math.floor(safeDuration / 60)}:{String(Math.floor(safeDuration % 60)).padStart(2, '0')}
                        </Box>
                    </Box>

                    {/* Scene Count */}
                    <Box>
                        <Box sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginBottom: 0.5
                        }}>
                            Scenes
                        </Box>
                        <Box sx={{
                            fontSize: "11px",
                            color: "rgba(255, 255, 255, 0.6)",
                            padding: "4px 8px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: 1,
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            {safeScenes.length} scene{safeScenes.length !== 1 ? 's' : ''}
                        </Box>
                    </Box>

                    {/* Additional details placeholder */}
                    <Box sx={{
                        marginTop: "auto",
                        padding: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        borderRadius: 1,
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        fontSize: "11px",
                        color: "rgba(255, 255, 255, 0.5)",
                        textAlign: "center"
                    }}>
                        More details coming soon...
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
