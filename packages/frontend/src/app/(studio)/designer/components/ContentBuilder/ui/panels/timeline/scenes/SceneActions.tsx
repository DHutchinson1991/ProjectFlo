"use client";

import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { 
    Close as CloseIcon, 
    DragIndicator as DragIcon
} from "@mui/icons-material";
import { TimelineScene } from "@/lib/types/timeline";

interface SceneActionsProps {
    scene: TimelineScene;
    onDelete?: (scene: TimelineScene) => void;
}

export const SceneActions: React.FC<SceneActionsProps> = ({
    scene,
    onDelete,
}) => {
    return (
        <Box
            className="scene-controls"
            sx={{
                position: 'absolute',
                right: 2,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'none', // Hidden by default, shown on parent hover
                gap: 0.5,
                zIndex: 50,
                bgcolor: 'rgba(0,0,0,0.7)',
                borderRadius: 1,
                padding: '2px 4px',
                alignItems: 'center',
                backdropFilter: 'blur(2px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
        >
            {/* Drag Handle */}
            <Tooltip title="Drag Scene">
                <Box sx={{ 
                    cursor: 'grab', 
                    display: 'flex', 
                    alignItems: 'center', 
                    opacity: 0.8,
                    px: 0.5,
                    "&:hover": { opacity: 1 }
                }}>
                    <DragIcon sx={{ fontSize: 14, color: "white" }} />
                </Box>
            </Tooltip>

            {/* Delete */}
            {onDelete && (
                <Tooltip title="Delete Scene">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(scene);
                        }}
                        sx={{
                            width: 20,
                            height: 20,
                            color: "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                                color: "#FF6B6B",
                                bgcolor: "rgba(255, 255, 255, 0.2)",
                            },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};
