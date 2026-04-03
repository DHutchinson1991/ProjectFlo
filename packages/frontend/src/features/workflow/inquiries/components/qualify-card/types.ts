import type { Inquiry, InquiryTask } from '@/features/workflow/inquiries/types';
import type { NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types/needs-assessment';

export interface QualifyCardProps {
    inquiry: Inquiry;
    inquiryTasks: InquiryTask[];
    submission: NeedsAssessmentSubmission | null;
    onRefresh: () => Promise<void>;
}

export type SubtaskLite = {
    id: number;
    subtask_key: string;
    status: string;
};

export type DiscoveryCallData = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    meeting_type: 'ONLINE' | 'PHONE_CALL' | 'IN_PERSON' | 'VIDEO_CALL' | null;
    meeting_url: string | null;
    location: string | null;
    is_confirmed?: boolean;
} | null;

export function formatDate(d: Date | string | null | undefined): string | null {
    if (!d) return null;
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(d: Date | string): string {
    const parsed = new Date(d);
    return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

export function meetingTypeLabel(type: NonNullable<NonNullable<DiscoveryCallData>>['meeting_type']): string {
    switch (type) {
        case 'VIDEO_CALL': return 'Video Call';
        case 'ONLINE': return 'Online Meeting';
        case 'PHONE_CALL': return 'Phone Call';
        case 'IN_PERSON': return 'In Person';
        default: return 'Meeting';
    }
}
