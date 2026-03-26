import { apiClient } from '@/lib/api';
import type { ApiClient } from '@/lib/api/api-client.types';
import type {
    CreateInquiryData,
    Inquiry,
    InquiryTask,
    InquiryTaskSubtask,
    InquiryAvailabilityResponse,
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    UpdateInquiryData,
} from '@/lib/types';
import type {
    InquiryAvailabilityRequestStatus,
    InquiryEquipmentReservationStatus,
    InquiryScheduleDiffResult,
    InquiryScheduleSnapshotSummary,
    InquiryScheduleSyncResult,
} from '../types';

function createInquiryScheduleSnapshotApi(client: ApiClient) {
    return {
        getSummary: (inquiryId: number) =>
            client.get<InquiryScheduleSnapshotSummary>(`/api/inquiries/${inquiryId}/schedule-snapshot`),
        getEventDays: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/event-days`),
        getActivities: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/activities`),
        getOperators: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/operators`),
        getSubjects: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/subjects`),
        getLocations: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/locations`),
        getFilms: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/films`),
        getActivityMoments: (inquiryId: number, activityId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/activities/${activityId}/moments`),
    };
}

export function createInquiriesApi(client: ApiClient) {
    return {
        getAll: () => client.get<Inquiry[]>('/api/inquiries'),
        getById: (inquiryId: number) => client.get<Inquiry>(`/api/inquiries/${inquiryId}`),
        create: (data: CreateInquiryData) => client.post<Inquiry>('/api/inquiries', data),
        update: (inquiryId: number, data: UpdateInquiryData) =>
            client.put<Inquiry>(`/api/inquiries/${inquiryId}`, data),
        convert: (inquiryId: number) =>
            client.post<{ projectId: number }>(`/api/inquiries/${inquiryId}/convert`),
        delete: (inquiryId: number) => client.delete<void>(`/api/inquiries/${inquiryId}`),
        sendWelcomePack: (inquiryId: number) =>
            client.post<{ welcome_sent_at: string }>(`/api/inquiries/${inquiryId}/send-welcome-pack`),
        getDiscoveryCall: (inquiryId: number) =>
            client.get<{
                id: number;
                title: string;
                start_time: string;
                end_time: string;
                meeting_type: 'ONLINE' | 'PHONE_CALL' | 'IN_PERSON' | 'VIDEO_CALL' | null;
                meeting_url: string | null;
                location: string | null;
            } | null>(`/api/inquiries/${inquiryId}/discovery-call`),
        getCrewAvailability: (inquiryId: number) =>
            client.get<InquiryAvailabilityResponse<InquiryCrewAvailabilityRow>>(
                `/api/inquiries/${inquiryId}/crew-availability`
            ),
        getEquipmentAvailability: (inquiryId: number) =>
            client.get<InquiryAvailabilityResponse<InquiryEquipmentAvailabilityRow>>(
                `/api/inquiries/${inquiryId}/equipment-availability`
            ),
        sendAvailabilityRequest: (inquiryId: number, data: { contributor_id: number; project_day_operator_id?: number }) =>
            client.post<{ id: number; status: string }>(`/api/inquiries/${inquiryId}/availability-requests`, data),
        updateAvailabilityRequest: (
            inquiryId: number,
            requestId: number,
            status: InquiryAvailabilityRequestStatus,
        ) => client.patch<{ id: number; status: string }>(`/api/inquiries/${inquiryId}/availability-requests/${requestId}`, { status }),
        reserveEquipment: (inquiryId: number, assignmentId: number) =>
            client.post<{ id: number; status: string; equipment_availability_id: number }>(
                `/api/inquiries/${inquiryId}/equipment-reservations`,
                { assignment_id: assignmentId }
            ),
        cancelEquipmentReservation: (inquiryId: number, reservationId: number) =>
            client.delete<{ id: number; status: string }>(`/api/inquiries/${inquiryId}/equipment-reservations/${reservationId}`),
        updateEquipmentReservation: (
            inquiryId: number,
            reservationId: number,
            status: InquiryEquipmentReservationStatus,
        ) => client.patch<{ id: number; status: string }>(`/api/inquiries/${inquiryId}/equipment-reservations/${reservationId}`, { status }),
        swapEquipment: (inquiryId: number, assignmentId: number, newEquipmentId: number) =>
            client.patch<{ id: number; old_equipment_id: number; new_equipment_id: number }>(
                `/api/inquiries/${inquiryId}/equipment-assignments/${assignmentId}/swap`,
                { new_equipment_id: newEquipmentId }
            ),
        inquiryTasks: {
            getAll: (inquiryId: number) =>
                client.get<InquiryTask[]>(`/api/inquiries/${inquiryId}/tasks`),
            generate: (inquiryId: number) =>
                client.post<InquiryTask[]>(`/api/inquiries/${inquiryId}/tasks/generate`),
            toggleSubtask: (inquiryId: number, subtaskId: number, completedById?: number) =>
                client.patch<InquiryTaskSubtask>(
                    `/api/inquiries/${inquiryId}/subtasks/${subtaskId}/toggle`,
                    completedById ? { completed_by_id: completedById } : {}
                ),
        },
        scheduleSnapshot: createInquiryScheduleSnapshotApi(client),
    };
}

export function createInquiryScheduleApi(client: ApiClient) {
    return {
        syncFromPackage: (inquiryId: number) =>
            client.post<InquiryScheduleSyncResult>(`/api/inquiries/${inquiryId}/schedule/sync-from-package`, {}),
        getDiff: (inquiryId: number) =>
            client.get<InquiryScheduleDiffResult>(`/api/inquiries/${inquiryId}/schedule/diff`),
    };
}

export const inquiriesApi = createInquiriesApi(apiClient as unknown as ApiClient);
export const inquiryScheduleApi = createInquiryScheduleApi(apiClient as unknown as ApiClient);

export type InquiriesApi = ReturnType<typeof createInquiriesApi>;
export type InquiryScheduleApi = ReturnType<typeof createInquiryScheduleApi>;
