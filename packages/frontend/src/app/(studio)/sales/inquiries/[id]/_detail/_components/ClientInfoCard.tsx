'use client';

import React from 'react';
import { Box, Typography, CardContent, Stack } from '@mui/material';
import { People, Person, Groups, Notes } from '@mui/icons-material';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ACCENT = '#06b6d4'; // cyan

const ClientInfoCard: React.FC<WorkflowCardProps> = ({ isActive, activeColor, submission }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    const partnerName = responses.partner_name;
    const guestCount = responses.guest_count;
    const specialRequests = responses.special_requests;
    const birthdayPerson = responses.birthday_person_name;
    const birthdayRelation = responses.birthday_relation;
    const isBirthdayPerson = responses.is_birthday_person;

    const hasData = partnerName || guestCount || specialRequests || birthdayPerson;

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor} sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                        width: 32, height: 32,
                        borderRadius: 2,
                        bgcolor: 'rgba(6,182,212,0.1)',
                        border: '1px solid rgba(6,182,212,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <People sx={{ fontSize: 18, color: ACCENT }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                        Client Info
                    </Typography>
                </Box>

                {!hasData ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                            No assessment data yet
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {/* Partner name */}
                        {partnerName && (
                            <InfoRow
                                icon={<Person sx={{ fontSize: 16, color: '#94a3b8' }} />}
                                label="Partner"
                                value={partnerName}
                            />
                        )}

                        {/* Birthday person (non-wedding events) */}
                        {birthdayPerson && (
                            <InfoRow
                                icon={<Person sx={{ fontSize: 16, color: '#94a3b8' }} />}
                                label="Birthday Person"
                                value={`${birthdayPerson}${birthdayRelation ? ` (${birthdayRelation})` : ''}`}
                            />
                        )}
                        {isBirthdayPerson === 'yes' && !birthdayPerson && (
                            <InfoRow
                                icon={<Person sx={{ fontSize: 16, color: '#94a3b8' }} />}
                                label="Birthday Person"
                                value="Contact is the birthday person"
                            />
                        )}

                        {/* Guest count */}
                        {guestCount && (
                            <InfoRow
                                icon={<Groups sx={{ fontSize: 16, color: '#94a3b8' }} />}
                                label="Guests"
                                value={guestCount}
                            />
                        )}

                        {/* Special requests */}
                        {specialRequests && (
                            <Box sx={{
                                mt: 0.5,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(6,182,212,0.04)',
                                border: '1px solid rgba(6,182,212,0.08)',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <Notes sx={{ fontSize: 14, color: '#94a3b8' }} />
                                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                        Special Requests
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                    {specialRequests}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

/* ── tiny helper ────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', minWidth: 70 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>
                {value}
            </Typography>
        </Box>
    );
}

export default ClientInfoCard;
