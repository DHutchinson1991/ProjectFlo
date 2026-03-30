'use client';
import React from 'react';
import {
    Box, Typography, Stack, TextField, Button, CircularProgress, Checkbox, FormControlLabel, Divider, Chip,
} from '@mui/material';
import { CheckCircle, RateReview, ErrorOutline, InfoOutlined, Warning } from '@mui/icons-material';
import type { IwDateConflictResult, IwCrewConflictResult } from '@/features/workflow/inquiry-wizard/types';

const MANUAL_CHECKLIST = [
    { key: 'venue_feasibility', label: 'Venue feasibility checked' },
    { key: 'coverage_scope', label: 'Coverage scope verified' },
    { key: 'budget_alignment', label: 'Budget alignment confirmed' },
];

interface Props {
    dateConflicts: IwDateConflictResult | null;
    crewConflicts: IwCrewConflictResult | null;
    loadingConflicts: boolean;
    reviewNotes: string;
    onReviewNotesChange: (v: string) => void;
    checklistState: Record<string, boolean>;
    onToggleChecklist: (key: string) => void;
    submittingReview: boolean;
    reviewDone: boolean;
    onCompleteReview: () => void;
}

export default function IwReviewPanel({ dateConflicts, crewConflicts, loadingConflicts, reviewNotes, onReviewNotesChange, checklistState, onToggleChecklist, submittingReview, reviewDone, onCompleteReview }: Props) {
    const conflictCardSx = { mb: 2, p: 1.5, borderRadius: 2, border: '1px solid rgba(52, 58, 68, 0.25)', bgcolor: 'rgba(255,255,255,0.015)' };

    return (
        <Box sx={{ mt: 3 }}>
            <Divider sx={{ borderColor: 'rgba(52, 58, 68, 0.3)', mb: 2.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <RateReview sx={{ fontSize: 18, color: reviewDone ? '#22c55e' : '#8b5cf6' }} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: reviewDone ? '#22c55e' : '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Review Checklist
                </Typography>
                {reviewDone && (
                    <Chip label="Reviewed" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', '& .MuiChip-label': { px: 0.75 } }} />
                )}
            </Box>

            {/* Date conflicts */}
            <Box sx={conflictCardSx}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Date Conflicts</Typography>
                {loadingConflicts ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <CircularProgress size={13} sx={{ color: '#64748b' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Checking…</Typography>
                    </Box>
                ) : dateConflicts ? (
                    <Stack spacing={0.5}>
                        {dateConflicts.booked_conflicts.length === 0 && dateConflicts.soft_conflicts.length === 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                                <Typography sx={{ fontSize: '0.78rem', color: '#22c55e' }}>No date conflicts found</Typography>
                            </Box>
                        ) : (
                            <>
                                {dateConflicts.booked_conflicts.map((c) => (
                                    <Box key={`${c.type}-${c.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ErrorOutline sx={{ fontSize: 14, color: '#ef4444' }} />
                                        <Typography sx={{ fontSize: '0.78rem', color: '#fca5a5' }}><strong>BOOKED:</strong> {c.name} ({c.status})</Typography>
                                    </Box>
                                ))}
                                {dateConflicts.soft_conflicts.map((c) => (
                                    <Box key={`${c.type}-${c.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <InfoOutlined sx={{ fontSize: 14, color: '#f59e0b' }} />
                                        <Typography sx={{ fontSize: '0.78rem', color: '#fde68a' }}><strong>UNBOOKED:</strong> {c.name} ({c.status})</Typography>
                                    </Box>
                                ))}
                            </>
                        )}
                    </Stack>
                ) : null}
            </Box>

            {/* Crew conflicts */}
            <Box sx={conflictCardSx}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Crew Availability</Typography>
                {loadingConflicts ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <CircularProgress size={13} sx={{ color: '#64748b' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Checking…</Typography>
                    </Box>
                ) : crewConflicts ? (
                    crewConflicts.conflicts.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                            <Typography sx={{ fontSize: '0.78rem', color: '#22c55e' }}>No crew conflicts found</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={0.5}>
                            {crewConflicts.conflicts.map((c) => (
                                <Box key={c.crew_id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Warning sx={{ fontSize: 14, color: '#ef4444' }} />
                                    <Typography sx={{ fontSize: '0.78rem', color: '#fca5a5' }}><strong>{c.name}</strong> — {c.conflicting_inquiries.length} conflicting inquiry{c.conflicting_inquiries.length !== 1 ? 's' : ''}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    )
                ) : null}
            </Box>

            {/* Manual checklist */}
            <Stack spacing={0.25} sx={{ mb: 2 }}>
                {MANUAL_CHECKLIST.map((item) => (
                    <FormControlLabel key={item.key}
                        control={<Checkbox size="small" checked={!!checklistState[item.key]} onChange={() => onToggleChecklist(item.key)} sx={{ color: 'rgba(139, 92, 246, 0.4)', '&.Mui-checked': { color: '#8b5cf6' }, p: 0.5 }} />}
                        label={<Typography sx={{ fontSize: '0.82rem', color: checklistState[item.key] ? '#c4b5fd' : '#94a3b8' }}>{item.label}</Typography>}
                        sx={{ m: 0, ml: 0.5 }}
                    />
                ))}
            </Stack>

            <TextField fullWidth multiline minRows={2} placeholder="Review notes (optional)…" value={reviewNotes} onChange={(e) => onReviewNotesChange(e.target.value)} size="small"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: '0.82rem', color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(52, 58, 68, 0.4)' }, '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.3)' }, '&.Mui-focused fieldset': { borderColor: 'rgba(139, 92, 246, 0.6)' } }, '& .MuiInputBase-input::placeholder': { color: '#475569', opacity: 1 } }}
            />

            <Button variant="contained" size="small" disabled={submittingReview || reviewDone} onClick={onCompleteReview}
                startIcon={reviewDone ? <CheckCircle sx={{ fontSize: 15 }} /> : <RateReview sx={{ fontSize: 15 }} />}
                sx={{ bgcolor: reviewDone ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)', color: reviewDone ? '#22c55e' : '#a78bfa', border: `1px solid ${reviewDone ? 'rgba(34, 197, 94, 0.25)' : 'rgba(139, 92, 246, 0.25)'}`, fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', borderRadius: 2, boxShadow: 'none', '&:hover': { bgcolor: reviewDone ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.25)', boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: reviewDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(52, 58, 68, 0.3)', color: reviewDone ? '#22c55e' : '#475569' } }}>
                {submittingReview ? 'Saving…' : reviewDone ? 'Review Complete' : 'Complete Review'}
            </Button>
        </Box>
    );
}
