import type { Proposal, ProposalSectionView, ProposalSectionNote, ProposalContractSummary } from '@/features/workflow/proposals';
import type { WorkflowCardProps } from '../../lib';

export type ProposalsCardProps = WorkflowCardProps;

export interface SectionViewIconsProps {
    sectionViews: ProposalSectionView[];
    sectionNotes: ProposalSectionNote[];
}

export interface ContractJourneyProps {
    contract: ProposalContractSummary;
}

/* ── Pure helpers ── */

export function getEffectiveStatus(proposal: Proposal): string {
    if (proposal.client_response === 'Accepted') return 'Accepted';
    if (proposal.client_response === 'Reconsideration') return 'Reconsideration';
    if (proposal.client_response === 'ChangesRequested') return 'ChangesRequested';
    if (proposal.viewed_at && proposal.status === 'Sent') return 'Viewed';
    return proposal.status;
}

export const STEPS = ['Draft', 'Sent', 'Viewed', 'Accepted'];

export function getActiveStep(status: string): number {
    const map: Record<string, number> = { Draft: 0, Sent: 1, Viewed: 2, Accepted: 3, ChangesRequested: 2, Reconsideration: 2 };
    return map[status] ?? 0;
}

