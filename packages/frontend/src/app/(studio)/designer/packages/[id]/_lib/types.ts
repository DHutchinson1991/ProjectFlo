// ─── Package Edit Page – Shared Type Definitions ─────────────────────
//
// Extracted from page.tsx to keep the page component focused on
// orchestration, and to enable reuse + independent testing.
// ─────────────────────────────────────────────────────────────────────

// ─── PackageFilm join table type ─────────────────────────────────────
export interface PackageFilmRecord {
    id: number;
    package_id: number;
    film_id: number;
    order_index: number;
    notes?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    film?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene_schedules?: any[];
}

export interface SubjectTypeTemplate {
    id: number;
    name: string;
    description?: string | null;
    category: string;
    roles: Array<{ id: number; role_name: string; is_core: boolean }>;
}

// Crew member from crew API (for assignment dropdowns)
export interface CrewMemberOption {
    id: number;
    contact: {
        first_name?: string | null;
        last_name?: string | null;
        email: string;
    };
    crew_color?: string | null;
    /** Optional to accommodate contributor objects loaded via operator records */
    contributor_job_roles?: Array<{
        is_primary: boolean;
        job_role: { id: number; name: string; display_name?: string | null };
    }>;
}

export interface PackageDayOperatorRecord {
    id: number;
    package_id: number;
    event_day_template_id: number;
    contributor_id?: number | null;
    package_activity_id?: number | null;
    position_name: string;
    position_color?: string | null;
    job_role_id?: number | null;
    hours: number;
    notes?: string | null;
    order_index: number;
    contributor?: {
        id: number;
        crew_color?: string | null;
        default_hourly_rate?: number | string | null;
        contact: { id: number; first_name?: string | null; last_name?: string | null; email: string };
        contributor_job_roles?: Array<{
            is_primary: boolean;
            is_unmanned?: boolean;
            job_role_id?: number;
            job_role: { id: number; name: string; display_name?: string | null };
            payment_bracket?: {
                id: number;
                name: string;
                display_name?: string | null;
                level: number;
                hourly_rate?: number | string | null;
                day_rate?: number | string | null;
            } | null;
        }>;
    } | null;
    job_role?: { id: number; name: string; display_name?: string | null; category?: string | null } | null;
    equipment: Array<{
        id: number;
        equipment_id: number;
        is_primary: boolean;
        equipment?: { id: number; item_name: string; model?: string | null; category?: string };
    }>;
    event_day?: { id: number; name: string };
    package_activity?: { id: number; name: string } | null;
    activity_assignments?: Array<{
        id: number;
        package_activity_id: number;
        package_activity?: { id: number; name: string };
    }>;
}

// ─── Local state-shape interfaces ────────────────────────────────────

/** Contributor job-role assignment (subset used throughout this page). */
export type ContributorJobRoleEntry = {
    is_primary: boolean;
    is_unmanned?: boolean;
    job_role_id?: number;
    job_role: { id: number; name: string; display_name?: string | null };
    payment_bracket?: {
        id: number;
        name: string;
        display_name?: string | null;
        level: number;
        hourly_rate?: number | string | null;
        day_rate?: number | string | null;
    } | null;
};

/** Package activity record used in `packageActivities` state. */
export interface PackageActivityRecord {
    id: number;
    name: string;
    color?: string | null;
    icon?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    package_event_day_id?: number;
}

/** Package subject record used in `packageSubjects` state. */
export interface PackageEventDaySubjectRecord {
    id: number;
    name: string;
    count?: number | null;
    category?: string;
    event_day_template_id?: number;
    package_activity_id?: number | null;
    activity_assignments?: Array<{ id: number; package_activity_id: number; package_activity?: { id: number; name: string } }>;
}

/** Package location-slot record used in `packageLocationSlots` state. */
export interface PackageLocationSlotRecord {
    id: number;
    location_number: number;
    event_day_template_id?: number;
    custom_name?: string | null;
    location?: { id: number; name: string } | null;
    activity_assignments?: Array<{ id: number; package_activity_id: number }>;
}

/** Unmanned-equipment record used in `unmannedEquipment` state. */
export interface UnmannedEquipmentRecord {
    id: number;
    item_name?: string;
    model?: string | null;
    category?: string;
}

/** Full equipment inventory record used in `allEquipment` state. */
export interface EquipmentRecord {
    id: number;
    item_name: string;
    model?: string | null;
    category?: string;
    rental_price_per_day?: number | string | null;
}

/** Equipment item stored inside day_equipment / activity_equipment maps. */
export interface EquipItem {
    equipment_id: number;
    slot_type: 'CAMERA' | 'AUDIO';
    track_number?: number;
    equipment?: { id: number; item_name: string; model?: string | null };
}

/** Film record shape used when rendering package-contents items. */
export interface FilmData {
    id: number;
    name?: string;
    scenes?: Array<{
        id: number;
        name: string;
        mode?: string;
        duration_seconds?: number;
        equipment?: unknown[];
        beats?: Array<{ duration_seconds?: number }>;
        moments?: Array<{ duration?: number }>;
    }>;
}
