import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  DayBlueprintActivity,
  DayBlueprintDay,
  DayBlueprintLockRule,
  DayBlueprintMoment,
  DayBlueprintMomentAction,
  DayBlueprintMomentPlacement,
  DayBlueprintSpaceSlot,
  DayBlueprintSubjectRoleLink,
  DayBlueprintVersionSummary,
} from '../types';

export interface CreateDayBlueprintVersionInput {
  change_summary?: string;
  source_ai_run_id?: number;
}

export interface CreateDayInput {
  name: string;
  description?: string;
  default_start_time?: string;
  default_duration_hours?: number;
  order_index?: number;
  source_event_day_id?: number;
}

export interface UpdateDayInput {
  name?: string;
  description?: string;
  default_start_time?: string;
  default_duration_hours?: number;
  order_index?: number;
}

export interface CreateActivityInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  default_start_time?: string;
  default_duration_minutes?: number;
  duration_min_minutes?: number;
  duration_max_minutes?: number;
  order_index?: number;
  criticality?: string;
  lock_flags?: Record<string, boolean>;
}

export type UpdateActivityInput = Partial<CreateActivityInput>;

export interface CreateMomentInput {
  name: string;
  description?: string;
  duration_seconds?: number;
  order_index?: number;
  is_key_moment?: boolean;
  criticality?: string;
  lock_flags?: Record<string, boolean>;
}

export type UpdateMomentInput = Partial<CreateMomentInput>;

export interface CreateMomentActionInput {
  subject_role_id: number;
  action_text: string;
  emphasis?: string;
  notes?: string;
  order_index?: number;
}

export type UpdateMomentActionInput = Partial<Omit<CreateMomentActionInput, 'subject_role_id'>>;

export interface CreateMomentPlacementInput {
  day_blueprint_space_slot_id: number;
  subject_role_id: number;
  position_hint?: string;
  facing_hint?: string;
  notes?: string;
  order_index?: number;
}

export type UpdateMomentPlacementInput = Partial<
  Omit<CreateMomentPlacementInput, 'day_blueprint_space_slot_id' | 'subject_role_id'>
>;

// ─── Version-scoped auxiliaries ──────────────────────────────────

export interface CreateSubjectRoleLinkInput {
  subject_role_id: number;
  is_primary?: boolean;
  typical_count?: number;
  order_index?: number;
}
export type UpdateSubjectRoleLinkInput = Partial<Omit<CreateSubjectRoleLinkInput, 'subject_role_id'>>;

export interface CreateSpaceSlotInput {
  day_blueprint_location_role_id: number;
  key: string;
  label: string;
  description?: string;
  order_index?: number;
}
export type UpdateSpaceSlotInput = Partial<CreateSpaceSlotInput>;

export interface LinkActivityLocationInput {
  day_blueprint_location_role_id: number;
  is_primary?: boolean;
  notes?: string;
  order_index?: number;
}

export type LockScope = 'VERSION' | 'DAY' | 'ACTIVITY' | 'MOMENT';
export interface CreateLockRuleInput {
  scope: LockScope;
  target_id?: number;
  rule_key: string;
  rule_value?: Record<string, unknown>;
  notes?: string;
}
export type UpdateLockRuleInput = Partial<CreateLockRuleInput>;

export interface DayBlueprintLocationRole {
  id: number;
  brand_id: number;
  key: string;
  display_name: string;
  description?: string | null;
  order_index: number;
  is_active?: boolean;
}
export interface CreateLocationRoleInput {
  key: string;
  display_name: string;
  description?: string;
  order_index?: number;
  icon?: string;
  is_active?: boolean;
}

