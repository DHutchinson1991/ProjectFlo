'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import type { PortalColors } from '../../constants/public-wizard-theme';

interface WizardStep {
    key: string;
    label: string;
    description?: string;
}

interface Props {
    steps: WizardStep[];
    currentStepIdx: number;
    onStepClick: (idx: number) => void;
    colors: PortalColors;
    cardSx: object;
}

export default function PortalStepIndicator({ steps, currentStepIdx, onStepClick, colors, cardSx }: Props) {
    const currentStep = steps[currentStepIdx];

    return (
        <Box sx={cardSx}>
            <Box sx={{ px: { xs: 3, md: 4 }, pt: { xs: 2.5, md: 3 }, pb: 1 }}>
                <Typography sx={{ color: colors.accent, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.65rem', fontWeight: 700 }}>
                    Progress
                </Typography>
            </Box>
            <Box sx={{ px: { xs: 3, md: 4 }, pb: { xs: 2.5, md: 3 } }}>
                {/* Scrollable step list */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', overflowX: 'auto', pb: 1, mt: 1.5,
                    '&::-webkit-scrollbar': { height: 4, display: 'block' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: alpha(colors.border, 0.6), borderRadius: 2 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                }}>
                    {steps.map((step, idx) => {
                        const isActive = idx === currentStepIdx;
                        const isDone = !isActive && idx < currentStepIdx;
                        const isClickable = idx < currentStepIdx;
                        return (
                            <React.Fragment key={step.key}>
                                <Box
                                    onClick={() => isClickable ? onStepClick(idx) : undefined}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        px: 1.5, py: 0.75, borderRadius: '10px',
                                        cursor: isClickable ? 'pointer' : 'default',
                                        flexShrink: 0, transition: 'all 0.2s',
                                        bgcolor: isActive ? alpha(colors.accent, 0.12) : 'transparent',
                                        border: `1px solid ${isActive ? alpha(colors.accent, 0.3) : 'transparent'}`,
                                        '&:hover': isClickable ? { bgcolor: alpha(colors.text, 0.04) } : {},
                                    }}
                                >
                                    <Box sx={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: isActive ? colors.accent : isDone ? alpha('#22c55e', 0.15) : alpha(colors.border, 0.6),
                                        border: `1.5px solid ${isActive ? colors.accent : isDone ? alpha('#22c55e', 0.5) : colors.border}`,
                                        fontSize: '0.65rem', fontWeight: 700,
                                        color: isActive ? '#fff' : isDone ? '#22c55e' : colors.muted,
                                        flexShrink: 0, transition: 'all 0.2s',
                                    }}>
                                        {isDone ? <CheckIcon sx={{ fontSize: 12 }} /> : idx + 1}
                                    </Box>
                                    <Typography sx={{
                                        fontSize: '0.78rem', fontWeight: isActive ? 600 : 400,
                                        color: isActive ? colors.text : isDone ? alpha(colors.text, 0.7) : colors.muted,
                                        whiteSpace: 'nowrap', transition: 'color 0.2s',
                                    }}>
                                        {step.label}
                                    </Typography>
                                </Box>
                                {idx < steps.length - 1 && (
                                    <Box sx={{ width: 20, height: 1, mx: 0.25, flexShrink: 0, bgcolor: idx < currentStepIdx ? alpha('#22c55e', 0.4) : alpha(colors.border, 0.5), transition: 'background 0.3s' }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </Box>

                {/* Progress bar */}
                <Box sx={{ mt: 2, height: 3, borderRadius: 2, bgcolor: alpha(colors.border, 0.5), overflow: 'hidden' }}>
                    <Box sx={{
                        height: '100%',
                        width: `${((currentStepIdx + 1) / steps.length) * 100}%`,
                        background: `linear-gradient(90deg, ${colors.gradient1}, ${colors.gradient2})`,
                        borderRadius: 2, transition: 'width 0.4s ease',
                    }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                        <Typography sx={{ color: colors.text, fontSize: '1.05rem', fontWeight: 600 }}>{currentStep?.label}</Typography>
                        {currentStep?.description && (
                            <Typography sx={{ color: colors.muted, fontSize: '0.8rem', mt: 0.3 }}>{currentStep.description}</Typography>
                        )}
                    </Box>
                    <Typography sx={{ color: colors.muted, fontSize: '0.75rem' }}>
                        Step {currentStepIdx + 1} of {steps.length}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
