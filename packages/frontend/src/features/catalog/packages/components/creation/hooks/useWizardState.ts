import { useState } from 'react';
import type {
  EventTypeForWizard, CustomActivity, CrewAssignment, CameraAudioSlot, RoleSlot,
} from '../types/wizard.types';
import { DEFAULT_CAMERA_SLOT, WIZARD_STEPS, WIZARD_STEP_INDEX } from '../helpers/wizard-helpers';
import { isManualDayPlanComplete, type ManualDayPlan } from '../helpers/manual-day-plan';
import { clampLocationCount } from '../helpers/location-helpers';

export type DayDesignSource = 'blueprint' | 'manual' | null;
export type DayDesignPath = 'library' | 'create' | 'generate' | null;

export function useWizardState() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEventType, setSelectedEventType] = useState<EventTypeForWizard | null>(null);
  const [autoSelectAttempted, setAutoSelectAttempted] = useState(false);
  const [selectedDayIds, setSelectedDayIds] = useState<Set<number>>(new Set());
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<number>>(new Set());
  const [selectedMomentIds, setSelectedMomentIds] = useState<Set<number>>(new Set());
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [locationCount, setLocationCount] = useState(3);
  /** Per blueprint day (DayBlueprintDay.id) location slot count. */
  const [locationCountByBlueprintDayId, setLocationCountByBlueprintDayId] = useState<Record<number, number>>({});
  /** Blueprint day metadata for create payload (name + order). */
  const [blueprintScaffoldDays, setBlueprintScaffoldDays] = useState<
    Array<{ id: number; name: string; order_index: number }>
  >([]);
  const [packageName, setPackageName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPackageId, setCreatedPackageId] = useState<number | null>(null);

  const [expandedPresets, setExpandedPresets] = useState<Set<number>>(new Set());
  const [expandedReviewPresets, setExpandedReviewPresets] = useState<Set<number>>(new Set());

  const [presetTimeOverrides, setPresetTimeOverrides] = useState<Record<number, string>>({});
  const [presetDurationOverrides, setPresetDurationOverrides] = useState<Record<number, number>>({});
  const [momentKeyOverrides, setMomentKeyOverrides] = useState<Record<number, boolean>>({});

  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [addingActivityForDay, setAddingActivityForDay] = useState<number | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [addingMomentForActivity, setAddingMomentForActivity] = useState<string | null>(null);
  const [newMomentName, setNewMomentName] = useState('');

  const [crewAssignments, setCrewAssignments] = useState<CrewAssignment[]>([]);
  const [roleSlots, setRoleSlots] = useState<RoleSlot[]>([]);
  /** Per-position equipment slots for camera/audio roles, keyed `${jobRoleId}:${posIndex}`. */
  const [positionEquipment, setPositionEquipment] = useState<Record<string, (number | null)[]>>({});

  const [cameraSlots, setCameraSlots] = useState<CameraAudioSlot[]>([{ ...DEFAULT_CAMERA_SLOT }]);
  const [audioSlots, setAudioSlots] = useState<CameraAudioSlot[]>([]);

  // Day Designer: optional published DayBlueprintVersion to consume after build.
  const [sourceDayBlueprintVersionId, setSourceDayBlueprintVersionId] = useState<number | null>(null);
  const [sourceDayBlueprintId, setSourceDayBlueprintId] = useState<number | null>(null);
  const [selectedBlueprintActivityIds, setSelectedBlueprintActivityIds] = useState<Set<number>>(new Set());
  /** DayBlueprintDay.id → PackageTemplateDay.id (wizard "Match days"). */
  const [blueprintDayMappings, setBlueprintDayMappings] = useState<Record<number, number>>({});
  const [blueprintDayCount, setBlueprintDayCount] = useState(0);
  const [isDayDesignRunning, setIsDayDesignRunning] = useState(false);
  /**
   * Day design flow: picker → path screen (library / create / generate) → review.
   * `dayDesignPath` null = picker only; set when user picks Library, Create, or Generate.
   */
  const [dayDesignPath, setDayDesignPath] = useState<DayDesignPath>(null);
  /** 'review' shows blueprint activity selection after library/generate completes. */
  const [dayDesignPhase, setDayDesignPhase] = useState<'source' | 'review'>('source');
  /** Committed day-design path: library/generate → blueprint; create → manual scaffold. */
  const [dayDesignSource, setDayDesignSource] = useState<DayDesignSource>(null);
  const [manualDayPlan, setManualDayPlan] = useState<ManualDayPlan | null>(null);

  const resetState = () => {
    setActiveStep(0);
    setSelectedEventType(null);
    setAutoSelectAttempted(false);
    setSelectedDayIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedMomentIds(new Set());
    setSelectedRoleIds(new Set());
    setCustomActivities([]);
    setExpandedPresets(new Set());
    setExpandedReviewPresets(new Set());
    setPresetTimeOverrides({});
    setPresetDurationOverrides({});
    setMomentKeyOverrides({});
    setRoleSlots([]);
    setCrewAssignments([]);
    setPositionEquipment({});
    setCameraSlots([{ ...DEFAULT_CAMERA_SLOT }]);
    setAudioSlots([]);
    setLocationCount(3);
    setLocationCountByBlueprintDayId({});
    setBlueprintScaffoldDays([]);
    setPackageName('');
    setSourceDayBlueprintVersionId(null);
    setSourceDayBlueprintId(null);
    setSelectedBlueprintActivityIds(new Set());
    setDayDesignSource(null);
    setManualDayPlan(null);
    setBlueprintDayMappings({});
    setBlueprintDayCount(0);
    setIsDayDesignRunning(false);
    setDayDesignPath(null);
    setDayDesignPhase('source');
    setIsCreating(false);
    setError(null);
  };

  const canAdvance = (() => {
    switch (activeStep) {
      // Screen 1 — Event: just need a chosen event type.
      case WIZARD_STEP_INDEX.EVENT:
        return selectedEventType !== null;
      // Screen 2 — Day design: only advanceable once a source is committed (review
      // phase). Then apply the Concept C rules: blueprint activity subset / day
      // mapping, or preset activities for the Create path.
      case WIZARD_STEP_INDEX.DAY_DESIGN:
        if (selectedEventType === null || isDayDesignRunning) return false;
        if (dayDesignPath === null && dayDesignPhase === 'source') return false;
        if (sourceDayBlueprintVersionId !== null) {
          if (dayDesignPhase !== 'review') return false;
          return selectedBlueprintActivityIds.size > 0;
        }
        if (dayDesignSource === 'manual' && dayDesignPath === 'create') {
          return isManualDayPlanComplete(manualDayPlan);
        }
        return false;
      // Screen 3 — Crew & equipment: always advanceable (smart defaults applied).
      case WIZARD_STEP_INDEX.TEAM:
        return true;
      default:
        return false;
    }
  })();

  const canCreate =
    activeStep === WIZARD_STEP_INDEX.REVIEW && packageName.trim().length > 0 && !isCreating;

  const setLocationCountForBlueprintDay = (blueprintDayId: number, count: number) => {
    setLocationCountByBlueprintDayId((prev) => ({
      ...prev,
      [blueprintDayId]: clampLocationCount(count),
    }));
  };

  return {
    activeStep, setActiveStep,
    selectedEventType, setSelectedEventType,
    autoSelectAttempted, setAutoSelectAttempted,
    selectedDayIds, setSelectedDayIds,
    selectedPresetIds, setSelectedPresetIds,
    selectedMomentIds, setSelectedMomentIds,
    selectedRoleIds, setSelectedRoleIds,
    locationCount, setLocationCount,
    locationCountByBlueprintDayId, setLocationCountByBlueprintDayId,
    blueprintScaffoldDays, setBlueprintScaffoldDays,
    setLocationCountForBlueprintDay,
    packageName, setPackageName,
    isCreating, setIsCreating,
    error, setError,
    createdPackageId, setCreatedPackageId,
    expandedPresets, setExpandedPresets,
    expandedReviewPresets, setExpandedReviewPresets,
    presetTimeOverrides, setPresetTimeOverrides,
    presetDurationOverrides, setPresetDurationOverrides,
    momentKeyOverrides, setMomentKeyOverrides,
    customActivities, setCustomActivities,
    addingActivityForDay, setAddingActivityForDay,
    newActivityName, setNewActivityName,
    addingMomentForActivity, setAddingMomentForActivity,
    newMomentName, setNewMomentName,
    crewAssignments, setCrewAssignments,
    roleSlots, setRoleSlots,
    positionEquipment, setPositionEquipment,
    cameraSlots, setCameraSlots,
    audioSlots, setAudioSlots,
    sourceDayBlueprintVersionId, setSourceDayBlueprintVersionId,
    sourceDayBlueprintId, setSourceDayBlueprintId,
    selectedBlueprintActivityIds, setSelectedBlueprintActivityIds,
    blueprintDayMappings, setBlueprintDayMappings,
    blueprintDayCount, setBlueprintDayCount,
    isDayDesignRunning, setIsDayDesignRunning,
    dayDesignPath, setDayDesignPath,
    dayDesignPhase, setDayDesignPhase,
    dayDesignSource, setDayDesignSource,
    manualDayPlan, setManualDayPlan,
    steps: WIZARD_STEPS,
    canAdvance,
    canCreate,
    resetState,
  };
}

export type WizardState = ReturnType<typeof useWizardState>;