export const createDayBlueprintsAuthoringApi = (client: ApiClient) => ({
  versions: {
    createDraft: (
      blueprintId: number,
      data: CreateDayBlueprintVersionInput,
    ): Promise<DayBlueprintVersionSummary> =>
      client.post(`/api/day-blueprints/${blueprintId}/versions`, data),
  },

  days: {
    create: (versionId: number, data: CreateDayInput): Promise<DayBlueprintDay> =>
      client.post(`/api/day-blueprints/versions/${versionId}/days`, data),
    update: (dayId: number, data: UpdateDayInput): Promise<DayBlueprintDay> =>
      client.patch(`/api/day-blueprints/days/${dayId}`, data),
    delete: (dayId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/days/${dayId}`),
  },

  activities: {
    create: (dayId: number, data: CreateActivityInput): Promise<DayBlueprintActivity> =>
      client.post(`/api/day-blueprints/days/${dayId}/activities`, data),
    update: (activityId: number, data: UpdateActivityInput): Promise<DayBlueprintActivity> =>
      client.patch(`/api/day-blueprints/activities/${activityId}`, data),
    delete: (activityId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/activities/${activityId}`),
  },

  activityLocations: {
    link: (activityId: number, data: LinkActivityLocationInput): Promise<void> =>
      client.post(`/api/day-blueprints/activities/${activityId}/locations`, data),
    delete: (linkId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/activity-locations/${linkId}`),
  },

  moments: {
    create: (activityId: number, data: CreateMomentInput): Promise<DayBlueprintMoment> =>
      client.post(`/api/day-blueprints/activities/${activityId}/moments`, data),
    update: (momentId: number, data: UpdateMomentInput): Promise<DayBlueprintMoment> =>
      client.patch(`/api/day-blueprints/moments/${momentId}`, data),
    delete: (momentId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/moments/${momentId}`),
  },

  momentActions: {
    create: (momentId: number, data: CreateMomentActionInput): Promise<DayBlueprintMomentAction> =>
      client.post(`/api/day-blueprints/moments/${momentId}/actions`, data),
    update: (
      actionId: number,
      data: UpdateMomentActionInput,
    ): Promise<DayBlueprintMomentAction> =>
      client.patch(`/api/day-blueprints/moment-actions/${actionId}`, data),
    delete: (actionId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/moment-actions/${actionId}`),
  },

  momentPlacements: {
    create: (
      momentId: number,
      data: CreateMomentPlacementInput,
    ): Promise<DayBlueprintMomentPlacement> =>
      client.post(`/api/day-blueprints/moments/${momentId}/placements`, data),
    update: (
      placementId: number,
      data: UpdateMomentPlacementInput,
    ): Promise<DayBlueprintMomentPlacement> =>
      client.patch(`/api/day-blueprints/moment-placements/${placementId}`, data),
    delete: (placementId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/moment-placements/${placementId}`),
  },

  subjectRoleLinks: {
    create: (
      versionId: number,
      data: CreateSubjectRoleLinkInput,
    ): Promise<DayBlueprintSubjectRoleLink> =>
      client.post(`/api/day-blueprints/versions/${versionId}/subject-roles`, data),
    update: (
      rowId: number,
      data: UpdateSubjectRoleLinkInput,
    ): Promise<DayBlueprintSubjectRoleLink> =>
      client.patch(`/api/day-blueprints/subject-roles/${rowId}`, data),
    delete: (rowId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/subject-roles/${rowId}`),
  },

  spaceSlots: {
    create: (versionId: number, data: CreateSpaceSlotInput): Promise<DayBlueprintSpaceSlot> =>
      client.post(`/api/day-blueprints/versions/${versionId}/space-slots`, data),
    update: (slotId: number, data: UpdateSpaceSlotInput): Promise<DayBlueprintSpaceSlot> =>
      client.patch(`/api/day-blueprints/space-slots/${slotId}`, data),
    delete: (slotId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/space-slots/${slotId}`),
  },

  lockRules: {
    create: (versionId: number, data: CreateLockRuleInput): Promise<DayBlueprintLockRule> =>
      client.post(`/api/day-blueprints/versions/${versionId}/lock-rules`, data),
    update: (ruleId: number, data: UpdateLockRuleInput): Promise<DayBlueprintLockRule> =>
      client.patch(`/api/day-blueprints/lock-rules/${ruleId}`, data),
    delete: (ruleId: number): Promise<void> =>
      client.delete(`/api/day-blueprints/lock-rules/${ruleId}`),
  },

  locationRoles: {
    list: (): Promise<DayBlueprintLocationRole[]> =>
      client.get(`/api/day-blueprints/location-roles`),
    create: (data: CreateLocationRoleInput): Promise<DayBlueprintLocationRole> =>
      client.post(`/api/day-blueprints/location-roles`, data),
  },
});

export const dayBlueprintsAuthoringApi = createDayBlueprintsAuthoringApi(apiClient);
export type DayBlueprintsAuthoringApi = ReturnType<typeof createDayBlueprintsAuthoringApi>;
