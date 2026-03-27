"use client";

import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { getPhaseConfig, hexToRgba } from "@/shared/ui/tasks";
import { Add as AddIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

interface PhaseTabBarProps {
    phases: { phase: string; count: number; activeCount: number }[];
    activePhase: string;
    onPhaseChange: (phase: string) => void;
    onAddTask: (phase: string) => void;
}

export function PhaseTabBar({ phases, activePhase, onPhaseChange, onAddTask }: PhaseTabBarProps) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1, py: 1,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 0 },
        }}>
            {phases.map(({ phase, count }) => {
                const cfg = getPhaseConfig(phase);
                const isActive = phase === activePhase;
                const Icon = cfg.icon;

                return (
                    <Box
                        key={phase}
                        onClick={() => onPhaseChange(phase)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.75, py: 0.75,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                            bgcolor: isActive ? hexToRgba(cfg.color, 0.12) : 'transparent',
                            border: '1px solid',
                            borderColor: isActive ? hexToRgba(cfg.color, 0.3) : 'transparent',
                            '&:hover': {
                                bgcolor: hexToRgba(cfg.color, isActive ? 0.16 : 0.06),
                            },
                        }}
                    >
                        <Icon sx={{ fontSize: 15, color: isActive ? cfg.color : 'rgba(255,255,255,0.35)' }} />
                        <Typography sx={{
                            fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                            color: isActive ? cfg.color : 'rgba(255,255,255,0.5)',
                            whiteSpace: 'nowrap',
                        }}>
                            {cfg.label}
                        </Typography>
                        {count > 0 && (
                            <Chip
                                label={count}
                                size="small"
                                sx={{
                                    height: 18, minWidth: 18,
                                    fontSize: '0.625rem', fontWeight: 700,
                                    bgcolor: isActive ? hexToRgba(cfg.color, 0.2) : 'rgba(255,255,255,0.06)',
                                    color: isActive ? cfg.color : 'rgba(255,255,255,0.4)',
                                    '& .MuiChip-label': { px: 0.5 },
                                }}
                            />
                        )}
                    </Box>
                );
            })}

            {/* Add task to active phase */}
            <Tooltip title="Add task to this phase" arrow>
                <IconButton
                    onClick={() => onAddTask(activePhase)}
                    size="small"
                    sx={{
                        ml: 'auto', width: 28, height: 28, flexShrink: 0,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                >
                    <AddIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}
