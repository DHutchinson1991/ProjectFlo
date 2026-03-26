export interface InquiryScheduleSnapshotSummary {
    owner_id: number;
    owner_type: string;
    source_package_id: number | null;
    source_package_name: string | null;
    event_day_count: number;
    activity_count: number;
    operator_count: number;
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

export type InquiryAvailabilityRequestStatus = 'confirmed' | 'declined' | 'cancelled';
export type InquiryEquipmentReservationStatus = 'confirmed' | 'cancelled';
