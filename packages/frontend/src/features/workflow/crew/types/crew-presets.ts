export interface CrewPresetSlot {
  id: number;
  preset_id: number;
  job_role_id: number;
  crew_id: number | null;
  order_index: number;
  job_role?: {
    id: number;
    name: string;
    category?: string | null;
  };
  crew?: {
    id: number;
    first_name: string;
    last_name: string;
    crew_color?: string | null;
  } | null;
}

export interface CrewPreset {
  id: number;
  brand_id: number;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  slots: CrewPresetSlot[];
}

export interface CrewPresetSlotInput {
  job_role_id: number;
  crew_id?: number | null;
  order_index: number;
}

export interface CreateCrewPresetData {
  name: string;
  is_default?: boolean;
  slots: CrewPresetSlotInput[];
}

export interface UpdateCrewPresetData {
  name?: string;
  is_default?: boolean;
  slots?: CrewPresetSlotInput[];
}
