import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    CreateInquiryData,
    Inquiry,
    InquiryTaskEvent,
    InquiryTaskStatus,
    InquiryTask,
    InquiryTaskSubtask,
    InquiryAvailabilityResponse,
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    UpdateInquiryData,
} from '@/features/workflow/inquiries/types';
import type {
    InquiryAvailabilityRequestStatus,
    InquiryEquipmentReservationStatus,
    InquiryScheduleDiffResult,
    InquiryScheduleSnapshotSummary,
    InquiryScheduleSyncResult,
} from '../types';
import type {
    DiscoveryQuestionnaireTemplate,
    DiscoveryQuestionnaireSubmission,
    CreateDiscoverySubmissionPayload,
} from '../types/discovery-questionnaire';

function createInquiryScheduleSnapshotApi(client: ApiClient) {
    return {
        getSummary: (inquiryId: number) =>
            client.get<InquiryScheduleSnapshotSummary>(`/api/inquiries/${inquiryId}/schedule-snapshot`),
        getEventDays: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/event-days`),
        getActivities: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/activities`),
        getCrewSlots: (inquiryId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/schedule-snapshot/crew-slots`),
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
        sendAvailabilityRequest: (inquiryId: number, data: { crew_id: number; project_crew_slot_id?: number }) =>
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
            update: (
                inquiryId: number,
                taskId: number,
                data: {
                    status?: InquiryTaskStatus;
                    due_date?: string;
                    order_index?: number;
                    assigned_to_id?: number | null;
                },
            ) => client.patch<InquiryTask>(`/api/inquiries/${inquiryId}/tasks/${taskId}`, data),
            toggle: (inquiryId: number, taskId: number, completedById?: number) =>
                client.patch<InquiryTask>(
                    `/api/inquiries/${inquiryId}/tasks/${taskId}/toggle`,
                    completedById ? { completed_by_id: completedById } : {}
                ),
            generate: (inquiryId: number) =>
                client.post<InquiryTask[]>(`/api/inquiries/${inquiryId}/tasks/generate`),
            toggleSubtask: (inquiryId: number, subtaskId: number, completedById?: number) =>
                client.patch<InquiryTaskSubtask>(
                    `/api/inquiries/${inquiryId}/subtasks/${subtaskId}/toggle`,
                    completedById ? { completed_by_id: completedById } : {}
                ),
            getEvents: (inquiryId: number, taskId: number) =>
                client.get<InquiryTaskEvent[]>(`/api/inquiries/${inquiryId}/tasks/${taskId}/events`),
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

// ─── Discovery Questionnaire Templates ───────────────────────────────────────

export function createDiscoveryQuestionnaireTemplatesApi(client: ApiClient) {
    return {
        getActive: (): Promise<DiscoveryQuestionnaireTemplate> =>
            client.get('/api/discovery-questionnaire/templates/active'),
        getAll: (): Promise<DiscoveryQuestionnaireTemplate[]> =>
            client.get('/api/discovery-questionnaire/templates'),
        getById: (id: number): Promise<DiscoveryQuestionnaireTemplate> =>
            client.get(`/api/discovery-questionnaire/templates/${id}`),
        update: (id: number, data: Partial<DiscoveryQuestionnaireTemplate>): Promise<DiscoveryQuestionnaireTemplate> =>
            client.put(`/api/discovery-questionnaire/templates/${id}`, data),
    };
}

// ─── Discovery Questionnaire Submissions ─────────────────────────────────────

export function createDiscoveryQuestionnaireSubmissionsApi(client: ApiClient) {
    return {
        getByInquiryId: (inquiryId: number): Promise<DiscoveryQuestionnaireSubmission | null> =>
            client.get(`/api/discovery-questionnaire/submissions/by-inquiry/${inquiryId}`),
        getById: (id: number): Promise<DiscoveryQuestionnaireSubmission> =>
            client.get(`/api/discovery-questionnaire/submissions/${id}`),
        create: (data: CreateDiscoverySubmissionPayload): Promise<DiscoveryQuestionnaireSubmission> =>
            client.post('/api/discovery-questionnaire/submissions', data),
        update: (id: number, data: Partial<CreateDiscoverySubmissionPayload>): Promise<DiscoveryQuestionnaireSubmission> =>
            client.patch(`/api/discovery-questionnaire/submissions/${id}`, data),
    };
}

export const inquiriesApi = createInquiriesApi(apiClient);
export const inquiryScheduleApi = createInquiryScheduleApi(apiClient);
export const discoveryQuestionnaireTemplatesApi = createDiscoveryQuestionnaireTemplatesApi(apiClient);
export const discoveryQuestionnaireSubmissionsApi = createDiscoveryQuestionnaireSubmissionsApi(apiClient);

export type InquiriesApi = ReturnType<typeof createInquiriesApi>;
export type InquiryScheduleApi = ReturnType<typeof createInquiryScheduleApi>;
export type DiscoveryQuestionnaireTemplatesApi = ReturnType<typeof createDiscoveryQuestionnaireTemplatesApi>;
export type DiscoveryQuestionnaireSubmissionsApi = ReturnType<typeof createDiscoveryQuestionnaireSubmissionsApi>;
