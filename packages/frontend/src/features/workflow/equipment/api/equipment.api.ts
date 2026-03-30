import type { ApiClient } from "@/shared/api/client";
import type { CrewApiResponse } from "@/shared/types/user-api";
import { mapCrewResponse } from "@/shared/types/user-mappers";
import type { Crew } from "@/shared/types/users";
import type {
    Equipment,
    EquipmentRental,
    EquipmentMaintenance,
    CreateEquipmentDto,
    UpdateEquipmentDto,
    CreateEquipmentRentalDto,
    UpdateEquipmentRentalDto,
    CreateEquipmentMaintenanceDto,
    UpdateEquipmentMaintenanceDto,
    EquipmentByCategory,
    EquipmentStats,
} from "../types/equipment.types";

export interface EquipmentTemplateItem {
    id: number;
    slot_type: "CAMERA" | "AUDIO";
    slot_index: number;
    equipment_id: number;
}

export interface EquipmentTemplate {
    id: number;
    name: string;
    description?: string | null;
    items: EquipmentTemplateItem[];
}

export const createEquipmentApi = (client: ApiClient) => ({
    // Main equipment CRUD
    getAll: (query?: {
        category?: string;
        type?: string;
        status?: string;
        search?: string;
        manufacturer?: string;
        location?: string;
    }): Promise<Equipment[]> => {
        const params = new URLSearchParams();
        if (query?.category) params.append("category", query.category);
        if (query?.type) params.append("type", query.type);
        if (query?.status) params.append("status", query.status);
        if (query?.search) params.append("search", query.search);
        if (query?.manufacturer) params.append("manufacturer", query.manufacturer);
        if (query?.location) params.append("location", query.location);
        const queryString = params.toString();
        return client.get<Equipment[]>(`/api/equipment${queryString ? `?${queryString}` : ""}`);
    },

    getById: (id: number): Promise<Equipment> =>
        client.get<Equipment>(`/api/equipment/${id}`),

    create: (data: CreateEquipmentDto): Promise<Equipment> =>
        client.post<Equipment>("/api/equipment", data),

    update: (id: number, data: UpdateEquipmentDto | Partial<CreateEquipmentDto>): Promise<Equipment> =>
        client.patch<Equipment>(`/api/equipment/${id}`, data),

    delete: (id: number): Promise<void> =>
        client.delete<void>(`/api/equipment/${id}`),

    getGroupedByCategory: async (): Promise<EquipmentByCategory> => {
        const response = await client.get<{ groupedByType: EquipmentByCategory }>("/api/equipment/grouped");
        return response.groupedByType;
    },

    getStats: (): Promise<EquipmentStats> =>
        client.get<EquipmentStats>("/api/equipment/stats"),

    getAvailable: (startDate?: string, endDate?: string): Promise<Equipment[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        const queryString = params.toString();
        return client.get<Equipment[]>(`/api/equipment/available${queryString ? `?${queryString}` : ""}`);
    },

    getAvailability: (equipmentId: number, query: { start_date: string; end_date: string; status?: string }) => {
        const params = new URLSearchParams({
            start_date: query.start_date,
            end_date: query.end_date,
        });
        if (query.status) {
            params.append('status', query.status);
        }
        return client.get<unknown[]>(`/api/equipment/${equipmentId}/availability?${params}`);
    },

    getTemplatesByBrand: (brandId: number): Promise<EquipmentTemplate[]> =>
        client.get<EquipmentTemplate[]>(`/api/equipment/templates/brand/${brandId}`, { skipBrandContext: true }),

    // Equipment unmanned status
    findUnmanned: (brandId: number): Promise<Equipment[]> =>
        client.get<Equipment[]>(`/api/equipment/unmanned/${brandId}`),

    setUnmannedStatus: (equipmentId: number, isUnmanned: boolean): Promise<Equipment> =>
        client.patch<Equipment>(`/api/equipment/${equipmentId}/unmanned`, { isUnmanned }),

    // Crew (used to populate owner dropdowns)
    getCrew: async (): Promise<Crew[]> => {
        const apiResponse = await client.get<CrewApiResponse[]>("/api/crew");
        return apiResponse.map(mapCrewResponse);
    },

    // Equipment rental methods
    rentals: {
        getAll: (equipmentId?: number): Promise<EquipmentRental[]> => {
            const endpoint = equipmentId
                ? `/api/equipment/${equipmentId}/rentals`
                : "/api/equipment/rentals";
            return client.get<EquipmentRental[]>(endpoint);
        },

        getById: (id: number): Promise<EquipmentRental> =>
            client.get<EquipmentRental>(`/api/equipment/rentals/${id}`),

        create: (data: CreateEquipmentRentalDto): Promise<EquipmentRental> =>
            client.post<EquipmentRental>("/api/equipment/rentals", data),

        update: (id: number, data: UpdateEquipmentRentalDto): Promise<EquipmentRental> =>
            client.patch<EquipmentRental>(`/api/equipment/rentals/${id}`, data),

        delete: (id: number): Promise<void> =>
            client.delete<void>(`/api/equipment/rentals/${id}`),

        returnEquipment: (id: number, depositReturned = true): Promise<EquipmentRental> =>
            client.patch<EquipmentRental>(`/api/equipment/rentals/${id}/return`, {
                status: "Completed",
                deposit_returned: depositReturned,
            }),

        getActive: (): Promise<EquipmentRental[]> =>
            client.get<EquipmentRental[]>("/api/equipment/rentals?status=Active"),
    },

    // Equipment maintenance methods
    maintenance: {
        getAll: (equipmentId?: number): Promise<EquipmentMaintenance[]> => {
            const endpoint = equipmentId
                ? `/api/equipment/${equipmentId}/maintenance`
                : "/api/equipment/maintenance";
            return client.get<EquipmentMaintenance[]>(endpoint);
        },

        getById: (id: number): Promise<EquipmentMaintenance> =>
            client.get<EquipmentMaintenance>(`/api/equipment/maintenance/${id}`),

        create: (data: CreateEquipmentMaintenanceDto): Promise<EquipmentMaintenance> =>
            client.post<EquipmentMaintenance>("/api/equipment/maintenance", data),

        update: (id: number, data: UpdateEquipmentMaintenanceDto): Promise<EquipmentMaintenance> =>
            client.patch<EquipmentMaintenance>(`/api/equipment/maintenance/${id}`, data),

        delete: (id: number): Promise<void> =>
            client.delete<void>(`/api/equipment/maintenance/${id}`),

        complete: (id: number, notes?: string): Promise<EquipmentMaintenance> =>
            client.patch<EquipmentMaintenance>(`/api/equipment/maintenance/${id}/complete`, {
                status: "Completed",
                completed_date: new Date().toISOString(),
                notes,
            }),

        getDue: (): Promise<EquipmentMaintenance[]> =>
            client.get<EquipmentMaintenance[]>("/api/equipment/maintenance/due"),

        getScheduled: (): Promise<EquipmentMaintenance[]> =>
            client.get<EquipmentMaintenance[]>("/api/equipment/maintenance?status=Scheduled"),
    },
});

export type EquipmentApi = ReturnType<typeof createEquipmentApi>;
