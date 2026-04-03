'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Notes } from '@mui/icons-material';
import type { EventNotesSectionProps } from './types';

const EventNotesSection: React.FC<EventNotesSectionProps> = ({
    partnerName,
    specialRequests,
    birthdayPerson,
    birthdayRelation,
    isBirthdayPerson,
}) => {
    const showSection = partnerName || specialRequests || birthdayPerson || isBirthdayPerson === 'yes';
    if (!showSection) return null;

    return (
        <Box sx={{ px: 2.5, py: 1.75, borderTop: '1px solid rgba(52, 58, 68, 0.3)' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                {partnerName && (
                    <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.4 }}>
                            Partner
                        </Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                            {partnerName}
                        </Typography>
                    </Box>
                )}

                {(birthdayPerson || isBirthdayPerson === 'yes') && (
                    <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.4 }}>
                            Birthday Person
                        </Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                            {birthdayPerson
                                ? `${birthdayPerson}${birthdayRelation ? ` (${birthdayRelation})` : ''}`
                                : 'Contact is the birthday person'}
                        </Typography>
                    </Box>
                )}
            </Box>

            {specialRequests && (
                <Box sx={{ mt: 1.2, p: 1.2, borderRadius: 2, bgcolor: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.08)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.45 }}>
                        <Notes sx={{ fontSize: 14, color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Special Requests
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {specialRequests}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default EventNotesSection;
