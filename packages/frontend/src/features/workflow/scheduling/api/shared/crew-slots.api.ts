import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

// ─── Crew Slots API ───────────────────────────────────────────────────────────

export function createCrewSlotsApi(client: ApiClient) {
    return {
        // Package crew slots (assign crew to package event days)
        packageDay: {
            getAll: (packageId: number, dayId?: number): Promise<unknown[]> =>
                client.get(`/api/crew-slots/packages/${packageId}${dayId ? `?dayId=${dayId}` : ''}`),
            add: (packageId: number, data: {
                package_event_day_id: number;
                label?: string | null;
                crew_id?: number | null;
                job_role_id?: number | null;
                hours?: number;
            }): Promise<unknown> =>
                client.post(`/api/crew-slots/packages/${packageId}`, data),
            update: (slotId: number, data: {
                label?: string | null;
                crew_id?: number | null;
                job_role_id?: number | null;
                hours?: number;
                order_index?: number;
            }): Promise<unknown> =>
                client.patch(`/api/crew-slots/packages/crew-slots/${slotId}`, data),
            assign: (slotId: number, crewId: number | null): Promise<unknown> =>
                client.patch(`/api/crew-slots/packages/crew-slots/${slotId}/assign`, { crew_id: crewId }),
            remove: (slotId: number): Promise<void> =>
                client.delete(`/api/crew-slots/packages/crew-slots/${slotId}`),
            setEquipment: (slotId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<unknown> =>
                client.post(`/api/crew-slots/packages/crew-slots/${slotId}/equipment`, { equipment }),
            assignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.post(`/api/crew-slots/packages/crew-slots/${slotId}/activities/${activityId}`, {}),
            unassignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.delete(`/api/crew-slots/packages/crew-slots/${slotId}/activities/${activityId}`),
            syncCrewActivities: (packageId: number): Promise<{ synced: number }> =>
                client.post(`/api/crew-slots/packages/${packageId}/sync-crew-activities`, {}),
        },
        // Project-level day crew slots (inquiry/project crew)
        projectDay: {
            assign: (slotId: number, crewId: number | null): Promise<unknown> =>
                client.patch(`/api/crew-slots/project/crew-slots/${slotId}/assign`, { crew_id: crewId }),
        },
    };
}

export const crewSlotsApi = createCrewSlotsApi(apiClient);

export type CrewSlotsApi = ReturnType<typeof createCrewSlotsApi>;
