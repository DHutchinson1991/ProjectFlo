import type { WizardState } from './useWizardState';
import type { WizardData } from './useWizardData';
import type { WizardDerived } from './useWizardDerived';
import type { CrewAssignment, CustomActivity, Crew, CameraAudioSlot, EquipmentPreset } from '../types/wizard.types';
import {
  normalizeEventTypeForWizard, getEventTypeDays, getAllRoleIds,
  getAllMomentIdsForPresets, getPresetIdsForDays, renumberSlots,
  DEFAULT_CAMERA_SLOT, getDefaultStandardGuestCount,
} from '../helpers/wizard-helpers';
import { servicePackagesApi } from '@/features/catalog/packages/api';
import { crewPresetsApi } from '@/features/workflow/crew/api';
import type { CrewPreset } from '@/features/workflow/crew/types/crew-presets';
import { readStoredEquipmentPresets, writeStoredEquipmentPresets } from '../helpers/equipment-preset-storage';

export function useWizardHandlers(
  state: WizardState,
  data: WizardData,
  derived: WizardDerived,
  brandId?: number,
) {
  const { crew } = data;
  const { cameraCrewOptions, audioCrewOptions } = derived;

  // ── Event Type ─────────────────────────────────────────────────
  const handleEventTypeSelected = (eventType: Parameters<typeof normalizeEventTypeForWizard>[0]) => {
    const normalized = normalizeEventTypeForWizard(eventType);
    state.setSelectedEventType(normalized);
    state.setSourceDayBlueprintVersionId(null);

    // Auto-select the primary day (e.g. "Wedding Day") and its activities/moments
    const days = getEventTypeDays(normalized);
    const primaryDay = days.find((d) => d.event_day_template.name.toLowerCase().includes('wedding'))
      || (days.length === 1 ? days[0] : null);

    if (primaryDay) {
      const dayId = primaryDay.id;
      const presetIds = primaryDay.event_day_template.activity_presets.map((p) => p.id);
      const momentIds = primaryDay.event_day_template.activity_presets.flatMap((p) => p.moments?.map((m) => m.id) || []);
      state.setSelectedDayIds(new Set([dayId]));
      state.setSelectedPresetIds(new Set(presetIds));
      state.setSelectedMomentIds(new Set(momentIds));
    } else {
      state.setSelectedDayIds(new Set());
      state.setSelectedPresetIds(new Set());
      state.setSelectedMomentIds(new Set());
    }

    state.setSelectedRoleIds(getAllRoleIds(normalized));
  state.setStandardGuestCount(getDefaultStandardGuestCount(normalized));
    state.setCustomActivities([]);
    state.setPresetTimeOverrides({});
    state.setPresetDurationOverrides({});
    state.setMomentKeyOverrides({});
    state.setRoleSlots([]);
    state.setCrewAssignments([]);
    state.setCameraSlots([{ ...DEFAULT_CAMERA_SLOT }]);
    state.setAudioSlots([]);
    state.setLocationCount(3);
    if (!state.packageName) state.setPackageName(`${normalized.name} Package`);
    state.setActiveStep(1);
  };

  // ── Navigation ─────────────────────────────────────────────────
  const handleNext = () => {
    if (state.activeStep < state.steps.length - 1) state.setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    state.setError(null);
    if (state.activeStep > 0) state.setActiveStep((prev) => prev - 1);
  };

  // ── Day toggles ────────────────────────────────────────────────
  const toggleDay = (dayId: number) => {
    if (!state.selectedEventType) return;
    const dayLink = getEventTypeDays(state.selectedEventType).find((ed) => ed.id === dayId);
    if (!dayLink) return;
    const presetIds = dayLink.event_day_template.activity_presets.map((p) => p.id);
    const momentIds = dayLink.event_day_template.activity_presets.flatMap(
      (p) => p.moments?.map((m) => m.id) || [],
    );
    if (state.selectedDayIds.has(dayId)) {
      state.setSelectedDayIds((prev) => { const n = new Set(prev); n.delete(dayId); return n; });
      state.setSelectedPresetIds((prev) => { const n = new Set(prev); presetIds.forEach((id) => n.delete(id)); return n; });
      state.setSelectedMomentIds((prev) => { const n = new Set(prev); momentIds.forEach((id) => n.delete(id)); return n; });
    } else {
      state.setSelectedDayIds((prev) => new Set(prev).add(dayId));
      state.setSelectedPresetIds((prev) => { const n = new Set(prev); presetIds.forEach((id) => n.add(id)); return n; });
      state.setSelectedMomentIds((prev) => { const n = new Set(prev); momentIds.forEach((id) => n.add(id)); return n; });
    }
  };

  // ── Preset/moment toggles ─────────────────────────────────────
  const togglePreset = (id: number) => {
    if (!state.selectedEventType) return;
    const momentIdsForPreset: number[] = [];
    getEventTypeDays(state.selectedEventType).forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === id)
        .forEach((p) => p.moments?.forEach((m) => momentIdsForPreset.push(m.id))),
    );
    if (state.selectedPresetIds.has(id)) {
      state.setSelectedPresetIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      state.setSelectedMomentIds((prev) => { const n = new Set(prev); momentIdsForPreset.forEach((mid) => n.delete(mid)); return n; });
    } else {
      state.setSelectedPresetIds((prev) => new Set(prev).add(id));
      state.setSelectedMomentIds((prev) => { const n = new Set(prev); momentIdsForPreset.forEach((mid) => n.add(mid)); return n; });
    }
  };

  const toggleMoment = (id: number) => {
    state.setSelectedMomentIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleMomentKey = (momentId: number, currentIsKey: boolean) => {
    state.setMomentKeyOverrides((prev) => ({ ...prev, [momentId]: !currentIsKey }));
  };

  const selectAllMomentsForPreset = (presetId: number) => {
    if (!state.selectedEventType) return;
    getEventTypeDays(state.selectedEventType).forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === presetId)
        .forEach((p) =>
          state.setSelectedMomentIds((prev) => { const n = new Set(prev); p.moments?.forEach((m) => n.add(m.id)); return n; }),
        ),
    );
  };

  const deselectAllMomentsForPreset = (presetId: number) => {
    if (!state.selectedEventType) return;
    getEventTypeDays(state.selectedEventType).forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === presetId)
        .forEach((p) =>
          state.setSelectedMomentIds((prev) => { const n = new Set(prev); p.moments?.forEach((m) => n.delete(m.id)); return n; }),
        ),
    );
  };

  const selectAllActivities = () => {
    if (!state.selectedEventType) return;
    const allP = getPresetIdsForDays(state.selectedEventType, state.selectedDayIds);
    state.setSelectedPresetIds(allP);
    state.setSelectedMomentIds(getAllMomentIdsForPresets(state.selectedEventType, allP));
  };

  const deselectAllActivities = () => {
    state.setSelectedPresetIds(new Set());
    state.setSelectedMomentIds(new Set());
  };

  // ── Role/subject toggles ──────────────────────────────────────
  const toggleRole = (id: number) => {
    state.setSelectedRoleIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleExpandPreset = (id: number) => {
    state.setExpandedPresets((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleExpandReviewPreset = (id: number) => {
    state.setExpandedReviewPresets((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // ── Role slots ─────────────────────────────────────────────────
  const addRoleSlot = (jobRoleId: number) => {
    state.setRoleSlots((prev) => {
      const existing = prev.find((s) => s.jobRoleId === jobRoleId);
      if (existing) return prev.map((s) => s.jobRoleId === jobRoleId ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { jobRoleId, quantity: 1 }];
    });
  };

  const removeRoleSlot = (jobRoleId: number) => {
    state.setRoleSlots((prev) => {
      const existing = prev.find((s) => s.jobRoleId === jobRoleId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((s) => s.jobRoleId !== jobRoleId);
      return prev.map((s) => s.jobRoleId === jobRoleId ? { ...s, quantity: s.quantity - 1 } : s);
    });
    state.setCrewAssignments((prev) => {
      const slot = state.roleSlots.find((s) => s.jobRoleId === jobRoleId);
      if (!slot) return prev;
      const assignmentsForRole = prev.filter((a) => a.jobRoleIds.includes(jobRoleId));
      if (assignmentsForRole.length <= slot.quantity - 1) return prev;
      const last = [...prev].reverse().find((a) => a.jobRoleIds.includes(jobRoleId));
      if (!last) return prev;
      return prev.filter((a) => a !== last);
    });
  };

  const getPositionCrewId = (jobRoleId: number, posIndex: number): number | null => {
    const assignmentsForRole = state.crewAssignments.filter((a) => a.jobRoleIds.includes(jobRoleId));
    return assignmentsForRole[posIndex]?.crewId ?? null;
  };

  const assignCrewToPosition = (jobRoleId: number, posIndex: number, crewId: number | null) => {
    state.setCrewAssignments((prev) => {
      const forRole = prev.filter((a) => a.jobRoleIds.includes(jobRoleId));
      const others = prev.filter((a) => !a.jobRoleIds.includes(jobRoleId));
      if (crewId === null) {
        const updated = [...forRole];
        if (posIndex < updated.length) updated.splice(posIndex, 1);
        return [...others, ...updated];
      }
      const crewMember = crew.find((c: Crew) => c.id === crewId);
      const entry: CrewAssignment = {
        crewId,
        jobRoleIds: [jobRoleId],
        positionColor: crewMember?.crew_color,
      };
      const updated = [...forRole];
      if (posIndex < updated.length) {
        updated[posIndex] = entry;
      } else {
        updated.push(entry);
      }
      return [...others, ...updated];
    });
  };

  // ── Crew presets ───────────────────────────────────────────────
  const applyCrewPreset = (preset: CrewPreset) => {
    // Build roleSlots by counting slots per job role.
    const quantityByRole = new Map<number, number>();
    for (const slot of preset.slots) {
      quantityByRole.set(slot.job_role_id, (quantityByRole.get(slot.job_role_id) ?? 0) + 1);
    }
    const nextRoleSlots = Array.from(quantityByRole.entries()).map(([jobRoleId, quantity]) => ({
      jobRoleId,
      quantity,
    }));
    state.setRoleSlots(nextRoleSlots);

    // Build crew assignments from preset slots (order_index already gives position order).
    const orderedSlots = [...preset.slots].sort((a, b) => a.order_index - b.order_index);
    const assignments: CrewAssignment[] = [];
    for (const slot of orderedSlots) {
      if (slot.crew_id == null) continue;
      const crewMember = crew.find((c: Crew) => c.id === slot.crew_id);
      assignments.push({
        crewId: slot.crew_id,
        jobRoleIds: [slot.job_role_id],
        positionColor: crewMember?.crew_color,
      });
    }
    state.setCrewAssignments(assignments);
  };

  const saveAsCrewPreset = async (name: string, isDefault = false): Promise<CrewPreset | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (state.roleSlots.length === 0) return null;

    // Expand roleSlots × quantity into preset slots, filling crew_id from current assignments.
    const slots: { job_role_id: number; crew_id: number | null; order_index: number }[] = [];
    let order = 0;
    for (const slot of state.roleSlots) {
      for (let posIndex = 0; posIndex < slot.quantity; posIndex++) {
        const crewId = getPositionCrewId(slot.jobRoleId, posIndex);
        slots.push({
          job_role_id: slot.jobRoleId,
          crew_id: crewId,
          order_index: order++,
        });
      }
    }
    try {
      const created = await crewPresetsApi.create({
        name: trimmed,
        is_default: isDefault,
        slots,
      });
      await data.fetchCrewPresets();
      return created;
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to save crew preset');
      return null;
    }
  };

  const deleteCrewPreset = async (presetId: number): Promise<boolean> => {
    try {
      await crewPresetsApi.delete(presetId);
      await data.fetchCrewPresets();
      return true;
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to delete crew preset');
      return false;
    }
  };

  // ── Equipment slots ────────────────────────────────────────────
  const addCameraSlot = () => {
    const autoOp = cameraCrewOptions.length === 1 ? cameraCrewOptions[0] : null;
    state.setCameraSlots((prev) => [
      ...prev,
      { slotNumber: prev.length + 1, equipmentId: null, assignedCrewId: autoOp?.crewId ?? null, assignedJobRoleId: autoOp?.jobRoleId ?? null },
    ]);
  };

  const removeCameraSlot = (slotNumber: number) => {
    state.setCameraSlots((prev) => prev.filter((s) => s.slotNumber !== slotNumber).map((s, i) => ({ ...s, slotNumber: i + 1 })));
  };

  const moveCameraSlot = (slotNumber: number, direction: 'up' | 'down') => {
    state.setCameraSlots((prev) => {
      const index = prev.findIndex((slot) => slot.slotNumber === slotNumber);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return renumberSlots(next);
    });
  };

  const updateCameraSlot = (slotNumber: number, equipmentId: number | null) => {
    state.setCameraSlots((prev) => prev.map((s) => s.slotNumber === slotNumber ? { ...s, equipmentId } : s));
  };

  const addAudioSlot = () => {
    const autoOp = audioCrewOptions.length === 1 ? audioCrewOptions[0] : null;
    state.setAudioSlots((prev) => [
      ...prev,
      { slotNumber: prev.length + 1, equipmentId: null, assignedCrewId: autoOp?.crewId ?? null, assignedJobRoleId: autoOp?.jobRoleId ?? null },
    ]);
  };

  const removeAudioSlot = (slotNumber: number) => {
    state.setAudioSlots((prev) => prev.filter((s) => s.slotNumber !== slotNumber).map((s, i) => ({ ...s, slotNumber: i + 1 })));
  };

  const moveAudioSlot = (slotNumber: number, direction: 'up' | 'down') => {
    state.setAudioSlots((prev) => {
      const index = prev.findIndex((slot) => slot.slotNumber === slotNumber);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return renumberSlots(next);
    });
  };

  const updateAudioSlot = (slotNumber: number, equipmentId: number | null) => {
    state.setAudioSlots((prev) => prev.map((s) => s.slotNumber === slotNumber ? { ...s, equipmentId } : s));
  };

  const updateSlotAssignment = (slotType: 'CAMERA' | 'AUDIO', slotNumber: number, value: string) => {
    const [crewValue, roleValue] = value ? value.split(':') : [];
    const assignedCrewId = crewValue ? Number(crewValue) : null;
    const assignedJobRoleId = roleValue ? Number(roleValue) : null;
    const updater = (slots: CameraAudioSlot[]) => slots.map((slot) =>
      slot.slotNumber === slotNumber ? { ...slot, assignedCrewId, assignedJobRoleId } : slot,
    );
    if (slotType === 'CAMERA') state.setCameraSlots(updater);
    else state.setAudioSlots(updater);
  };

  const applyEquipmentPreset = (preset: EquipmentPreset) => {
    const orderedCameraSlots = preset.slots
      .filter((slot) => slot.slot_type === 'CAMERA')
      .sort((a, b) => a.order_index - b.order_index)
      .map((slot, index) => ({
        slotNumber: index + 1,
        equipmentId: slot.equipment_id,
        assignedCrewId: slot.crew_id,
        assignedJobRoleId: slot.job_role_id,
      }));

    const orderedAudioSlots = preset.slots
      .filter((slot) => slot.slot_type === 'AUDIO')
      .sort((a, b) => a.order_index - b.order_index)
      .map((slot, index) => ({
        slotNumber: index + 1,
        equipmentId: slot.equipment_id,
        assignedCrewId: slot.crew_id,
        assignedJobRoleId: slot.job_role_id,
      }));

    state.setCameraSlots(orderedCameraSlots.length > 0 ? orderedCameraSlots : [{ ...DEFAULT_CAMERA_SLOT }]);
    state.setAudioSlots(orderedAudioSlots);
  };

  const saveAsEquipmentPreset = async (name: string, isDefault = false): Promise<EquipmentPreset | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const slots = [
      ...state.cameraSlots.map((slot, index) => ({
        slot_type: 'CAMERA' as const,
        equipment_id: slot.equipmentId,
        crew_id: slot.assignedCrewId,
        job_role_id: slot.assignedJobRoleId,
        order_index: index,
      })),
      ...state.audioSlots.map((slot, index) => ({
        slot_type: 'AUDIO' as const,
        equipment_id: slot.equipmentId,
        crew_id: slot.assignedCrewId,
        job_role_id: slot.assignedJobRoleId,
        order_index: index,
      })),
    ];

    const hasConfiguredSlots = slots.some((slot) =>
      slot.equipment_id != null || slot.crew_id != null || slot.job_role_id != null,
    ) || state.cameraSlots.length > 1 || state.audioSlots.length > 0;

    if (!hasConfiguredSlots) return null;

    try {
      const existing = readStoredEquipmentPresets(brandId);
      const existingWithSameName = existing.find((preset) => preset.name.trim().toLowerCase() === trimmed.toLowerCase());
      const now = new Date().toISOString();
      const created: EquipmentPreset = {
        id: existingWithSameName?.id ?? Date.now(),
        brand_id: brandId,
        name: trimmed,
        is_default: isDefault,
        created_at: existingWithSameName?.created_at ?? now,
        updated_at: now,
        slots,
      };

      const nextPresets = [
        created,
        ...existing
          .filter((preset) => preset.id !== created.id)
          .map((preset) => (isDefault ? { ...preset, is_default: false } : preset)),
      ];

      writeStoredEquipmentPresets(brandId, nextPresets);
      await data.fetchEquipmentPresets();
      return created;
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to save equipment preset');
      return null;
    }
  };

  const deleteEquipmentPreset = async (presetId: number): Promise<boolean> => {
    try {
      const nextPresets = readStoredEquipmentPresets(brandId).filter((preset) => preset.id !== presetId);
      writeStoredEquipmentPresets(brandId, nextPresets);
      await data.fetchEquipmentPresets();
      return true;
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to delete equipment preset');
      return false;
    }
  };

  // ── Custom activities ──────────────────────────────────────────
  const handleAddCustomActivity = (dayLinkId: number) => {
    if (!state.newActivityName.trim()) return;
    state.setCustomActivities((prev) => [
      ...prev,
      { tempId: `custom-${Date.now()}`, name: state.newActivityName.trim(), dayLinkId, startTime: '', durationMinutes: 60, moments: [] },
    ]);
    state.setNewActivityName('');
    state.setAddingActivityForDay(null);
  };

  const handleRemoveCustomActivity = (tempId: string) => {
    state.setCustomActivities((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  const updateCustomActivity = (tempId: string, updates: Partial<CustomActivity>) => {
    state.setCustomActivities((prev) => prev.map((a) => (a.tempId === tempId ? { ...a, ...updates } : a)));
  };

  const handleAddCustomMoment = (activityTempId: string) => {
    if (!state.newMomentName.trim()) return;
    state.setCustomActivities((prev) =>
      prev.map((a) =>
        a.tempId === activityTempId
          ? { ...a, moments: [...a.moments, { tempId: `moment-${Date.now()}`, name: state.newMomentName.trim(), isKeyMoment: false }] }
          : a,
      ),
    );
    state.setNewMomentName('');
    state.setAddingMomentForActivity(null);
  };

  const handleRemoveCustomMoment = (activityTempId: string, momentTempId: string) => {
    state.setCustomActivities((prev) =>
      prev.map((a) =>
        a.tempId === activityTempId
          ? { ...a, moments: a.moments.filter((m) => m.tempId !== momentTempId) }
          : a,
      ),
    );
  };

  const toggleCustomMomentKey = (activityTempId: string, momentTempId: string) => {
    state.setCustomActivities((prev) =>
      prev.map((a) =>
        a.tempId === activityTempId
          ? { ...a, moments: a.moments.map((m) => m.tempId === momentTempId ? { ...m, isKeyMoment: !m.isKeyMoment } : m) }
          : a,
      ),
    );
  };

  // ── Create ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!state.selectedEventType || !state.packageName.trim() || !brandId) return;
    state.setIsCreating(true);
    state.setError(null);
    try {
      const selectedActivities = Array.from(state.selectedPresetIds).map((presetId) => ({
        presetId,
        startTime: state.presetTimeOverrides[presetId] || undefined,
        durationMinutes: state.presetDurationOverrides[presetId] || undefined,
      }));

      const blueprintMode = state.sourceDayBlueprintVersionId !== null;

      const customActivitiesData = state.customActivities
        .filter((ca) => state.selectedDayIds.has(ca.dayLinkId))
        .map((ca) => {
          const dayLink = getEventTypeDays(state.selectedEventType).find((ed) => ed.id === ca.dayLinkId);
          return {
            name: ca.name,
            dayTemplateId: dayLink?.event_day_template.id || 0,
            startTime: ca.startTime || undefined,
            durationMinutes: ca.durationMinutes || undefined,
            moments: ca.moments.map((m) => ({ name: m.name, isKeyMoment: m.isKeyMoment })),
          };
        });

      const momentKeyOverridesData = Object.entries(state.momentKeyOverrides).map(([id, isKey]) => ({
        momentId: parseInt(id),
        isKey,
      }));

      const equipmentSlotsData = [
        ...state.cameraSlots.filter((s) => s.equipmentId).map((s) => ({
          equipmentId: s.equipmentId!, slotLabel: `Camera ${s.slotNumber}`, slotType: 'CAMERA',
          crewId: s.assignedCrewId || undefined, jobRoleId: s.assignedJobRoleId || undefined,
        })),
        ...state.audioSlots.filter((s) => s.equipmentId).map((s) => ({
          equipmentId: s.equipmentId!, slotLabel: `Audio ${s.slotNumber}`, slotType: 'AUDIO',
          crewId: s.assignedCrewId || undefined, jobRoleId: s.assignedJobRoleId || undefined,
        })),
      ];

      const crewAssignmentsData = state.crewAssignments.flatMap((a) =>
        a.jobRoleIds.map((roleId) => {
          const cm = crew.find((c: Crew) => c.id === a.crewId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const role = cm?.job_role_assignments?.find((r: any) => r.job_role.id === roleId);
          const positionName = role?.job_role?.display_name || role?.job_role?.name || 'Crew';
          return { crewId: a.crewId, jobRoleId: roleId, label: positionName };
        }),
      );

      const response = await servicePackagesApi.createFromTemplate(state.selectedEventType.id, {
        packageName: state.packageName,
        selectedDayIds: blueprintMode ? [] : Array.from(state.selectedDayIds),
        selectedActivities: blueprintMode ? [] : selectedActivities,
        customActivities: blueprintMode ? [] : customActivitiesData,
        selectedMomentIds: blueprintMode ? [] : Array.from(state.selectedMomentIds),
        momentKeyOverrides: blueprintMode ? [] : momentKeyOverridesData,
        selectedRoleIds: Array.from(state.selectedRoleIds),
        standardGuestCount: state.standardGuestCount,
        locationCount: state.locationCount,
        roleSlots: state.roleSlots.map((s) => ({ jobRoleId: s.jobRoleId, quantity: s.quantity })),
        crewAssignments: crewAssignmentsData,
        equipmentSlots: equipmentSlotsData,
        sourceDayBlueprintVersionId: state.sourceDayBlueprintVersionId ?? undefined,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const packageId = (response as any)?.id;
      if (packageId) {
        state.setCreatedPackageId(packageId);
      } else {
        state.setError('Failed to create package');
        state.setIsCreating(false);
      }
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to create package');
      state.setIsCreating(false);
    }
  };

  return {
    handleEventTypeSelected,
    handleNext,
    handleBack,
    toggleDay,
    togglePreset,
    toggleMoment,
    toggleMomentKey,
    selectAllMomentsForPreset,
    deselectAllMomentsForPreset,
    selectAllActivities,
    deselectAllActivities,
    toggleRole,
    toggleExpandPreset,
    toggleExpandReviewPreset,
    addRoleSlot,
    removeRoleSlot,
    getPositionCrewId,
    assignCrewToPosition,
    applyCrewPreset,
    saveAsCrewPreset,
    deleteCrewPreset,
    addCameraSlot,
    removeCameraSlot,
    moveCameraSlot,
    updateCameraSlot,
    addAudioSlot,
    removeAudioSlot,
    moveAudioSlot,
    updateAudioSlot,
    updateSlotAssignment,
    applyEquipmentPreset,
    saveAsEquipmentPreset,
    deleteEquipmentPreset,
    handleAddCustomActivity,
    handleRemoveCustomActivity,
    updateCustomActivity,
    handleAddCustomMoment,
    handleRemoveCustomMoment,
    toggleCustomMomentKey,
    handleCreate,
  };
}

export type WizardHandlers = ReturnType<typeof useWizardHandlers>;
