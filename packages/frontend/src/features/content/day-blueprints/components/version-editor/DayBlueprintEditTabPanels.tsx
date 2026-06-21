'use client';

import type { ReactNode } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { DayBlueprintSpaceSlot, DayBlueprintSubjectRoleLink } from '../../types';

function PanelShell({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2, height: '100%', overflow: 'auto' }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', mb: 1.5 }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

export function DayBlueprintPeopleTabPanel({
    subjectRoles,
}: {
    subjectRoles: DayBlueprintSubjectRoleLink[];
}) {
    return (
        <PanelShell title="Subject roles">
            {subjectRoles.length === 0 ? (
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    No subject roles linked to this blueprint version yet.
                </Typography>
            ) : (
                <Stack spacing={1}>
                    {subjectRoles.map((link) => (
                        <Box
                            key={link.id}
                            sx={{
                                px: 1.5,
                                py: 1.25,
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                bgcolor: 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {link.subject_role?.role_name ?? `Role #${link.subject_role_id}`}
                                </Typography>
                                {link.is_primary ? (
                                    <Chip label="Primary" size="small" sx={{ height: 20, fontSize: '0.62rem' }} />
                                ) : null}
                                {link.typical_count != null ? (
                                    <Chip
                                        label={`×${link.typical_count}`}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.62rem', color: '#94a3b8' }}
                                    />
                                ) : null}
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}
        </PanelShell>
    );
}

export function DayBlueprintSpacesTabPanel({
    spaceSlots,
}: {
    spaceSlots: DayBlueprintSpaceSlot[];
}) {
    return (
        <PanelShell title="Spaces">
            {spaceSlots.length === 0 ? (
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    No spaces configured for this blueprint version yet.
                </Typography>
            ) : (
                <Stack spacing={1}>
                    {spaceSlots.map((slot) => (
                        <Box
                            key={slot.id}
                            sx={{
                                px: 1.5,
                                py: 1.25,
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                bgcolor: 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                                {slot.label?.trim() || slot.key}
                            </Typography>
                            {slot.location_role?.display_name ? (
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.35 }}>
                                    {slot.location_role.display_name}
                                </Typography>
                            ) : null}
                            {slot.description ? (
                                <Typography sx={{ color: '#64748b', fontSize: '0.76rem', mt: 0.5 }}>
                                    {slot.description}
                                </Typography>
                            ) : null}
                        </Box>
                    ))}
                </Stack>
            )}
        </PanelShell>
    );
}
