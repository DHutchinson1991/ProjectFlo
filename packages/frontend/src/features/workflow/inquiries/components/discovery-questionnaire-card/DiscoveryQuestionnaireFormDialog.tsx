'use client';

import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Dialog,
    DialogContent,
    CircularProgress,
    Alert,
} from '@mui/material';
import type {
    DiscoveryQuestionnaireSubmission,
    DiscoveryQuestion,
} from '@/features/workflow/inquiries/types';
import { getStepMeta } from '../../constants/discovery-questionnaire-config';
import { DiscoveryQuestionField } from './DiscoveryQuestionField';
import { DiscoverySentimentPanel } from './DiscoverySentimentPanel';
import { useDiscoveryCallForm } from '../../hooks/use-discovery-questionnaire-card';
import { DialogHeader, SectionHeader, ScriptHintBlock, BottomNav, SuccessScreen } from './DiscoveryDialogLayout';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DiscoveryQuestionnaireFormDialogProps {
    open: boolean;
    onClose: () => void;
    inquiryId: number;
    brandId: number;
    customerName?: string;
    producerName?: string;
    brandName?: string;
    venueName?: string;
    weddingDate?: string;
    packageName?: string;
    budgetRange?: string;
    estimateTotal?: number | null;
    currency?: string;
    existingSubmission?: DiscoveryQuestionnaireSubmission | null;
    onSubmitted?: (submission: DiscoveryQuestionnaireSubmission) => void;
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export default function DiscoveryQuestionnaireFormDialog({
    open,
    onClose,
    inquiryId,
    brandId,
    customerName,
    producerName,
    brandName,
    venueName,
    weddingDate,
    packageName,
    budgetRange,
    estimateTotal,
    currency,
    existingSubmission,
    onSubmitted,
}: DiscoveryQuestionnaireFormDialogProps) {
    const form = useDiscoveryCallForm({
        open,
        inquiryId,
        brandId,
        customerName,
        producerName,
        brandName,
        venueName,
        weddingDate,
        packageName,
        budgetRange,
        estimateTotal,
        currency,
        existingSubmission,
        onSubmitted,
    });

    const accentColor = getStepMeta(form.currentSection?.name ?? '').accent;

    const handleClose = () => {
        form.handleClose();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth={false}
            slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' } } }}
            PaperProps={{
                sx: {
                    bgcolor: '#080a10',
                    background: `
                        radial-gradient(ellipse 80% 22% at 50% 0%, ${accentColor}0a 0%, transparent 70%),
                        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(59,130,246,0.03) 0%, transparent 60%),
                        linear-gradient(180deg, #0a0c14 0%, #080a10 100%)
                    `,
                    border: '1px solid rgba(148,163,184,0.06)',
                    borderRadius: 4,
                    color: '#e2e8f0',
                    width: '94vw',
                    maxWidth: 1360,
                    height: '88vh',
                    maxHeight: '88vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 80px ${accentColor}08`,
                    transition: 'background 0.6s ease, box-shadow 0.6s ease',
                },
            }}
        >
            <DialogHeader
                sections={form.sections}
                sectionIndex={form.sectionIndex}
                setSectionIndex={form.setSectionIndex}
                loading={form.loading}
                submitted={form.submitted}
                accentColor={accentColor}
                customerName={customerName}
                sectionHasAnswers={form.sectionHasAnswers}
                onClose={handleClose}
            />

            <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {form.loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress size={36} sx={{ color: '#3b82f6' }} />
                    </Box>
                )}

                {form.error && !form.loading && (
                    <Alert severity="error" sx={{ mx: 3, mt: 2 }}>{form.error}</Alert>
                )}

                {form.submitted && (
                    <SuccessScreen existingSubmission={existingSubmission} onClose={handleClose} />
                )}

                {!form.loading && !form.submitted && form.template && form.sections.length > 0 && (
                    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* LEFT COLUMN: Script & Questions (60%) */}
                        <Box sx={{
                            flex: '0 0 60%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRight: '1px solid rgba(100,116,139,0.06)',
                            position: 'relative',
                        }}>
                            <Box sx={{
                                flex: 1,
                                overflowY: 'auto',
                                px: 3.5,
                                py: 3,
                                '&::-webkit-scrollbar': { width: 5 },
                                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.1)' },
                                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100,116,139,0.18)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(100,116,139,0.3)' } },
                            }}>
                                {form.currentSection && (
                                    <Stack spacing={4}>
                                        <SectionHeader section={form.currentSection} sectionIndex={form.sectionIndex} totalSections={form.sections.length} />

                                        {form.currentSection.questions.map((q) => (
                                            <Box key={q.id}>
                                                {q.script_hint && <ScriptHintBlock hint={form.resolveHint(q.script_hint)} accentColor={getStepMeta(form.currentSection!.name).accent} />}

                                                {q.field_type !== 'script_only' && (
                                                    <Typography sx={{
                                                        color: '#f1f5f9',
                                                        fontSize: '0.92rem',
                                                        fontWeight: 700,
                                                        mb: 1.5,
                                                        lineHeight: 1.45,
                                                        letterSpacing: '-0.005em',
                                                    }}>
                                                        {q.prompt}
                                                        {q.required && <Box component="span" sx={{ color: '#f87171', ml: 0.5, fontSize: '0.85rem' }}>*</Box>}
                                                    </Typography>
                                                )}

                                                <DiscoveryQuestionField
                                                    question={q}
                                                    value={form.responses[q.field_key ?? q.id.toString()] ?? (q.field_type === 'multiselect' ? [] : '')}
                                                    onChange={(v) => form.handleChange(q.field_key ?? String(q.id), v)}
                                                    activities={form.activities}
                                                    paymentSchedule={form.paymentSchedule}
                                                />
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </Box>

                            <BottomNav
                                prevSectionName={form.prevSectionName}
                                nextSectionName={form.nextSectionName}
                                sectionIndex={form.sectionIndex}
                                setSectionIndex={form.setSectionIndex}
                                accentColor={accentColor}
                                saving={form.saving}
                                existingSubmission={existingSubmission}
                                onSubmit={form.handleSubmit}
                            />
                        </Box>

                        {/* RIGHT COLUMN: Phase Signals + Transcript (40%) */}
                        <Box sx={{
                            flex: '0 0 40%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            bgcolor: 'rgba(0,0,0,0.25)',
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 100%)',
                            position: 'relative',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '1px',
                                background: `linear-gradient(180deg, ${accentColor}15, rgba(100,116,139,0.04), ${accentColor}08)`,
                            },
                        }}>
                            <Box sx={{
                                flex: 1,
                                overflowY: 'auto',
                                px: 3,
                                py: 2.5,
                                '&::-webkit-scrollbar': { width: 4 },
                                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.1)' },
                                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100,116,139,0.15)', borderRadius: 3, '&:hover': { bgcolor: 'rgba(100,116,139,0.25)' } },
                            }}>
                                <DiscoverySentimentPanel
                                    sectionName={form.currentSection?.name ?? ''}
                                    sentiment={form.sentiment}
                                    onChange={form.handleSentimentChange}
                                    recordingConsent={form.recordingConsent}
                                    onRecordingConsentChange={(checked) => {
                                        if (checked) {
                                            form.setRecordingConsent(true);
                                            form.handleChange('recording_consent', 'yes');
                                        } else {
                                            form.setRecordingConsent(false);
                                            form.handleChange('recording_consent', 'no');
                                            form.setTranscript('');
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
