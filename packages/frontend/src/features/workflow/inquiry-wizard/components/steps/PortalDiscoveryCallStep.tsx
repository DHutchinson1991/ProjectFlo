'use client';
import React from 'react';
import { Box, Typography, TextField, Chip, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { PortalColors } from '../../constants/public-wizard-theme';
import { CONTACT_TIME_OPTIONS } from '../../constants/public-wizard-theme';

type AnyRecord = Record<string, unknown>;

interface Props {
    responses: AnyRecord;
    onChange: (key: string, val: unknown) => void;
    colors: PortalColors;
    fieldSx: object;
    cardSx: object;
}

const CALL_METHODS = [
    { key: 'Phone Call', emoji: '📞' },
    { key: 'Video Call', emoji: '🎥' },
];

export default function PortalDiscoveryCallStep({ responses, onChange, colors, fieldSx, cardSx }: Props) {
    return (
        <Stack spacing={2.5}>
            <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                <Typography sx={{ color: colors.accent, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>
                    Call Method
                </Typography>
                <Typography sx={{ color: alpha(colors.text, 0.8), fontWeight: 500, mb: 2.5, fontSize: '0.9rem' }}>
                    How would you like your discovery call?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {CALL_METHODS.map(({ key, emoji }) => {
                        const active = responses.discovery_call_method === key;
                        return (
                            <Box key={key} onClick={() => onChange('discovery_call_method', active ? '' : key)}
                                sx={{
                                    flex: 1, p: 3, borderRadius: '16px', cursor: 'pointer', textAlign: 'center',
                                    border: `1.5px solid ${active ? colors.accent : colors.border}`,
                                    bgcolor: active ? alpha(colors.accent, 0.1) : alpha(colors.card, 0.5),
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.08) },
                                }}
                            >
                                <Typography sx={{ fontSize: '2rem', mb: 1 }}>{emoji}</Typography>
                                <Typography sx={{ color: active ? colors.text : alpha(colors.text, 0.7), fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}>
                                    {key}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                <Typography sx={{ color: colors.accent, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>
                    Preferred Date
                </Typography>
                <TextField type="date" value={responses.discovery_call_date || ''} onChange={(e) => onChange('discovery_call_date', e.target.value)}
                    fullWidth sx={fieldSx} InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                />
            </Box>

            <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                <Typography sx={{ color: colors.accent, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>
                    Preferred Time
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {CONTACT_TIME_OPTIONS.map((opt) => {
                        const sel = responses.discovery_call_time === opt;
                        return (
                            <Chip key={opt} label={opt} size="small"
                                onClick={() => onChange('discovery_call_time', sel ? '' : opt)}
                                sx={{
                                    cursor: 'pointer', fontSize: '0.78rem', height: 32,
                                    color: sel ? colors.text : colors.muted,
                                    bgcolor: sel ? alpha(colors.accent, 0.15) : alpha(colors.text, 0.04),
                                    border: `1px solid ${sel ? alpha(colors.accent, 0.4) : alpha(colors.border, 0.5)}`,
                                    '& .MuiChip-label': { px: 1.5 },
                                    '&:hover': { bgcolor: sel ? alpha(colors.accent, 0.2) : alpha(colors.text, 0.07) },
                                    transition: 'all 0.15s',
                                }}
                            />
                        );
                    })}
                </Box>
            </Box>
        </Stack>
    );
}
