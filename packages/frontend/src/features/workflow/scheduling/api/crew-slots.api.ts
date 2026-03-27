import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

// ─── Crew Slots API ───────────────────────────────────────────────────────────

export function createCrewSlotsApi(client: ApiClient) {
    return {
        // Package crew slots (assign crew to package event days)
        packageDay: {
            getAll: (packageId: number, dayId?: number): Promise<unknown[]> =>
                client.get(`/crew-slots/packages/${packageId}${dayId ? `?dayId=${dayId}` : ''}`),
            add: (packageId: number, data: {
                event_day_template_id: number;
                label?: string | null;
                crew_member_id?: number | null;
                job_role_id?: number | null;
                hours?: number;
                package_activity_id?: number | null;
            }): Promise<unknown> =>
                client.post(`/crew-slots/packages/${packageId}`, data),
            update: (slotId: number, data: {
                label?: string | null;
                crew_member_id?: number | null;
                job_role_id?: number | null;
                hours?: number;
                order_index?: number;
                package_activity_id?: number | null;
            }): Promise<unknown> =>
                client.patch(`/crew-slots/packages/day-operators/${slotId}`, data),
            assign: (slotId: number, crewMemberId: number | null): Promise<unknown> =>
                client.patch(`/crew-slots/packages/day-operators/${slotId}/assign`, { crew_member_id: crewMemberId }),
            remove: (slotId: number): Promise<void> =>
                client.delete(`/crew-slots/packages/day-operators/${slotId}`),
            setEquipment: (slotId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<unknown> =>
                client.post(`/crew-slots/packages/day-operators/${slotId}/equipment`, { equipment }),
            assignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.post(`/crew-slots/packages/day-operators/${slotId}/activities/${activityId}`, {}),
            unassignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.delete(`/crew-slots/packages/day-operators/${slotId}/activities/${activityId}`),
        },
        // Project-level day operators (inquiry/project crew)
        projectDay: {
            assign: (slotId: number, crewMemberId: number | null): Promise<unknown> =>
                client.patch(`/crew-slots/project/day-operators/${slotId}/assign`, { crew_member_id: crewMemberId }),
        },
    };
}

export const crewSlotsApi = createCrewSlotsApi(apiClient);

export type CrewSlotsApi = ReturnType<typeof createCrewSlotsApi>;
