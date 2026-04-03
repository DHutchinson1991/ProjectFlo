import type { Inquiry, InquiryTask, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';
import type { ConversionData } from '../../lib';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface CommandCenterHeaderProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    inquiryTasks: InquiryTask[];
    needsAssessmentSubmission: NeedsAssessmentSubmission | null;
    conversionData: ConversionData;
    daysInPipeline: number;
    dealValue: number;
    onRefresh: () => Promise<void>;
    onSnackbar: (msg: string) => void;
}

export interface ContactInfoProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    conversionData: ConversionData;
    onRefresh: () => Promise<void>;
    onSnackbar: (msg: string) => void;
}

export interface MetricsPillsProps {
    inquiry: Inquiry;
    needsAssessmentSubmission: NeedsAssessmentSubmission | null;
    conversionData: ConversionData;
    dealValue: number;
    currencyCode: string;
    validityDays: number;
}

export interface HeaderActionsProps {
    inquiry: Inquiry;
    inquiryTasks: InquiryTask[];
    submission: NeedsAssessmentSubmission | null;
    onRefresh: () => Promise<void>;
    onSnackbar: (msg: string) => void;
}
