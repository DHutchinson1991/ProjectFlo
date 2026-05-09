'use client';

import React from 'react';
import {
    Box,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import type {
    PackageAiPlannerSummary,
    PackageAiRunTranscriptStep,
} from '../../types/api.types';
import { PackageAiTranscriptView } from './PackageAiTranscriptView';

interface PackageAiRunArtifactsViewProps {
    transcriptSteps: PackageAiRunTranscriptStep[];
    request: unknown | null;
    builderSummary: unknown | null;
    plannerSummary: PackageAiPlannerSummary | null;
}

export function PackageAiRunArtifactsView({
    transcriptSteps,
    request,
    builderSummary,
    plannerSummary,
}: PackageAiRunArtifactsViewProps) {
    const hasArtifacts = transcriptSteps.length > 0 || request != null || builderSummary != null || plannerSummary != null;

    if (!hasArtifacts) {
        return (
            <Typography sx={{ p: 1.5, color: '#64748b', fontSize: '0.74rem' }}>
                This run did not capture any extra artifacts.
            </Typography>
        );
    }

    return (
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
            {transcriptSteps.length > 0 && (
                <ArtifactSection title="Structured transcript" subtitle="Step-by-step prompt, response, and event blocks">
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.08)',
                            bgcolor: 'rgba(2, 6, 23, 0.7)',
                            overflow: 'hidden',
                        }}
                    >
                        <PackageAiTranscriptView transcriptSteps={transcriptSteps} />
                    </Paper>
                </ArtifactSection>
            )}

            {request != null && (
                <ArtifactSection title="Request payload" subtitle="Original package creation input">
                    <ArtifactPre value={request} />
                </ArtifactSection>
            )}

            {builderSummary != null && (
                <ArtifactSection title="Builder summary" subtitle="Deterministic build snapshot written during package creation">
                    <ArtifactPre value={builderSummary} />
                </ArtifactSection>
            )}

            {plannerSummary != null && (
                <ArtifactSection title="Planner summary" subtitle="Planner status and step summary">
                    <ArtifactPre value={plannerSummary} />
                </ArtifactSection>
            )}
        </Stack>
    );
}

function ArtifactSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <Box>
            <Typography sx={{ color: '#f8fafc', fontSize: '0.76rem', fontWeight: 700 }}>
                {title}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.66rem', mt: 0.25, mb: 0.9 }}>
                {subtitle}
            </Typography>
            {children}
        </Box>
    );
}

function ArtifactPre({ value }: { value: unknown }) {
    return (
        <Box
            component="pre"
            sx={{
                m: 0,
                p: 1.25,
                maxHeight: 280,
                overflow: 'auto',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                bgcolor: 'rgba(2, 6, 23, 0.78)',
                color: '#cbd5e1',
                fontSize: '0.7rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'Consolas, "SFMono-Regular", monospace',
            }}
        >
            {formatArtifact(value)}
        </Box>
    );
}

function formatArtifact(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    return JSON.stringify(value, null, 2);
}