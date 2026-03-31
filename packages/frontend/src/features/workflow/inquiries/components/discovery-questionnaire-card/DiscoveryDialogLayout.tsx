import React from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    Paper,
    Chip,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Close,
    Send,
    Check,
    VisibilityOffOutlined,
    MicNone,
    MicOff,
    ArrowForward,
    ArrowBack,
    AutoAwesome,
    Lock,
} from '@mui/icons-material';
import type {
    DiscoveryQuestionnaireSubmission,
    DiscoveryQuestion,
} from '@/features/workflow/inquiries/types';
import { getStepMeta } from '../../constants/discovery-questionnaire-config';

// ─── DialogHeader ─────────────────────────────────────────────────────────────

export interface DialogHeaderProps {
    sections: { name: string; questions: DiscoveryQuestion[] }[];
    sectionIndex: number;
    setSectionIndex: (i: number) => void;
    loading: boolean;
    submitted: boolean;
    accentColor: string;
    customerName?: string;
    sectionHasAnswers: (s: { name: string; questions: DiscoveryQuestion[] }) => boolean;
    onClose: () => void;
}

export function DialogHeader({
    sections,
    sectionIndex,
    setSectionIndex,
    loading,
    submitted,
    accentColor,
    customerName,
    sectionHasAnswers,
    onClose,
}: DialogHeaderProps) {
    return (
        <Box sx={{ px: 4, pt: 3, pb: 0, flexShrink: 0, position: 'relative' }}>
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: 1,
                background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
                transition: 'background 0.5s ease',
            }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${accentColor}10`,
                        border: `1px solid ${accentColor}25`,
                        boxShadow: `0 0 20px ${accentColor}15`,
                        transition: 'all 0.5s ease',
                    }}>
                        <MicNone sx={{ color: accentColor, fontSize: 20, transition: 'color 0.5s ease' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                            Discovery Call
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.3, mt: 0.25 }}>
                            {customerName ? `with ${customerName}` : 'Navigate freely between phases'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        color: '#475569',
                        width: 32,
                        height: 32,
                        border: '1px solid rgba(100,116,139,0.1)',
                        borderRadius: '10px',
                        '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(100,116,139,0.2)' },
                    }}
                >
                    <Close sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {!loading && !submitted && sections.length > 0 && (
                <JourneyStepper
                    sections={sections}
                    sectionIndex={sectionIndex}
                    setSectionIndex={setSectionIndex}
                    accentColor={accentColor}
                    sectionHasAnswers={sectionHasAnswers}
                />
            )}

            <Box sx={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}15 30%, ${accentColor}15 70%, transparent)`, mx: -4, transition: 'background 0.5s ease' }} />
        </Box>
    );
}

// ─── JourneyStepper ───────────────────────────────────────────────────────────

