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
    /* ── All possible cards ──────────────────────────────────────── */
    const allCards: Record<string, OverviewPanelItem> = {
        questionnaire: {
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
        estimate: {
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
        proposal: {
            key: 'proposal',
            eyebrow: (() => {
                const s = sections.proposal?.status;
                if (s === 'review_pending') return 'Ready for review';
                if (s === 'changes_requested') return 'Under review';
                if (s === 'accepted') return 'Accepted';
                return 'Coming up';
            })(),
            title: 'Proposal',
            description: sections.proposal?.status === 'review_pending'
                ? 'Your full creative proposal is ready for review and response.'
                : sections.proposal?.status === 'accepted'
                    ? 'Your approved proposal and creative direction.'
                    : 'The proposal lands here once pricing and direction are aligned.',
            status: sections.proposal?.status ?? 'locked',
            accent: '#f59e0b',
            tab: 'proposal',
        },
        contract: {
            key: 'contract',
            eyebrow: sections.contract?.status === 'available' ? 'Action needed'
                : sections.contract?.status === 'complete' ? 'Signed' : 'After proposal',
            title: 'Contract',
            description: sections.contract?.status === 'available'
                ? 'Review the contract and lock in your date when you are ready.'
                : sections.contract?.status === 'complete'
                    ? 'Your signed contract is available here.'
                    : 'Contract signing will appear here after approval.',
            status: sections.contract?.status ?? 'locked',
            accent: colors.accent,
            tab: 'contract',
        },
        invoices: {
            key: 'invoices',
            eyebrow: sections.invoices?.status === 'available' ? 'Billing details' : 'After booking',
            title: 'Payments',
            description: sections.invoices?.status === 'available'
                ? 'View your invoice breakdown and payment schedule.'
                : 'Payment milestones will appear here once billing opens.',
            status: sections.invoices?.status ?? 'locked',
            accent: colors.accent,
            tab: 'invoices',
        },
    };

    /* ── Pick 2 contextual cards based on journey stage ──────────── */
    const panels: OverviewPanelItem[] = (() => {
        const hasInvoices = sections.invoices && sections.invoices.status !== 'locked';
        const hasContract = sections.contract && sections.contract.status !== 'locked';
        const contractSigned = sections.contract?.status === 'complete';
        const proposalAccepted = sections.proposal?.status === 'accepted';
        const hasProposal = sections.proposal && sections.proposal.status !== 'locked';
        const hasEstimate = sections.estimate && sections.estimate.status !== 'locked';

        // Post-booking: Contract (signed) + Payments
        if (hasInvoices && contractSigned) {
            return [allCards.contract, allCards.invoices];
        }

        // Contract ready or signed but no invoices yet: Proposal + Contract
        if (hasContract) {
            return [allCards.proposal, allCards.contract];
        }

        // Proposal out for review / accepted: Estimate + Proposal
        if (hasProposal) {
            return [allCards.estimate, allCards.proposal];
        }

        // Estimate ready, no proposal yet: Questionnaire + Estimate
        if (hasEstimate) {
            return [allCards.questionnaire, allCards.estimate];
        }

        // Early stage: Questionnaire + Estimate (coming up)
        return [allCards.questionnaire, allCards.estimate];
    })();

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