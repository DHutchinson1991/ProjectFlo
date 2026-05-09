import type { PackageTemplate, EventDay, EventDayActivity, PresetMoment, PackageTemplateDay, PackageTemplateSubject } from './index';

/**
 * Legacy compat types. The domain migrated from EventType to PackageTemplate,
 * but the inquiry wizard + package UI still consume the old shape. These
 * aliases + the `toEventType()` adapter preserve the old contract while the
 * server-side shape is flat.
 */
export interface LinkedSubjectRole {
    id: number;
    event_type_id: number;
    subject_role_id: number;
    order_index: number;
    is_default: boolean;
    subject_role: {
        id: number;
        brand_id: number;
        role_name: string;
        description?: string;
        is_group: boolean;
        never_group: boolean;
        order_index: number;
    };
}

export interface EventTypeDay {
    id: number;
    event_type_id: number;
    event_day_template_id: number;
    order_index: number;
    is_default: boolean;
    event_day_template: EventDay;
}

export interface EventType {
    id: number;
    brand_id: number;
    name: string;
    event_category?: string;
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
    subject_roles: LinkedSubjectRole[];
}

export function toEventType(t: PackageTemplate): EventType {
    return {
        id: t.id,
        brand_id: t.brand_id ?? 0,
        name: t.name,
        event_category: t.event_category ?? undefined,
        description: t.description ?? undefined,
        icon: t.icon ?? undefined,
        color: t.color ?? undefined,
        default_duration_hours: t.total_duration_hours ?? undefined,
        default_start_time: t.event_start_time ?? undefined,
        typical_guest_count: t.typical_guest_count ?? undefined,
        is_system: t.is_system_seeded,
        is_active: t.is_active,
        order_index: t.order_index,
        event_days: (t.days ?? []).map((d: PackageTemplateDay): EventTypeDay => ({
            id: d.id,
            event_type_id: d.package_template_id,
            event_day_template_id: d.event_day_template_id,
            order_index: d.order_index,
            is_default: d.is_default,
            event_day_template: d.event_day_template,
        })),
        subject_roles: (t.subjects ?? [])
            .filter((s: PackageTemplateSubject) => !!s.subject_role)
            .map((s: PackageTemplateSubject): LinkedSubjectRole => ({
                id: s.id,
                event_type_id: s.package_template_id,
                subject_role_id: s.subject_role_id ?? 0,
                order_index: s.order_index,
                is_default: s.is_primary,
                subject_role: s.subject_role!,
            })),
    };
}

export type { EventDay, EventDayActivity, PresetMoment };
