'use client';
import React from 'react';
import { Box, Typography, TextField, FormControl, Select, MenuItem, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import AddressAutocomplete, { type AddressResult } from '@/shared/ui/AddressAutocomplete/AddressAutocomplete';
import type { PortalColors } from '../../constants/public-wizard-theme';
import type { InquiryWizardQuestion } from '../../types';
import { CONTACT_TIME_OPTIONS, LOCATION_FIELD_KEYS, fadeInUp } from '../../constants/public-wizard-theme';

interface Props {
    question: InquiryWizardQuestion;
    index: number;
    value: unknown;
    error?: string;
    onChange: (key: string, value: unknown) => void;
    colors: PortalColors;
    fieldSx: object;
    cardSx: object;
}

export default function PortalQuestionCard({ question: q, index: idx, value: val, error: err, onChange, colors, fieldSx, cardSx }: Props) {
    const key = q.field_key || `question_${q.id}`;
    const isFilled = val !== '' && val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0);
    const opts: string[] = (q.options as { values?: string[] })?.values ?? [];
    const isContactTime = key === 'preferred_contact_time' || key.toLowerCase().includes('contact_time');
    const isAddress = q.field_type === 'address' || LOCATION_FIELD_KEYS.has(key);

    const chipSx = (selected: boolean) => ({
        fontSize: '0.78rem', height: 32, cursor: 'pointer',
        color: selected ? colors.text : colors.muted,
        bgcolor: selected ? alpha(colors.accent, 0.15) : alpha(colors.text, 0.04),
        border: `1px solid ${selected ? alpha(colors.accent, 0.4) : alpha(colors.border, 0.5)}`,
        '& .MuiChip-label': { px: 1.5 },
        '&:hover': { bgcolor: selected ? alpha(colors.accent, 0.2) : alpha(colors.text, 0.07) },
        transition: 'all 0.15s',
    });

    return (
        <Box sx={{
            ...cardSx, p: { xs: 3, md: 3.5 },
            borderColor: isFilled ? alpha(colors.accent, 0.25) : undefined,
            bgcolor: isFilled ? alpha(colors.accent, 0.06) : alpha(colors.card, 0.7),
            animation: `${fadeInUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.06}s both`,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: isFilled ? colors.accent : alpha(colors.border, 0.5),
                    color: isFilled ? '#fff' : colors.muted,
                    fontSize: '0.68rem', fontWeight: 700, transition: 'all 0.2s',
                }}>
                    {isFilled ? <CheckIcon sx={{ fontSize: 14 }} /> : idx + 1}
                </Box>
                <Typography sx={{ color: alpha(colors.text, 0.9), fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>
                    {q.prompt}
                    {q.required && <Box component="span" sx={{ color: '#ef4444', ml: 0.5 }}>*</Box>}
                </Typography>
            </Box>

            {q.help_text && (
                <Typography sx={{ color: colors.muted, fontSize: '0.78rem', mb: 1.5, lineHeight: 1.5 }}>{q.help_text}</Typography>
            )}

            {isContactTime ? (
                <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {CONTACT_TIME_OPTIONS.map((opt) => (
                            <Chip key={opt} label={opt} size="small"
                                onClick={() => onChange(key, val === opt ? '' : opt)}
                                sx={chipSx(val === opt)}
                            />
                        ))}
                    </Box>
                    {err && <Typography sx={{ color: '#ef4444', fontSize: '0.72rem', mt: 0.75 }}>{err}</Typography>}
                </Box>
            ) : q.field_type === 'multiselect' && opts.length > 0 ? (
                <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {opts.map((opt) => {
                            const selected = Array.isArray(val) && val.includes(opt);
                            return (
                                <Chip key={opt} label={opt} size="small"
                                    onClick={() => {
                                        const cur: string[] = Array.isArray(val) ? val : [];
                                        onChange(key, selected ? cur.filter((x) => x !== opt) : [...cur, opt]);
                                    }}
                                    sx={chipSx(selected)}
                                />
                            );
                        })}
                    </Box>
                    {err && <Typography sx={{ color: '#ef4444', fontSize: '0.72rem', mt: 0.75 }}>{err}</Typography>}
                </Box>
            ) : q.field_type === 'select' && opts.length > 0 ? (
                <FormControl fullWidth>
                    <Select value={(val as string) || ''} displayEmpty onChange={(e) => onChange(key, e.target.value)}
                        sx={{ color: colors.text, borderRadius: '12px', fontSize: '0.9rem', bgcolor: alpha(colors.card, 0.5), '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(colors.border, 0.6) }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(colors.accent, 0.4) }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent, borderWidth: '1.5px' }, '& .MuiSvgIcon-root': { color: colors.muted } }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', mt: 0.5, '& .MuiMenuItem-root': { color: alpha(colors.text, 0.8), fontSize: '0.875rem', '&:hover': { bgcolor: alpha(colors.accent, 0.1) }, '&.Mui-selected': { bgcolor: alpha(colors.accent, 0.12), color: colors.text } } } } }}
                    >
                        <MenuItem value="" disabled sx={{ color: colors.muted, fontSize: '0.875rem' }}>Select an option</MenuItem>
                        {opts.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </Select>
                    {err && <Typography sx={{ color: '#ef4444', fontSize: '0.72rem', mt: 0.5 }}>{err}</Typography>}
                </FormControl>
            ) : q.field_type === 'textarea' ? (
                <TextField value={val} multiline rows={3} placeholder={q.prompt} onChange={(e) => onChange(key, e.target.value)}
                    required={Boolean(q.required)} error={Boolean(err)} helperText={err} fullWidth sx={fieldSx} />
            ) : isAddress ? (
                <AddressAutocomplete
                    value={(val as string) || ''} placeholder={q.prompt || 'Search for address…'} colors={colors} error={err}
                    onSelect={(result: AddressResult | null) => {
                        if (result) {
                            onChange(key, result.display_name);
                            onChange(`${key}_lat`, result.lat); onChange(`${key}_lng`, result.lng);
                            onChange(`${key}_address`, result.display_name); onChange(`${key}_postcode`, result.postcode || ''); onChange(`${key}_city`, result.city || '');
                            if (key === 'ceremony_location') { onChange('venue_lat', result.lat); onChange('venue_lng', result.lng); onChange('venue_address', result.display_name); }
                        } else {
                            onChange(key, ''); onChange(`${key}_lat`, null); onChange(`${key}_lng`, null);
                            onChange(`${key}_address`, null); onChange(`${key}_postcode`, ''); onChange(`${key}_city`, '');
                            if (key === 'ceremony_location') { onChange('venue_lat', null); onChange('venue_lng', null); onChange('venue_address', null); }
                        }
                    }}
                />
            ) : (
                <TextField value={val} placeholder={q.field_type === 'date' ? undefined : q.prompt}
                    onChange={(e) => onChange(key, e.target.value)}
                    type={q.field_type === 'date' ? 'date' : q.field_type === 'email' ? 'email' : 'text'}
                    required={Boolean(q.required)} error={Boolean(err)} helperText={err}
                    fullWidth InputLabelProps={q.field_type === 'date' ? { shrink: true } : undefined} sx={fieldSx}
                />
            )}
        </Box>
    );
}