function JourneyStepper({
    sections,
    sectionIndex,
    setSectionIndex,
    accentColor,
    sectionHasAnswers,
}: {
    sections: { name: string; questions: DiscoveryQuestion[] }[];
    sectionIndex: number;
    setSectionIndex: (i: number) => void;
    accentColor: string;
    sectionHasAnswers: (s: { name: string; questions: DiscoveryQuestion[] }) => boolean;
}) {
    return (
        <Box sx={{ position: 'relative', pb: 3, pt: 1, px: 2 }}>
            <Box sx={{
                position: 'absolute',
                top: 24,
                left: '10%',
                right: '10%',
                height: 2,
                bgcolor: 'rgba(100,116,139,0.06)',
                borderRadius: 1,
                zIndex: 0,
            }} />
            <Box sx={{
                position: 'absolute',
                top: 23,
                left: '10%',
                width: sections.length > 1 ? `${(sectionIndex / (sections.length - 1)) * 80}%` : '0%',
                height: 3,
                background: `linear-gradient(90deg, ${getStepMeta(sections[0]?.name ?? '').accent}, ${accentColor})`,
                borderRadius: 2,
                zIndex: 1,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 16px ${accentColor}50, 0 0 4px ${accentColor}40`,
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: -4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: accentColor,
                    boxShadow: `0 0 12px ${accentColor}90, 0 0 4px ${accentColor}`,
                    display: sectionIndex > 0 ? 'block' : 'none',
                },
            }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {sections.map((s, i) => {
                    const isActive = i === sectionIndex;
                    const isPast = i < sectionIndex;
                    const isFuture = i > sectionIndex;
                    const meta = getStepMeta(s.name);
                    const hasAnswers = sectionHasAnswers(s);
                    return (
                        <Box
                            key={s.name}
                            onClick={() => setSectionIndex(i)}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                flex: 1,
                                transition: 'all 0.25s',
                                '&:hover .step-node': {
                                    transform: isActive ? 'scale(1.05)' : 'scale(1.12)',
                                    borderColor: isFuture ? 'rgba(148,163,184,0.25)' : undefined,
                                },
                                '&:hover .step-label': {
                                    color: isFuture ? '#94a3b8' : undefined,
                                },
                            }}
                        >
                            <Box
                                className="step-node"
                                sx={{
                                    width: isActive ? 48 : 42,
                                    height: isActive ? 48 : 42,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    color: isActive ? '#fff' : isPast ? '#10b981' : '#475569',
                                    background: isActive
                                        ? `linear-gradient(135deg, ${meta.accent}30, ${meta.accent}15)`
                                        : isPast
                                            ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
                                            : 'rgba(100,116,139,0.03)',
                                    backdropFilter: 'blur(12px)',
                                    border: `1.5px solid ${
                                        isActive ? `${meta.accent}90` : isPast ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.08)'
                                    }`,
                                    boxShadow: isActive
                                        ? `0 0 24px ${meta.accent}35, 0 4px 16px ${meta.accent}20, inset 0 1px 0 rgba(255,255,255,0.1)`
                                        : isPast
                                            ? '0 0 12px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.04)'
                                            : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    ...(isActive && {
                                        animation: 'nodeGlow 3s ease-in-out infinite',
                                        '@keyframes nodeGlow': {
                                            '0%, 100%': { boxShadow: `0 0 24px ${meta.accent}35, 0 4px 16px ${meta.accent}20, inset 0 1px 0 rgba(255,255,255,0.1)` },
                                            '50%': { boxShadow: `0 0 36px ${meta.accent}50, 0 4px 24px ${meta.accent}30, inset 0 1px 0 rgba(255,255,255,0.1)` },
                                        },
                                    }),
                                }}
                            >
                                {isPast && hasAnswers ? (
                                    <Check sx={{ fontSize: 18, color: '#10b981' }} />
                                ) : (
                                    React.cloneElement(meta.icon as React.ReactElement, {
                                        sx: { fontSize: isActive ? 20 : 17 },
                                    })
                                )}
                            </Box>
                            <Typography
                                className="step-label"
                                sx={{
                                    fontSize: isActive ? '0.76rem' : '0.72rem',
                                    fontWeight: isActive ? 700 : isPast ? 600 : 500,
                                    color: isActive ? '#f8fafc' : isPast ? '#94a3b8' : '#3e4759',
                                    textAlign: 'center',
                                    lineHeight: 1.2,
                                    transition: 'all 0.3s',
                                    maxWidth: 100,
                                    letterSpacing: isActive ? '0.02em' : 0,
                                }}
                            >
                                {s.name.replace('The ', '')}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({ section, sectionIndex, totalSections }: { section: { name: string; questions: DiscoveryQuestion[] }; sectionIndex: number; totalSections: number }) {
    const meta = getStepMeta(section.name);
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            borderBottom: `1px solid ${meta.accent}15`,
        }}>
            <Box sx={{
                width: 4,
                height: 32,
                borderRadius: 2,
                background: `linear-gradient(180deg, ${meta.accent}, ${meta.accent}40)`,
                boxShadow: `0 0 12px ${meta.accent}40`,
            }} />
            <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    {section.name}
                </Typography>
                <Typography sx={{ color: `${meta.accent}90`, fontWeight: 500, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.25 }}>
                    Phase {sectionIndex + 1} of {totalSections}
                </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            {section.questions[0]?.visibility === 'internal' && (
                <Chip
                    icon={<VisibilityOffOutlined sx={{ fontSize: 11 }} />}
                    label="Internal only"
                    size="small"
                    sx={{ height: 22, fontSize: '0.65rem', bgcolor: 'rgba(100,116,139,0.06)', color: '#64748b', border: '1px solid rgba(100,116,139,0.1)', backdropFilter: 'blur(8px)' }}
                />
            )}
        </Box>
    );
}

// ─── ScriptHintBlock ──────────────────────────────────────────────────────────

export function ScriptHintBlock({ hint, accentColor }: { hint: string; accentColor: string }) {
    const paras = hint.split('\n\n');
    return (
        <Paper elevation={0} sx={{
            p: 2.5,
            mb: 2.5,
            bgcolor: `${accentColor}06`,
            background: `linear-gradient(135deg, ${accentColor}08 0%, rgba(59,130,246,0.02) 100%)`,
            border: `1px solid ${accentColor}12`,
            borderLeft: `3px solid ${accentColor}50`,
            borderRadius: '6px 14px 14px 6px',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: `linear-gradient(90deg, ${accentColor}30, transparent 80%)`,
            },
        }}>
            <Box>
                {paras.map((para, i) => (
                    <Typography key={i} sx={{
                        color: '#c8d8e8',
                        fontSize: '0.88rem',
                        lineHeight: 1.75,
                        fontWeight: 400,
                        mb: i < paras.length - 1 ? 1.5 : 0,
                        whiteSpace: 'pre-line',
                    }}>
                        {para}
                    </Typography>
                ))}
            </Box>
        </Paper>
    );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

export interface BottomNavProps {
    prevSectionName: string | null;
    nextSectionName: string | null;
    sectionIndex: number;
    setSectionIndex: (i: number) => void;
    accentColor: string;
    saving: boolean;
    existingSubmission?: DiscoveryQuestionnaireSubmission | null;
    onSubmit: () => void;
}

export function BottomNav({
    prevSectionName,
    nextSectionName,
    sectionIndex,
    setSectionIndex,
    accentColor,
    saving,
    existingSubmission,
    onSubmit,
}: BottomNavProps) {
    return (
        <Box sx={{
            px: 3.5,
            py: 2,
            borderTop: '1px solid rgba(100,116,139,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            bgcolor: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${accentColor}20 50%, transparent)`,
            },
        }}>
            {prevSectionName && (
                <Button
                    size="small"
                    onClick={() => setSectionIndex(sectionIndex - 1)}
                    startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                    sx={{
                        color: '#64748b',
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 1.5,
                        '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)' },
                    }}
                >
                    {prevSectionName.replace('The ', '')}
                </Button>
            )}
            <Box sx={{ flex: 1 }} />
            {nextSectionName ? (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => setSectionIndex(sectionIndex + 1)}
                    endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                    sx={{
                        bgcolor: accentColor,
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                        textTransform: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        px: 3,
                        py: 0.8,
                        borderRadius: 2.5,
                        boxShadow: `0 4px 16px ${accentColor}35, 0 1px 3px rgba(0,0,0,0.2)`,
                        border: `1px solid ${accentColor}40`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: accentColor,
                            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                            boxShadow: `0 6px 24px ${accentColor}45, 0 2px 6px rgba(0,0,0,0.3)`,
                            transform: 'translateY(-1px)',
                        },
                    }}
                >
                    Next: {nextSectionName.replace('The ', '')}
                </Button>
            ) : (
                <Button
                    variant="contained"
                    size="small"
                    onClick={onSubmit}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <Send sx={{ fontSize: 14 }} />}
                    sx={{
                        bgcolor: '#10b981',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        textTransform: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        px: 3,
                        py: 0.8,
                        borderRadius: 2.5,
                        boxShadow: '0 4px 16px rgba(16,185,129,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(16,185,129,0.4)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: '#059669',
                            boxShadow: '0 6px 24px rgba(16,185,129,0.4), 0 2px 6px rgba(0,0,0,0.3)',
                            transform: 'translateY(-1px)',
                        },
                        '&:disabled': { bgcolor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.3)', boxShadow: 'none', border: '1px solid rgba(16,185,129,0.1)' },
                    }}
                >
                    {saving ? 'Saving...' : existingSubmission ? 'Update Notes' : 'Save Notes'}
                </Button>
            )}
        </Box>
    );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────

