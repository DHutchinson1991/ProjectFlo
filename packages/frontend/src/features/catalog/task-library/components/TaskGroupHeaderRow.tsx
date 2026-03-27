"use client";

import React from "react";
import {
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import {
    FolderOpen as FolderOpenIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { TaskLibrary } from "@/features/catalog/task-library/types";

interface TaskGroupHeaderRowProps {
    stage: TaskLibrary;
    childCount: number;
    onQuickAdd: (stageId: number) => void;
}

export function TaskGroupHeaderRow({ stage, childCount, onQuickAdd }: TaskGroupHeaderRowProps) {
    const color = 'rgba(255, 255, 255, 0.6)';

    return (
        <Box
            sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1,
                background: `linear-gradient(90deg, ${color}18 0%, transparent 100%)`,
                borderLeft: `3px solid ${color}`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <FolderOpenIcon sx={{ fontSize: 16, color: color, opacity: 0.8 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: color, letterSpacing: 0.3 }}>
                {stage.name}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                {childCount} task{childCount !== 1 ? 's' : ''}
            </Typography>
            {stage.description && (
                <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>
                    — {stage.description}
                </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton
                onClick={() => onQuickAdd(stage.id)}
                size="small"
                sx={{
                    width: 22, height: 22, color: color, opacity: 0.5,
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 1, bgcolor: `${color}15` },
                }}
            >
                <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Box>
    );
}
