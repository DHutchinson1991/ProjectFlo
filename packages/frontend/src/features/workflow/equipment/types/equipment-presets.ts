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

export interface CreateEquipmentPresetData {
  name: string;
  is_default?: boolean;
  slots: EquipmentPresetSlot[];
}

export interface UpdateEquipmentPresetData {
  name?: string;
  is_default?: boolean;
  slots?: EquipmentPresetSlot[];
}
