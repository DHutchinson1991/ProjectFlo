import type { JobRole } from '@/features/catalog/task-library/types/job-roles';

// ── Event type tree (from EventTypeSelector) ─────────────────────────

export interface PresetMoment {
  id: number;
  name: string;
  duration_seconds: number;
  is_key_moment: boolean;
}

export interface ActivityPreset {
  id: number;
  name: string;
  color?: string;
  default_duration_minutes?: number;
  default_start_time?: string;
  moments?: PresetMoment[];
}

export interface EventDay {
  id: number;
  name: string;
  description?: string;
  activity_presets: ActivityPreset[];
}

export interface SubjectRole {
  id: number;
  role_name: string;
  is_group: boolean;
  never_group: boolean;
}

export interface LinkedSubjectRole {
  id: number;
  order_index: number;
  is_default: boolean;
  subject_role: SubjectRole;
}

export interface EventTypeDay {
  id: number;
  order_index: number;
  is_default: boolean;
  event_day_template: EventDay;
}

export interface EventTypeForWizard {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  default_duration_hours?: number;
  default_start_time?: string;
  typical_guest_count?: number;
  event_days: EventTypeDay[];
  subject_roles: LinkedSubjectRole[];
}

// ── Wizard-specific types ────────────────────────────────────────────

export interface CustomMoment {
  tempId: string;
  name: string;
  isKeyMoment: boolean;
}

export interface CustomActivity {
  tempId: string;
  name: string;
  dayLinkId: number;
  startTime: string;
  durationMinutes: number;
  moments: CustomMoment[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Crew = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EquipmentItem = any;

export interface CrewAssignment {
  crewId: number;
  jobRoleIds: number[];
  positionColor?: string;
}

export interface CameraAudioSlot {
  slotNumber: number;
  equipmentId: number | null;
  assignedCrewId: number | null;
  assignedJobRoleId: number | null;
}

export interface EquipmentPresetSlot {
  slot_type: 'CAMERA' | 'AUDIO';
  equipment_id: number | null;
  crew_id: number | null;
  job_role_id: number | null;
  order_index: number;
}

export interface EquipmentPreset {
  id: number;
  name: string;
  is_default: boolean;
  brand_id?: number;
  created_at?: string;
  updated_at?: string;
  slots: EquipmentPresetSlot[];
}

export interface RoleSlot {
  jobRoleId: number;
  quantity: number;
}

export interface EquipmentCrewOption {
  crewId: number;
  jobRoleId: number;
  label: string;
  color: string;
}

export type { JobRole };
