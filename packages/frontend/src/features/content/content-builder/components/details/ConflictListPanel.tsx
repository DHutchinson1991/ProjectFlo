import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useMomentConflicts } from '@/features/content/shot-previews/hooks/useShotPreviews';
import type { MomentConflict } from '@/features/content/shot-previews/api/shot-previews.api';

interface ConflictListPanelProps {
    sceneMomentId: number | null;
    sourceType?: 'package' | 'project';
    packageSubjects?: Array<{ id: number; name: string }>;
}

/**
 * Phase D: Surfaces geometry vs. editorial-intent conflicts reported by
 * scene preparation. Geometry is never force-applied — mismatches are shown
 * here so the user (or shot director) can reconcile.
 */
export const ConflictListPanel: React.FC<ConflictListPanelProps> = ({
    sceneMomentId,
    sourceType = 'package',
    packageSubjects = [],
}) => {
    const { data, isLoading } = useMomentConflicts(sceneMomentId ?? undefined, sourceType);

    if (!sceneMomentId || isLoading) return null;
    const conflicts = data?.conflicts ?? [];
    if (conflicts.length === 0) return null;

    const resolveSubjectName = (id: number) =>
        packageSubjects.find((s) => s.id === id)?.name ?? `#${id}`;

    return (
        <Box
            sx={{
                mx: 0.5,
                mt: 0.5,
                px: 1,
                py: 0.75,
                bgcolor: 'rgba(244,196,48,0.06)',
                border: '1px solid rgba(244,196,48,0.2)',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningAmberRoundedIcon sx={{ fontSize: 13, color: 'rgba(244,196,48,0.7)' }} />
                <Typography
                    sx={{
                        fontSize: '0.6rem',
                        color: 'rgba(244,196,48,0.85)',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                    }}
                >
                    Blocking conflicts ({conflicts.length})
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {conflicts.map((c: MomentConflict, i: number) => (
                    <Tooltip
                        key={`${c.assignmentId}-${c.kind}-${i}`}
                        arrow
                        placement="top"
                        title={
                            c.kind === 'SHOT_TYPE_MISMATCH'
                                ? c.reason ?? 'Shot director intent does not match spatial inference.'
                                : 'Editorial targets are not within the camera FOV.'
                        }
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.65rem',
                                color: 'rgba(255,255,255,0.7)',
                            }}
                        >
                            <Chip
                                size="small"
                                label={c.trackName ?? `Cam ${c.assignmentId}`}
                                sx={{
                                    height: 16,
                                    fontSize: '0.55rem',
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.7)',
                                    '& .MuiChip-label': { px: 0.75 },
                                }}
                            />
                            {c.kind === 'SHOT_TYPE_MISMATCH' ? (
                                <Typography sx={{ fontSize: '0.65rem' }}>
                                    shot type:{' '}
                                    <Box component="span" sx={{ color: 'rgba(130,200,255,0.9)' }}>
                                        {c.editorial}
                                    </Box>{' '}
                                    vs geometry{' '}
                                    <Box component="span" sx={{ color: 'rgba(244,196,48,0.9)' }}>
                                        {c.geometric}
                                    </Box>
                                </Typography>
                            ) : (
                                <Typography sx={{ fontSize: '0.65rem' }}>
                                    targets not visible:{' '}
                                    <Box component="span" sx={{ color: 'rgba(244,196,48,0.9)' }}>
                                        {c.targetSubjectIds.map(resolveSubjectName).join(', ')}
                                    </Box>
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>
                ))}
            </Box>
        </Box>
    );
};
