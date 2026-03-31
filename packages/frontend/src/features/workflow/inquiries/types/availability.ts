import type {
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    TaskAutoGenerationPreviewTask,
} from './index';

export type RequestState = { id: number; status: 'pending' | 'confirmed' | 'declined' | 'cancelled' };
export type RequestMap = Map<number, RequestState>; // keyed by crew_id
export type ReservationState = { id: number; status: 'reserved' | 'confirmed' | 'cancelled' };
export type ReservationMap = Map<number, ReservationState>; // keyed by assignment id (row.id)

export type CrewDialogState = {
    crewId: number;
    crewName: string;
    crewEmail?: string | null;
    rows: InquiryCrewAvailabilityRow[];
    requestState?: RequestState;
    emailSubject: string;
    emailBody: string;
    previewTasks?: TaskAutoGenerationPreviewTask[];
    eventDate?: Date | string | null;
    venueDetails?: string | null;
    eventType?: string | null;
    clientName?: string;
    brandName?: string;
};

export type EquipmentDialogState = {
    ownerId: number;
    ownerName: string;
    ownerEmail?: string | null;
    rows: InquiryEquipmentAvailabilityRow[];
    reservationStates: Map<number, ReservationState>;
    emailSubject: string;
    emailBody: string;
};

export type MergedCrewGroup = {
    cid: number;
    name: string;
    onSiteRows: InquiryCrewAvailabilityRow[];
    projectRows: InquiryCrewAvailabilityRow[];
};
