'use client';
import React from 'react';
import { Box, Typography, Grid, Chip, Stack } from '@mui/material';
import {
    Person, Event, Videocam, AttachMoney, Schedule, Chat, Phone, Notes, HelpOutline,
} from '@mui/icons-material';
import { fmtVal } from '../lib';

const SECTION_ICONS: Record<string, React.ReactElement> = {
    Contact: <Person sx={{ fontSize: 15 }} />,
    Event: <Event sx={{ fontSize: 15 }} />,
    Coverage: <Videocam sx={{ fontSize: 15 }} />,
    Budget: <AttachMoney sx={{ fontSize: 15 }} />,
    Timeline: <Schedule sx={{ fontSize: 15 }} />,
    Communication: <Chat sx={{ fontSize: 15 }} />,
    'Discovery Call': <Phone sx={{ fontSize: 15 }} />,
    Notes: <Notes sx={{ fontSize: 15 }} />,
    Other: <HelpOutline sx={{ fontSize: 15 }} />,
};

interface SectionEntry { key: string; label: string; value: unknown; }
interface Section { label: string; entries: SectionEntry[]; }

interface Props { sections: Section[]; }

export default function IwSubmissionSections({ sections }: Props) {
    if (sections.length === 0) {
        return (
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', py: 3, textAlign: 'center' }}>
                No responses recorded.
            </Typography>
        );
    }

    return (
        <Grid container spacing={2.5}>
            {sections.map((group, gi) => (
                <Grid item xs={12} sm={6} key={gi}>
                    <Box sx={{ height: '100%', borderRadius: 2.5, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(52, 58, 68, 0.25)', overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderBottom: '1px solid rgba(52, 58, 68, 0.2)', bgcolor: 'rgba(255, 255, 255, 0.015)' }}>
                            <Box sx={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
                                {SECTION_ICONS[group.label] ?? <HelpOutline sx={{ fontSize: 15 }} />}
                            </Box>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {group.label}
                            </Typography>
                            <Chip label={group.entries.length} size="small" sx={{ ml: 'auto', height: 18, minWidth: 24, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', '& .MuiChip-label': { px: 0.75 } }} />
                        </Box>
                        <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
                            {group.entries.map((entry, ei) => (
                                <Box key={entry.key} sx={{ py: 1, borderBottom: ei < group.entries.length - 1 ? '1px solid rgba(52, 58, 68, 0.12)' : 'none' }}>
                                    <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
                                        {entry.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {fmtVal(entry.value)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}
