import type { ComponentType } from 'react';
import type { Inquiry, NeedsAssessmentSubmission, InquiryTaskStatus } from '@/features/workflow/inquiries/types';

// ─── Shared prop interface for workflow card components ──────────────

export interface WorkflowCardProps {
    inquiry: Inquiry;
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

// ─── Pipeline task (from task library) ───────────────────────────────

export interface PipelineTask {
    id: number;
    name: string;
    phase: 'Inquiry' | 'Booking';
    order_index: number;
    color: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ComponentType<any>;
    sectionId: string;
    description?: string;
    // Real task tracking fields (from inquiry_tasks)
    status?: InquiryTaskStatus;
    estimated_hours?: number | null;
    due_date?: string | null;
    completed_at?: string | null;
    inquiry_task_id?: number; // the actual inquiry_tasks.id
    parentStageId?: number;   // parent inquiry_task.id for grouping
    assigned_to_id?: number | null;
    assigned_to?: {
        id: number;
        contact: { first_name: string; last_name: string; email?: string };
    } | null;
    is_auto_only?: boolean;
}

// ─── Needs assessment category ───────────────────────────────────────

export interface NaCategory {
    label: string;
    keys: string[];
}