export function SuccessScreen({ existingSubmission, onClose }: { existingSubmission?: DiscoveryQuestionnaireSubmission | null; onClose: () => void }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2.5 }}>
            <Box sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(16,185,129,0.08)',
                border: '2px solid rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(16,185,129,0.15), 0 0 80px rgba(16,185,129,0.08)',
                animation: 'successPulse 2s ease-in-out infinite',
                '@keyframes successPulse': {
                    '0%, 100%': { boxShadow: '0 0 40px rgba(16,185,129,0.15), 0 0 80px rgba(16,185,129,0.08)' },
                    '50%': { boxShadow: '0 0 50px rgba(16,185,129,0.25), 0 0 100px rgba(16,185,129,0.12)' },
                },
            }}>
                <Check sx={{ fontSize: 36, color: '#10b981' }} />
            </Box>
            <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
                Discovery Notes Saved!
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                {existingSubmission
                    ? 'Your call notes have been updated.'
                    : 'The Discovery Call task has been automatically completed.'}
            </Typography>
            <Button
                variant="outlined"
                onClick={onClose}
                size="small"
                sx={{
                    color: '#94a3b8',
                    borderColor: 'rgba(100,116,139,0.2)',
                    textTransform: 'none',
                    mt: 1.5,
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(255,255,255,0.04)' },
                }}
            >
                Close
            </Button>
        </Box>
    );
}

