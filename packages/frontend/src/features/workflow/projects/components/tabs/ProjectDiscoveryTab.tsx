'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { Project } from '../../types/project.types';
import {
    inquiryWizardSubmissionsApi,
    DiscoveryStoryCard,
    DiscoverySalesCard,
    DiscoveryTranscriptCard,
} from '@/features/workflow/inquiry-wizard';
import type { InquiryWizardSubmission } from '@/features/workflow/inquiry-wizard';

interface ProjectDiscoveryTabProps {
    project: Project;
}

/**
 * Read-only view of the discovery data from the source inquiry.
 * Fetches the discovery submission using the project's `inquiry_id`.
 */
export function ProjectDiscoveryTab({ project }: ProjectDiscoveryTabProps) {
    const [submission, setSubmission] = useState<InquiryWizardSubmission | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSubmission = useCallback(async () => {
        if (!project.inquiry_id) {
            setLoading(false);
            return;
        }
        try {
            const s = await inquiryWizardSubmissionsApi.getSingleByInquiryId(project.inquiry_id, 'DISCOVERY_CALL');
            setSubmission(s && typeof s === 'object' && 'id' in s ? s : null);
        } catch {
            setSubmission(null);
        } finally {
            setLoading(false);
        }
    }, [project.inquiry_id]);

    useEffect(() => {
        fetchSubmission();
    }, [fetchSubmission]);

    if (loading) {
        return (
            <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography sx={{ color: '#64748b' }}>Loading discovery data...</Typography>
            </Box>
        );
    }

    if (!submission) {
        return (
            <Box
                sx={{
                    py: 6,
                    textAlign: 'center',
                    borderRadius: 2,
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px dashed rgba(148, 163, 184, 0.12)',
                }}
            >
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                    No discovery data available for this project.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', width: '100%' }}>
            {/* Column 1 — Transcript */}
            <Box sx={{ flex: '0 0 34%', minWidth: 0 }}>
                <Stack spacing={2}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                        }}
                    >
                        <Typography sx={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600 }}>
                            Read-only — Discovery data from inquiry #{project.inquiry_id}
                        </Typography>
                    </Box>
                    <DiscoveryTranscriptCard
                        submission={submission}
                        onRefreshSubmission={fetchSubmission}
                    />
                </Stack>
            </Box>

            {/* Column 2 — Story & Vision */}
            <Box sx={{ flex: '1 1 33%', minWidth: 0 }}>
                <DiscoveryStoryCard submission={submission} />
            </Box>

            {/* Column 3 — Sales & Next Steps */}
            <Box sx={{ flex: '1 1 33%', minWidth: 0 }}>
                <DiscoverySalesCard submission={submission} />
            </Box>
        </Box>
    );
}
