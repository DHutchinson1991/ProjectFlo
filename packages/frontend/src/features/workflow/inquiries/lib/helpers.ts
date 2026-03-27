import type { Inquiry, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';
import type { ConversionData, NextActionData, PipelineTask } from './types';
import { NA_CATEGORIES, NA_HIDDEN_KEYS, TASK_AUTO_COMPLETE, WORKFLOW_PHASES } from './constants';

// ─── Deal intelligence ───────────────────────────────────────────────

export const getConversionScore = (inq: Inquiry): ConversionData => {
    let score = 0;
    if (inq.contact?.email && !inq.contact.email.startsWith('pending_')) score += 10;
    if (inq.contact?.phone_number) score += 10;
    if (inq.workflow_status && typeof inq.workflow_status === 'object' && inq.workflow_status.needsAssessment === 'completed') score += 15;
    if (inq.estimates && inq.estimates.length > 0) score += 15;
    if (inq.workflow_status && typeof inq.workflow_status === 'object' && inq.workflow_status.discoveryCall === 'completed') score += 10;
    if (inq.proposals && inq.proposals.length > 0) score += 15;
    if (inq.quotes && inq.quotes.length > 0) score += 10;
    if (inq.contracts && inq.contracts.length > 0) score += 10;
    if (score >= 80) return { score, label: 'Hot', color: '#ef4444' };
    if (score >= 50) return { score, label: 'Warm', color: '#f59e0b' };
    if (score >= 25) return { score, label: 'Cool', color: '#3b82f6' };
    return { score, label: 'Cold', color: '#64748b' };
};

export const getNextBestAction = (inq: Inquiry, sub: NeedsAssessmentSubmission | null): NextActionData => {
    if (!sub) return { action: 'Send Assessment', description: 'Get client requirements to start the conversation', color: '#3b82f6', sectionId: 'needs-assessment-section' };
    if (!inq.estimates || inq.estimates.length === 0) return { action: 'Create Estimate', description: 'Draft a pricing estimate based on their needs', color: '#10b981', sectionId: 'estimates-section' };
    if (!inq.proposals || inq.proposals.length === 0) return { action: 'Send Proposal', description: 'Create a compelling proposal to win them over', color: '#8b5cf6', sectionId: 'proposals-section' };
    if (!inq.quotes || inq.quotes.length === 0) return { action: 'Generate Quote', description: 'Finalize pricing with a professional quote', color: '#ef4444', sectionId: 'quotes-section' };
    if (!inq.contracts || inq.contracts.length === 0) return { action: 'Draft Contract', description: 'Lock in the deal with an agreement', color: '#6366f1', sectionId: 'contracts-section' };
    return { action: 'Close the Deal!', description: 'Get their signature and book the project!', color: '#14b8a6', sectionId: 'approval-section' };
};

export const getDaysInPipeline = (inq: Inquiry): number => {
    if (!inq.created_at) return 0;
    return Math.floor((Date.now() - new Date(inq.created_at).getTime()) / 86400000);
};

// ─── Workflow progress ───────────────────────────────────────────────

export const calculateWorkflowProgress = (inquiry: Inquiry) => {
    if (!inquiry?.workflow_status) return 0;
    const status = inquiry.workflow_status;
    let completedSteps = 0;
    const totalSteps = 8;
    if (typeof status === 'object') {
        if (status.needsAssessment === 'completed') completedSteps++;
        if (status.discoveryCall === 'completed') completedSteps++;
        if (status.clientApproval === 'completed') completedSteps++;
    }
    if (inquiry.estimates && inquiry.estimates.length > 0) completedSteps++;
    if (inquiry.proposals && inquiry.proposals.length > 0) completedSteps++;
    if (inquiry.quotes && inquiry.quotes.length > 0) completedSteps++;
    if (inquiry.contracts && inquiry.contracts.length > 0) completedSteps++;
    return Math.round((completedSteps / totalSteps) * 100);
};

// ─── Pipeline active-index computation ───────────────────────────────

/** Compute the index of the currently-active pipeline task. */
export function computeActiveIndex(
    tasks: PipelineTask[],
    inquiry: Inquiry,
): number {
    if (tasks.length === 0) return 0;

    const hasRealStatus = tasks[0]?.status !== undefined;
    if (hasRealStatus) {
        const firstIncompleteIdx = tasks.findIndex(t => {
            // Auto-complete rules override backend status
            const autoRule = TASK_AUTO_COMPLETE[t.name];
            if (autoRule && autoRule.check(inquiry)) return false; // auto-done → skip
            return t.status !== 'Completed';
        });
        if (firstIncompleteIdx === -1) return tasks.length - 1;
        return firstIncompleteIdx;
    }

    // Fallback: old heuristic for task-library-only mode
    if (!inquiry?.workflow_status) return 0;
    const status = inquiry.workflow_status;
    let completedSteps = 0;
    if (typeof status === 'object') {
        if (status.needsAssessment === 'completed') completedSteps++;
        if (status.discoveryCall === 'completed') completedSteps++;
        if (status.clientApproval === 'completed') completedSteps++;
    }
    if (inquiry.estimates && inquiry.estimates.length > 0) completedSteps++;
    if (inquiry.proposals && inquiry.proposals.length > 0) completedSteps++;
    if (inquiry.quotes && inquiry.quotes.length > 0) completedSteps++;
    if (inquiry.contracts && inquiry.contracts.length > 0) completedSteps++;

    const pct = completedSteps / 8;
    return Math.min(Math.floor(pct * tasks.length), tasks.length - 1);
}

/**
 * Maps a sectionId (e.g. 'estimates-section') to a WORKFLOW_PHASES id
 * (e.g. 'estimates') so cards can compare with `currentPhase`.
 */
function sectionToPhaseId(sectionId: string): string {
    return sectionId.replace(/-section$/, '');
}

/**
 * Derive the active workflow phase id from real pipeline tasks.
 * Falls back to the legacy progress-based heuristic when no tasks exist.
 */
export function getActivePhaseFromTasks(
    tasks: PipelineTask[],
    inquiry: Inquiry,
): string {
    if (tasks.length > 0) {
        const idx = computeActiveIndex(tasks, inquiry);
        return sectionToPhaseId(tasks[idx].sectionId);
    }
    // Fallback — legacy
    const pct = calculateWorkflowProgress(inquiry);
    const completedCount = Math.floor((pct / 100) * WORKFLOW_PHASES.length);
    const activeIndex = Math.min(completedCount, WORKFLOW_PHASES.length - 1);
    return WORKFLOW_PHASES[activeIndex].id;
}

// ─── Display helpers ─────────────────────────────────────────────────

export const getDisplayEmail = (email?: string) => {
    if (!email) return '';
    if (email.startsWith('pending_') && email.endsWith('@temp.com')) return '';
    return email;
};

export const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

export const getDealValue = (inquiry: Inquiry): number => {
    const primaryEst = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
    return primaryEst ? Number(primaryEst.total_amount || 0) : 0;
};

// ─── Needs assessment response formatting ────────────────────────────

export const humanize = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const fmtVal = (v: unknown): string => {
    if (v === null || v === undefined || v === '') return '-';
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
};

export const groupNaResponses = (responses: Record<string, unknown>) => {
    const naGrouped = NA_CATEGORIES.map(cat => {
        const entries = cat.keys
            .filter(k => responses[k] !== undefined && responses[k] !== null && responses[k] !== '')
            .map(k => ({ key: k, label: humanize(k), value: responses[k] }));
        return { ...cat, entries };
    }).filter(c => c.entries.length > 0);

    const naCatKeys = new Set(NA_CATEGORIES.flatMap(c => c.keys));
    const hiddenSet = new Set(NA_HIDDEN_KEYS);
    const naUncategorized = Object.entries(responses)
        .filter(([k, v]) => !naCatKeys.has(k) && !hiddenSet.has(k) && v !== undefined && v !== null && v !== '')
        .map(([k, v]) => ({ key: k, label: humanize(k), value: v }));

    return { naGrouped, naUncategorized };
};
