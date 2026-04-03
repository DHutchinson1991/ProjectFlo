import type { Inquiry, InquiryTask, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';

/** Tab ID type for inquiry detail screen navigation. */
export type InquiryTabId = 'inquiry' | 'discovery' | 'proposal' | 'schedule';

/** Common props shared by all inquiry tab components. */
export interface InquiryTabProps {
    inquiry: Inquiry;
    onRefresh: () => Promise<void>;
}

/** Extended props for tabs that need extra data. */
export interface InquiryTabWithContextProps extends InquiryTabProps {
    inquiryTasks: InquiryTask[];
    submission: NeedsAssessmentSubmission | null;
    currentPhase: string;
    phaseColor: (id: string) => string | undefined;
    onTasksChanged: () => void;
    onScheduleClick: () => void;
}

/**
 * Map sectionId → tab.
 * Used by the task drawer / next-best-action to switch to the right tab.
 */
export const SECTION_TO_TAB: Record<string, InquiryTabId> = {
    // Inquiry tab
    'needs-assessment-section': 'inquiry',
    'inquiry-section': 'inquiry',
    'availability-section': 'inquiry',
    'package-scope-section': 'inquiry',
    'qualify-respond-section': 'inquiry',
    'qualify-section': 'inquiry',
    'calls-section': 'inquiry',

    'estimates-section': 'inquiry',
    'payment-terms-section': 'proposal',

    // Discovery tab
    'discovery-section': 'discovery',
    'discovery-questionnaire-section': 'discovery',

    // Proposal tab
    'proposal-section': 'proposal',
    'proposals-section': 'proposal',
    'proposal-review-section': 'proposal',
    'contracts-section': 'proposal',
    'approval-section': 'proposal',
    'quotes-section': 'proposal',
    'invoices-section': 'proposal',

    // Schedule tab
    'schedule-section': 'schedule',
    'booking-section': 'proposal',
};

/** Navigate to a section: switch tab, then scroll after a tick. */
export function navigateToSection(
    sectionId: string,
    setActiveTab: (tab: InquiryTabId) => void,
) {
    const tab = SECTION_TO_TAB[sectionId];
    if (tab) setActiveTab(tab);

    // Scroll only after tab content has had time to mount.
    const tryScroll = () => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    requestAnimationFrame(() => {
        requestAnimationFrame(tryScroll);
    });
}
