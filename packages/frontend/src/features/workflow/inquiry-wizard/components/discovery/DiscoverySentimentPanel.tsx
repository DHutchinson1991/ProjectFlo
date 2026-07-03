'use client';

import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Stack,
    TextField,
    Switch,
} from '@mui/material';
import {
    Check,
    MicNone,
    MicOff,
    CheckCircleOutline,
} from '@mui/icons-material';
import { getPhaseWidgets, getStepMeta } from '../../constants/discovery-questionnaire-config';
import type { PhaseWidget } from '../../constants/discovery-questionnaire-config';
import { TagChipInput } from '@/shared/ui/ChipInput';

export interface DiscoverySentimentPanelProps {
    sectionName: string;
    sentiment: Record<string, string>;
    onChange: (key: string, val: string | null) => void;
    recordingConsent: boolean | null;
    onRecordingConsentChange: (consent: boolean) => void;
}

export function DiscoverySentimentPanel({ sectionName, sentiment, onChange, recordingConsent, onRecordingConsentChange }: DiscoverySentimentPanelProps) {
    const widgets = getPhaseWidgets(sectionName);
    const meta = getStepMeta(sectionName);

    const renderWidget = (w: PhaseWidget) => {
        switch (w.type) {
            case 'pills': {
                return (
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {w.options?.map((opt) => {
                            const isSelected = sentiment[w.key] === opt;
                            const color = w.colors?.[opt] ?? '#64748b';
                            return (
                                <Box
                                    key={opt}
                                    onClick={() => onChange(w.key, isSelected ? null : opt)}
                                    sx={{
                                        px: 2,
                                        py: 0.75,
                                        fontSize: '0.73rem',
                                        fontWeight: 700,
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: `1px solid ${isSelected ? `${color}60` : 'rgba(100,116,139,0.12)'}`,
                                        bgcolor: isSelected ? `${color}18` : 'rgba(255,255,255,0.02)',
                                        color: isSelected ? color : '#64748b',
                                        boxShadow: isSelected ? `0 0 16px ${color}25, inset 0 0 12px ${color}08` : 'none',
                                        backdropFilter: 'blur(8px)',
                                        letterSpacing: '0.01em',
                                        '&:hover': {
                                            bgcolor: isSelected ? `${color}25` : 'rgba(255,255,255,0.05)',
                                            borderColor: isSelected ? `${color}80` : 'rgba(100,116,139,0.3)',
                                            transform: 'scale(1.03)',
                                            boxShadow: isSelected ? `0 0 20px ${color}35, inset 0 0 12px ${color}10` : `0 0 8px rgba(100,116,139,0.08)`,
                                        },
                                    }}
                                >
                                    {opt}
                                </Box>
                            );
                        })}
                    </Box>
                );
            }
            case 'multi-chip': {
                const selected: string[] = (() => {
                    try { return JSON.parse(sentiment[w.key] || '[]'); } catch { return []; }
                })();
                return (
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {w.options?.map((opt) => {
                            const isSelected = selected.includes(opt);
                            return (
                                <Chip
                                    key={opt}
                                    label={opt}
                                    size="small"
                                    onClick={() => {
                                        const next = isSelected ? selected.filter((s) => s !== opt) : [...selected, opt];
                                        onChange(w.key, JSON.stringify(next));
                                    }}
                                    icon={isSelected ? <Check sx={{ fontSize: 12 }} /> : undefined}
                                    sx={{
                                        height: 28,
                                        fontSize: '0.73rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        bgcolor: isSelected ? `${meta.accent}15` : 'rgba(255,255,255,0.02)',
                                        color: isSelected ? meta.accent : '#64748b',
                                        border: `1px solid ${isSelected ? `${meta.accent}40` : 'rgba(100,116,139,0.1)'}`,
                                        backdropFilter: 'blur(8px)',
                                        boxShadow: isSelected ? `0 0 10px ${meta.accent}15` : 'none',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: isSelected ? `${meta.accent}22` : 'rgba(255,255,255,0.05)',
                                            transform: 'scale(1.03)',
                                        },
                                    }}
                                />
                            );
                        })}
                    </Box>
                );
            }
            case 'tag-chips': {
                const tags: string[] = (() => {
                    try { return JSON.parse(sentiment[w.key] || '[]'); } catch { return []; }
                })();
                return (
                    <TagChipInput
                        tags={tags}
                        onChange={(next) => onChange(w.key, JSON.stringify(next))}
                        placeholder={w.placeholder}
                    />
                );
            }
            case 'checklist': {
                const checked: string[] = (() => {
                    try { return JSON.parse(sentiment[w.key] || '[]'); } catch { return []; }
                })();
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {w.options?.map((opt) => {
                            const isChecked = checked.includes(opt);
                            return (
                                <Box
                                    key={opt}
                                    onClick={() => {
                                        const next = isChecked ? checked.filter((c) => c !== opt) : [...checked, opt];
                                        onChange(w.key, JSON.stringify(next));
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.25,
                                        px: 1.5,
                                        py: 0.75,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        bgcolor: isChecked ? 'rgba(16,185,129,0.04)' : 'transparent',
                                        border: `1px solid ${isChecked ? 'rgba(16,185,129,0.12)' : 'transparent'}`,
                                        '&:hover': { bgcolor: isChecked ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)', borderColor: isChecked ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.08)' },
                                    }}
                                >
                                    <Box sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '6px',
                                        border: `1.5px solid ${isChecked ? '#10b981' : 'rgba(100,116,139,0.25)'}`,
                                        bgcolor: isChecked ? 'rgba(16,185,129,0.12)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                        boxShadow: isChecked ? '0 0 8px rgba(16,185,129,0.2)' : 'none',
                                    }}>
                                        {isChecked && <Check sx={{ fontSize: 14, color: '#10b981' }} />}
                                    </Box>
                                    <Typography sx={{
                                        fontSize: '0.8rem',
                                        color: isChecked ? '#e2e8f0' : '#64748b',
                                        fontWeight: isChecked ? 600 : 400,
                                        transition: 'all 0.2s',
                                    }}>
                                        {opt}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                );
            }
            case 'date-picker': {
                const val = sentiment[w.key] ?? '';
                return (
                    <TextField
                        type="date"
                        size="small"
                        value={val}
                        onChange={(e) => onChange(w.key, e.target.value || null)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            width: 180,
                            '& .MuiInputBase-root': {
                                bgcolor: 'rgba(255,255,255,0.03)',
                                color: '#e2e8f0',
                                fontSize: '0.8rem',
                                borderRadius: 1.5,
                                height: 34,
                            },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.15)' },
                            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                            '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 1.5 },
                            '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
                        }}
                    />
                );
            }
            default:
                return null;
        }
    };

    const filledCount = widgets.filter((w) => {
        const v = sentiment[w.key];
        if (!v) return false;
        if (w.type === 'multi-chip' || w.type === 'tag-chips' || w.type === 'checklist') {
            try { return JSON.parse(v).length > 0; } catch { return false; }
        }
        return true;
    }).length;

    return (
        <Stack spacing={2.5}>
            {/* Phase header with progress counter */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1.5,
                borderBottom: `1px solid ${meta.accent}10`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${meta.accent}20, ${meta.accent}08)`,
                        border: `1px solid ${meta.accent}25`,
                    }}>
                        {React.cloneElement(meta.icon as React.ReactElement, { sx: { fontSize: 14, color: meta.accent } })}
                    </Box>
                    <Typography sx={{
                        color: '#f1f5f9',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        letterSpacing: '-0.01em',
                    }}>
                        {sectionName === 'Call Opening' ? 'Reading the Room' :
                         sectionName === 'The Connection' ? 'Understanding the Couple' :
                         sectionName === 'The Discovery' ? 'Understanding the Vision' :
                         sectionName === 'The Solution' ? 'Gauging Reaction' :
                         sectionName === 'The Close' ? 'Securing Next Steps' : sectionName}
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '12px',
                    bgcolor: filledCount > 0 ? `${meta.accent}08` : 'rgba(100,116,139,0.04)',
                    border: `1px solid ${filledCount > 0 ? `${meta.accent}15` : 'rgba(100,116,139,0.08)'}`,
                }}>
                    <Typography sx={{ color: filledCount > 0 ? meta.accent : '#475569', fontSize: '0.68rem', fontWeight: 700 }}>
                        {filledCount}
                    </Typography>
                    <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>/</Typography>
                    <Typography sx={{ color: '#475569', fontSize: '0.68rem', fontWeight: 500 }}>
                        {widgets.length + (sectionName === 'Call Opening' ? 1 : 0)}
                    </Typography>
                </Box>
            </Box>

            {/* Widgets */}
            {widgets.map((w) => (
                <Box key={w.key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                        <Box sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: sentiment[w.key] ? meta.accent : 'rgba(100,116,139,0.2)',
                            boxShadow: sentiment[w.key] ? `0 0 6px ${meta.accent}50` : 'none',
                            transition: 'all 0.3s',
                        }} />
                        <Typography sx={{
                            color: sentiment[w.key] ? '#cbd5e1' : '#64748b',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'color 0.3s',
                        }}>
                            {w.label}
                        </Typography>
                    </Box>
                    {renderWidget(w)}
                </Box>
            ))}

            {/* Audio recording toggle — only in Call Opening */}
            {sectionName === 'Call Opening' && (
                <Box sx={{
                    mt: 1,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: recordingConsent === true
                        ? 'rgba(16,185,129,0.04)'
                        : 'rgba(100,116,139,0.03)',
                    border: `1px solid ${
                        recordingConsent === true
                            ? 'rgba(16,185,129,0.15)'
                            : recordingConsent === false
                                ? 'rgba(239,68,68,0.1)'
                                : 'rgba(100,116,139,0.08)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(8px)',
                    '&:hover': { bgcolor: 'rgba(100,116,139,0.05)' },
                }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: recordingConsent === true
                            ? 'rgba(16,185,129,0.1)'
                            : 'rgba(100,116,139,0.06)',
                        border: `1px solid ${
                            recordingConsent === true
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(100,116,139,0.08)'
                        }`,
                        transition: 'all 0.3s ease',
                    }}>
                        {recordingConsent === true ? (
                            <MicNone sx={{ fontSize: 16, color: '#10b981' }} />
                        ) : recordingConsent === false ? (
                            <MicOff sx={{ fontSize: 16, color: '#ef4444' }} />
                        ) : (
                            <MicNone sx={{ fontSize: 16, color: '#475569' }} />
                        )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>
                            Audio Recording
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.25 }}>
                            Consent to transcript recording?
                        </Typography>
                    </Box>
                    {recordingConsent === true && (
                        <CheckCircleOutline sx={{ fontSize: 14, color: '#10b981' }} />
                    )}
                    <Switch
                        size="small"
                        checked={recordingConsent === true}
                        onChange={(_, checked) => onRecordingConsentChange(checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                            '& .MuiSwitch-track': { bgcolor: 'rgba(100,116,139,0.25)' },
                        }}
                    />
                </Box>
            )}
        </Stack>
    );
}
