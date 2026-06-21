'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import CropFreeRoundedIcon from '@mui/icons-material/CropFreeRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import { SpaceSlotOverlay } from '@/features/workflow/locations/components/floor-plan/components/Panels/SpaceSlotOverlay';
import type {
  FloorPlanObjectType,
  PackageSpaceSlot,
  SpaceSlotObject,
  SpaceSlotZone,
} from '@/features/workflow/locations/types/floor-plan.types';
import type {
  DayBlueprintActivity,
  DayBlueprintDay,
  DayBlueprintMoment,
  DayBlueprintMomentAction,
  DayBlueprintMomentPlacement,
  DayBlueprintSpaceSlot,
  DayBlueprintSubjectRoleLink,
} from '../types';
import {
  computeCeremonyGuestSeatCapacity,
  effectiveCeremonyTypicalCount,
} from '@projectflo/shared';
import {
  assignCeremonySyntheticSeats,
  CeremonySeatLayoutMode,
  findNearestChairSeatMeta,
  parsePlacementSeatToken,
  resolveChairSeatCoordinates,
  type CeremonyRoleInstanceInput,
  type CeremonySeatAssignmentResult,
} from '../utils/ceremony-seat-layout';
import {
  buildCeremonyMotionTextForRole,
  ceremonyHardExemptFromSeating,
  shouldSkipCeremonySeatSnap,
} from '../utils/ceremony-motion-exempt';
import {
  buildSandboxRoomLayout,
  coordinatesFromBlueprintPlacement,
  deriveSandboxAnchors,
  isPreCeremonyFloorActivity,
  resolveSandboxSpaceKind,
  resolveSpatialCollisions,
  type FloorPlanSceneViewModel,
  type SandboxSpaceKind,
} from '@projectflo/shared';
import { sceneToPackageSpaceSlot } from '@/features/workflow/locations/utils/floor-plan-scene';
import {
  useCreateMomentPlacement,
  useDeleteMomentAction,
  useDeleteMomentPlacement,
  useUpdateMoment,
  useUpdateMomentPlacement,
} from '../hooks';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;
const SEAT_SNAP_MAX_DISTANCE = 24;

interface DayBlueprintFloorPlanTabProps {
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  slots: DayBlueprintSpaceSlot[];
  subjectRoles: DayBlueprintSubjectRoleLink[];
  activeDay: DayBlueprintDay | null;
  selectedActivity: DayBlueprintActivity | null;
  selectedMoment: DayBlueprintMoment | null;
  hoveredMomentRoleId: number | null;
  onHoverMomentRole: (roleId: number | null) => void;
  /**
   * Live per-subject AI spatial generation status. `'generating'` triggers a
   * pulsing ring + spinner overlay on the avatar; `'done'` triggers a one-shot
   * glow flash via the `roleId -> done timestamp` map below.
   */
  subjectSpatialStatus?: Map<number, 'generating' | 'done'>;
  blankAuthoring?: boolean;
  selectedSubjectRoleId?: number | null;
  onSelectSubjectRole?: (roleId: number | null) => void;
}

const spatialPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(167,139,250,0.65); }
  70% { box-shadow: 0 0 0 8px rgba(167,139,250,0); }
  100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
`;

const spatialFlash = keyframes`
  0% { box-shadow: 0 0 14px 2px rgba(34,197,94,0.65); border-color: rgba(34,197,94,0.95); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); border-color: rgba(96,165,250,0.42); }
