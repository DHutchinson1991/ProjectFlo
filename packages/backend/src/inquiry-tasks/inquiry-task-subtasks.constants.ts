export type InquiryTaskSubtaskKey =
    | 'verify_submission_data'
    | 'confirm_package_selection'
    | 'check_crew_availability'
    | 'check_equipment_availability'
    | 'resolve_availability_conflicts'
    | 'send_crew_availability_requests'
    | 'reserve_equipment'
    | 'mark_inquiry_qualified'
    | 'send_welcome_response';

export interface InquiryTaskSubtaskTemplate {
    subtask_key: InquiryTaskSubtaskKey;
    name: string;
    order_index: number;
    is_auto_only: boolean;
}

export const REVIEW_INQUIRY_SUBTASKS: InquiryTaskSubtaskTemplate[] = [
    {
        subtask_key: 'verify_submission_data',
        name: 'Verify Submission Data',
        order_index: 1,
        is_auto_only: true,
    },
    {
        subtask_key: 'confirm_package_selection',
        name: 'Confirm Package Selection',
        order_index: 2,
        is_auto_only: true,
    },
    {
        subtask_key: 'check_crew_availability',
        name: 'Check Crew Availability',
        order_index: 3,
        is_auto_only: true,
    },
    {
        subtask_key: 'check_equipment_availability',
        name: 'Check Equipment Availability',
        order_index: 4,
        is_auto_only: true,
    },
    {
        subtask_key: 'resolve_availability_conflicts',
        name: 'Resolve Availability Conflicts',
        order_index: 5,
        is_auto_only: true,
    },
    {
        subtask_key: 'send_crew_availability_requests',
        name: 'Send Availability Requests',
        order_index: 6,
        is_auto_only: true,
    },
    {
        subtask_key: 'reserve_equipment',
        name: 'Reserve Equipment',
        order_index: 7,
        is_auto_only: true,
    },
];

export const QUALIFY_AND_RESPOND_SUBTASKS: InquiryTaskSubtaskTemplate[] = [
    {
        subtask_key: 'mark_inquiry_qualified',
        name: 'Qualify Inquiry',
        order_index: 1,
        is_auto_only: false,
    },
    {
        subtask_key: 'send_welcome_response',
        name: 'Send Welcome Response',
        order_index: 2,
        is_auto_only: false,
    },
];

export const INQUIRY_TASK_SUBTASK_SETS: Record<string, InquiryTaskSubtaskTemplate[]> = {
    'Review Inquiry': REVIEW_INQUIRY_SUBTASKS,
    'Qualify & Respond': QUALIFY_AND_RESPOND_SUBTASKS,
};

export function getInquiryTaskSubtasksForName(taskName: string): InquiryTaskSubtaskTemplate[] {
    return INQUIRY_TASK_SUBTASK_SETS[taskName] ?? [];
}