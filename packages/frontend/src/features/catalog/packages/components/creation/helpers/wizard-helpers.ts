import type { EventTypeForWizard, EventTypeDay, CameraAudioSlot, Crew } from '../types/wizard.types';
import type { EventType } from '@/features/catalog/package-templates/types';

export const CAMERA_ROLE_KEYWORDS = ['videographer', 'camera', 'operator', 'cinematographer', 'photographer', 'drone'];
export const AUDIO_ROLE_KEYWORDS = ['sound', 'audio', 'mixer'];
export const STANDARD_GUEST_OPTIONS = [50, 100, 150] as const;

export const DEFAULT_CAMERA_SLOT: CameraAudioSlot = {
  slotNumber: 1, equipmentId: null, assignedCrewId: null, assignedJobRoleId: null,
};

export const WIZARD_STEPS = [
  'Event', 'Blueprint', 'Activities', 'Guests', 'Locations', 'Roles', 'Crew', 'Equipment', 'Name', 'Review',
] as const;

export const renumberSlots = (slots: CameraAudioSlot[]) =>
  slots.map((slot, index) => ({ ...slot, slotNumber: index + 1 }));

export const getNormalizedRoleName = (role: { display_name?: string; name?: string } | null | undefined) =>
  `${role?.display_name || ''} ${role?.name || ''}`.trim().toLowerCase();

export const matchesRoleKeywords = (
  role: { display_name?: string; name?: string } | null | undefined,
  keywords: string[],
) => {
  const normalizedRoleName = getNormalizedRoleName(role);
  return keywords.some((keyword) => normalizedRoleName.includes(keyword));
};

export const normalizeEventTypeForWizard = (eventType: EventTypeForWizard | EventType): EventTypeForWizard => {
  const eventDays = Array.isArray(eventType.event_days) ? eventType.event_days : [];
  const subjectRoles = Array.isArray(eventType.subject_roles) ? eventType.subject_roles : [];

  return ({
    ...eventType,
    event_days: eventDays.map(day => ({
      ...day,
      event_day_template: {
        ...day.event_day_template,
        activity_presets: (day.event_day_template?.activity_presets ?? []).map(ap => ({
          ...ap,
          moments: (ap as { moments?: unknown[] }).moments ?? [],
        })),
      },
    })),
    subject_roles: subjectRoles.map((link) => ({
      ...link,
      subject_role: {
        ...(link.subject_role ?? {}),
        is_group: Boolean(link.subject_role?.is_group),
        never_group: Boolean(link.subject_role?.never_group),
      },
    })),
  }) as unknown as EventTypeForWizard;
};

export const getEventTypeDays = (et?: EventTypeForWizard | null): EventTypeDay[] =>
  Array.isArray(et?.event_days) ? et.event_days : [];

export const getEventTypeSubjects = (et?: EventTypeForWizard | null) =>
  Array.isArray(et?.subject_roles) ? et.subject_roles : [];

export const getEventTypeGuestRole = (et?: EventTypeForWizard | null) =>
  getEventTypeSubjects(et).find((link) => link.subject_role?.role_name?.trim().toLowerCase() === 'guests')?.subject_role ?? null;

export const getDefaultStandardGuestCount = (eventType?: { typical_guest_count?: number | null }) => {
  const guestCount = Number(eventType?.typical_guest_count);
  if (!Number.isFinite(guestCount) || guestCount <= 0) return STANDARD_GUEST_OPTIONS[1];
  return STANDARD_GUEST_OPTIONS.find((option) => guestCount <= option) ?? STANDARD_GUEST_OPTIONS[STANDARD_GUEST_OPTIONS.length - 1];
};

export const getPresetIdsForDays = (et: EventTypeForWizard, dayIds: Set<number>) => {
  const ids = new Set<number>();
  getEventTypeDays(et).filter((ed) => dayIds.has(ed.id)).forEach((ed) =>
    ed.event_day_template.activity_presets.forEach((p) => ids.add(p.id)),
  );
  return ids;
};

export const getAllMomentIdsForPresets = (et: EventTypeForWizard, presetIds: Set<number>) => {
  const ids = new Set<number>();
  getEventTypeDays(et).forEach((ed) =>
    ed.event_day_template.activity_presets
      .filter((p) => presetIds.has(p.id))
      .forEach((p) => p.moments?.forEach((m) => ids.add(m.id))),
  );
  return ids;
};

export const getAllRoleIds = (et?: EventTypeForWizard | null) => {
  const ids = new Set<number>();
  getEventTypeSubjects(et).forEach((link) => {
    if (link.subject_role?.id) ids.add(link.subject_role.id);
  });
  return ids;
};

export const getPresetTime = (
  preset: { id: number; default_start_time?: string | null },
  overrides: Record<number, string>,
) => overrides[preset.id] ?? preset.default_start_time ?? '';

export const getPresetDuration = (
  preset: { id: number; default_duration_minutes?: number | null },
  overrides: Record<number, number>,
) => overrides[preset.id] ?? preset.default_duration_minutes ?? 60;

export const isMomentKey = (
  moment: { id: number; is_key_moment?: boolean },
  overrides: Record<number, boolean>,
) => overrides[moment.id] ?? moment.is_key_moment ?? false;

export const getCrewName = (cm: Crew) => {
  const c = cm.contact;
  if (c?.first_name || c?.last_name) return `${c.first_name || ''} ${c.last_name || ''}`.trim();
  return c?.email || 'Unnamed';
};

export const getCrewPrimaryRole = (cm: Crew): string => {
  const primary = cm.job_role_assignments?.find((r: { is_primary: boolean }) => r.is_primary);
  if (primary) return primary.job_role?.display_name || primary.job_role?.name || '';
  if (cm.job_role_assignments?.length > 0) {
    const first = cm.job_role_assignments[0];
    return first.job_role?.display_name || first.job_role?.name || '';
  }
  return '';
};