`;

const SPACE_KIND_LABEL: Record<string, string> = {
  ceremony: 'Ceremony',
  reception: 'Reception',
  prep: 'Prep',
  portraits: 'Portraits',
  cocktail: 'Cocktail',
};

const SPACE_KIND_COLOR: Record<string, string> = {
  ceremony: 'rgba(96,165,250,0.14)',
  reception: 'rgba(168,85,247,0.14)',
  prep: 'rgba(244,114,182,0.14)',
  portraits: 'rgba(52,211,153,0.14)',
  cocktail: 'rgba(251,191,36,0.14)',
};

const SPACE_KIND_TEXT: Record<string, string> = {
  ceremony: '#93c5fd',
  reception: '#c4b5fd',
  prep: '#f9a8d4',
  portraits: '#6ee7b7',
  cocktail: '#fde68a',
};

const SPACE_KIND_BORDER: Record<string, string> = {
  ceremony: 'rgba(96,165,250,0.22)',
  reception: 'rgba(168,85,247,0.22)',
  prep: 'rgba(244,114,182,0.22)',
  portraits: 'rgba(52,211,153,0.22)',
  cocktail: 'rgba(251,191,36,0.22)',
};

export function DayBlueprintFloorPlanTab({
  blueprintId,
  versionId,
  readOnly,
  slots,
  subjectRoles,
  activeDay,
  selectedActivity,
  selectedMoment,
  hoveredMomentRoleId: _hoveredMomentRoleId,
  onHoverMomentRole,
  subjectSpatialStatus,
  blankAuthoring = false,
  selectedSubjectRoleId = null,
  onSelectSubjectRole,
}: DayBlueprintFloorPlanTabProps) {
  const createMomentPlacement = useCreateMomentPlacement(blueprintId, versionId);
  const deleteMomentPlacement = useDeleteMomentPlacement(blueprintId, versionId);
  const deleteMomentAction = useDeleteMomentAction(blueprintId, versionId);
  const updateMoment = useUpdateMoment(blueprintId, versionId);
  const updateMomentPlacement = useUpdateMomentPlacement(blueprintId, versionId);
  // Track when each role most recently flipped to 'done' so we can fire the
  // one-shot glow flash for ~1s without re-flashing on every re-render.
  const [doneFlashAt, setDoneFlashAt] = useState<Record<number, number>>({});
  const prevStatusRef = useRef<Map<number, 'generating' | 'done'>>(new Map());
  useEffect(() => {
    if (!subjectSpatialStatus) return;
    const prev = prevStatusRef.current;
    const newlyDone: number[] = [];
    subjectSpatialStatus.forEach((status, roleId) => {
      if (status === 'done' && prev.get(roleId) !== 'done') newlyDone.push(roleId);
    });
    prevStatusRef.current = new Map(subjectSpatialStatus);
    if (newlyDone.length === 0) return;
    const now = Date.now();
    setDoneFlashAt((prevMap) => {
      const next = { ...prevMap };
      for (const id of newlyDone) next[id] = now;
      return next;
    });
    const id = window.setTimeout(() => {
      setDoneFlashAt((prevMap) => {
        const next = { ...prevMap };
        for (const roleId of newlyDone) {
          if (next[roleId] === now) delete next[roleId];
        }
        return next;
      });
    }, 1100);
    return () => window.clearTimeout(id);
  }, [subjectSpatialStatus]);
  const { ref: stageRef, width: stageWidth, height: stageHeight } = useMeasuredElementSize<HTMLDivElement>();
  const activeActivity = selectedActivity ?? activeDay?.activities?.[0] ?? null;
  /** Prefer the activity that owns `selectedMoment` so pew assignment matches the open moment when the day has many activities. */
  const assignmentActivity = useMemo(() => {
    if (!selectedMoment) return activeActivity;
    const fromMoment = activeDay?.activities?.find((a) => a.id === selectedMoment.activity_id);
    return selectedActivity ?? fromMoment ?? activeDay?.activities?.[0] ?? activeActivity;
  }, [activeActivity, activeDay?.activities, selectedActivity, selectedMoment]);
  const planSize = Math.max(260, Math.floor(Math.min(stageWidth - 32, stageHeight - 92, 720)));

  const [isPanModeCanvas, setIsPanModeCanvas] = useState(false);
  const fitToViewRef = useRef<(() => void) | null>(null);
  const togglePanModeRef = useRef<(() => void) | null>(null);
  const handleControlsReady = useCallback(
    (controls: { fitToView: () => void; isZoomed: boolean; isPanMode: boolean; togglePanMode: () => void }) => {
      fitToViewRef.current = controls.fitToView;
      togglePanModeRef.current = controls.togglePanMode;
      setIsPanModeCanvas(controls.isPanMode);
    },
    [],
  );

  const relevantSlots = useMemo(() => {
    const placementSlotIds = new Set(
      (selectedMoment?.placements ?? []).map((placement) => placement.day_blueprint_space_slot_id),
    );
    if (placementSlotIds.size > 0) {
      return slots.filter((slot) => placementSlotIds.has(slot.id));
    }

    if (activeActivity) {
      const activityLocationRoleIds = new Set(
        (activeActivity.activity_locations ?? []).map((location) => location.day_blueprint_location_role_id),
      );
      const locationRoleSlots = activityLocationRoleIds.size > 0
        ? slots.filter((slot) => activityLocationRoleIds.has(slot.day_blueprint_location_role_id))
        : [];
      const activityOwnedSlots = locationRoleSlots.filter((slot) => spaceSlotMatchesActivity(slot, activeActivity));
      if (activityOwnedSlots.length > 0) return activityOwnedSlots;

      const genericSandboxSlot = locationRoleSlots.find((slot) => isGenericSandboxSlot(slot));
      if (genericSandboxSlot) return [genericSandboxSlot];
    }

    const activityLocationRoleIds = new Set(
      (activeActivity?.activity_locations ?? []).map((location) => location.day_blueprint_location_role_id),
    );
    if (activityLocationRoleIds.size > 0) {
      const activitySlots = slots.filter((slot) => activityLocationRoleIds.has(slot.day_blueprint_location_role_id));
      return activitySlots.length > 0 ? activitySlots : slots;
    }

    return slots;
  }, [activeActivity, selectedMoment, slots]);

  const activeSlot = relevantSlots[0] ?? slots[0] ?? null;
  const activeSlotLabel = activeSlot ? displaySlotLabel(activeSlot, activeActivity) : null;
  const spaceKind = resolveSpaceKind(activeSlot, activeActivity, activeSlotLabel);

  const roleById = useMemo(() => {
    const map = new Map<number, DayBlueprintSubjectRoleLink>();
    subjectRoles.forEach((link) => map.set(link.subject_role_id, link));
    return map;
  }, [subjectRoles]);

  const placementsForActiveSlot = useMemo(() => {
    if (!activeSlot || !selectedMoment) return [];
    return (selectedMoment.placements ?? []).filter(
      (placement) => placement.day_blueprint_space_slot_id === activeSlot.id,
    );
  }, [activeSlot, selectedMoment]);

  const activityPlacedRoleIdsForActiveSlot = useMemo(() => {
    if (!activeSlot || !activeActivity) return [] as number[];
    const ids = new Set<number>();
    (activeActivity.moments ?? []).forEach((moment) => {
      (moment.placements ?? []).forEach((placement) => {
        if (placement.day_blueprint_space_slot_id === activeSlot.id) {
          ids.add(placement.subject_role_id);
        }
      });
    });
    return Array.from(ids);
  }, [activeActivity, activeSlot]);

  const linkedRoleIds = useMemo(() => {
    if (selectedMoment) {
      const ids = new Set<number>();
      (selectedMoment.actions ?? []).forEach((action) => ids.add(action.subject_role_id));
      (selectedMoment.placements ?? []).forEach((placement) => ids.add(placement.subject_role_id));
      return Array.from(ids);
    }

    if (activeActivity) {
      return activityPlacedRoleIdsForActiveSlot;
    }

    return subjectRoles.map((link) => link.subject_role_id);
  }, [selectedMoment, activeActivity, activityPlacedRoleIdsForActiveSlot, subjectRoles]);

  const placedRoleIdsForActiveSlot = useMemo(() => {
    return Array.from(new Set(placementsForActiveSlot.map((placement) => placement.subject_role_id)));
  }, [placementsForActiveSlot]);
  const excludedRoleIds = useMemo(
    () => readExcludedSubjectRoleIds(selectedMoment?.lock_flags),
    [selectedMoment?.lock_flags],
  );

  const ceremonyPhaseContext = useMemo(() => {
    const moments = assignmentActivity?.moments ?? [];
    const currentMomentIndex = selectedMoment
      ? moments.findIndex((moment) => moment.id === selectedMoment.id)
      : -1;
    const guestsArrivingIndex = moments.findIndex((moment) =>
      /\b(guest|guests)\b.*\b(arriv|arrival|seated|seating)\b/.test(normalizeValue(moment.name)),
    );
    const weddingPartyProcessionalIndex = moments.findIndex((moment) =>
      /\b(wedding party|bridal party)\b.*\bprocessional\b/.test(normalizeValue(moment.name)),
    );
    const hasReachedGuestsArriving = guestsArrivingIndex < 0 || (currentMomentIndex >= 0 && currentMomentIndex >= guestsArrivingIndex);
    const hasReachedWeddingPartyProcessional =
      weddingPartyProcessionalIndex < 0 || (currentMomentIndex >= 0 && currentMomentIndex >= weddingPartyProcessionalIndex);
    return {
      currentMomentIndex,
      guestsArrivingIndex,
      weddingPartyProcessionalIndex,
      hasReachedGuestsArriving,
      hasReachedWeddingPartyProcessional,
    };
  }, [assignmentActivity, selectedMoment]);

  /**
   * Ceremony floor: keep everyone who was ever placed on this slot across the activity
   * visible while stepping moments (guests stay in pews during prelude, etc.).
   * Still union current-moment action roles so new actors appear.
   */
  const ceremonyFloorRoleIds = useMemo(() => {
    if (!selectedMoment || !assignmentActivity || !activeSlot) return null;

    const sortRoleIdsByBlueprintOrder = (ids: Set<number>) => {
      const order = new Map(subjectRoles.map((link) => [link.subject_role_id, link.order_index ?? 0]));
      return Array.from(ids).sort((a, b) => {
        const oa = order.get(a) ?? 0;
        const ob = order.get(b) ?? 0;
        if (oa !== ob) return oa - ob;
        return a - b;
      });
    };

    if (isPreCeremonyFloorActivity(assignmentActivity)) {
      const ids = new Set<number>();
      (selectedMoment.actions ?? []).forEach((action) => ids.add(action.subject_role_id));
      (selectedMoment.placements ?? []).forEach((placement) => {
        if (placement.day_blueprint_space_slot_id === activeSlot.id) {
          ids.add(placement.subject_role_id);
        }
      });
      return sortRoleIdsByBlueprintOrder(ids);
    }

    const ids = new Set<number>();
    const momentsSorted = [...(assignmentActivity.moments ?? [])].sort(
      (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
    );
    const currentOrder = selectedMoment.order_index ?? 0;

    if (blankAuthoring) {
      for (const moment of momentsSorted) {
        if ((moment.order_index ?? 0) > currentOrder) continue;
        (moment.placements ?? []).forEach((placement) => {
          if (placement.day_blueprint_space_slot_id === activeSlot.id) {
            ids.add(placement.subject_role_id);
          }
        });
      }
    } else {
      (assignmentActivity.moments ?? []).forEach((moment) => {
        (moment.placements ?? []).forEach((placement) => {
          if (placement.day_blueprint_space_slot_id === activeSlot.id) {
            ids.add(placement.subject_role_id);
          }
        });
      });
    }
    (selectedMoment.actions ?? []).forEach((action) => ids.add(action.subject_role_id));
    if (!blankAuthoring) {
      subjectRoles.forEach((link) => {
        const label = normalizeValue(subjectRoleLabel(link));
        if (/\b(bride|groom|maid|matron|bridesmaid|bridesmaids|best man|groomsman|groomsmen|flower|ring bearer|officiant|father|mother|parent|guests?)\b/.test(label)) {
          if (excludedRoleIds.has(link.subject_role_id)) {
            return;
          }
          if (isGroomPartyCeremonyRole(label) && !ceremonyPhaseContext.hasReachedGuestsArriving) {
            return;
          }
          if (isBridePartyCeremonyRole(label) && !ceremonyPhaseContext.hasReachedWeddingPartyProcessional) {
            return;
          }
          ids.add(link.subject_role_id);
        }
      });
    }
    return sortRoleIdsByBlueprintOrder(ids);
  }, [
    selectedMoment,
    assignmentActivity,
    activeSlot,
    ceremonyPhaseContext,
    excludedRoleIds,
    subjectRoles,
    blankAuthoring,
  ]);

  /**
   * Full role set for `assignCeremonySyntheticSeats` / placement note fill. Unlike
   * `ceremonyFloorRoleIds` (blank authoring narrows *who is drawn*), this always unions
   * ceremony-relevant subject roles so pew keys exist for roles not yet placed on a prior moment.
   */
  const ceremonySeatAssignmentRoleIds = useMemo(() => {
    if (!selectedMoment || !activeSlot) return null;

    const sortRoleIdsByBlueprintOrder = (roleIds: Set<number>) => {
      const order = new Map(subjectRoles.map((link) => [link.subject_role_id, link.order_index ?? 0]));
      return Array.from(roleIds).sort((a, b) => {
        const oa = order.get(a) ?? 0;
        const ob = order.get(b) ?? 0;
        if (oa !== ob) return oa - ob;
        return a - b;
      });
    };

    if (assignmentActivity && isPreCeremonyFloorActivity(assignmentActivity)) {
      const ids = new Set<number>();
      (selectedMoment.actions ?? []).forEach((action) => ids.add(action.subject_role_id));
      (selectedMoment.placements ?? []).forEach((placement) => {
        if (placement.day_blueprint_space_slot_id === activeSlot.id) {
          ids.add(placement.subject_role_id);
        }
      });
      return sortRoleIdsByBlueprintOrder(ids);
    }

    const ids = new Set<number>();
    const act = assignmentActivity;
    if (act) {
      (act.moments ?? []).forEach((moment) => {
        (moment.placements ?? []).forEach((placement) => {
          if (placement.day_blueprint_space_slot_id === activeSlot.id) {
            ids.add(placement.subject_role_id);
          }
        });
      });
    } else {
      (selectedMoment.placements ?? []).forEach((placement) => {
        if (placement.day_blueprint_space_slot_id === activeSlot.id) {
          ids.add(placement.subject_role_id);
        }
      });
    }
    (selectedMoment.actions ?? []).forEach((action) => ids.add(action.subject_role_id));
    subjectRoles.forEach((link) => {
      const label = normalizeValue(subjectRoleLabel(link));
      if (/\b(bride|groom|maid|matron|bridesmaid|bridesmaids|best man|groomsman|groomsmen|flower|ring bearer|officiant|father|mother|parent|guests?)\b/.test(label)) {
        if (excludedRoleIds.has(link.subject_role_id)) {
          return;
        }
        if (isGroomPartyCeremonyRole(label) && !ceremonyPhaseContext.hasReachedGuestsArriving) {
          return;
        }
        if (isBridePartyCeremonyRole(label) && !ceremonyPhaseContext.hasReachedWeddingPartyProcessional) {
          return;
        }
        ids.add(link.subject_role_id);
      }
    });
    return sortRoleIdsByBlueprintOrder(ids);
  }, [
    activeSlot,
    assignmentActivity,
    ceremonyPhaseContext,
    excludedRoleIds,
    selectedMoment,
    subjectRoles,
  ]);

  const syntheticFloorPayload = useMemo(() => {
    if (!activeSlot) return null;

    const actionByRoleId = new Map<number, DayBlueprintMomentAction>();
    (selectedMoment?.actions ?? []).forEach((action) => actionByRoleId.set(action.subject_role_id, action));

    const placementByRoleId = new Map<number, DayBlueprintMomentPlacement>();
    placementsForActiveSlot.forEach((placement) => placementByRoleId.set(placement.subject_role_id, placement));

    const roleIds =
      selectedMoment && spaceKind === 'ceremony' && ceremonyFloorRoleIds
        ? ceremonyFloorRoleIds
        : selectedMoment
          ? placedRoleIdsForActiveSlot
          : linkedRoleIds;

    const assignmentRoleIds =
      selectedMoment && spaceKind === 'ceremony' && ceremonySeatAssignmentRoleIds
        ? ceremonySeatAssignmentRoleIds
        : roleIds;

    const { objects, zones: sandboxZones } = buildSandboxSlotGeometry(
      activeSlot.id,
      spaceKind,
      activeSlotLabel ?? activeSlot.label,
    );
    const anchors = deriveSandboxAnchors(objects);
    const useCeremonySeatSnap =
      spaceKind === 'ceremony' && objects.some((object) => object.object_type === 'CHAIR_ROW');
    const guestSeatCapacity = useCeremonySeatSnap
      ? computeCeremonyGuestSeatCapacity(objects, CeremonySeatLayoutMode.FLUID)
      : 0;
    const copyCountForRole = (roleLink: DayBlueprintSubjectRoleLink, roleLabel: string) => {
      if (guestSeatCapacity > 0) {
        return effectiveCeremonyTypicalCount(roleLabel, roleLink.typical_count, guestSeatCapacity);
      }
      return Math.max(roleLink.typical_count ?? 1, 1);
    };

    const roleInstances = roleIds.flatMap((roleId) => {
      const roleLink = roleById.get(roleId);
      if (!roleLink) return [] as Array<{ roleId: number; roleLink: DayBlueprintSubjectRoleLink; copyIndex: number; copyCount: number }>;
      const roleLabel = subjectRoleLabel(roleLink);
      const copyCount = copyCountForRole(roleLink, roleLabel);
      return Array.from({ length: copyCount }, (_, copyIndex) => ({ roleId, roleLink, copyIndex, copyCount }));
    });

    const roleInstancesForAssignment = assignmentRoleIds.flatMap((roleId) => {
      const roleLink = roleById.get(roleId);
      if (!roleLink) return [] as Array<{ roleId: number; roleLink: DayBlueprintSubjectRoleLink; copyIndex: number; copyCount: number }>;
      const roleLabel = subjectRoleLabel(roleLink);
      const copyCount = copyCountForRole(roleLink, roleLabel);
      return Array.from({ length: copyCount }, (_, copyIndex) => ({ roleId, roleLink, copyIndex, copyCount }));
    });

    const ceremonySeatInputs: CeremonyRoleInstanceInput[] = roleInstancesForAssignment.map((instance) => {
      const roleLabel = subjectRoleLabel(instance.roleLink);
      const normalizedRoleLabel = normalizeValue(roleLabel);
      const action = actionByRoleId.get(instance.roleId);
      const placement = placementByRoleId.get(instance.roleId);
      const motionText = buildCeremonyMotionTextForRole({
        actionText: action?.action_text,
        actionNotes: action?.notes,
        placementPositionHint: placement?.position_hint,
        placementNotes: placement?.notes,
        momentName: selectedMoment?.name,
      });
      const inactiveProcessionalParty =
        spaceKind === 'ceremony' &&
        Boolean(selectedMoment) &&
        isCeremonyPartyRoleLabel(normalizedRoleLabel) &&
        !action &&
        !placement;
      const skipSeatSnap = shouldSkipCeremonySeatSnap(roleLabel, motionText);
      return {
        roleId: instance.roleId,
        copyIndex: instance.copyIndex,
        copyCount: instance.copyCount,
        roleLink: instance.roleLink,
        roleLabel,
        skipSeatSnap,
      };
    });
    const seatInputSkipByInstanceKey = new Map(
      ceremonySeatInputs.map((entry) => [`${entry.roleId}:${entry.copyIndex}`, entry.skipSeatSnap] as const),
    );

    const ceremonySeatResult = useCeremonySeatSnap
      ? assignCeremonySyntheticSeats(objects, ceremonySeatInputs, {
          seatLayout: CeremonySeatLayoutMode.FLUID,
        })
      : null;
    const positionedSubjects = roleInstances
      .map((instance, index) => {
        const placement = placementByRoleId.get(instance.roleId);
        const action = actionByRoleId.get(instance.roleId);
        const roleLabel = subjectRoleLabel(instance.roleLink);
        const normalizedRole = normalizeValue(roleLabel);
        const seatKey = `${instance.roleId}:${instance.copyIndex}` as `${number}:${number}`;
        const seatInputSkip = seatInputSkipByInstanceKey.get(seatKey) ?? false;
        const motionText = buildCeremonyMotionTextForRole({
          actionText: action?.action_text,
          actionNotes: action?.notes,
          placementPositionHint: placement?.position_hint,
          placementNotes: placement?.notes,
          momentName: selectedMoment?.name,
        });
        const derivedSkipSeatSnap = shouldSkipCeremonySeatSnap(roleLabel, motionText);
        const skipSeatSnap = seatInputSkipByInstanceKey.has(seatKey)
          ? seatInputSkip
          : derivedSkipSeatSnap;
        const placementResolveOptions = {
          motionText,
          momentName: selectedMoment?.name ?? null,
          anchors,
        };
        const inactiveProcessionalParty =
          spaceKind === 'ceremony' &&
          Boolean(selectedMoment) &&
          isCeremonyPartyRoleLabel(normalizedRole) &&
          !action &&
          !placement;
        if (selectedMoment && !placement) {
          const allowCeremonySeatWithoutMomentPlacement =
            spaceKind === 'ceremony' && useCeremonySeatSnap && ceremonySeatResult && !skipSeatSnap;
          const allowCeremonyAnchorWithoutMomentPlacement =
            spaceKind === 'ceremony' &&
            skipSeatSnap &&
            (isCeremonyOfficiantRole(normalizedRole) || normalizedRole === 'groom');
          if (!allowCeremonySeatWithoutMomentPlacement && !allowCeremonyAnchorWithoutMomentPlacement) {
            return null;
          }
        }

        const snapped = ceremonySeatResult?.seatByInstanceKey.get(seatKey);
        const normalizedMomentName = normalizeValue(selectedMoment?.name ?? '');
        const groomAisleAnchorForBrideEntrance =
          spaceKind === 'ceremony' &&
          !placement &&
          normalizedRole === 'groom' &&
          /\b(bride|bridal)\b/.test(normalizedMomentName) &&
          /\b(entrance|entry|processional|procession)\b/.test(normalizedMomentName);

        let coordinates: { x: number; y: number; rotation: number };
        // Seat-snapped and user-authored coordinates are pinned: the
        // collision resolver treats them as immovable obstacles.
        let pinned = false;
        if (ceremonySeatResult && !skipSeatSnap) {
          const persistedCoord = placement
            ? readPlacementCoordForCopy(placement.notes, instance.copyIndex)
            : null;
          const persistedSeat = placement
            ? parsePlacementSeatForCopy(placement.notes, instance.copyIndex)
            : null;
          if (persistedCoord) {
            coordinates = persistedCoord;
            pinned = true;
          } else if (persistedSeat) {
            const resolved = resolveChairSeatCoordinates(objects, persistedSeat);
            const fallback = snapped ?? null;
            coordinates =
              resolved ??
              fallback ??
              defaultCoordinates(index, roleInstances.length, 'overview', spaceKind, roleLabel);
            pinned = Boolean(resolved ?? fallback);
          } else {
            coordinates = snapped ?? defaultCoordinates(index, roleInstances.length, 'overview', spaceKind, roleLabel);
            pinned = Boolean(snapped);
          }
        } else if (groomAisleAnchorForBrideEntrance) {
          coordinates = { x: 500, y: 470, rotation: 180 };
        } else {
          const pewSnapped =
            spaceKind === 'ceremony' &&
            useCeremonySeatSnap &&
            ceremonySeatResult &&
            ceremonySeatResult.seatByInstanceKey.get(seatKey);
          const baseCoordinates = placement
            ? coordinatesFromPlacement(
                placement,
                index,
                roleInstances.length,
                spaceKind,
                roleLabel,
                instance.copyIndex,
                objects,
                placementResolveOptions,
              )
            : defaultCoordinates(index, roleInstances.length, 'overview', spaceKind, roleLabel);
          if (pewSnapped && !skipSeatSnap) {
            coordinates = pewSnapped;
            pinned = true;
          } else {
            coordinates = applyInstanceOffset(baseCoordinates, instance.copyIndex, instance.copyCount);
          }
        }

        return {
          id: instance.roleLink.id * 1000 + instance.copyIndex,
          package_space_slot_id: activeSlot.id,
          day_subject_id: instance.roleLink.subject_role_id,
          label: floorMarkerLabel(roleLabel, instance.copyIndex, instance.copyCount),
          x: coordinates.x,
          y: coordinates.y,
          rotation: coordinates.rotation,
          bound_object_id: null,
          bound_offset_x: 0,
          bound_offset_y: 0,
          facing_target_type: 'ANGLE' as const,
          facing_target_id: null,
          order_index: index,
          created_at: '',
          updated_at: '',
          day_subject: {
            id: instance.roleLink.subject_role_id,
            name: roleLabel,
            role_template_id: instance.roleLink.subject_role_id,
          },
          bound_object: null,
          moment_overrides: [],
          _isPlaced: Boolean(placement),
          _actionText: action?.action_text ?? null,
          _placementId: placement?.id ?? null,
          _copyIndex: instance.copyIndex,
          _pinned: pinned,
        };
      })
      .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));

    // Match the package placement-seed behaviour: deterministically resolve
    // furniture overlaps and subject separation so the authoring preview
    // shows the same layout that will be seeded into the package.
    const collisionPoints = positionedSubjects.map((subject) => ({
      x: subject.x,
      y: subject.y,
      fixed: subject._pinned,
    }));
    resolveSpatialCollisions(collisionPoints, objects);
    positionedSubjects.forEach((subject, idx) => {
      subject.x = collisionPoints[idx].x;
      subject.y = collisionPoints[idx].y;
    });

    const scene: FloorPlanSceneViewModel = {
      label: activeSlotLabel ?? activeSlot.label,
      description: activeSlot.description ?? null,
      canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      objects: objects.map((object) => ({
        object_type: object.object_type,
        label: object.label ?? '',
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        rotation: object.rotation,
        order_index: object.order_index,
        metadata: (object.metadata as Record<string, unknown> | null) ?? null,
      })),
      zones: sandboxZones.map((zone) => ({
        name: zone.name,
        label: zone.label ?? zone.name,
        polygon: zone.polygon as Array<{ x: number; y: number }>,
        color: zone.color ?? 'rgba(167,139,250,0.09)',
        description: zone.description ?? '',
        order_index: zone.order_index,
      })),
      subjects: [],
    };
    const slot = sceneToPackageSpaceSlot(
      scene,
      {
        id: activeSlot.id,
        label: scene.label ?? activeSlot.label,
        description: scene.description,
      },
      positionedSubjects,
    );

    const ceremonySeatStats =
      ceremonySeatResult && useCeremonySeatSnap
        ? {
            seated: ceremonySeatResult.seatedSubjectCount,
            overflow: ceremonySeatResult.overflowSubjectCount,
            capacity: ceremonySeatResult.totalSeatCapacity,
          }
        : null;

    if (selectedMoment && ceremonySeatResult && useCeremonySeatSnap) {
      const nonGuestRows: number[] = [];
      const guestRows: number[] = [];
      for (const input of ceremonySeatInputs) {
        if (input.skipSeatSnap) continue;
        const key = `${input.roleId}:${input.copyIndex}`;
        const seatMeta = ceremonySeatResult.seatMetaByInstanceKey.get(key);
        if (!seatMeta) continue;
        if (/\bguest|audience|crowd|congregation\b/i.test(input.roleLabel)) {
          guestRows.push(seatMeta.rowIndex);
        } else {
          nonGuestRows.push(seatMeta.rowIndex);
        }
      }
      void nonGuestRows;
      void guestRows;
    }

    return { slot, ceremonySeatStats, ceremonySeatResult: ceremonySeatResult && useCeremonySeatSnap ? ceremonySeatResult : null };
  }, [
    activeSlot,
    activeSlotLabel,
    ceremonyFloorRoleIds,
    ceremonySeatAssignmentRoleIds,
    linkedRoleIds,
    placedRoleIdsForActiveSlot,
    placementsForActiveSlot,
    roleById,
    selectedMoment,
    spaceKind,
    blankAuthoring,
  ]);

  const syntheticSlot = syntheticFloorPayload?.slot ?? null;
  const ceremonySeatStats = syntheticFloorPayload?.ceremonySeatStats ?? null;
  const ceremonySeatResultForPersist = syntheticFloorPayload?.ceremonySeatResult ?? null;
  const [draggingRoleId, setDraggingRoleId] = useState<number | null>(null);
  const subjectBySyntheticId = useMemo(() => {
    const map = new Map<number, { roleId: number; placementId: number | null; copyIndex: number }>();
    for (const subject of syntheticSlot?.subject_positions ?? []) {
      const roleId = subject.day_subject_id;
      if (typeof roleId !== 'number') continue;
      const placementId = typeof (subject as any)._placementId === 'number'
        ? (subject as any)._placementId
        : null;
      const copyIndex = typeof (subject as any)._copyIndex === 'number' ? (subject as any)._copyIndex : 0;
      map.set(subject.id, { roleId, placementId, copyIndex });
    }
    return map;
  }, [syntheticSlot]);
  const visibleRoleIds = useMemo(() => {
    if (!syntheticSlot) return [] as number[];
    return Array.from(new Set((syntheticSlot.subject_positions ?? []).map((subject) => subject.day_subject_id)));
  }, [syntheticSlot]);

  const unplacedLinkedSubjects = useMemo(() => {
    if (!selectedMoment || !activeSlot) return [];
    const placedRoleIds = new Set(placementsForActiveSlot.map((placement) => placement.subject_role_id));
    return linkedRoleIds
      .filter((roleId) => !placedRoleIds.has(roleId))
      .map((roleId) => roleById.get(roleId))
      .filter((link): link is DayBlueprintSubjectRoleLink => Boolean(link));
  }, [activeSlot, linkedRoleIds, placementsForActiveSlot, roleById, selectedMoment]);

  const displayedSubjectCount = selectedMoment ? linkedRoleIds.length : subjectRoles.length;
  const displayedSubjectInstances = selectedMoment
    ? linkedRoleIds.reduce((sum, roleId) => {
        const roleLink = roleById.get(roleId);
        return sum + Math.max(roleLink?.typical_count ?? 1, 1);
      }, 0)
    : subjectRoles.reduce((sum, roleLink) => sum + Math.max(roleLink.typical_count ?? 1, 1), 0);
  const canEditSpatial = Boolean(selectedMoment) && !readOnly;

  const upsertPlacementAtCanvasCoordinates = useCallback(async (
    roleId: number,
    rawX: number,
    rawY: number,
    placementId: number | null,
    copyIndex = 0,
  ) => {
    if (!selectedMoment || !activeSlot || !syntheticSlot) return;
    const snapped = findNearestChairSeatMeta(syntheticSlot.objects ?? [], rawX, rawY, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });
    const roleLink = roleById.get(roleId);
    const existingPlacement = placementId != null
      ? selectedMoment.placements?.find((placement) => placement.id === placementId)
      : (selectedMoment.placements ?? []).find((placement) =>
        placement.subject_role_id === roleId && placement.day_blueprint_space_slot_id === activeSlot.id);
    if (excludedRoleIds.has(roleId)) {
      const nextLockFlags = setSubjectRoleExcluded(selectedMoment.lock_flags, roleId, false);
      await updateMoment.mutateAsync({
        momentId: selectedMoment.id,
        data: { lock_flags: nextLockFlags },
      });
    }
    const priorCoords = readPlacementCoordForCopy(existingPlacement?.notes, copyIndex);
    const shouldSnap = snapped.nearestDistance <= SEAT_SNAP_MAX_DISTANCE;
    const finalCoordinates = shouldSnap
      ? snapped
      : {
        x: clamp(rawX, 40, CANVAS_WIDTH - 40),
        y: clamp(rawY, 40, CANVAS_HEIGHT - 40),
        rotation: priorCoords?.rotation ?? 0,
      };
    const placementNotes = withPlacementTokensMerged(
      existingPlacement?.notes,
      finalCoordinates,
      shouldSnap && snapped.meta ? snapped.meta : null,
      copyIndex,
    );
    const copyCountN = Math.max(roleLink?.typical_count ?? 1, 1);
    let nextNotes = placementNotes;
    if (
      spaceKind === 'ceremony' &&
      (syntheticSlot.objects ?? []).some((o) => o.object_type === 'CHAIR_ROW') &&
      ceremonySeatResultForPersist &&
      copyCountN >= 1
    ) {
      nextNotes = fillMissingCeremonyCopySpatialTokens(
        placementNotes,
        roleId,
        copyCountN,
        ceremonySeatResultForPersist,
      );
    }
    if (existingPlacement) {
      await updateMomentPlacement.mutateAsync({
        placementId: existingPlacement.id,
        data: {
          day_blueprint_space_slot_id: activeSlot.id,
          notes: nextNotes,
        },
      });
      return;
    }
    await createMomentPlacement.mutateAsync({
      momentId: selectedMoment.id,
      data: {
        day_blueprint_space_slot_id: activeSlot.id,
        subject_role_id: roleId,
        notes: nextNotes,
      },
    });
  }, [
    activeSlot,
    ceremonySeatResultForPersist,
    createMomentPlacement,
    excludedRoleIds,
    roleById,
    selectedMoment,
    spaceKind,
    syntheticSlot,
    updateMoment,
    updateMomentPlacement,
  ]);

  const removeSubjectFromMoment = useCallback(async (roleId: number) => {
    if (!selectedMoment) return;
    const placements = (selectedMoment.placements ?? []).filter((placement) => placement.subject_role_id === roleId);
    const actions = (selectedMoment.actions ?? []).filter((action) => action.subject_role_id === roleId);
    await Promise.all([
      ...placements.map((placement) => deleteMomentPlacement.mutateAsync(placement.id)),
      ...actions.map((action) => deleteMomentAction.mutateAsync(action.id)),
    ]);
    const nextLockFlags = setSubjectRoleExcluded(selectedMoment.lock_flags, roleId, true);
    await updateMoment.mutateAsync({
      momentId: selectedMoment.id,
      data: { lock_flags: nextLockFlags },
    });
  }, [deleteMomentAction, deleteMomentPlacement, selectedMoment, updateMoment]);

  const handleSubjectMove = useCallback((positionId: number, x: number, y: number) => {
    if (!canEditSpatial) return;
    const mapped = subjectBySyntheticId.get(positionId);
    if (!mapped) return;
    void upsertPlacementAtCanvasCoordinates(mapped.roleId, x, y, mapped.placementId, mapped.copyIndex);
  }, [canEditSpatial, subjectBySyntheticId, upsertPlacementAtCanvasCoordinates]);

  const handleDropRoleOnCanvas = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!canEditSpatial) return;
    event.preventDefault();
    const roleIdText = event.dataTransfer.getData('application/x-day-blueprint-role-id');
    const roleId = Number(roleIdText);
    const overlayElement = stageRef.current;
    if (!Number.isFinite(roleId) || roleId <= 0 || !overlayElement) return;
    const rect = overlayElement.getBoundingClientRect();
    const relativeX = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
    const relativeY = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    const dropX = clamp(relativeX * CANVAS_WIDTH, 40, CANVAS_WIDTH - 40);
    const dropY = clamp(relativeY * CANVAS_HEIGHT, 40, CANVAS_HEIGHT - 40);
    void upsertPlacementAtCanvasCoordinates(roleId, dropX, dropY, null);
    setDraggingRoleId(null);
  }, [canEditSpatial, stageRef, upsertPlacementAtCanvasCoordinates]);


  if (slots.length === 0) {
    return (
      <Box sx={{ height: '100%', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            flex: '1 1 auto',
            minHeight: 260,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(148,163,184,0.12)',
            bgcolor: 'rgba(15, 23, 42, 0.24)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: '10% 12%',
              borderRadius: 2,
              border: '2px solid rgba(148,163,184,0.35)',
              bgcolor: 'rgba(148,163,184,0.05)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: '12%',
                right: '12%',
                top: '48%',
                borderTop: '1px dashed rgba(148,163,184,0.35)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '12%',
                bottom: '12%',
                left: '50%',
                borderLeft: '1px dashed rgba(148,163,184,0.35)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: '18% 20%',
                borderRadius: 1.5,
                border: '1px solid rgba(148,163,184,0.28)',
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: { xs: 2, md: 2.5 },
        }}
      >
        {/* Single top info bar */}
        <Box
          sx={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 0.5,
            minHeight: 44,
            borderBottom: '1px solid rgba(148,163,184,0.08)',
            overflow: 'hidden',
          }}
        >
        {/* Space name */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#f1f5f9', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {activeSlotLabel ?? activeActivity?.name ?? 'Floor plan'}
        </Typography>

        {/* Space kind chip */}
        {spaceKind !== 'generic' && (
          <Chip
            label={SPACE_KIND_LABEL[spaceKind]}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 700,
              flexShrink: 0,
              bgcolor: SPACE_KIND_COLOR[spaceKind],
              color: SPACE_KIND_TEXT[spaceKind],
              border: `1px solid ${SPACE_KIND_BORDER[spaceKind]}`,
            }}
          />
        )}

        {/* Dot divider */}
        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(148,163,184,0.28)', flexShrink: 0 }} />

        {/* Context label */}
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {selectedMoment ? selectedMoment.name : activeActivity?.name ?? 'Sandbox'}
        </Typography>

        {/* Subject count */}
        <Chip
          label={`${displayedSubjectInstances} subject${displayedSubjectInstances === 1 ? '' : 's'}`}
          size="small"
          sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'none', flexShrink: 0 }}
        />

        {ceremonySeatStats && ceremonySeatStats.overflow > 0 && (
          <Chip
            label={`${ceremonySeatStats.seated} seated · ${ceremonySeatStats.overflow} over pew capacity`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              bgcolor: 'rgba(251,191,36,0.14)',
              color: '#fcd34d',
              border: '1px solid rgba(251,191,36,0.28)',
              flexShrink: 0,
            }}
          />
        )}

        {/* Placement status when in moment mode */}
        {selectedMoment && (
          <Tooltip
            title="Roles with saved placements on this floor for this moment (not headcount). Figures can still preview from ceremony layout before you save."
            placement="bottom"
          >
            <Chip
              label={
                placementsForActiveSlot.length > 0
                  ? `${new Set(placementsForActiveSlot.map((p) => p.subject_role_id)).size} roles saved`
                  : 'no positions yet'
              }
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                bgcolor: placementsForActiveSlot.length > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.08)',
                color: placementsForActiveSlot.length > 0 ? '#6ee7b7' : '#64748b',
                border: 'none',
                flexShrink: 0,
              }}
            />
          </Tooltip>
        )}

        {/* Push controls to the right */}
        <Box sx={{ flex: 1 }} />

        {/* Hand tool toggle */}
        <Tooltip title="Hand tool — drag to pan (or hold Space)" placement="bottom">
          <IconButton
            size="small"
            onClick={() => togglePanModeRef.current?.()}
            sx={{
              p: 0.5,
              borderRadius: 1,
              color: isPanModeCanvas ? '#60a5fa' : '#475569',
              bgcolor: isPanModeCanvas ? 'rgba(96,165,250,0.12)' : 'transparent',
              border: `1px solid ${isPanModeCanvas ? 'rgba(96,165,250,0.28)' : 'transparent'}`,
              '&:hover': { bgcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
              flexShrink: 0,
            }}
          >
            <PanToolRoundedIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>

        {/* Fit to view */}
        <Tooltip title="Fit to view" placement="bottom">
          <IconButton
            size="small"
            onClick={() => fitToViewRef.current?.()}
            sx={{
              p: 0.5,
              borderRadius: 1,
              color: '#475569',
              '&:hover': { bgcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
              flexShrink: 0,
            }}
          >
            <CropFreeRoundedIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
        </Box>

        {/* Canvas viewport — frameless, blends into the page */}
        <Box
        ref={stageRef}
        onDragOver={(event) => {
          if (!canEditSpatial) return;
          event.preventDefault();
        }}
        onDrop={handleDropRoleOnCanvas}
        sx={{
          position: 'relative',
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: 1.5,
          outline: draggingRoleId != null ? '2px dashed rgba(96,165,250,0.65)' : 'none',
          outlineOffset: draggingRoleId != null ? -2 : 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {syntheticSlot && (
            <SpaceSlotOverlay
              spaceSlot={syntheticSlot}
              width={Math.max(1, stageWidth)}
              height={Math.max(1, stageHeight)}
              isEditing={canEditSpatial}
              lockSubjects={!canEditSpatial}
              lockCameras
              showCameras={false}
              fillViewport
              contentMaxSize={planSize}
              viewportBackgroundColor="transparent"
              hideLabels
              compactSubjectLabels
              highlightSubjectRoleIds={selectedSubjectRoleId != null ? [selectedSubjectRoleId] : []}
              onSubjectSelect={
                onSelectSubjectRole && selectedMoment
                  ? (roleId) => {
                      onSelectSubjectRole(selectedSubjectRoleId === roleId ? null : roleId);
                    }
                  : undefined
              }
              onControlsReady={handleControlsReady}
              onSubjectMove={handleSubjectMove}
            />
          )}
        </Box>

        {unplacedLinkedSubjects.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 12,
              zIndex: 2,
              border: '1px solid rgba(148,163,184,0.12)',
              bgcolor: alpha('#0f172a', 0.74),
              borderRadius: 2,
              px: 1.5,
              py: 1,
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Linked without slot placement
              </Typography>
              {unplacedLinkedSubjects.map((link) => (
                <Chip
                  key={link.id}
                  label={subjectRoleLabel(link)}
                  size="small"
                  sx={{ height: 22, bgcolor: 'rgba(148,163,184,0.12)', color: '#cbd5e1', border: 'none', fontSize: '0.68rem' }}
                />
              ))}
            </Stack>
          </Paper>
        )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: '0 0 auto',
          minHeight: 84,
          maxHeight: 180,
          alignSelf: 'stretch',
          width: '100%',
          mt: 0.75,
          pt: 1,
          px: 0,
          borderTop: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(180deg, rgba(148,163,184,0.04), rgba(148,163,184,0))',
          overflowY: 'auto',
        }}
      >
        <Box sx={{ px: { xs: 1.5, md: 2 } }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>
            People
          </Typography>
          {subjectRoles.length === 0 ? (
            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic' }}>
              No subject roles linked to this blueprint yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, rowGap: 1.5, alignContent: 'flex-start' }}>
            {subjectRoles.map((link) => {
              const roleLabel = subjectRoleLabel(link);
              const roleCount = Math.max(link.typical_count ?? 1, 1);
              const shouldFilterByLinkedRoles = Boolean(selectedMoment || activeActivity);
              const isLinked = shouldFilterByLinkedRoles
                ? linkedRoleIds.includes(link.subject_role_id)
                : true;
              const isOnFloorPlan = visibleRoleIds.includes(link.subject_role_id);
              const isGalleryActive = isOnFloorPlan;
              const canRemoveFromMoment = canEditSpatial && Boolean(selectedMoment) && isOnFloorPlan;
              const initials = initialsFromLabel(roleLabel);
              const spatialStatus = subjectSpatialStatus?.get(link.subject_role_id);
              const isGeneratingSpatial = spatialStatus === 'generating';
              const isFlashingDone = Boolean(doneFlashAt[link.subject_role_id]);
              const isSelectedRole = selectedSubjectRoleId === link.subject_role_id;
              return (
                <Box
                  key={link.id}
                  draggable={canEditSpatial}
                  onClick={() => {
                    if (!onSelectSubjectRole || !selectedMoment || !isGalleryActive) return;
                    onSelectSubjectRole(isSelectedRole ? null : link.subject_role_id);
                  }}
                  onDragStart={(event) => {
                    if (!canEditSpatial) return;
                    event.dataTransfer.setData('application/x-day-blueprint-role-id', String(link.subject_role_id));
                    event.dataTransfer.effectAllowed = 'move';
                    setDraggingRoleId(link.subject_role_id);
                  }}
                  onDragEnd={() => setDraggingRoleId(null)}
                  onMouseEnter={() => {
                    if (isGalleryActive) onHoverMomentRole(link.subject_role_id);
                  }}
                  onMouseLeave={() => {
                    onHoverMomentRole(null);
                  }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.45,
                    flex: '0 0 auto',
                    width: 84,
                    maxWidth: 96,
                    minWidth: 72,
                    opacity: isGeneratingSpatial || isFlashingDone ? 1 : isGalleryActive ? 1 : 0.28,
                    cursor:
                      canEditSpatial
                        ? 'grab'
                        : selectedMoment && isGalleryActive
                          ? 'pointer'
                          : 'default',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isGeneratingSpatial
                        ? 'linear-gradient(135deg, rgba(167,139,250,0.45), rgba(96,165,250,0.45))'
                        : isGalleryActive
                          ? 'linear-gradient(135deg, rgba(96,165,250,0.28), rgba(168,85,247,0.28))'
                          : 'rgba(255,255,255,0.04)',
                      border: isSelectedRole
                        ? '2px solid rgba(255,215,0,0.9)'
                        : `1px solid ${
                            isGeneratingSpatial
                              ? 'rgba(167,139,250,0.85)'
                              : isGalleryActive
                                ? 'rgba(96,165,250,0.42)'
                                : 'rgba(255,255,255,0.08)'
                          }`,
                      boxShadow: isSelectedRole ? '0 0 0 1px rgba(0,0,0,0.35)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'background 0.2s ease, border-color 0.2s ease',
                      animation: isGeneratingSpatial
                        ? `${spatialPulse} 1.4s ease-out infinite`
                        : isFlashingDone
                          ? `${spatialFlash} 1s ease-out`
                          : 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: isGeneratingSpatial ? '#ddd6fe' : isGalleryActive ? '#93c5fd' : '#475569', lineHeight: 1 }}>
                      {initials}
                    </Typography>
                    {isGeneratingSpatial && (
                      <CircularProgress
                        size={48}
                        thickness={2.4}
                        sx={{
                          position: 'absolute',
                          top: -4,
                          left: -4,
                          color: '#a78bfa',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {roleCount > 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          right: -3,
                          bottom: -3,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: '#1e293b',
                          border: '1px solid rgba(96,165,250,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>
                          {roleCount}
                        </Typography>
                      </Box>
                    )}
                    {canRemoveFromMoment && (
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void removeSubjectFromMoment(link.subject_role_id);
                        }}
                        sx={{
                          position: 'absolute',
                          left: -6,
                          top: -6,
                          width: 16,
                          height: 16,
                          bgcolor: 'rgba(2,6,23,0.85)',
                          border: '1px solid rgba(251,113,133,0.55)',
                          '&:hover': { bgcolor: 'rgba(136,19,55,0.9)' },
                        }}
                      >
                        <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 12, color: '#fb7185' }} />
                      </IconButton>
                    )}
                  </Box>
                  <Typography
                    title={roleLabel}
                    sx={{
                      fontSize: '0.58rem',
                      color: isGeneratingSpatial ? '#c4b5fd' : isGalleryActive ? '#94a3b8' : '#475569',
                      textAlign: 'center',
                      lineHeight: 1.25,
                      width: '100%',
                      px: 0.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {roleLabel}
                  </Typography>
                </Box>
              );
            })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function useMeasuredElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 760, height: 460 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}

function floorMarkerLabel(roleLabel: string, copyIndex: number, copyCount: number): string {
  if (/\bguests?\b|audience|crowd|congregation/i.test(roleLabel)) {
    return '';
  }
  const n = normalizeValue(roleLabel);
  const num = copyCount > 1 ? String(copyIndex + 1) : '';

  if (/\b(bridesmaid|bridesmaids)\b/.test(n)) {
    return num ? `Brides\nMaids ${num}` : `Brides\nMaids`;
  }
  if (/\b(groomsman|groomsmen)\b/.test(n)) {
    return num ? `Grooms\nmen ${num}` : `Grooms\nmen`;
  }
  if (/\bring bearer\b/.test(n)) {
    return num ? `Ring Bearer\n${num}` : 'Ring Bearer';
  }
  if (/\bflower girl\b/.test(n)) {
    return num ? `Flower Girl\n${num}` : 'Flower Girl';
  }

  const name = roleLabel.trim();
  if (copyCount > 1) {
    return `${splitRoleNameAcrossTwoLines(name)}\n${copyIndex + 1}`;
  }
  return splitRoleNameAcrossTwoLines(name);
}

/** Pack role name into at most two lines at word boundaries (readable on tight pew markers). */
function splitRoleNameAcrossTwoLines(name: string): string {
  const t = name.trim();
  if (t.length <= 11) return t;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return t;
  let line1 = words[0]!;
  let i = 1;
  while (i < words.length && `${line1} ${words[i]}`.length <= 12) {
    line1 = `${line1} ${words[i]!}`;
    i += 1;
  }
  if (i >= words.length) return t;
  return `${line1}\n${words.slice(i).join(' ')}`;
}

function subjectRoleLabel(link: DayBlueprintSubjectRoleLink) {
  return link.subject_role?.role_name ?? `Role #${link.subject_role_id}`;
}

