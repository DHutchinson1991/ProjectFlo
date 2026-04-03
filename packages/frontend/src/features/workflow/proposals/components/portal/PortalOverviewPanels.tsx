"use client";

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NorthEast as ArrowIcon } from '@mui/icons-material';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';

type OverviewSectionStatus = 'complete' | 'available' | 'locked' | 'review_pending' | 'accepted' | 'changes_requested';
type OverviewTab = 'questionnaire' | 'estimate' | 'proposal' | 'contract' | 'invoices';

interface OverviewSection {
    status: OverviewSectionStatus;
}

interface PortalOverviewPanelsProps {
    sections: {
        questionnaire: OverviewSection | null;
        estimate: OverviewSection | null;
        proposal: OverviewSection | null;
        contract: OverviewSection | null;
        invoices: OverviewSection | null;
    };
    colors: PortalDashboardColors;
    onTabChange: (tab: OverviewTab) => void;
}

interface OverviewPanelItem {
    key: string;
    eyebrow: string;
    title: string;
    description: string;
    status: OverviewSectionStatus;
    accent: string;
    tab: OverviewTab;
}

export function PortalOverviewPanels({ sections, colors, onTabChange }: PortalOverviewPanelsProps) {
    const contractOrInvoices = (() => {
        if (sections.invoices && sections.invoices.status !== 'locked') {
            return {
                key: 'invoices',
                eyebrow: sections.invoices.status === 'available' ? 'Ready to pay' : 'After booking',
                title: 'Payments',
                description: sections.invoices.status === 'available'
                    ? 'Open invoices and payment milestones are available here.'
                    : 'Receipts and payment history will live here once billing opens.',
                status: sections.invoices.status,
                accent: colors.accent,
                tab: 'invoices' as const,
            };
        }

        return {
            key: 'contract',
            eyebrow: sections.contract?.status === 'available' ? 'Action needed' : 'After proposal',
            title: 'Contract & pay',
            description: sections.contract?.status === 'available'
                ? 'Review the contract and lock in your date when you are ready.'
                : 'Contract signing and payment steps will appear here after approval.',
            status: sections.contract?.status ?? 'locked',
            accent: colors.accent,
            tab: 'contract' as const,
        };
    })();

    const panels: OverviewPanelItem[] = [
        {
            key: 'estimate',
            eyebrow: sections.estimate?.status === 'available' ? 'Ready now' : 'Coming up',
            title: 'Estimate',
            description: sections.estimate?.status === 'available'
                ? 'Your custom package pricing is ready to review.'
                : 'Pricing will appear here once the studio has shaped your package.',
            status: sections.estimate?.status ?? 'locked',
            accent: colors.green,
            tab: 'estimate',
        },
        {
            key: 'questionnaire',
            eyebrow: sections.questionnaire?.status === 'available' ? 'Action needed' : 'Inquiry details',
            title: 'Questionnaire',
            description: sections.questionnaire?.status === 'available'
                ? 'Add the extra detail the team needs to move everything forward.'
                : 'Your submitted answers and meeting details are collected here.',
            status: sections.questionnaire?.status ?? 'locked',
            accent: colors.accent,
            tab: 'questionnaire',
        },
        {
            key: 'proposal',
            eyebrow: sections.proposal?.status === 'review_pending' ? 'Ready for review' : 'Coming up',
            title: 'Proposal',
            description: sections.proposal?.status === 'review_pending'
                ? 'Your full creative proposal is ready for review and response.'
                : 'The proposal lands here once pricing and direction are aligned.',
            status: sections.proposal?.status ?? 'locked',
            accent: '#f59e0b',
            tab: 'proposal',
        },
        contractOrInvoices,
    ];

    return (
        <Box sx={{ mt: { xs: 4, md: 5 }, maxWidth: 680, mx: 'auto' }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.5,
            }}>
                {panels.map((panel) => {
                    const isInteractive = panel.status !== 'locked';
                    const isFeatured = panel.status === 'available' || panel.status === 'review_pending';

                    return (
                        <Box
                            key={panel.key}
                            sx={{
                                minHeight: 176,
                                p: 2.5,
                                borderRadius: '18px',
                                border: `1px solid ${alpha(panel.accent, isFeatured ? 0.26 : 0.12)}`,
                                bgcolor: isFeatured ? alpha(panel.accent, 0.08) : alpha(colors.card, 0.42),
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box>
                                <Typography sx={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: alpha(isFeatured ? panel.accent : colors.muted, 0.92),
                                    mb: 1.1,
                                }}>
                                    {panel.eyebrow}
                                </Typography>
                                <Typography sx={{
                                    fontSize: { xs: '1.5rem', md: '1.75rem' },
                                    fontWeight: 700,
                                    lineHeight: 1.05,
                                    color: isInteractive ? colors.text : alpha(colors.text, 0.46),
                                    mb: 0.85,
                                }}>
                                    {panel.title}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.9rem',
                                    lineHeight: 1.55,
                                    color: alpha(colors.muted, isInteractive ? 0.84 : 0.46),
                                    maxWidth: 280,
                                }}>
                                    {panel.description}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton
                                    onClick={() => {
                                        if (!isInteractive) return;
                                        onTabChange(panel.tab);
                                    }}
                                    disabled={!isInteractive}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        border: `1px solid ${alpha(panel.accent, isFeatured ? 0.35 : 0.16)}`,
                                        color: isInteractive ? panel.accent : alpha(colors.muted, 0.32),
                                        bgcolor: alpha(panel.accent, isFeatured ? 0.1 : 0.04),
                                    }}
                                >
                                    <ArrowIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}