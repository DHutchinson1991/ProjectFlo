'use client';

import React, { useMemo } from 'react';
import {
    Box,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { PackageAiRunTranscriptStep } from '../../types/api.types';

interface PackageAiLiveChatFeedProps {
    transcriptSteps: PackageAiRunTranscriptStep[];
    isLive?: boolean;
    isLoading?: boolean;
}

type ChatRole = 'prompt' | 'response' | 'thinking' | 'pending';

interface ChatMessage {
    id: string;
    role: ChatRole;
    stepNumber: number;
    stepLabel: string;
    timestamp: string | null;
    title: string;
    content: string;
}

const THINKING_KEYS = ['thinking', 'thought', 'thoughts', 'analysis', 'reasoning', 'rationale'];

export function PackageAiLiveChatFeed({ transcriptSteps, isLive = false, isLoading = false }: PackageAiLiveChatFeedProps) {
    const chatMessages = useMemo(() => buildChatMessages(transcriptSteps, isLive), [transcriptSteps, isLive]);

    if (isLoading && chatMessages.length === 0) {
        return (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.25, py: 1.5, color: '#94a3b8' }}>
                <CircularProgress size={16} />
                <Typography sx={{ fontSize: '0.75rem' }}>Loading live AI chat…</Typography>
            </Stack>
        );
    }

    if (chatMessages.length === 0) {
        return (
            <Typography sx={{ px: 1.25, py: 1.5, color: '#64748b', fontSize: '0.74rem' }}>
                {isLive ? 'Waiting for the planner to emit its first prompt…' : 'This run has no prompt/response transcript yet.'}
            </Typography>
        );
    }

    return (
        <Box sx={{ px: 1.25, py: 1.1, maxHeight: 240, overflowY: 'auto', display: 'grid', gap: 0.95 }}>
            {chatMessages.map((message) => (
                <Stack key={message.id} alignItems={message.role === 'prompt' ? 'flex-end' : 'flex-start'}>
                    <Paper
                        elevation={0}
                        sx={{
                            width: '100%',
                            maxWidth: message.role === 'prompt' ? '92%' : '96%',
                            borderRadius: 2.25,
                            px: 1.1,
                            py: 0.95,
                            border: `1px solid ${getBubbleBorder(message.role)}`,
                            bgcolor: getBubbleBackground(message.role),
                            boxShadow: `0 12px 28px ${alpha('#020617', 0.22)}`,
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography sx={{ color: getRoleColor(message.role), fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {message.title}
                                </Typography>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.64rem' }}>
                                    {message.stepLabel}
                                </Typography>
                            </Stack>
                            {message.timestamp && (
                                <Typography sx={{ color: '#64748b', fontSize: '0.62rem' }}>
                                    {formatTimestamp(message.timestamp)}
                                </Typography>
                            )}
                        </Stack>

                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                mt: 0.7,
                                color: '#e2e8f0',
                                fontSize: '0.71rem',
                                lineHeight: 1.55,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: 'Consolas, "SFMono-Regular", monospace',
                            }}
                        >
                            {message.content}
                        </Box>
                    </Paper>
                </Stack>
            ))}
        </Box>
    );
}

function buildChatMessages(transcriptSteps: PackageAiRunTranscriptStep[], isLive: boolean): ChatMessage[] {
    const messages: ChatMessage[] = [];

    const orderedSteps = [...transcriptSteps].sort((left, right) => right.stepNumber - left.stepNumber);
    for (const step of orderedSteps) {
        const promptSections = step.sections.filter((section) => section.kind === 'llm-prompt');
        const responseSections = step.sections.filter((section) => section.kind === 'llm-response');

        responseSections.forEach((section, index) => {
            messages.push({
                id: `${step.stepNumber}-response-${index}`,
                role: 'response',
                stepNumber: step.stepNumber,
                stepLabel: step.label,
                timestamp: step.startedAt,
                title: 'AI response',
                content: section.content,
            });

            extractThinkingEntries(section.json).forEach((entry, thinkingIndex) => {
                messages.push({
                    id: `${step.stepNumber}-thinking-${index}-${thinkingIndex}`,
                    role: 'thinking',
                    stepNumber: step.stepNumber,
                    stepLabel: step.label,
                    timestamp: step.startedAt,
                    title: 'AI thinking',
                    content: entry.value,
                });
            });
        });

        if (isLive && promptSections.length > 0 && responseSections.length === 0) {
            messages.push({
                id: `${step.stepNumber}-pending`,
                role: 'pending',
                stepNumber: step.stepNumber,
                stepLabel: step.label,
                timestamp: step.startedAt,
                title: 'AI response',
                content: 'Generating response…',
            });
        }

        promptSections.forEach((section, index) => {
            messages.push({
                id: `${step.stepNumber}-prompt-${index}`,
                role: 'prompt',
                stepNumber: step.stepNumber,
                stepLabel: step.label,
                timestamp: step.startedAt,
                title: 'Prompt',
                content: section.content,
            });
        });
    }

    return messages;
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
            label: key,
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

function getBubbleBackground(role: ChatRole): string {
    switch (role) {
        case 'prompt':
            return 'rgba(120, 53, 15, 0.28)';
        case 'response':
            return 'rgba(8, 47, 73, 0.44)';
        case 'thinking':
            return 'rgba(30, 41, 59, 0.82)';
        case 'pending':
            return 'rgba(15, 23, 42, 0.92)';
        default:
            return 'rgba(15, 23, 42, 0.72)';
    }
}

function getBubbleBorder(role: ChatRole): string {
    switch (role) {
        case 'prompt':
            return alpha('#f59e0b', 0.38);
        case 'response':
            return alpha('#38bdf8', 0.34);
        case 'thinking':
            return alpha('#94a3b8', 0.22);
        case 'pending':
            return alpha('#22c55e', 0.26);
        default:
            return alpha('#94a3b8', 0.2);
    }
}

function getRoleColor(role: ChatRole): string {
    switch (role) {
        case 'prompt':
            return '#fbbf24';
        case 'response':
            return '#7dd3fc';
        case 'thinking':
            return '#cbd5e1';
        case 'pending':
            return '#86efac';
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
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
}