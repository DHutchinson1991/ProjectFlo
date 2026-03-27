import type {
    EquipmentSlotKey,
    FilmEquipmentAssignment,
    FilmEquipmentAssignmentsBySlot,
    FilmEquipmentSlotAssignment,
} from "@/features/content/films/types/film-equipment.types";

const SLOT_PREFIX = "slot:";
const SLOT_PATTERN = /^slot:(camera|audio)-(\d+)$/i;
const TRACK_PATTERN = /^(Camera|Audio)\s+(\d+)$/i;

export const buildEquipmentSlotKey = (type: "camera" | "audio", index: number): EquipmentSlotKey =>
    `${type}-${index}` as EquipmentSlotKey;

export const buildEquipmentSlotNote = (slotKey: EquipmentSlotKey): string => `${SLOT_PREFIX}${slotKey}`;

export const parseEquipmentSlotNote = (note?: string | null): EquipmentSlotKey | null => {
    if (!note) return null;
    const trimmed = note.trim();
    const match = trimmed.match(SLOT_PATTERN);
    if (!match) return null;
    const type = match[1].toLowerCase() as "camera" | "audio";
    const index = Number(match[2]);
    if (!Number.isFinite(index) || index <= 0) return null;
    return buildEquipmentSlotKey(type, index);
};

export const getSlotKeyFromTrackName = (trackName?: string | null): EquipmentSlotKey | null => {
    if (!trackName) return null;
    const match = trackName.trim().match(TRACK_PATTERN);
    if (!match) return null;
    const type = match[1].toLowerCase() as "camera" | "audio";
    const index = Number(match[2]);
    if (!Number.isFinite(index) || index <= 0) return null;
    return buildEquipmentSlotKey(type, index);
};

export const formatEquipmentLabel = (assignment?: {
    equipmentName?: string | null;
    equipmentModel?: string | null;
}): string => {
    if (!assignment?.equipmentName) return "";
    if (assignment.equipmentModel) return `${assignment.equipmentName} (${assignment.equipmentModel})`;
    return assignment.equipmentName;
};

export const formatEquipmentShortLabel = (assignment?: {
    equipmentName?: string | null;
    equipmentModel?: string | null;
}): string => {
    if (!assignment?.equipmentName) return "";
    if (assignment.equipmentModel) return assignment.equipmentModel;
    return assignment.equipmentName;
};

export const buildAssignmentsBySlot = (
    assignments: FilmEquipmentAssignment[],
): FilmEquipmentAssignmentsBySlot => {
    return assignments.reduce<FilmEquipmentAssignmentsBySlot>((acc, assignment) => {
        const slotKey = parseEquipmentSlotNote(assignment.notes);
        if (!slotKey || !assignment.equipment) return acc;
        const next: FilmEquipmentSlotAssignment = {
            slotKey,
            equipmentId: assignment.equipment.id,
            equipmentName: assignment.equipment.name,
            equipmentModel: assignment.equipment.model ?? undefined,
            equipmentType: assignment.equipment.type,
            equipmentCategory: assignment.equipment.category,
        };
        acc[slotKey] = next;
        return acc;
    }, {});
};

export const getEquipmentLabelForTrackName = (
    trackName: string | undefined,
    assignmentsBySlot?: FilmEquipmentAssignmentsBySlot,
): string => {
    if (!trackName || !assignmentsBySlot) return "";
    const slotKey = getSlotKeyFromTrackName(trackName);
    if (!slotKey) return "";
    const assignment = assignmentsBySlot[slotKey];
    return formatEquipmentLabel(assignment);
};

export const getEquipmentShortLabelForTrackName = (
    trackName: string | undefined,
    assignmentsBySlot?: FilmEquipmentAssignmentsBySlot,
): string => {
    if (!trackName || !assignmentsBySlot) return "";
    const slotKey = getSlotKeyFromTrackName(trackName);
    if (!slotKey) return "";
    const assignment = assignmentsBySlot[slotKey];
    return formatEquipmentShortLabel(assignment);
};
