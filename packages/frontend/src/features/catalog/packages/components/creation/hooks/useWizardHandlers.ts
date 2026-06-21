import type { WizardState } from './useWizardState';
import type { WizardData } from './useWizardData';
import type { WizardDerived } from './useWizardDerived';
import type { CrewAssignment, CustomActivity, Crew, CameraAudioSlot, EquipmentPreset } from '../types/wizard.types';
import {
  normalizeEventTypeForWizard, getEventTypeDays, getAllRoleIds,
  getAllMomentIdsForPresets, getPresetIdsForDays, renumberSlots,
  DEFAULT_CAMERA_SLOT, PACKAGE_PLANNING_GUEST_COUNT, WIZARD_STEP_INDEX,
  matchesRoleKeywords, CAMERA_ROLE_KEYWORDS, AUDIO_ROLE_KEYWORDS,
} from '../helpers/wizard-helpers';
import { maxLocationCount, DEFAULT_LOCATION_COUNT } from '../helpers/location-helpers';
import { crewIdsByPresetPosition, fillPresetPositionEquipment } from '../helpers/crew-preset-equipment';
import { servicePackagesApi } from '@/features/catalog/packages/api';
import { crewPresetsApi } from '@/features/workflow/crew/api';
import { equipmentPresetsApi } from '@/features/workflow/equipment/api';
import type { CrewPreset } from '@/features/workflow/crew/types/crew-presets';
import { isManualDayPlanComplete } from '../helpers/manual-day-plan';
import { buildDefaultBlueprintName } from '../helpers/day-design-shared';
import { materializeManualDayPlanBlueprint } from '../../../day-design/materialize-manual-day-plan-blueprint';

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
    state.setSourceDayBlueprintId(null);
    state.setSelectedBlueprintActivityIds(new Set());
    state.setBlueprintDayMappings({});
    state.setBlueprintDayCount(0);
    state.setBlueprintScaffoldDays([]);
    state.setLocationCountByBlueprintDayId({});

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
    state.setCustomActivities([]);
    state.setPresetTimeOverrides({});
    state.setPresetDurationOverrides({});
    state.setMomentKeyOverrides({});
    state.setRoleSlots([]);
    state.setCrewAssignments([]);
    state.setPositionEquipment({});
    state.setCameraSlots([{ ...DEFAULT_CAMERA_SLOT }]);
    state.setAudioSlots([]);
    state.setLocationCount(3);
    if (!state.packageName) state.setPackageName(`${normalized.name} Package`);
    // Auto-advance to the Day design step, starting at the path picker.
    state.setDayDesignPath(null);
    state.setDayDesignPhase('source');
    state.setActiveStep(WIZARD_STEP_INDEX.DAY_DESIGN);
  };

  // ── Navigation ─────────────────────────────────────────────────
  /** Discard the committed day design and return to the path picker. */
  const resetDayDesignSource = () => {
    state.setSourceDayBlueprintVersionId(null);
    state.setSourceDayBlueprintId(null);
    state.setSelectedBlueprintActivityIds(new Set());
    state.setBlueprintDayMappings({});
    state.setBlueprintDayCount(0);
    state.setBlueprintScaffoldDays([]);
    state.setLocationCountByBlueprintDayId({});
    state.setDayDesignSource(null);
    state.setManualDayPlan(null);
    state.setDayDesignPath(null);
    state.setDayDesignPhase('source');
  };

  const returnToDayDesignPicker = () => {
    state.setDayDesignSource(null);
    state.setManualDayPlan(null);
    state.setDayDesignPath(null);
    state.setDayDesignPhase('source');
    state.setBlueprintScaffoldDays([]);
    state.setLocationCountByBlueprintDayId({});
  };

  const handleNext = () => {
    if (state.activeStep < state.steps.length - 1) state.setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    state.setError(null);
    if (state.activeStep === WIZARD_STEP_INDEX.DAY_DESIGN) {
      if (state.dayDesignPhase === 'review') {
        resetDayDesignSource();
        return;
      }
      const pathStillInProgress =
        state.dayDesignPath !== null
        && (
          state.dayDesignSource === null
          || (state.dayDesignSource === 'manual' && !isManualDayPlanComplete(state.manualDayPlan))
        );
      if (pathStillInProgress) {
        returnToDayDesignPicker();
        return;
      }
    }
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

  const toggleBlueprintActivity = (activityId: number) => {
    state.setSelectedBlueprintActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const selectAllBlueprintActivities = (activityIds: number[]) => {
    state.setSelectedBlueprintActivityIds(new Set(activityIds));
  };

  const deselectAllBlueprintActivities = () => {
    state.setSelectedBlueprintActivityIds(new Set());
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
    const existingSlot = state.roleSlots.find((s) => s.jobRoleId === jobRoleId);
    state.setRoleSlots((prev) => {
      const existing = prev.find((s) => s.jobRoleId === jobRoleId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((s) => s.jobRoleId !== jobRoleId);
      return prev.map((s) => s.jobRoleId === jobRoleId ? { ...s, quantity: s.quantity - 1 } : s);
    });
    // Drop equipment attached to the position being removed.
    if (existingSlot) {
      state.setPositionEquipment((prev) => {
        const next = { ...prev };
        if (existingSlot.quantity <= 1) {
          Object.keys(next)
            .filter((key) => key.startsWith(`${jobRoleId}:`))
            .forEach((key) => delete next[key]);
        } else {
          delete next[`${jobRoleId}:${existingSlot.quantity - 1}`];
        }
        return next;
      });
    }
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

  // ── Per-position equipment (camera/audio roles) ────────────────
  const positionEquipmentKey = (jobRoleId: number, posIndex: number) => `${jobRoleId}:${posIndex}`;

  const getPositionEquipmentSlots = (jobRoleId: number, posIndex: number): (number | null)[] => {
    const slots = state.positionEquipment[positionEquipmentKey(jobRoleId, posIndex)];
    return slots?.length ? slots : [null];
  };

  const setPositionEquipmentAt = (
    jobRoleId: number,
    posIndex: number,
    eqIndex: number,
    equipmentId: number | null,
  ) => {
    const key = positionEquipmentKey(jobRoleId, posIndex);
    state.setPositionEquipment((prev) => {
      const current = [...(prev[key] ?? [])];
      while (current.length <= eqIndex) current.push(null);

      if (equipmentId == null) {
        current.splice(eqIndex, 1);
      } else {
        current[eqIndex] = equipmentId;
      }

      while (current.length > 0 && current[current.length - 1] == null) {
        current.pop();
      }

      const next = { ...prev };
      if (current.length === 0 || current.every((id) => id == null)) {
        delete next[key];
      } else {
        next[key] = current;
      }
      return next;
    });
  };

  const addPositionEquipmentSlot = (jobRoleId: number, posIndex: number) => {
    const key = positionEquipmentKey(jobRoleId, posIndex);
    state.setPositionEquipment((prev) => {
      const current = prev[key]?.length ? [...prev[key]] : [null];
      if (current[current.length - 1] === null) return prev;
      return { ...prev, [key]: [...current, null] };
    });
  };

  const removePositionEquipmentSlot = (jobRoleId: number, posIndex: number, eqIndex: number) => {
    const key = positionEquipmentKey(jobRoleId, posIndex);
    state.setPositionEquipment((prev) => {
      const current = prev[key];
      if (!current?.length) return prev;
      const nextSlots = current.filter((_, index) => index !== eqIndex);
      const next = { ...prev };
      if (nextSlots.length === 0 || nextSlots.every((id) => id == null)) {
        delete next[key];
      } else {
        next[key] = nextSlots;
      }
      return next;
    });
  };

  const clearPositionEquipment = (jobRoleId: number, posIndex: number) => {
    const key = positionEquipmentKey(jobRoleId, posIndex);
    state.setPositionEquipment((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Team presets (unified: positions + crew + equipment) ───────
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

    // Build crew assignments + per-position equipment from preset slots.
    // order_index gives position order; track a per-role counter for the position index.
    const orderedSlots = [...preset.slots].sort((a, b) => a.order_index - b.order_index);
    const assignments: CrewAssignment[] = [];
    const nextPositionEquipment: Record<string, (number | null)[]> = {};
    const posCounter = new Map<number, number>();
    for (const slot of orderedSlots) {
      const posIndex = posCounter.get(slot.job_role_id) ?? 0;
      posCounter.set(slot.job_role_id, posIndex + 1);
      if (slot.equipment_id != null) {
        const key = `${slot.job_role_id}:${posIndex}`;
        nextPositionEquipment[key] = [slot.equipment_id];
      }
      if (slot.crew_id == null) continue;
      const crewMember = crew.find((c: Crew) => c.id === slot.crew_id);
      assignments.push({
        crewId: slot.crew_id,
        jobRoleIds: [slot.job_role_id],
        positionColor: crewMember?.crew_color,
      });
    }
    state.setCrewAssignments(assignments);
    state.setPositionEquipment(
      fillPresetPositionEquipment(
        nextRoleSlots,
        crewIdsByPresetPosition(orderedSlots),
        nextPositionEquipment,
        data.availableJobRoles,
        data.equipmentItems,
      ),
    );
  };

  const saveAsCrewPreset = async (name: string, isDefault = false): Promise<CrewPreset | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (state.roleSlots.length === 0) return null;

    // Expand roleSlots × quantity into preset slots, filling crew_id + equipment_id from current state.
    const slots: { job_role_id: number; crew_id: number | null; equipment_id: number | null; order_index: number }[] = [];
    let order = 0;
    for (const slot of state.roleSlots) {
      for (let posIndex = 0; posIndex < slot.quantity; posIndex++) {
        const crewId = getPositionCrewId(slot.jobRoleId, posIndex);
        const equipmentIds = getPositionEquipmentSlots(slot.jobRoleId, posIndex).filter((id): id is number => id != null);
        slots.push({
          job_role_id: slot.jobRoleId,
          crew_id: crewId,
          equipment_id: equipmentIds[0] ?? null,
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
      const created = await equipmentPresetsApi.create({
        name: trimmed,
        is_default: isDefault,
        slots,
      });
      await data.fetchEquipmentPresets();
      return created;
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to save equipment preset');
      return null;
    }
  };

  const deleteEquipmentPreset = async (presetId: number): Promise<boolean> => {
    if (presetId < 0) {
      data.removeEquipmentPresetLocal(presetId);
      return true;
    }
    try {
      await equipmentPresetsApi.delete(presetId);
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

      const manualMode = state.dayDesignSource === 'manual';
      let sourceDayBlueprintVersionId = state.sourceDayBlueprintVersionId;
      let selectedDayBlueprintActivityIds = sourceDayBlueprintVersionId !== null
        ? Array.from(state.selectedBlueprintActivityIds)
        : undefined;

      if (
        manualMode
        && state.manualDayPlan
        && isManualDayPlanComplete(state.manualDayPlan)
        && sourceDayBlueprintVersionId === null
      ) {
        const blueprintDisplayName = state.packageName.trim()
          || buildDefaultBlueprintName(state.selectedEventType.name);
        const materialized = await materializeManualDayPlanBlueprint({
          manualDayPlan: state.manualDayPlan,
          eventCategory: state.selectedEventType.name,
          displayName: blueprintDisplayName,
        });
        sourceDayBlueprintVersionId = materialized.versionId;
        selectedDayBlueprintActivityIds = materialized.activityIds;
        state.setSourceDayBlueprintVersionId(materialized.versionId);
        state.setSourceDayBlueprintId(materialized.blueprintId);
        state.setSelectedBlueprintActivityIds(new Set(materialized.activityIds));
      }

      const blueprintMode = sourceDayBlueprintVersionId !== null;

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

      // Equipment now lives on camera/audio positions — derive slots from the team setup.
      const equipmentSlotsData: Array<{
        equipmentId: number; slotLabel: string; slotType: 'CAMERA' | 'AUDIO';
        crewId?: number; jobRoleId: number;
      }> = [];
      let cameraCount = 0;
      let audioCount = 0;
      for (const slot of state.roleSlots) {
        const role = data.availableJobRoles.find((r) => r.id === slot.jobRoleId);
        const isCamera = matchesRoleKeywords(role, CAMERA_ROLE_KEYWORDS);
        const isAudio = !isCamera && matchesRoleKeywords(role, AUDIO_ROLE_KEYWORDS);
        if (!isCamera && !isAudio) continue;
        for (let posIndex = 0; posIndex < slot.quantity; posIndex++) {
          const equipmentIds = getPositionEquipmentSlots(slot.jobRoleId, posIndex)
            .filter((id): id is number => id != null);
          if (equipmentIds.length === 0) continue;
          const crewId = getPositionCrewId(slot.jobRoleId, posIndex) || undefined;
          for (const equipmentId of equipmentIds) {
            if (isCamera) {
              cameraCount += 1;
              equipmentSlotsData.push({
                equipmentId,
                slotLabel: `Camera ${cameraCount}`,
                slotType: 'CAMERA',
                crewId,
                jobRoleId: slot.jobRoleId,
              });
            } else {
              audioCount += 1;
              equipmentSlotsData.push({
                equipmentId,
                slotLabel: `Audio ${audioCount}`,
                slotType: 'AUDIO',
                crewId,
                jobRoleId: slot.jobRoleId,
              });
            }
          }
        }
      }

      const crewAssignmentsData = state.crewAssignments.flatMap((a) =>
        a.jobRoleIds.map((roleId) => {
          const cm = crew.find((c: Crew) => c.id === a.crewId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const role = cm?.job_role_assignments?.find((r: any) => r.job_role.id === roleId);
          const positionName = role?.job_role?.display_name || role?.job_role?.name || 'Crew';
          return { crewId: a.crewId, jobRoleId: roleId, label: positionName };
        }),
      );

      const perDayLocationCounts = blueprintMode
        ? state.blueprintScaffoldDays.map(
            (day) => state.locationCountByBlueprintDayId[day.id] ?? DEFAULT_LOCATION_COUNT,
          )
        : manualMode && state.manualDayPlan
          ? state.manualDayPlan.days.map((day) => day.locationCount)
          : [state.locationCount];
      const effectiveLocationCount = maxLocationCount(perDayLocationCounts);

      const scaffoldPackageDays = blueprintMode && state.blueprintScaffoldDays.length > 0
        ? state.blueprintScaffoldDays.map((day) => ({
            name: day.name,
            order_index: day.order_index,
            locationCount: state.locationCountByBlueprintDayId[day.id] ?? DEFAULT_LOCATION_COUNT,
          }))
        : manualMode && state.manualDayPlan
          ? state.manualDayPlan.days.map((day) => ({
              name: day.customName?.trim() || day.name,
              order_index: day.order_index,
              locationCount: day.locationCount,
              ...(blueprintMode
                ? {}
                : {
                    activities: day.activities
                      .filter((activity) => activity.selected)
                      .map((activity) => ({
                        name: activity.name,
                        durationMinutes: activity.durationMinutes,
                      })),
                  }),
            }))
          : undefined;

      const response = await servicePackagesApi.createFromTemplate(state.selectedEventType.id, {
        packageName: state.packageName,
        selectedDayIds: blueprintMode || manualMode ? [] : Array.from(state.selectedDayIds),
        selectedActivities: blueprintMode || manualMode ? [] : selectedActivities,
        customActivities: blueprintMode || manualMode ? [] : customActivitiesData,
        selectedMomentIds: blueprintMode || manualMode ? [] : Array.from(state.selectedMomentIds),
        momentKeyOverrides: blueprintMode || manualMode ? [] : momentKeyOverridesData,
        selectedRoleIds: Array.from(state.selectedRoleIds),
        standardGuestCount: PACKAGE_PLANNING_GUEST_COUNT,
        locationCount: effectiveLocationCount,
        roleSlots: state.roleSlots.map((s) => ({ jobRoleId: s.jobRoleId, quantity: s.quantity })),
        crewAssignments: crewAssignmentsData,
        equipmentSlots: equipmentSlotsData,
        sourceDayBlueprintVersionId: sourceDayBlueprintVersionId ?? undefined,
        selectedDayBlueprintActivityIds: blueprintMode
          ? selectedDayBlueprintActivityIds
          : undefined,
        scaffoldPackageDays,
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
    toggleBlueprintActivity,
    selectAllBlueprintActivities,
    deselectAllBlueprintActivities,
    resetDayDesignSource,
    toggleRole,
    toggleExpandPreset,
    toggleExpandReviewPreset,
    addRoleSlot,
    removeRoleSlot,
    getPositionCrewId,
    assignCrewToPosition,
    setPositionEquipmentAt,
    getPositionEquipmentSlots,
    addPositionEquipmentSlot,
    removePositionEquipmentSlot,
    clearPositionEquipment,
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
