/**
 * TypeScript types for Film Equipment Management
 * Corresponds to backend film-equipment.service.ts
 */

export type EquipmentType = 'CAMERA' | 'AUDIO' | 'MUSIC';

export interface FilmEquipment {
  id: number;
  film_id: number;
  equipment_type: EquipmentType;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetEquipmentDto {
  equipment_type: EquipmentType;
  quantity: number;
  notes?: string;
}

export interface EquipmentSummary {
  cameras: number;
  audio: number;
  music: number;
  totalTracks: number;
  tracks?: any[];
}

export type EquipmentSlotType = "camera" | "audio";
export type EquipmentSlotKey = `${EquipmentSlotType}-${number}`;

export interface FilmEquipmentAssignment {
  id: number;
  film_id: number;
  equipment_id: number;
  quantity: number;
  notes?: string;
  assigned_at: string;
  equipment?: {
    id: number;
    name: string;
    type: string;
    category?: string;
    model?: string;
    status: string;
  };
}

export interface FilmEquipmentSlotAssignment {
  slotKey: EquipmentSlotKey;
  equipmentId: number;
  equipmentName: string;
  equipmentModel?: string;
  equipmentType?: string;
  equipmentCategory?: string;
}

export type FilmEquipmentAssignmentsBySlot = Record<EquipmentSlotKey, FilmEquipmentSlotAssignment>;
