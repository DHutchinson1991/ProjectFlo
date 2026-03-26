import { FilmEquipmentAssignmentsBySlot, EquipmentSlotKey } from "@/features/content/films/types/film-equipment.types";
import { Equipment } from "@/lib/types";
import {
  buildEquipmentSlotKey,
  buildEquipmentSlotNote,
  formatEquipmentLabel,
} from "@/lib/utils/equipmentAssignments";
import type { FilmsApi } from "../api";

export const buildSelectionState = (
  quantity: number,
  type: "camera" | "audio",
  slotAssignments: FilmEquipmentAssignmentsBySlot,
  previous?: Record<number, number | "">
): Record<number, number | ""> => {
  const next: Record<number, number | ""> = {};
  for (let i = 1; i <= quantity; i += 1) {
    const slotKey = buildEquipmentSlotKey(type, i);
    next[i] = previous?.[i] ?? slotAssignments[slotKey]?.equipmentId ?? "";
  }
  return next;
};

export const getSelectedIds = (selections: Record<number, number | "">): number[] =>
  Object.values(selections).filter((value): value is number => typeof value === "number");

export const hasDuplicateSelections = (selections: Record<number, number | "">) => {
  const values = getSelectedIds(selections);
  return values.length !== new Set(values).size;
};

export const formatOptionLabel = (item: Equipment) =>
  formatEquipmentLabel({ equipmentName: item.item_name, equipmentModel: item.model });

export const buildSlotSelectionMap = (
  cameraSelections: Record<number, number | "">,
  audioSelections: Record<number, number | "">
): Record<string, number> => {
  const map: Record<string, number> = {};
  Object.entries(cameraSelections).forEach(([slotIndex, equipmentId]) => {
    if (typeof equipmentId === "number") {
      map[buildEquipmentSlotKey("camera", Number(slotIndex))] = equipmentId;
    }
  });
  Object.entries(audioSelections).forEach(([slotIndex, equipmentId]) => {
    if (typeof equipmentId === "number") {
      map[buildEquipmentSlotKey("audio", Number(slotIndex))] = equipmentId;
    }
  });
  return map;
};

export const checkAssignmentsComplete = (
  cameraSelections: Record<number, number | "">,
  audioSelections: Record<number, number | "">,
  cameraQty: number,
  audioQty: number
): boolean => {
  const cameraSelected = getSelectedIds(cameraSelections).length === cameraQty;
  const audioSelected = getSelectedIds(audioSelections).length === audioQty;
  return cameraSelected && audioSelected
    && !hasDuplicateSelections(cameraSelections)
    && !hasDuplicateSelections(audioSelections);
};

export const checkAssignmentChanges = (
  assignmentsBySlot: FilmEquipmentAssignmentsBySlot,
  nextSelections: Record<string, number>
): boolean => {
  const nextKeys = new Set(Object.keys(nextSelections));
  for (const [slotKey, assignment] of Object.entries(assignmentsBySlot)) {
    if (!nextKeys.has(slotKey)) return true;
    if (nextSelections[slotKey] !== assignment.equipmentId) return true;
  }
  for (const [slotKey, equipmentId] of Object.entries(nextSelections)) {
    const prev = assignmentsBySlot[slotKey as keyof FilmEquipmentAssignmentsBySlot];
    if (!prev || prev.equipmentId !== equipmentId) return true;
  }
  return false;
};

export async function syncEquipmentAssignments(
  filmsApi: FilmsApi, filmId: number,
  assignmentsBySlot: FilmEquipmentAssignmentsBySlot,
  nextSelections: Record<string, number>,
) {
  const removePromises: Promise<void>[] = [];
  const addPromises: Promise<void>[] = [];

  Object.entries(assignmentsBySlot).forEach(([slotKey, assignment]) => {
    const nextEquipmentId = nextSelections[slotKey];
    if (!nextEquipmentId || nextEquipmentId !== assignment.equipmentId) {
      removePromises.push(filmsApi.equipmentAssignments.remove(filmId, assignment.equipmentId));
    }
  });

  Object.entries(nextSelections).forEach(([slotKey, equipmentId]) => {
    const prev = assignmentsBySlot[slotKey as keyof FilmEquipmentAssignmentsBySlot];
    if (!prev || prev.equipmentId !== equipmentId) {
      addPromises.push(
        filmsApi.equipmentAssignments.assign(filmId, {
          equipment_id: equipmentId, quantity: 1,
          notes: buildEquipmentSlotNote(slotKey as EquipmentSlotKey),
        }).then(() => undefined)
      );
    } else if (prev && prev.slotKey !== slotKey) {
      addPromises.push(
        filmsApi.equipmentAssignments.update(filmId, equipmentId, {
          notes: buildEquipmentSlotNote(slotKey as EquipmentSlotKey),
        }).then(() => undefined)
      );
    }
  });

  if (removePromises.length || addPromises.length) {
    await Promise.all([...removePromises, ...addPromises]);
  }

  return filmsApi.equipmentAssignments.getAll(filmId);
}
