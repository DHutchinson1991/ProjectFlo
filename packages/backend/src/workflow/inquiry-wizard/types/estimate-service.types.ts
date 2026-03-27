export interface TaskEntry {
    phase?: string | null;
    assigned_to_name?: string | null;
    name?: string | null;
    estimated_cost?: number | string | null;
    total_hours?: number | string | null;
    role_name?: string | null;
    hourly_rate?: number | string | null;
}

export type CrewEntry = {
    name: string; role: string; category: string;
    hours: number; cost: number; rate: number;
    ppFilmCosts: Map<string, { hours: number; cost: number }>;
};