function initialsFromLabel(label: string) {
  return label
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CEREMONY_OFFICIANT_ROLE_RE =
  /\b(officiant|celebrant|minister|priest|vicar|rabbi|imam|registrar)\b/;
const EXCLUDED_ROLE_FLAG_PREFIX = 'exclude_subject_role_';

function isCeremonyOfficiantRole(normalizedRoleLabel: string): boolean {
  return CEREMONY_OFFICIANT_ROLE_RE.test(normalizedRoleLabel);
}

function isCeremonyPartyRoleLabel(normalizedRoleLabel: string): boolean {
  return /\b(maid of honor|matron of honor|maid|bridesmaid|bridesmaids|best man|groomsman|groomsmen|flower girl|flower|ring bearer|ringbearer|attendant|wedding party)\b/.test(
    normalizedRoleLabel,
  );
}

function isBridePartyCeremonyRole(normalizedRoleLabel: string): boolean {
  return /\b(maid of honor|matron of honor|maid|bridesmaid|bridesmaids|flower girl|flower)\b/.test(normalizedRoleLabel);
}

function isGroomPartyCeremonyRole(normalizedRoleLabel: string): boolean {
  return /\b(best man|groomsman|groomsmen)\b/.test(normalizedRoleLabel);
}

function readExcludedSubjectRoleIds(lockFlags: unknown): Set<number> {
  if (!lockFlags || typeof lockFlags !== 'object') return new Set();
  const ids = new Set<number>();
  for (const [key, value] of Object.entries(lockFlags as Record<string, unknown>)) {
    if (!key.startsWith(EXCLUDED_ROLE_FLAG_PREFIX) || value !== true) continue;
    const id = Number(key.slice(EXCLUDED_ROLE_FLAG_PREFIX.length));
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }
  return ids;
}

function setSubjectRoleExcluded(lockFlags: unknown, roleId: number, excluded: boolean): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  if (lockFlags && typeof lockFlags === 'object') {
    for (const [key, value] of Object.entries(lockFlags as Record<string, unknown>)) {
      if (typeof value === 'boolean') next[key] = value;
    }
  }
  const key = `${EXCLUDED_ROLE_FLAG_PREFIX}${roleId}`;
  if (excluded) next[key] = true;
  else delete next[key];
  return next;
}

