export interface EventSubtype {
    id: number;
    name?: string;
    description?: string;
}

export interface CreateEventTypeData {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    default_duration_hours?: number;
    default_start_time?: string;
    typical_guest_count?: number;
    order_index?: number;
}

export interface UpdateEventTypeData {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    default_duration_hours?: number;
    default_start_time?: string;
    typical_guest_count?: number;
    is_active?: boolean;
    order_index?: number;
}

export interface LinkEventDayData {
    event_day_template_id: number;
    order_index?: number;
    is_default?: boolean;
}

export interface LinkSubjectRoleData {
    subject_role_id: number;
    order_index?: number;
    is_default?: boolean;
}

export interface CreatePackageFromWizardData {
    packageName: string;
    packageDescription?: string;
    selectedDayIds: number[];
    selectedActivities: { presetId: number; startTime?: string; durationMinutes?: number }[];
    customActivities: {
        name: string;
        dayTemplateId: number;
        startTime?: string;
        durationMinutes?: number;
        moments: { name: string; isKeyMoment: boolean }[];
    }[];
    selectedMomentIds: number[];
    momentKeyOverrides: { momentId: number; isKey: boolean }[];
    selectedRoleIds: number[];
    locationCount: number;
    crewAssignments: { crewId: number; jobRoleId: number; label?: string }[];
    equipmentSlots: { equipmentId: number; slotLabel: string; slotType: string }[];
}