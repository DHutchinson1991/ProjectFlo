// Shape types for the Day Designer (Day Blueprint) feature.
// Intentionally narrow — only what the UI currently reads.

export type DayBlueprintVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DayBlueprintVersionSummary {
  id: number;
  blueprint_id: number;
  version_number: number;
  status: DayBlueprintVersionStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayBlueprintListRowSummary {
  primary_version_id: number | null;
  primary_version_number: number | null;
  primary_version_status: DayBlueprintVersionStatus | null;
  day_count: number;
  activity_count: number;
  moment_count: number;
}

export interface DayBlueprintSummary {
  id: number;
  brand_id: number;
  key: string;
  display_name: string;
  event_category: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  versions?: DayBlueprintVersionSummary[];
  row_summary?: DayBlueprintListRowSummary;
}

export interface DayBlueprintMomentAction {
  id: number;
  day_blueprint_moment_id: number;
  subject_role_id: number;
  action_text: string;
  emphasis?: string | null;
  notes?: string | null;
  order_index: number;
}

export interface DayBlueprintMomentPlacement {
  id: number;
  day_blueprint_moment_id: number;
  day_blueprint_space_slot_id: number;
  subject_role_id: number;
  position_hint?: string | null;
  facing_hint?: string | null;
  notes?: string | null;
  order_index: number;
}

export interface DayBlueprintActivityLocation {
  id: number;
  day_blueprint_activity_id: number;
  day_blueprint_location_role_id: number;
  is_primary: boolean;
  notes?: string | null;
  order_index: number;
  location_role?: { id: number; key: string; display_name: string };
}

export interface DayBlueprintMoment {
  id: number;
  activity_id: number;
  name: string;
  description?: string | null;
  order_index: number;
  duration_seconds?: number | null;
  expected_duration_minutes?: number | null;
  is_key_moment?: boolean | null;
  criticality?: string | null;
  lock_flags?: unknown;
  actions?: DayBlueprintMomentAction[];
  placements?: DayBlueprintMomentPlacement[];
}

export interface DayBlueprintActivity {
  id: number;
  day_id: number;
  day_blueprint_day_id?: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  default_start_time?: string | null;
  default_duration_minutes?: number | null;
  duration_min_minutes?: number | null;
  duration_max_minutes?: number | null;
  order_index: number;
  criticality?: string | null;
  lock_flags?: unknown;
  activity_locations?: DayBlueprintActivityLocation[];
  moments?: DayBlueprintMoment[];
}

export interface DayBlueprintDay {
  id: number;
  version_id: number;
  day_blueprint_version_id?: number;
  name: string;
  description?: string | null;
  default_start_time?: string | null;
  default_duration_hours?: number | null;
  order_index: number;
  activities?: DayBlueprintActivity[];
}

export interface DayBlueprintSubjectRoleLink {
  id: number;
  day_blueprint_version_id: number;
  subject_role_id: number;
  is_primary: boolean;
  typical_count?: number | null;
  order_index: number;
  subject_role?: { id: number; role_name: string };
}

export interface DayBlueprintSpaceSlot {
  id: number;
  day_blueprint_version_id: number;
  day_blueprint_location_role_id: number;
  key: string;
  label: string;
  description?: string | null;
  order_index: number;
  location_role?: { id: number; key: string; display_name: string };
}

export interface DayBlueprintLockRule {
  id: number;
  day_blueprint_version_id: number;
  scope: 'VERSION' | 'DAY' | 'ACTIVITY' | 'MOMENT';
  target_id?: number | null;
  rule_key: string;
  rule_value?: unknown;
}

export interface DayBlueprintVersionDetail extends DayBlueprintVersionSummary {
  days?: DayBlueprintDay[];
  subject_roles?: DayBlueprintSubjectRoleLink[];
  space_slots?: DayBlueprintSpaceSlot[];
  lock_rules?: DayBlueprintLockRule[];
}

export interface CreateDayBlueprintInput {
  key: string;
  display_name: string;
  event_category: string;
  description?: string;
  initial_event_days?: number;
  initial_event_day_roles?: Record<string, string>;
  initial_activities?: string[];
  initial_day_timings?: Array<{
    day_number: number;
    default_start_time?: string;
    default_duration_hours?: number;
  }>;
  initial_activity_timings?: Array<{
    name: string;
    default_start_time?: string;
    default_duration_minutes?: number;
    duration_min_minutes?: number;
    duration_max_minutes?: number;
  }>;
  primary_partner_label?: string;
  second_partner_label?: string;
}

export * from './ai';
