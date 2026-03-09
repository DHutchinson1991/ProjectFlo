import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Button, Stack, TextField, Divider, Chip } from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { activityLogsService } from '@/lib/api';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ActivityLogCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [noteText, setNoteText] = useState('');
    const [activities, setActivities] = useState<Array<{ id: number; description: string; created_at: string }>>([]);

    useEffect(() => {
        if (inquiry?.activity_logs) {
            setActivities(
                (inquiry.activity_logs as Array<{ id: number; description: string; created_at: string }>) || []
            );
        }
    }, [inquiry]);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;

        try {
            await activityLogsService.logNote(inquiry.id, noteText);
            setNoteText('');
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    return (
        <WorkflowCard sx={{ height: 'fit-content', minHeight: '600px' }} isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                        <Timeline sx={{ fontSize: 18, color: '#3b82f6' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Activity Log</Typography>
                    {activities.length > 0 && <Chip label={activities.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />}
                </Box>

                <Box sx={{ mb: 2.5 }}>
                    <TextField
                        placeholder="Add a note about this inquiry..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(52, 58, 68, 0.08)' } }}
                    />
                    <Button onClick={handleAddNote} disabled={!noteText.trim()} size="small" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                        Add Note
                    </Button>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(52, 58, 68, 0.15)' }} />

                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {activities.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.12)' }}>
                                <Timeline sx={{ fontSize: 22, color: '#3b82f6' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No activity yet</Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Notes and actions will appear here</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={0}>
                            {activities.map((activity, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1.5, py: 1.25, position: 'relative' }}>
                                    {/* Timeline dot + line */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: index === 0 ? '#3b82f6' : '#334155', border: index === 0 ? '2px solid rgba(59, 130, 246, 0.3)' : 'none' }} />
                                        {index < activities.length - 1 && <Box sx={{ width: 1.5, flex: 1, bgcolor: 'rgba(52, 58, 68, 0.2)', mt: 0.5 }} />}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.5 }}>{activity.description}</Typography>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.25 }}>
                                            {new Date(activity.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

export { ActivityLogCard };
