import { useMemo } from 'react';
import type { WizardState } from './useWizardState';
import type { WizardData } from './useWizardData';
import type { EquipmentCrewOption, Crew, EquipmentItem } from '../types/wizard.types';
import {
  getEventTypeDays, getEventTypeSubjects, getCrewName, getCrewPrimaryRole,
  matchesRoleKeywords, CAMERA_ROLE_KEYWORDS, AUDIO_ROLE_KEYWORDS,
} from '../helpers/wizard-helpers';

export function useWizardDerived(state: WizardState, data: WizardData) {
  const {
    selectedEventType, selectedDayIds, selectedPresetIds, selectedMomentIds,
    selectedRoleIds, locationCount, customActivities, roleSlots,
    crewAssignments, cameraSlots, audioSlots,
  } = state;
  const { crew, equipmentItems } = data;

  const selectedDays = useMemo(() => {
    if (!selectedEventType) return [];
    return getEventTypeDays(selectedEventType)
      .filter((ed) => selectedDayIds.has(ed.id))
      .sort((a, b) => a.order_index - b.order_index);
  }, [selectedEventType, selectedDayIds]);

  const stats = useMemo(() => {
    if (!selectedEventType)
      return { days: 0, activities: 0, moments: 0, subjects: 0, locations: 0, roles: 0, crew: 0, equipment: 0 };
    const activities =
      selectedDays.reduce(
        (sum, ed) =>
          sum + ed.event_day_template.activity_presets.filter((p) => selectedPresetIds.has(p.id)).length,
        0,
      ) + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length;
    const moments =
      selectedDays.reduce(
        (sum, ed) =>
          sum +
          ed.event_day_template.activity_presets
            .filter((p) => selectedPresetIds.has(p.id))
            .reduce((ms, p) => ms + (p.moments?.filter((m) => selectedMomentIds.has(m.id)).length || 0), 0),
        0,
      ) + customActivities.reduce((s, ca) => s + ca.moments.length, 0);
    const subjects = getEventTypeSubjects(selectedEventType).reduce((sum, link) => {
      return sum + (link.subject_role?.id && selectedRoleIds.has(link.subject_role.id) ? 1 : 0);
    }, 0);
    return {
      days: selectedDays.length,
      activities,
      moments,
      subjects,
      locations: locationCount,
      roles: roleSlots.reduce((s, r) => s + r.quantity, 0),
      crew: crewAssignments.length,
      equipment: cameraSlots.filter((s) => s.equipmentId !== null).length + audioSlots.filter((s) => s.equipmentId !== null).length,
    };
  }, [selectedEventType, selectedDays, selectedPresetIds, selectedMomentIds, selectedRoleIds, locationCount, customActivities, roleSlots, crewAssignments, cameraSlots, audioSlots, selectedDayIds]);

  const totalPresetsInSelectedDays = useMemo(
    () => selectedDays.reduce((s, ed) => s + ed.event_day_template.activity_presets.length, 0),
    [selectedDays],
  );

  const totalRoles = useMemo(() => {
    if (!selectedEventType) return 0;
    return getEventTypeSubjects(selectedEventType).length;
  }, [selectedEventType]);

  const cameraEquipment = useMemo(
    () => equipmentItems.filter((eq: EquipmentItem) => eq.category === 'CAMERA'), [equipmentItems],
  );
  const audioEquipment = useMemo(
    () => equipmentItems.filter((eq: EquipmentItem) => eq.category === 'AUDIO'), [equipmentItems],
  );
  const selectedCameraEquipmentIds = useMemo(
    () => new Set(cameraSlots.map((slot) => slot.equipmentId).filter((id): id is number => id !== null)),
    [cameraSlots],
  );
  const selectedAudioEquipmentIds = useMemo(
    () => new Set(audioSlots.map((slot) => slot.equipmentId).filter((id): id is number => id !== null)),
    [audioSlots],
  );

  const equipmentCrewOptions: EquipmentCrewOption[] = useMemo(() => {
    return crewAssignments.flatMap((assignment) => {
      const crewMember = crew.find((cm: Crew) => cm.id === assignment.crewId);
      if (!crewMember) return [];
      return assignment.jobRoleIds.map((jobRoleId) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = crewMember.job_role_assignments?.find((r: any) => r.job_role.id === jobRoleId);
        const roleName = role?.job_role?.display_name || role?.job_role?.name || 'Crew';
        return {
          crewId: assignment.crewId,
          jobRoleId,
          label: `${getCrewName(crewMember)} · ${roleName}`,
          color: assignment.positionColor || crewMember.crew_color || '#818cf8',
        };
      });
    });
  }, [crewAssignments, crew]);

  const cameraCrewOptions = useMemo(() => {
    return equipmentCrewOptions.filter((opt) => {
      const crewMember = crew.find((cm: Crew) => cm.id === opt.crewId);
      if (!crewMember) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = crewMember.job_role_assignments?.find((r: any) => r.job_role.id === opt.jobRoleId);
      return matchesRoleKeywords(role?.job_role, CAMERA_ROLE_KEYWORDS);
    });
  }, [equipmentCrewOptions, crew]);

  const audioCrewOptions = useMemo(() => {
    return equipmentCrewOptions.filter((opt) => {
      const crewMember = crew.find((cm: Crew) => cm.id === opt.crewId);
      if (!crewMember) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = crewMember.job_role_assignments?.find((r: any) => r.job_role.id === opt.jobRoleId);
      return matchesRoleKeywords(role?.job_role, AUDIO_ROLE_KEYWORDS);
    });
  }, [equipmentCrewOptions, crew]);

  const crewByRole = useMemo(() => {
    const groups: Record<string, Crew[]> = {};
    crew.forEach((cm: Crew) => {
      const role = getCrewPrimaryRole(cm) || 'Unassigned';
      if (!groups[role]) groups[role] = [];
      groups[role].push(cm);
    });
    return groups;
  }, [crew]);

  const accent = selectedEventType?.color || '#f59e0b';

  return {
    selectedDays,
    stats,
    totalPresetsInSelectedDays,
    totalRoles,
    cameraEquipment,
    audioEquipment,
    selectedCameraEquipmentIds,
    selectedAudioEquipmentIds,
    equipmentCrewOptions,
    cameraCrewOptions,
    audioCrewOptions,
    crewByRole,
    accent,
  };
}

export type WizardDerived = ReturnType<typeof useWizardDerived>;
