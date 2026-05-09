'use client';

import React from 'react';
import {
    Box,
    Divider,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type {
    PackageAiRunTranscriptSection,
    PackageAiRunTranscriptStep,
} from '../../types/api.types';

interface PackageAiTranscriptViewProps {
    transcriptSteps: PackageAiRunTranscriptStep[];
}

const THINKING_KEYS = ['thinking', 'thought', 'thoughts', 'analysis', 'reasoning', 'rationale'];

export function PackageAiTranscriptView({ transcriptSteps }: PackageAiTranscriptViewProps) {
    if (transcriptSteps.length === 0) {
        return (
            <Typography sx={{ p: 1.5, color: '#64748b', fontSize: '0.74rem' }}>
                This run has not captured prompt and response transcript blocks yet.
            </Typography>
        );
    }

    return (
        <Stack divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />}>
            {transcriptSteps.map((step) => (
                <Box key={`${step.stepNumber}-${step.skillKey ?? step.label}`} sx={{ px: 1.5, py: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                        <Stack direction="row" spacing={0.9} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography sx={{ color: '#f59e0b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {`Step ${String(step.stepNumber).padStart(2, '0')}`}
                            </Typography>
                            <Typography sx={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 700 }}>
                                {step.label}
                            </Typography>
                            {step.skillKey && (
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem' }}>
                                    {step.skillKey}
                                </Typography>
                            )}
                        </Stack>

                        {step.startedAt && (
                            <Typography sx={{ color: '#64748b', fontSize: '0.66rem' }}>
                                {formatTimestamp(step.startedAt)}
                            </Typography>
                        )}
                    </Stack>

                    {step.sections.length === 0 && step.messages.length === 0 ? (
                        <Typography sx={{ mt: 1.2, color: '#64748b', fontSize: '0.72rem' }}>
                            This step only recorded planner status metadata.
                        </Typography>
                    ) : (
                        <Stack spacing={1.1} sx={{ mt: 1.25 }}>
                            {step.sections.map((section, index) => (
                                <TranscriptSectionCard
                                    key={`${step.stepNumber}-${section.title}-${index}`}
                                    section={section}
                                />
                            ))}

                            {step.messages.length > 0 && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 2,
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        bgcolor: 'rgba(15, 23, 42, 0.52)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box sx={{ px: 1.25, py: 0.9, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>
                                            Step events
                                        </Typography>
                                    </Box>
                                    <Stack spacing={0.5} sx={{ px: 1.25, py: 1 }}>
                                        {step.messages.map((message, index) => (
                                            <Stack key={`${message.level}-${index}`} direction="row" spacing={0.9} alignItems="flex-start">
                                                <Typography sx={{ color: getMessageColor(message.level), fontSize: '0.65rem', fontWeight: 800, minWidth: 42 }}>
                                                    {message.level}
                                                </Typography>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Typography sx={{ color: '#e2e8f0', fontSize: '0.7rem', lineHeight: 1.5 }}>
                                                        {message.message}
                                                    </Typography>
                                                    {message.timestamp && (
                                                        <Typography sx={{ color: '#64748b', fontSize: '0.62rem', mt: 0.2 }}>
                                                            {formatTimestamp(message.timestamp)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Paper>
                            )}
                        </Stack>
                    )}
                </Box>
            ))}
        </Stack>
    );
}

function TranscriptSectionCard({ section }: { section: PackageAiRunTranscriptSection }) {
    const accentColor = getSectionAccent(section.kind);
    const thinkingEntries = extractThinkingEntries(section.json);

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(accentColor, 0.24)}`,
                bgcolor: alpha(accentColor, 0.1),
                overflow: 'hidden',
            }}
        >
            <Box sx={{ px: 1.25, py: 0.9, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ color: '#f8fafc', fontSize: '0.72rem', fontWeight: 700 }}>
                        {getSectionLabel(section)}
                    </Typography>
                    <Typography sx={{ color: alpha('#f8fafc', 0.62), fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {section.title}
                    </Typography>
                </Stack>
            </Box>

            {thinkingEntries.length > 0 && (
                <Box sx={{ px: 1.25, py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Typography sx={{ color: '#f8fafc', fontSize: '0.68rem', fontWeight: 700, mb: 0.75 }}>
                        AI thinking
                    </Typography>
                    <Stack spacing={0.75}>
                        {thinkingEntries.map((entry) => (
                            <Box key={entry.label}>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.63rem', fontWeight: 700, mb: 0.3 }}>
                                    {entry.label}
                                </Typography>
                                <Box
                                    component="pre"
                                    sx={{
                                        m: 0,
                                        color: '#e2e8f0',
                                        fontSize: '0.68rem',
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        fontFamily: 'Consolas, "SFMono-Regular", monospace',
                                    }}
                                >
                                    {entry.value}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}

            <Box
                component="pre"
                sx={{
                    m: 0,
                    p: 1.25,
                    maxHeight: 240,
                    overflow: 'auto',
                    color: '#cbd5e1',
                    fontSize: '0.7rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'Consolas, "SFMono-Regular", monospace',
                }}
            >
                {section.content || 'No content captured for this block.'}
            </Box>
        </Paper>
    );
}

function extractThinkingEntries(value: unknown): Array<{ label: string; value: string }> {
    if (!isRecord(value)) {
        return [];
    }

    return THINKING_KEYS.flatMap((key) => {
        const entry = value[key];
        if (entry === undefined || entry === null) {
            return [];
        }

        return [{
            label: toTitleCase(key),
            value: formatUnknown(entry),
        }];
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatUnknown(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    return JSON.stringify(value, null, 2);
}

function getSectionAccent(kind: PackageAiRunTranscriptSection['kind']): string {
    switch (kind) {
        case 'llm-prompt':
            return '#f59e0b';
        case 'llm-response':
            return '#22c55e';
        case 'llm-call':
            return '#38bdf8';
        case 'output':
            return '#a78bfa';
        case 'context':
        case 'input':
        case 'other':
        default:
            return '#64748b';
    }
}

function getSectionLabel(section: PackageAiRunTranscriptSection): string {
    switch (section.kind) {
        case 'llm-prompt':
            return 'Prompt';
        case 'llm-response':
            return 'Response';
        case 'llm-call':
            return 'Call metadata';
        case 'context':
            return 'Step context';
        case 'input':
            return 'Planner input';
        case 'output':
            return 'Planner output';
        case 'other':
        default:
            return section.title;
    }
}

function getMessageColor(level: string): string {
    switch (level) {
        case 'ERROR':
            return '#fca5a5';
        case 'WARN':
            return '#fbbf24';
        case 'DONE':
            return '#86efac';
        case 'TIMING':
            return '#7dd3fc';
        case 'INFO':
        default:
            return '#cbd5e1';
    }
}

function formatTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function toTitleCase(value: string): string {
    return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}