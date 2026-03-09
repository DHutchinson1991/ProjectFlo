'use client';

import React from 'react';
import {
    Box,
    Typography,
    CardContent,
    Grid,
    Divider,
} from '@mui/material';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';

interface LeadInfoCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    submission?: NeedsAssessmentSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

const LeadInfoCard: React.FC<LeadInfoCardProps> = ({ inquiry, submission, WorkflowCard }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    const leadSource = inquiry.lead_source || responses.lead_source || 'Unknown';

    // lead_source_details may be a stringified JSON blob — extract a human-readable portion
    const leadSourceDetails = (() => {
        const raw = inquiry.lead_source_details || responses.lead_source_details;
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw as string);
            // Prefer an explicit source_details / lead_source_details key in the blob
            return (parsed as Record<string, unknown>).lead_source_details
                || (parsed as Record<string, unknown>).source_details
                || null;
        } catch {
            return raw as string;
        }
    })();

    const sourceField = responses.source_details || leadSourceDetails;
    const notes = inquiry.notes || responses.notes || null;

    return (
        <WorkflowCard isActive={false}>
            <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TravelExploreIcon /> Lead Info
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            LEAD SOURCE
                        </Typography>
                        <Typography variant="body2">{leadSource}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            SOURCE DETAILS
                        </Typography>
                        <Typography variant="body2">{sourceField || 'Not provided'}</Typography>
                    </Grid>
                </Grid>

                {notes && (
                    <>
                        <Divider sx={{ my: 1.5 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                NOTES
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', color: 'text.secondary' }}
                            >
                                &ldquo;{notes}&rdquo;
                            </Typography>
                        </Box>
                    </>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default LeadInfoCard;
