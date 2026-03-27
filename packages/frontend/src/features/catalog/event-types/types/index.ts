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

export interface SubjectRole {
    id: number;
    subject_type_id: number;
    role_name: string;
    description?: string;
    is_core: boolean;
    order_index: number;
}

export interface SubjectType {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    category: string;
    is_active: boolean;
    roles: SubjectRole[];
}

export interface EventTypeDay {
    id: number;
    event_type_id: number;
    event_day_template_id: number;
    order_index: number;
    is_default: boolean;
    event_day_template: EventDay;
}

export interface EventTypeSubject {
    id: number;
    event_type_id: number;
    subject_type_template_id: number;
    order_index: number;
    is_default: boolean;
    subject_type_template: SubjectType;
}

export interface EventType {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    default_duration_hours?: number;
    default_start_time?: string;
    typical_guest_count?: number;
    is_system: boolean;
    is_active: boolean;
    order_index: number;
    event_days: EventTypeDay[];
    subject_types: EventTypeSubject[];
}

export * from './api.types';