function stableKey(value: string) {
  return normalizeValue(value).replace(/ /g, '_');
}

function activitySpaceLabel(activity: DayBlueprintActivity) {
  return `${activity.name.trim() || 'Activity'} Space`;
}

function activitySpaceKeys(activity: DayBlueprintActivity) {
  return new Set([
    stableKey(`${activity.name} space`),
    stableKey(`${activity.name} space ${activity.id}`),
  ]);
}

function spaceSlotMatchesActivity(slot: DayBlueprintSpaceSlot, activity: DayBlueprintActivity) {
  const slotKeys = activitySpaceKeys(activity);
  const normalizedSlotLabel = normalizeValue(slot.label);
  return (
    slotKeys.has(stableKey(slot.key)) ||
    normalizedSlotLabel === normalizeValue(activity.name) ||
    normalizedSlotLabel === normalizeValue(activitySpaceLabel(activity))
  );
}

function isGenericSandboxSlot(slot: DayBlueprintSpaceSlot) {
  return stableKey(slot.key) === 'sandbox' || normalizeValue(slot.label) === 'sandbox';
}

function displaySlotLabel(slot: DayBlueprintSpaceSlot, activity: DayBlueprintActivity | null) {
  if (activity && isGenericSandboxSlot(slot)) return activitySpaceLabel(activity);
  return slot.label;
}

