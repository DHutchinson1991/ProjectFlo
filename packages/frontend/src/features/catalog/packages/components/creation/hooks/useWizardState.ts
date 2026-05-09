import { useState } from 'react';
import type {
  EventTypeForWizard, CustomActivity, CrewAssignment, CameraAudioSlot, RoleSlot,
} from '../types/wizard.types';
import { DEFAULT_CAMERA_SLOT, STANDARD_GUEST_OPTIONS, WIZARD_STEPS } from '../helpers/wizard-helpers';

export function useWizardState() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEventType, setSelectedEventType] = useState<EventTypeForWizard | null>(null);
  const [autoSelectAttempted, setAutoSelectAttempted] = useState(false);
  const [selectedDayIds, setSelectedDayIds] = useState<Set<number>>(new Set());
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<number>>(new Set());
  const [selectedMomentIds, setSelectedMomentIds] = useState<Set<number>>(new Set());
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [standardGuestCount, setStandardGuestCount] = useState<number>(STANDARD_GUEST_OPTIONS[1]);
  const [locationCount, setLocationCount] = useState(3);
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

  const [cameraSlots, setCameraSlots] = useState<CameraAudioSlot[]>([{ ...DEFAULT_CAMERA_SLOT }]);
  const [audioSlots, setAudioSlots] = useState<CameraAudioSlot[]>([]);

  // Day Designer: optional published DayBlueprintVersion to consume after build.
  const [sourceDayBlueprintVersionId, setSourceDayBlueprintVersionId] = useState<number | null>(null);

  const resetState = () => {
    setActiveStep(0);
    setSelectedEventType(null);
    setAutoSelectAttempted(false);
    setSelectedDayIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedMomentIds(new Set());
    setSelectedRoleIds(new Set());
    setStandardGuestCount(STANDARD_GUEST_OPTIONS[1]);
    setCustomActivities([]);
    setExpandedPresets(new Set());
    setExpandedReviewPresets(new Set());
    setPresetTimeOverrides({});
    setPresetDurationOverrides({});
    setMomentKeyOverrides({});
    setRoleSlots([]);
    setCrewAssignments([]);
    setCameraSlots([{ ...DEFAULT_CAMERA_SLOT }]);
    setAudioSlots([]);
    setLocationCount(3);
    setPackageName('');
    setSourceDayBlueprintVersionId(null);
    setIsCreating(false);
    setError(null);
  };

  const canAdvance = (() => {
    switch (activeStep) {
      case 0: return false;
      case 1: return sourceDayBlueprintVersionId !== null;
      case 2: return sourceDayBlueprintVersionId !== null || selectedPresetIds.size > 0 || customActivities.length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      case 8: return packageName.trim().length > 0;
      default: return false;
    }
  })();

  const canCreate = activeStep === 9 && packageName.trim().length > 0 && !isCreating;

  return {
    activeStep, setActiveStep,
    selectedEventType, setSelectedEventType,
    autoSelectAttempted, setAutoSelectAttempted,
    selectedDayIds, setSelectedDayIds,
    selectedPresetIds, setSelectedPresetIds,
    selectedMomentIds, setSelectedMomentIds,
    selectedRoleIds, setSelectedRoleIds,
    standardGuestCount, setStandardGuestCount,
    locationCount, setLocationCount,
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
    cameraSlots, setCameraSlots,
    audioSlots, setAudioSlots,
    sourceDayBlueprintVersionId, setSourceDayBlueprintVersionId,
    steps: WIZARD_STEPS,
    canAdvance,
    canCreate,
    resetState,
  };
}

export type WizardState = ReturnType<typeof useWizardState>;
