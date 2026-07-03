import type { Inquiry } from '@/features/workflow/inquiries/types';
import type { InquiryWizardSubmission } from '@/features/workflow/inquiry-wizard';

export interface EventDetailsCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: InquiryWizardSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

export interface VenueSectionProps {
    venueShortName: string;
    venueLabel: string;
    structuredAddress: { label: string; value: string }[];
    distance: string | null;
    hasVenueCoords: boolean;
}

export interface EventNotesSectionProps {
    partnerName?: string;
    specialRequests?: string;
    birthdayPerson?: string;
    birthdayRelation?: string;
    isBirthdayPerson?: string;
}