function resolveSpaceKind(
  slot: DayBlueprintSpaceSlot | null,
  activity: DayBlueprintActivity | null,
  label: string | null,
): SandboxSpaceKind {
  return resolveSandboxSpaceKind({
    slotKey: slot?.key,
    slotLabel: slot?.label,
    label,
    activityName: activity?.name,
    activityDescription: activity?.description,
  });
}

/**
 * Synthetic floor geometry for the Day Designer preview. Built from the
 * shared `buildSandboxRoomLayout` — the SAME generator the package consume
 * pipeline uses — so the authoring preview matches the consumed package.
 */
function buildSandboxSlotGeometry(
  slotId: number,
  kind: SandboxSpaceKind,
  label: string,
): { objects: SpaceSlotObject[]; zones: SpaceSlotZone[] } {
  const spec = buildSandboxRoomLayout({ label, kind });
  const objects: SpaceSlotObject[] = spec.objects.map((object, index) => ({
    id: slotId * 1000 + index + 1,
    package_space_slot_id: slotId,
    object_type: object.object_type as FloorPlanObjectType,
    label: object.label,
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    rotation: object.rotation,
    metadata: object.metadata ?? null,
    order_index: object.order_index,
    created_at: '',
    updated_at: '',
  }));
  const zones: SpaceSlotZone[] = spec.zones.map((zone, index) => ({
    id: slotId * 100 + index + 1,
    package_space_slot_id: slotId,
    name: zone.name,
    label: zone.label,
    polygon: zone.polygon,
    color: zone.color,
    description: zone.description,
    order_index: zone.order_index,
    created_at: '',
    updated_at: '',
  }));
  return { objects, zones };
}

