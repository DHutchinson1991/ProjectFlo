export interface PresetMoment {
    id: number;
    event_day_activity_preset_id: number;
    name: string;
    description?: string;
    duration_seconds: number;
    order_index: number;
    is_key_moment: boolean;
}

export interface EventDayActivity {
    id: number;
    event_day_template_id: number;
    name: string;
    description?: string;
    location_label?: string;
    color?: string;
    icon?: string;
    default_start_time?: string;
    default_duration_minutes?: number;
    order_index: number;
    is_active: boolean;
    moments?: PresetMoment[];
}

export interface EventDay {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    order_index: number;
    is_active: boolean;
    activity_presets?: EventDayActivity[];
}

export interface PackageTemplateDay {
    id: number;
    package_template_id: number;
    event_day_template_id: number;
    order_index: number;
    is_default: boolean;
    event_day_template: EventDay;
}

export interface PackageTemplateSubject {
    id: number;
    package_template_id: number;
    subject_role_id: number | null;
    name: string;
    is_primary: boolean;
    order_index: number;
    subject_role?: {
        id: number;
        brand_id: number;
        role_name: string;
        description?: string;
        is_group: boolean;
        never_group: boolean;
        order_index: number;
    } | null;
}

export interface PackageTemplate {
    id: number;
    brand_id: number | null;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    event_category: string | null;
    total_duration_hours?: number | null;
    event_start_time?: string | null;
    typical_guest_count?: number | null;
    is_system_seeded: boolean;
    is_active: boolean;
    order_index: number;
    days: PackageTemplateDay[];
    subjects: PackageTemplateSubject[];
}

export * from './legacy';

