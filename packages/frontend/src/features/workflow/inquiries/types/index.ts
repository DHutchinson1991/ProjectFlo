// ─── Inquiry types (canonical source: ./inquiry.ts) ────────────────────────
export type {
    Inquiry,
    InquiryTask,
    InquiryTaskStatus,
    CreateInquiryData,
    UpdateInquiryData,
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    InquiryAvailabilityResponse,
    InquiryTaskSubtask,
    InquiryTaskEvent,
    InquiryAvailabilityConflict,
    InquiryAvailabilityAlternativeCrew,
    InquiryEquipmentAvailabilityAlternative,
} from './inquiry';
export { InquiryStatus, InquirySource } from './inquiry';

// Needs-assessment domain
export type {
    NeedsAssessmentSubmission,
    NaDateConflictResult,
    NaCrewConflictResult,
} from './needs-assessment';

// Discovery questionnaire domain
export type {
    DiscoveryQuestion,
    DiscoveryQuestionnaireTemplate,
    DiscoveryQuestionnaireSubmission,
    CreateDiscoverySubmissionPayload,
} from './discovery-questionnaire';

// Schedule snapshot types (used by discovery questionnaire components)
export type { SnapshotActivity, SnapshotMoment } from './schedule-snapshot';

// Brand (MeetingSettings for DiscoveryCallCard)
export type { MeetingSettings } from '@/features/platform/brand/types';

// Task-library (TaskAutoGenerationPreviewTask for AvailabilityCard)
export type { TaskAutoGenerationPreviewTask } from '@/features/catalog/task-library/types';

// ─── Feature-owned types ─────────────────────────────────────────────
export interface InquiryScheduleSnapshotSummary {
    owner_id: number;
    owner_type: string;
    source_package_id: number | null;
    source_package_name: string | null;
    event_day_count: number;
    activity_count: number;
    crew_slot_count: number;
    subject_count: number;
    location_slot_count: number;
    film_count: number;
}

export interface InquiryScheduleSyncResult {
    success?: boolean;
    message?: string;
}

export interface InquiryScheduleDiffResult {
    added?: unknown[];
    removed?: unknown[];
    changed?: unknown[];
}

export type InquiryAvailabilityRequestStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';
export type InquiryEquipmentReservationStatus = 'confirmed' | 'cancelled';

// Availability card state types
export type {
    RequestState,
    RequestMap,
    ReservationState,
    ReservationMap,
    CrewDialogState,
    EquipmentDialogState,
    MergedCrewGroup,
} from './availability';
