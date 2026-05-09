import type { EquipmentPreset } from '../types/wizard.types';

const STORAGE_KEY_PREFIX = 'projectflo:package-wizard:equipment-presets';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isEquipmentPresetArray = (value: unknown): value is EquipmentPreset[] =>
  Array.isArray(value)
  && value.every((item) => isRecord(item) && typeof item.name === 'string' && Array.isArray(item.slots));

const getStorageKey = (brandId?: number) => `${STORAGE_KEY_PREFIX}:${brandId ?? 'global'}`;

interface EquipmentPresetFactoryInput {
  brandId?: number;
  andyCrewId?: number | null;
  videographerRoleId?: number | null;
  soundEngineerRoleId?: number | null;
  cameraIds: number[];
  audioIds: number[];
}

export function buildDefaultEquipmentPresets(input: EquipmentPresetFactoryInput): EquipmentPreset[] {
  const { brandId, andyCrewId, videographerRoleId, soundEngineerRoleId, cameraIds, audioIds } = input;

  if (!andyCrewId || !videographerRoleId || !soundEngineerRoleId) return [];
  if (cameraIds.length < 3 || audioIds.length < 2) return [];

  return [
    {
      id: -1,
      brand_id: brandId,
      name: 'Andy 3 Cam + 2 Audio',
      is_default: true,
      created_at: 'seeded',
      updated_at: 'seeded',
      slots: [
        { slot_type: 'CAMERA', equipment_id: cameraIds[0], crew_id: andyCrewId, job_role_id: videographerRoleId, order_index: 0 },
        { slot_type: 'CAMERA', equipment_id: cameraIds[1], crew_id: andyCrewId, job_role_id: videographerRoleId, order_index: 1 },
        { slot_type: 'CAMERA', equipment_id: cameraIds[2], crew_id: andyCrewId, job_role_id: videographerRoleId, order_index: 2 },
        { slot_type: 'AUDIO', equipment_id: audioIds[0], crew_id: andyCrewId, job_role_id: soundEngineerRoleId, order_index: 0 },
        { slot_type: 'AUDIO', equipment_id: audioIds[1], crew_id: andyCrewId, job_role_id: soundEngineerRoleId, order_index: 1 },
      ],
    },
  ];
}

export function readStoredEquipmentPresets(brandId?: number): EquipmentPreset[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey(brandId));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!isEquipmentPresetArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

export function writeStoredEquipmentPresets(brandId: number | undefined, presets: EquipmentPreset[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(getStorageKey(brandId), JSON.stringify(presets));
}