function semanticSubjectPosition(kind: SandboxSpaceKind, roleLabel: string, index: number) {
  const role = normalizeValue(roleLabel);
  if (kind === 'ceremony') {
    if (isCeremonyOfficiantRole(role)) return { x: 500, y: 185, rotation: 180 };
    if (role === 'bride') return { x: 430, y: 255, rotation: 20 };
    if (role === 'groom') return { x: 570, y: 255, rotation: 340 };
    if (/maid|bridesmaid|flower/.test(role)) return { x: 315 + (index % 3) * 38, y: 335 + (index % 3) * 34, rotation: 45 };
    if (/best man|groomsmen|ring/.test(role)) return { x: 650 + (index % 3) * 38, y: 335 + (index % 3) * 34, rotation: 315 };
    if (/father|mother|parent/.test(role)) return { x: index % 2 === 0 ? 250 : 750, y: 540 + (index % 3) * 38, rotation: 0 };
    if (/guest|congregation|audience/.test(role)) return { x: 500, y: 680, rotation: 0 };
  }

  if (kind === 'reception') {
    if (/bride|groom/.test(role)) return { x: role.includes('bride') ? 455 : 545, y: 175, rotation: 180 };
    if (/maid|best man|bridesmaid|groomsmen/.test(role)) return { x: 355 + (index % 5) * 72, y: 210, rotation: 180 };
    if (/father|mother|parent/.test(role)) return { x: index % 2 === 0 ? 250 : 750, y: 355 + (index % 2) * 310, rotation: 0 };
    if (/guest/.test(role)) return { x: 500, y: 790, rotation: 0 };
  }

  if (kind === 'prep') {
    if (/bride|groom/.test(role)) return { x: 455, y: 430, rotation: 0 };
    return { x: 260 + (index % 5) * 110, y: 610 + Math.floor(index / 5) * 55, rotation: 0 };
  }

  if (kind === 'portraits') {
    if (/bride|groom/.test(role)) return { x: role.includes('bride') ? 455 : 545, y: 455, rotation: 0 };
    return { x: 230 + (index % 7) * 90, y: 600 + Math.floor(index / 7) * 52, rotation: 0 };
  }

  return null;
}

