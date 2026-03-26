import React, { useMemo } from 'react';
import { Box, Typography, CardContent, Stack, Chip } from '@mui/material';
import { PersonOutline as PersonIcon } from '@mui/icons-material';
import type { WorkflowCardProps } from '../lib';
import { WorkflowCard } from './WorkflowCard';

interface ClientUpdateLog {
    id: number;
    type: string;
    description: string;
    metadata?: { changed_fields?: string[]; source?: string; selected_package_id?: number | null };
    created_at: string;
}

const ClientUpdatesCard: React.FC<WorkflowCardProps> = ({ inquiry, isActive, activeColor }) => {
    const clientUpdates = useMemo(() => {
        if (!inquiry.activity_logs) return [];
        return (inquiry.activity_logs as ClientUpdateLog[]).filter(
            (log) => log.type === 'client_update' || log.type === 'package_request',
        );
    }, [inquiry.activity_logs]);

    return (
        <WorkflowCard sx={{ height: 'fit-content' }} isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                        <PersonIcon sx={{ fontSize: 18, color: '#a855f7' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Client Updates</Typography>
                    {clientUpdates.length > 0 && (
                        <Chip label={clientUpdates.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }} />
                    )}
                </Box>

                <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    {clientUpdates.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.12)' }}>
                                <PersonIcon sx={{ fontSize: 22, color: '#a855f7' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No client updates yet</Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Changes made by the client from their portal will appear here</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={0}>
                            {clientUpdates.map((update, index) => (
                                <Box key={update.id} sx={{ display: 'flex', gap: 1.5, py: 1.25, position: 'relative' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: index === 0 ? '#a855f7' : '#334155', border: index === 0 ? '2px solid rgba(168, 85, 247, 0.3)' : 'none' }} />
                                        {index < clientUpdates.length - 1 && <Box sx={{ width: 1.5, flex: 1, bgcolor: 'rgba(52, 58, 68, 0.2)', mt: 0.5 }} />}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                                            {update.description}
                                        </Typography>
                                        {update.metadata?.changed_fields && update.metadata.changed_fields.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {update.metadata.changed_fields.map((field) => (
                                                    <Chip
                                                        key={field}
                                                        label={field}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: '0.6rem', fontWeight: 600,
                                                            bgcolor: 'rgba(168, 85, 247, 0.08)',
                                                            color: '#a855f7',
                                                            border: '1px solid rgba(168, 85, 247, 0.15)',
                                                            '& .MuiChip-label': { px: 0.75 },
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.25 }}>
                                            {new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            {update.metadata?.source === 'portal' && ' — via portal'}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            </CardContent>
        </WorkflowCard>
    );
};

export { ClientUpdatesCard };
