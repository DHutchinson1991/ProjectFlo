'use client';

import React from 'react';
import {
    Box,
    Typography,
    CardContent,
    Chip,
    Stack,
} from '@mui/material';
import {
    FavoriteOutlined,
    PlaceOutlined,
    EmojiEmotionsOutlined,
    PhotoCameraOutlined,
    MovieFilterOutlined,
    StarOutline,
    LocalFireDepartment,
    ThumbUpAlt,
} from '@mui/icons-material';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import type { DiscoveryQuestionnaireSubmission } from '@/features/workflow/inquiries/types';

interface DiscoveryStoryCardProps {
    submission: DiscoveryQuestionnaireSubmission;
}

interface StoryField {
    key: string;
    label: string;
    icon: React.ElementType;
    type: 'text' | 'chips';
}

interface StorySignal {
    key: string;
    label: string;
    icon: React.ElementType;
    type: 'single' | 'list';
    colors?: Record<string, string>;
}

const STORY_FIELDS: StoryField[] = [
    { key: 'venue_story', label: 'Venue Story', icon: PlaceOutlined, type: 'text' },
    { key: 'couple_story', label: 'Their Story', icon: FavoriteOutlined, type: 'text' },
    { key: 'most_excited', label: 'Most Excited For', icon: EmojiEmotionsOutlined, type: 'text' },
    { key: 'must_have_shots', label: 'Must-Have Moments', icon: StarOutline, type: 'text' },
    { key: 'camera_comfort', label: 'Camera Comfort', icon: PhotoCameraOutlined, type: 'chips' },
    { key: 'style_preferences', label: 'Film Style', icon: MovieFilterOutlined, type: 'chips' },
];

const STORY_SIGNALS: StorySignal[] = [
    { key: 'first_impression', label: 'First Impression', icon: FavoriteOutlined, type: 'single', colors: { Warm: '#10b981', Neutral: '#f59e0b', Guarded: '#ef4444' } },
    { key: 'energy_level', label: 'Energy', icon: LocalFireDepartment, type: 'single', colors: { Enthusiastic: '#10b981', Calm: '#3b82f6', Flat: '#64748b' } },
    { key: 'who_on_call', label: 'On The Call', icon: ThumbUpAlt, type: 'list' },
    { key: 'connection_quality', label: 'Connection', icon: FavoriteOutlined, type: 'single', colors: { Strong: '#10b981', Building: '#f59e0b', Distant: '#ef4444' } },
    { key: 'couple_dynamic', label: 'Dynamic', icon: EmojiEmotionsOutlined, type: 'single', colors: { 'Both engaged': '#10b981', 'One leading': '#f59e0b', 'One quiet': '#64748b' } },
    { key: 'communication_style', label: 'Comms Style', icon: MovieFilterOutlined, type: 'single', colors: { Storytellers: '#a855f7', 'Detail-oriented': '#3b82f6', 'Big picture': '#f59e0b', Visual: '#06b6d4' } },
    { key: 'emotional_temperature', label: 'Emotional Tone', icon: LocalFireDepartment, type: 'single', colors: { 'Excited & chatty': '#10b981', 'Polite & reserved': '#3b82f6', Nervous: '#f59e0b' } },
    { key: 'wedding_vibe', label: 'Wedding Vibe', icon: StarOutline, type: 'list' },
    { key: 'vision_clarity', label: 'Vision Clarity', icon: ThumbUpAlt, type: 'single', colors: { 'Crystal clear': '#10b981', Forming: '#f59e0b', Uncertain: '#64748b' } },
    { key: 'excitement', label: 'Excitement', icon: LocalFireDepartment, type: 'single', colors: { High: '#10b981', Moderate: '#f59e0b', Low: '#ef4444' } },
    { key: 'style_match', label: 'Style Match', icon: MovieFilterOutlined, type: 'single', colors: { 'Perfect fit': '#10b981', Adaptable: '#f59e0b', Mismatch: '#ef4444' } },
    { key: 'inspiration_sources', label: 'Inspiration', icon: PhotoCameraOutlined, type: 'list' },
    { key: 'must_haves', label: 'Must-Haves', icon: StarOutline, type: 'list' },
    { key: 'dealbreakers', label: 'Dealbreakers', icon: PlaceOutlined, type: 'list' },
    { key: 'decision_readiness', label: 'Decision', icon: ThumbUpAlt, type: 'single', colors: { 'Ready to book': '#10b981', 'Warm — needs time': '#f59e0b', 'Early stage': '#64748b' } },
];

