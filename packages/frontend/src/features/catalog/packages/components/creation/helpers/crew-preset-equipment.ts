import type { JobRole } from '@/features/catalog/task-library/types/job-roles';
import type { EquipmentItem, RoleSlot } from '../types/wizard.types';
import { matchesRoleKeywords, CAMERA_ROLE_KEYWORDS, AUDIO_ROLE_KEYWORDS } from './wizard-helpers';

function normalizeCategory(category: string | undefined): string {
  return category?.trim().toUpperCase() ?? '';
}

function pickEquipmentForCategory(
  category: 'CAMERA' | 'AUDIO',
  crewId: number | null,
  equipmentItems: EquipmentItem[],
  usedIds: Set<number>,
): number | null {
  const pool = equipmentItems.filter(
    (item) => normalizeCategory(item.category) === category && !usedIds.has(item.id),
  );
  if (pool.length === 0) return null;

  if (crewId != null) {
    const owned = pool.filter((item) => item.owner_id === crewId);
    if (owned.length > 0) return owned[0].id;
  }

  const brandPool = pool.filter((item) => item.owner_id == null);
  if (brandPool.length > 0) return brandPool[0].id;

  return pool[0].id;
}

/**
 * Fills camera/audio position equipment when a crew preset omits equipment_id
 * (e.g. seeded "Core Production Team" slots). Prefers gear owned by the assigned crew member.
 */
export function fillPresetPositionEquipment(
  roleSlots: RoleSlot[],
  crewIdByPosition: Map<string, number | null>,
  existing: Record<string, (number | null)[]>,
  availableJobRoles: JobRole[],
  equipmentItems: EquipmentItem[],
): Record<string, (number | null)[]> {
  const next = { ...existing };
  const usedIds = new Set(
    Object.values(next)
      .flat()
      .filter((id): id is number => id != null),
  );

  for (const slot of roleSlots) {
    const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
    const isCamera = matchesRoleKeywords(role, CAMERA_ROLE_KEYWORDS);
    const isAudio = !isCamera && matchesRoleKeywords(role, AUDIO_ROLE_KEYWORDS);
    if (!isCamera && !isAudio) continue;

    const category = isCamera ? 'CAMERA' : 'AUDIO';
    for (let posIndex = 0; posIndex < slot.quantity; posIndex++) {
      const key = `${slot.jobRoleId}:${posIndex}`;
      const existingSlots = next[key] ?? [];
      if (existingSlots.some((id) => id != null)) continue;
      const crewId = crewIdByPosition.get(key) ?? null;
      const equipmentId = pickEquipmentForCategory(category, crewId, equipmentItems, usedIds);
      if (equipmentId != null) {
        next[key] = [equipmentId];
        usedIds.add(equipmentId);
      }
    }
  }

  return next;
}

/** Map preset slot order to `${jobRoleId}:${posIndex}` crew ids. */
export function crewIdsByPresetPosition(
  orderedSlots: Array<{ job_role_id: number; crew_id: number | null }>,
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  const posCounter = new Map<number, number>();
  for (const slot of orderedSlots) {
    const posIndex = posCounter.get(slot.job_role_id) ?? 0;
    posCounter.set(slot.job_role_id, posIndex + 1);
    map.set(`${slot.job_role_id}:${posIndex}`, slot.crew_id);
  }
  return map;
}