function coordinatesFromPlacement(
  placement: DayBlueprintMomentPlacement,
  index: number,
  total: number,
  kind: SandboxSpaceKind,
  roleLabel: string,
  copyIndex = 0,
  chairObjects?: SpaceSlotObject[],
  options?: import('@projectflo/shared').BlueprintPlacementResolveOptions,
) {
  return coordinatesFromBlueprintPlacement(
    placement,
    index,
    total,
    kind,
    roleLabel,
    copyIndex,
    chairObjects,
    options,
  );
}

function defaultCoordinates(index: number, total: number, mode: 'linked' | 'overview', kind: SandboxSpaceKind = 'generic', roleLabel = '') {
  const semanticPosition = semanticSubjectPosition(kind, roleLabel, index);
  if (semanticPosition) return semanticPosition;

  if (mode === 'linked') {
    const columns = Math.max(1, Math.min(6, total));
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: 190 + col * 120,
      y: 560 + row * 42,
      rotation: 0,
    };
  }

  const radiusX = 260;
  const radiusY = 190;
  const angle = total <= 1 ? -Math.PI / 2 : (-Math.PI * 0.9) + (index * Math.PI * 1.8) / Math.max(1, total - 1);
  return {
    x: CANVAS_WIDTH / 2 + Math.cos(angle) * radiusX,
    y: CANVAS_HEIGHT / 2 + Math.sin(angle) * radiusY,
    rotation: ((angle * 180) / Math.PI + 90 + 360) % 360,
  };
}

