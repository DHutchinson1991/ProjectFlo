export interface TaskEntry {
    phase?: string | null;
    assigned_to_name?: string | null;
    name?: string | null;
    estimated_cost?: number | string | null;
    total_hours?: number | string | null;
    role_name?: string | null;
    hourly_rate?: number | string | null;
    is_on_site?: boolean | null;
    activity_key?: string | null;
    onsite_band?: string | null;
}

export type CrewEntry = {
    name: string; role: string; category: string;
    hours: number; cost: number; rate: number;
    ppFilmCosts: Map<string, { hours: number; cost: number }>;
    /** On-site band cost from task preview (charged once per person). */
    onsiteBandCost: number;
    /** On-site band label from task preview (e.g. 'Half Day', 'Day'). */
    onsiteBandLabel: string | null;
};
