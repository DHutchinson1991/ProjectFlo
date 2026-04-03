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
    AccountBalanceWallet,
    NoteAltOutlined,
    HelpOutlineOutlined,
    LockOutlined,
    FlagOutlined,
} from '@mui/icons-material';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import type { DiscoveryQuestionnaireSubmission } from '@/features/workflow/inquiries/types';

interface DiscoverySalesCardProps {
    submission: DiscoveryQuestionnaireSubmission;
}

interface SalesSignal {
    key: string;
    label: string;
    icon: React.ElementType;
    type: 'single' | 'list';
    colors?: Record<string, string>;
}

const BUDGET_FIT_COLORS: Record<string, string> = {
    'Comfortably within budget': '#10b981',
    'Slightly over — open to discussing': '#f59e0b',
    'At the top of our range': '#f59e0b',
    'A bit of a stretch right now': '#ef4444',
    'Needs adjustment': '#ef4444',
};

const SALES_SIGNALS: SalesSignal[] = [
    { key: 'budget_comfort', label: 'Budget Comfort', icon: AccountBalanceWallet, type: 'single', colors: { Comfortable: '#10b981', Stretching: '#f59e0b', Concerned: '#ef4444' } },
    { key: 'package_reaction', label: 'Package Reaction', icon: NoteAltOutlined, type: 'single', colors: { 'Love it': '#10b981', Interested: '#3b82f6', Hesitant: '#f59e0b', 'Too much': '#ef4444' } },
    { key: 'price_sensitivity', label: 'Price Sensitivity', icon: AccountBalanceWallet, type: 'single', colors: { 'Value-focused': '#3b82f6', 'Price-focused': '#f59e0b', Flexible: '#10b981' } },
    { key: 'objections_raised', label: 'Objections', icon: FlagOutlined, type: 'list' },
    { key: 'addon_interest', label: 'Add-on Interest', icon: NoteAltOutlined, type: 'list' },
    { key: 'flexibility_signal', label: 'Flexibility', icon: HelpOutlineOutlined, type: 'single', colors: { 'Fixed on package': '#3b82f6', 'Open to customise': '#10b981', 'Wants stripped back': '#f59e0b' } },
    { key: 'decision_readiness', label: 'Decision Readiness', icon: HelpOutlineOutlined, type: 'single', colors: { 'Ready to book': '#10b981', 'Warm — needs time': '#f59e0b', 'Early stage': '#64748b' } },
    { key: 'booking_likelihood', label: 'Likelihood', icon: HelpOutlineOutlined, type: 'single', colors: { 'Very likely': '#10b981', Possible: '#f59e0b', Unlikely: '#ef4444' } },
    { key: 'red_flags', label: 'Red Flags', icon: FlagOutlined, type: 'single', colors: { None: '#10b981', Minor: '#f59e0b', Significant: '#ef4444' } },
    { key: 'urgency', label: 'Urgency', icon: HelpOutlineOutlined, type: 'single', colors: { 'Book this week': '#10b981', 'Within a month': '#3b82f6', 'No rush': '#64748b', 'Date pressure': '#f59e0b' } },
    { key: 'agreed_next_steps', label: 'Next Steps', icon: NoteAltOutlined, type: 'list' },
    { key: 'blocking_factor', label: 'Blocking Factor', icon: FlagOutlined, type: 'single', colors: { None: '#10b981', Budget: '#f59e0b', 'Partner buy-in': '#f59e0b', 'Comparing others': '#ef4444', 'Date conflict': '#64748b' } },
    { key: 'follow_up_date', label: 'Follow-up Date', icon: NoteAltOutlined, type: 'single' },
];

function fmtVal(v: unknown): string {
    if (!v) return '';
    if (Array.isArray(v)) return v.join(', ');
    return String(v).trim();
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

export default function DiscoverySalesCard({ submission }: DiscoverySalesCardProps) {
    const responses = (submission.responses ?? {}) as Record<string, unknown>;
    const sentiment = (submission.sentiment ?? {}) as Record<string, string>;

    const solutionNotes = fmtVal(responses['solution_notes']);
    const budgetFit = fmtVal(responses['budget_fit']);
    const finalQuestions = fmtVal(responses['final_questions']);

    const hasSalesSignals = SALES_SIGNALS.some(({ key }) => parseSignalValues(sentiment[key]).length > 0);
    const hasAny = solutionNotes || budgetFit || finalQuestions || hasSalesSignals;
    if (!hasAny) return null;

    const budgetColor = budgetFit ? (BUDGET_FIT_COLORS[budgetFit] ?? '#64748b') : '#64748b';

    return (
        <WorkflowCard>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.2)',
                            }}
                        >
                            <AccountBalanceWallet sx={{ fontSize: 16, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                            Sales & Next Steps
                        </Typography>
                    </Box>
                    <Chip
                        size="small"
                        icon={<LockOutlined sx={{ fontSize: '10px !important', color: '#64748b !important' }} />}
                        label="Internal"
                        sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(100,116,139,0.08)',
                            color: '#64748b',
                            border: '1px solid rgba(100,116,139,0.12)',
                        }}
                    />
                </Box>

                <Stack spacing={1.75}>
                    {/* Sales and close signals from questionnaire chip selections */}
                    {hasSalesSignals && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                            {SALES_SIGNALS.map(({ key, label, icon: Icon, type, colors }) => {
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

                    {/* Budget fit */}
                    {budgetFit && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <AccountBalanceWallet sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Budget Fit
                                </Typography>
                            </Box>
                            <Chip
                                label={budgetFit}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: `${budgetColor}10`,
                                    color: budgetColor,
                                    border: `1px solid ${budgetColor}30`,
                                }}
                            />
                        </Box>
                    )}

                    {/* Solution / package walkthrough notes */}
                    {solutionNotes && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <NoteAltOutlined sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Package Walkthrough
                                </Typography>
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>
                                {solutionNotes}
                            </Typography>
                        </Box>
                    )}

                    {/* Final questions from couple */}
                    {finalQuestions && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <HelpOutlineOutlined sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Their Questions
                                </Typography>
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>
                                {finalQuestions}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </WorkflowCard>
    );
}