function rotationFromFacingHint(text: string, index: number, total: number, kind: SandboxSpaceKind = 'generic', roleLabel = '') {
  if (/left|west/.test(text)) return 270;
  if (/right|east/.test(text)) return 90;
  if (/back|rear|south|entrance/.test(text)) return 180;
  if (/front|altar|north|ceremony|camera/.test(text)) return 0;
  return defaultCoordinates(index, total, 'overview', kind, roleLabel).rotation;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const PLACEMENT_COORD_TOKEN = /\[\[coord:([0-9.-]+),([0-9.-]+),([0-9.-]+)\]\]/;

function readPlacementCoordinatesToken(notes?: string | null): { x: number; y: number; rotation: number } | null {
  if (!notes) return null;
  const match = notes.match(PLACEMENT_COORD_TOKEN);
  if (!match) return null;
  const x = Number(match[1]);
  const y = Number(match[2]);
  const rotation = Number(match[3]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rotation)) return null;
  return {
    x: clamp(x, 40, CANVAS_WIDTH - 40),
    y: clamp(y, 40, CANVAS_HEIGHT - 40),
    rotation,
  };
}

function copyCoordTokenRegex(copyIndex: number): RegExp {
  return new RegExp(`\\[\\[c${copyIndex}:([0-9.-]+),([0-9.-]+),([0-9.-]+)\\]\\]`);
}

/** Per-instance canvas coords for multi-copy roles (`[[cN:x,y,r]]`); copy 0 also reads legacy `[[coord:…]]`. */
function readPlacementCoordForCopy(
  notes?: string | null,
  copyIndex = 0,
): { x: number; y: number; rotation: number } | null {
  if (!notes) return null;
  const m = notes.match(copyCoordTokenRegex(copyIndex));
  if (m) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const rotation = Number(m[3]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(rotation)) {
      return {
        x: clamp(x, 40, CANVAS_WIDTH - 40),
        y: clamp(y, 40, CANVAS_HEIGHT - 40),
        rotation,
      };
    }
  }
  if (copyIndex === 0) {
    return readPlacementCoordinatesToken(notes);
  }
  return null;
}

/** Per-instance pew seat for copy N (`[[sN:L:r:s]]`); copy 0 uses legacy `[[seat:…]]`. */
function parsePlacementSeatForCopy(
  notes: string | null | undefined,
  copyIndex: number,
): { side: 'L' | 'R'; rowIndex: number; seatIndex: number } | null {
  if (!notes) return null;
  if (copyIndex > 0) {
    const re = new RegExp(`\\[\\[s${copyIndex}:([LR]):(\\d+):(\\d+)\\]\\]`);
    const match = notes.match(re);
    if (!match) return null;
    const side = match[1] as 'L' | 'R';
    const rowIndex = Number(match[2]);
    const seatIndex = Number(match[3]);
    if (!Number.isFinite(rowIndex) || !Number.isFinite(seatIndex)) return null;
    return { side, rowIndex, seatIndex };
  }
  return parsePlacementSeatToken(notes);
}

const PLACEMENT_SEAT_TOKEN = /\[\[seat:([LR]):(\d+):(\d+)\]\]/;

function stripMachinePlacementTokens(notes: string): string {
  return notes.replace(PLACEMENT_COORD_TOKEN, '').replace(PLACEMENT_SEAT_TOKEN, '').trim();
}

function stripCopyMachineTokens(notes: string, copyIndex: number): string {
  return notes
    .replace(new RegExp(`\\[\\[c${copyIndex}:[^\\]]+\\]\\]`, 'g'), '')
    .replace(new RegExp(`\\[\\[s${copyIndex}:[^\\]]+\\]\\]`, 'g'), '')
    .trim();
}

function withPlacementTokensMerged(
  notes: string | null | undefined,
  coords: { x: number; y: number; rotation: number },
  seatMeta: { side: 'L' | 'R'; rowIndex: number; seatIndex: number } | null,
  copyIndex = 0,
): string {
  let base = (notes ?? '').trim();
  if (copyIndex === 0) {
    base = stripMachinePlacementTokens(base);
  } else {
    base = stripCopyMachineTokens(base, copyIndex);
  }
  const parts: string[] = [];
  if (base.length > 0) parts.push(base);
  if (copyIndex > 0) {
    parts.push(`[[c${copyIndex}:${Math.round(coords.x)},${Math.round(coords.y)},${Math.round(coords.rotation)}]]`);
    if (seatMeta) {
      parts.push(`[[s${copyIndex}:${seatMeta.side}:${seatMeta.rowIndex}:${seatMeta.seatIndex}]]`);
    }
  } else {
    parts.push(`[[coord:${Math.round(coords.x)},${Math.round(coords.y)},${Math.round(coords.rotation)}]]`);
    if (seatMeta) {
      parts.push(`[[seat:${seatMeta.side}:${seatMeta.rowIndex}:${seatMeta.seatIndex}]]`);
    }
  }
  return parts.join('\n');
}

function fillMissingCeremonyCopySpatialTokens(
  notes: string,
  roleId: number,
  copyCount: number,
  seatAssignment: CeremonySeatAssignmentResult,
): string {
  let merged = notes;
  for (let i = 0; i < copyCount; i += 1) {
    const hasCoord = readPlacementCoordForCopy(merged, i) != null;
    const hasSeat = parsePlacementSeatForCopy(merged, i) != null;
    if (hasCoord && hasSeat) continue;
    const key = `${roleId}:${i}` as `${number}:${number}`;
    const pos = seatAssignment.seatByInstanceKey.get(key);
    const meta = seatAssignment.seatMetaByInstanceKey.get(key);
    if (!pos || !meta) continue;
    merged = withPlacementTokensMerged(merged, pos, meta, i);
  }
  return merged;
}

function applyInstanceOffset(
  base: { x: number; y: number; rotation: number },
  copyIndex: number,
  copyCount: number,
) {
  if (copyCount <= 1) return base;
  const ringIndex = copyIndex;
  const angle = (Math.PI * 2 * ringIndex) / copyCount;
  const radius = 22;
  return {
    x: clamp(base.x + Math.cos(angle) * radius, 90, CANVAS_WIDTH - 90),
    y: clamp(base.y + Math.sin(angle) * radius, 80, CANVAS_HEIGHT - 80),
    rotation: base.rotation,
  };
}