function fmtVal(v: unknown): string {
    if (!v) return '';
    if (Array.isArray(v)) return v.join(', ');
    return String(v).trim();
}

function toChips(v: unknown): string[] {
    if (Array.isArray(v)) return v.filter(Boolean).map(String);
    if (typeof v === 'string' && v.trim()) return [v.trim()];
    return [];
}

function parseSignalValues(v: unknown): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean).map(String);
    const str = String(v).trim();
    if (!str) return [];
    if (str.startsWith('[')) {
        try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
        } catch {
            return [str];
        }
    }
    return [str];
}

export default function DiscoveryStoryCard({ submission }: DiscoveryStoryCardProps) {
    const responses = (submission.responses ?? {}) as Record<string, unknown>;
    const sentiment = (submission.sentiment ?? {}) as Record<string, string>;

    const hasStorySignals = STORY_SIGNALS.some(({ key }) => parseSignalValues(sentiment[key]).length > 0);
    const hasAny = STORY_FIELDS.some(({ key }) => fmtVal(responses[key]) !== '') || hasStorySignals;
    if (!hasAny) return null;

    return (
        <WorkflowCard>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(168,85,247,0.1)',
                            border: '1px solid rgba(168,85,247,0.2)',
                        }}
                    >
                        <FavoriteOutlined sx={{ fontSize: 16, color: '#a855f7' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                        Their Story & Vision
                    </Typography>
                </Box>

                {/* Relationship and vision signals from questionnaire chip selections */}
                {hasStorySignals && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75, mb: 2 }}>
                        {STORY_SIGNALS.map(({ key, label, icon: Icon, type, colors }) => {
                            const values = parseSignalValues(sentiment[key]);
                            if (values.length === 0) return null;

                            const primaryValue = values[0];
                            const color = colors?.[primaryValue] ?? '#64748b';

                            return (
                                <Box
                                    key={key}
                                    sx={{
                                        py: 0.75,
                                        px: 1,
                                        borderRadius: 2,
                                        bgcolor: `${color}08`,
                                        border: `1px solid ${color}20`,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
                                        <Icon sx={{ fontSize: 15, color, flexShrink: 0 }} />
                                        <Typography sx={{ color: '#475569', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                                            {label}
                                        </Typography>
                                    </Box>

                                    {type === 'single' ? (
                                        <Typography sx={{ color, fontSize: '0.73rem', fontWeight: 700, lineHeight: 1.3 }}>
                                            {primaryValue}
                                        </Typography>
                                    ) : (
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                            {values.map((val) => (
                                                <Chip
                                                    key={`${key}-${val}`}
                                                    label={val}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.68rem',
                                                        fontWeight: 600,
                                                        bgcolor: `${color}12`,
                                                        color,
                                                        border: `1px solid ${color}2a`,
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* Fields */}
                <Stack spacing={1.75}>
                    {STORY_FIELDS.map(({ key, label, icon: Icon, type }) => {
                        const raw = responses[key];
                        const str = fmtVal(raw);
                        if (!str) return null;

                        return (
                            <Box key={key}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                    <Icon sx={{ fontSize: 13, color: '#64748b' }} />
                                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {label}
                                    </Typography>
                                </Box>
                                {type === 'chips' ? (
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                        {toChips(raw).map((chip) => (
                                            <Chip
                                                key={chip}
                                                label={chip}
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.72rem',
                                                    fontWeight: 500,
                                                    bgcolor: 'rgba(168,85,247,0.07)',
                                                    color: '#c084fc',
                                                    border: '1px solid rgba(168,85,247,0.15)',
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>
                                        {str}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>
        </WorkflowCard>
    );
}
