import type { JobRole } from '@/features/catalog/task-library/types/job-roles';
import type { Crew, EquipmentItem, EquipmentPreset } from '../types/wizard.types';

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

/** In-memory presets when the API returns none (e.g. seed skipped). IDs are negative so they don't collide with DB. */
export function buildWizardDefaultEquipmentPresets(
  brandId: number | undefined,
  crew: Crew[],
  roles: JobRole[],
  equipmentItems: EquipmentItem[],
): EquipmentPreset[] {
  const andy = crew.find((member: { first_name?: string; last_name?: string }) =>
    normalize(member.first_name) === 'andy' && normalize(member.last_name) === 'galloway',
  );
  const videographerRole = roles.find((role) => normalize(role.name) === 'videographer');
  const soundEngineerRole = roles.find((role) => normalize(role.name) === 'sound_engineer');

  if (!andy?.id || !videographerRole?.id || !soundEngineerRole?.id) return [];

  const andyOwned = equipmentItems.filter((item: { owner_id?: number | null }) => item.owner_id === andy.id);
  const pickCategory = (items: EquipmentItem[], categoryNorm: string, limit: number) =>
    items
      .filter((item: { category?: string }) => normalize(String(item.category)) === categoryNorm)
      .slice(0, limit)
      .map((item: { id: number }) => item.id);

  let cameras = pickCategory(andyOwned, 'camera', 3);
  let audio = pickCategory(andyOwned, 'audio', 2);

  if (cameras.length < 3 || audio.length < 2) {
    const brandPool = equipmentItems.filter((item: { owner_id?: number | null }) => item.owner_id == null || item.owner_id === andy.id);
    if (cameras.length < 3) {
      const extra = pickCategory(brandPool, 'camera', 99).filter((id) => !cameras.includes(id));
      cameras = [...cameras, ...extra].slice(0, 3);
    }
    if (audio.length < 2) {
      const extra = pickCategory(brandPool, 'audio', 99).filter((id) => !audio.includes(id));
      audio = [...audio, ...extra].slice(0, 2);
    }
  }

  const presets: EquipmentPreset[] = [];

  if (cameras.length >= 1) {
    presets.push({
      id: -1,
      brand_id: brandId,
      name: 'Andy Galloway with 3 cameras',
      is_default: true,
      created_at: 'local-default',
      updated_at: 'local-default',
      slots: cameras.slice(0, 3).map((equipment_id, order_index) => ({
        slot_type: 'CAMERA',
        equipment_id,
        crew_id: andy.id,
        job_role_id: videographerRole.id,
        order_index,
      })),
    });
  }

  if (audio.length >= 1) {
    presets.push({
      id: -2,
      brand_id: brandId,
      name: 'Andy Galloway with 2 audio',
      is_default: presets.length === 0,
      created_at: 'local-default',
      updated_at: 'local-default',
      slots: audio.slice(0, 2).map((equipment_id, order_index) => ({
        slot_type: 'AUDIO',
        equipment_id,
        crew_id: andy.id,
        job_role_id: soundEngineerRole.id,
        order_index,
      })),
    });
  }

  return presets;
}