// ─── TranscriptSection ────────────────────────────────────────────────────────

export function TranscriptSection({
    recordingConsent,
    transcript,
    onTranscriptChange,
}: {
    recordingConsent: boolean | null;
    transcript: string;
    onTranscriptChange: (val: string) => void;
}) {
    return (
        <Box sx={{
            borderTop: '1px solid rgba(100,116,139,0.06)',
            px: 3,
            py: 2,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '35%',
            minHeight: 130,
            bgcolor: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.12), transparent)',
            },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: recordingConsent === true ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.06)',
                    border: `1px solid ${recordingConsent === true ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.08)'}`,
                }}>
                    <MicNone sx={{ fontSize: 13, color: recordingConsent === true ? '#3b82f6' : '#334155' }} />
                </Box>
                <Typography sx={{
                    color: recordingConsent === true ? '#94a3b8' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                }}>
                    Transcript
                </Typography>
                {recordingConsent === true ? (
                    <Chip
                        size="small"
                        label="Consent given"
                        sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)', ml: 'auto', backdropFilter: 'blur(8px)' }}
                    />
                ) : (
                    <Chip
                        icon={<Lock sx={{ fontSize: 10 }} />}
                        size="small"
                        label="Consent required"
                        sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(100,116,139,0.05)', color: '#475569', border: '1px solid rgba(100,116,139,0.08)', ml: 'auto' }}
                    />
                )}
            </Box>

            {recordingConsent === true ? (
                <>
                    <TextField
                        fullWidth
                        multiline
                        value={transcript}
                        onChange={(e) => onTranscriptChange(e.target.value)}
                        placeholder="Paste transcript from Google Call Notes..."
                        sx={{
                            flex: 1,
                            '& .MuiInputBase-root': {
                                bgcolor: 'rgba(255,255,255,0.02)',
                                color: '#e2e8f0',
                                fontSize: '0.75rem',
                                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                alignItems: 'flex-start',
                                height: '100%',
                                borderRadius: 2,
                            },
                            '& .MuiInputBase-input': {
                                height: '100% !important',
                                overflow: 'auto !important',
                            },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.08)' },
                            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' },
                            '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 1.5 },
                        }}
                    />
                    <Tooltip title="AI-powered summary — coming soon" arrow placement="top">
                        <span>
                            <Button
                                size="small"
                                disabled={!transcript || transcript.length < 200}
                                startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
                                sx={{
                                    mt: 1.5,
                                    color: transcript && transcript.length >= 200 ? '#a78bfa' : '#334155',
                                    textTransform: 'none',
                                    fontSize: '0.73rem',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    px: 2,
                                    py: 0.6,
                                    border: '1px solid',
                                    borderColor: transcript && transcript.length >= 200 ? 'rgba(167,139,250,0.25)' : 'rgba(100,116,139,0.08)',
                                    bgcolor: transcript && transcript.length >= 200 ? 'rgba(167,139,250,0.06)' : 'transparent',
                                    background: transcript && transcript.length >= 200
                                        ? 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(139,92,246,0.04))'
                                        : 'transparent',
                                    boxShadow: transcript && transcript.length >= 200 ? '0 0 12px rgba(167,139,250,0.1)' : 'none',
                                    transition: 'all 0.25s ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(167,139,250,0.1)',
                                        borderColor: 'rgba(167,139,250,0.4)',
                                        boxShadow: '0 0 20px rgba(167,139,250,0.15)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:disabled': { color: '#1e293b', borderColor: 'rgba(100,116,139,0.06)', boxShadow: 'none', background: 'transparent' },
                                }}
                            >
                                Generate Summary
                            </Button>
                        </span>
                    </Tooltip>
                </>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 70 }}>
                    <Box sx={{ textAlign: 'center', opacity: 0.7 }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(100,116,139,0.04)',
                            border: '1px solid rgba(100,116,139,0.06)',
                            mx: 'auto',
                            mb: 1,
                        }}>
                            <MicOff sx={{ fontSize: 18, color: '#1e293b' }} />
                        </Box>
                        <Typography sx={{ color: '#334155', fontSize: '0.72rem', fontWeight: 500 }}>
                            Enable recording consent to unlock
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
