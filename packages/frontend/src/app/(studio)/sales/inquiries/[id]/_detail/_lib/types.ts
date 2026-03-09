import type { ComponentType } from 'react';
import type { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';

// ─── Shared prop interface for workflow card components ──────────────

export interface WorkflowCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: NeedsAssessmentSubmission | null;
}

// ─── Deal intelligence types ─────────────────────────────────────────

export interface ConversionData {
    score: number;
    label: string;
    color: string;
}

export interface NextActionData {
    action: string;
    description: string;
    color: string;
    sectionId: string;
}

// ─── Workflow phase definition ───────────────────────────────────────

export interface WorkflowPhase {
    id: string;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ComponentType<any>;
    color: string;
    description: string;
    tasks: string[];
    sectionId: string;
}

// ─── Needs assessment category ───────────────────────────────────────

export interface NaCategory {
    label: string;
    keys: string[];
}
