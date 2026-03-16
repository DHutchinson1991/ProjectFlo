'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    CardContent,
    Chip,
    Stack,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    MicNone,
    CheckCircle,
    RadioButtonUnchecked,
    EditNote,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { DiscoveryQuestionnaireSubmission } from '@/lib/types';
import { WorkflowCard } from './WorkflowCard';
import DiscoveryQuestionnaireFormDialog from './DiscoveryQuestionnaireFormDialog';
import type { WorkflowCardProps } from '../_lib';

// ─── Response summary — render up to N key fields ─────────────────────────────

const KEY_FIELDS: Array<{ key: string; label: string }> = [
    { key: 'film_vibe', label: 'Vibe' },
    { key: 'key_moments', label: 'Key Moments' },
    { key: 'desired_products', label: 'Products' },
    { key: 'highlight_length', label: 'Film Length' },
    { key: 'budget_fit', label: 'Budget Fit' },
    { key: 'decision_timeline', label: 'Decision' },
    { key: 'ready_for_proposal', label: 'Proposal?' },
    { key: 'follow_up_method', label: 'Follow-Up' },
];

function fmtVal(v: unknown): string {
    if (!v) return '';
    if (Array.isArray(v)) return v.join(', ');
    return String(v).trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryQuestionnaireCard: React.FC<WorkflowCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
}) => {
    const { currentBrand } = useBrand();
    const [submission, setSubmission] = useState<DiscoveryQuestionnaireSubmission | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (!inquiry?.id) return;
        api.discoveryQuestionnaireSubmissions
            .getByInquiryId(inquiry.id)
            .then((s) => setSubmission(s))
            .catch(() => setSubmission(null));
    }, [inquiry?.id]);

    const handleSubmitted = async (s: DiscoveryQuestionnaireSubmission) => {
        setSubmission(s);
        setDialogOpen(false);
        if (onRefresh) await onRefresh();
    };

    const responses = (submission?.responses ?? {}) as Record<string, unknown>;
    const visibleFields = KEY_FIELDS.filter(({ key }) => fmtVal(responses[key]));

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor ?? '#3b82f6'}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MicNone sx={{ color: '#3b82f6', fontSize: 18 }} />
                            <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.88rem' }}>
                                Discovery Call Notes
                            </Typography>
                        </Box>

                        {submission ? (
                            <Chip
                                size="small"
                                icon={<CheckCircle sx={{ fontSize: '12px !important', color: '#10b981 !important' }} />}
                                label="Submitted"
                                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
                            />
                        ) : (
                            <Chip
                                size="small"
                                icon={<RadioButtonUnchecked sx={{ fontSize: '12px !important', color: '#64748b !important' }} />}
                                label="Not filled"
                                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(100,116,139,0.1)', color: '#64748b' }}
                            />
                        )}
                    </Box>

                    {/* Content */}
                    {!submission ? (
                        <Box>
                            <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mb: 2, lineHeight: 1.6 }}>
                                Use the guided questionnaire during or after your discovery call
                                to capture key details and automatically complete the{' '}
                                <Box component="span" sx={{ color: '#93c5fd' }}>Requirements Discovery</Box>{' '}
                                task.
                            </Typography>
                            <Button
                                fullWidth
                                size="small"
                                variant="outlined"
                                startIcon={<MicNone sx={{ fontSize: 15 }} />}
                                onClick={() => setDialogOpen(true)}
                                sx={{
                                    color: '#3b82f6',
                                    borderColor: 'rgba(59,130,246,0.4)',
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    bgcolor: 'rgba(59,130,246,0.05)',
                                    '&:hover': { bgcolor: 'rgba(59,130,246,0.12)', borderColor: '#3b82f6' },
                                }}
                            >
                                Fill Discovery Notes
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            {/* Key highlights */}
                            {visibleFields.length > 0 && (
                                <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                                    {visibleFields.slice(0, 5).map(({ key, label }) => (
                                        <Box key={key} sx={{ display: 'flex', gap: 1 }}>
                                            <Typography sx={{ color: '#475569', fontSize: '0.73rem', fontWeight: 600, minWidth: 80, flexShrink: 0 }}>
                                                {label}
                                            </Typography>
                                            <Typography sx={{ color: '#94a3b8', fontSize: '0.73rem', lineHeight: 1.4 }}>
                                                {fmtVal(responses[key])}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            )}

                            {/* Call notes snippet */}
                            {submission.call_notes && (
                                <>
                                    <Divider sx={{ borderColor: 'rgba(100,116,139,0.15)', mb: 1 }} />
                                    <Tooltip title={submission.call_notes} placement="top" arrow>
                                        <Typography sx={{
                                            color: '#64748b',
                                            fontSize: '0.73rem',
                                            fontStyle: 'italic',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            cursor: 'default',
                                            mb: 1.5,
                                        }}>
                                            &quot;{submission.call_notes}&quot;
                                        </Typography>
                                    </Tooltip>
                                </>
                            )}

                            <Button
                                size="small"
                                variant="text"
                                startIcon={<EditNote sx={{ fontSize: 14 }} />}
                                onClick={() => setDialogOpen(true)}
                                sx={{ color: '#3b82f6', textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 0 }}
                            >
                                View Notes
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </WorkflowCard>

            <DiscoveryQuestionnaireFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                inquiryId={inquiry.id}
                brandId={currentBrand?.id ?? 0}
                existingSubmission={submission}
                onSubmitted={handleSubmitted}
            />
        </>
    );
};

export default DiscoveryQuestionnaireCard;
