'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Stack } from '@mui/material';
import {
    DiscoveryQuestionnaireCard,
    DiscoveryStoryCard,
    DiscoverySalesCard,
    DiscoveryTranscriptCard,
    inquiryWizardSubmissionsApi,
} from '@/features/workflow/inquiry-wizard';
import type { InquiryWizardSubmission } from '@/features/workflow/inquiry-wizard';
import type { InquiryTabProps } from './types';

interface DiscoveryTabProps extends InquiryTabProps {
    currentPhase: string;
}

export default function DiscoveryTab({
    inquiry,
    onRefresh,
    currentPhase,
}: DiscoveryTabProps) {
    const [submission, setSubmission] = useState<InquiryWizardSubmission | null>(null);

    const fetchSubmission = useCallback(async () => {
        if (!inquiry?.id) return;
        try {
            const s = await inquiryWizardSubmissionsApi.getSingleByInquiryId(inquiry.id, 'DISCOVERY_CALL');
            setSubmission(s && typeof s === 'object' && 'id' in s ? s : null);
        } catch {
            setSubmission(null);
        }
    }, [inquiry?.id]);

    useEffect(() => { fetchSubmission(); }, [fetchSubmission]);

    const handleRefreshSubmission = useCallback(async () => {
        await fetchSubmission();
    }, [fetchSubmission]);

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', width: '100%' }}>
            {/* Column 1 — Call summary + Transcript (stacked) */}
            <Box sx={{ flex: '0 0 34%', minWidth: 0 }}>
                <Stack spacing={2}>
                    <div id="discovery-questionnaire-section">
                        <DiscoveryQuestionnaireCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'calls'}
                            activeColor="#3b82f6"
                            submission={submission}
                            onRefreshSubmission={handleRefreshSubmission}
                        />
                    </div>

                    {submission ? (
                        <DiscoveryTranscriptCard
                            submission={submission}
                            onRefreshSubmission={handleRefreshSubmission}
                        />
                    ) : (
                        <Box
                            sx={{
                                minHeight: 160,
                                borderRadius: 3,
                                border: '1px dashed rgba(100,116,139,0.1)',
                                bgcolor: 'rgba(100,116,139,0.02)',
                            }}
                        />
                    )}
                </Stack>
            </Box>

            {/* Column 2 — Story & Vision */}
            <Box sx={{ flex: '1 1 33%', minWidth: 0 }}>
                {submission && (
                    <DiscoveryStoryCard submission={submission} />
                )}
            </Box>

            {/* Column 3 — Sales & Next Steps */}
            <Box sx={{ flex: '1 1 33%', minWidth: 0 }}>
                {submission && (
                    <DiscoverySalesCard submission={submission} />
                )}
            </Box>
        </Box>
    );
}
