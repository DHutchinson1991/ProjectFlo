'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import CropFreeRoundedIcon from '@mui/icons-material/CropFreeRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
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

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;

interface DayBlueprintFloorPlanTabProps {
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
  slots,
  subjectRoles,
  activeDay,
  selectedActivity,
  selectedMoment,
  hoveredMomentRoleId: _hoveredMomentRoleId,
  onHoverMomentRole,
  subjectSpatialStatus,
}: DayBlueprintFloorPlanTabProps) {
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

  const selectedMomentNoSpatial = selectedMoment ? isNoSpatialMoment(selectedMoment.lock_flags) : false;

  const relevantSlots = useMemo(() => {
    const placementSlotIds = new Set(
      selectedMomentNoSpatial
        ? []
        : (selectedMoment?.placements ?? []).map((placement) => placement.day_blueprint_space_slot_id),
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
  }, [activeActivity, selectedMoment, selectedMomentNoSpatial, slots]);

  const activeSlot = relevantSlots[0] ?? slots[0] ?? null;
  const activeSlotLabel = activeSlot ? displaySlotLabel(activeSlot, activeActivity) : null;
  const spaceKind = resolveSpaceKind(activeSlot, activeActivity, activeSlotLabel);

  const roleById = useMemo(() => {
    const map = new Map<number, DayBlueprintSubjectRoleLink>();
    subjectRoles.forEach((link) => map.set(link.subject_role_id, link));
    return map;
  }, [subjectRoles]);

  const placementsForActiveSlot = useMemo(() => {
    if (!activeSlot || !selectedMoment || selectedMomentNoSpatial) return [];
    return (selectedMoment.placements ?? []).filter(
      (placement) => placement.day_blueprint_space_slot_id === activeSlot.id,
    );
  }, [activeSlot, selectedMoment, selectedMomentNoSpatial]);

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
      if (!selectedMomentNoSpatial) {
        (selectedMoment.placements ?? []).forEach((placement) => ids.add(placement.subject_role_id));
      }
      return Array.from(ids);
    }

    if (activeActivity) {
      return activityPlacedRoleIdsForActiveSlot;
    }

    return subjectRoles.map((link) => link.subject_role_id);
  }, [selectedMoment, selectedMomentNoSpatial, activeActivity, activityPlacedRoleIdsForActiveSlot, subjectRoles]);

  const placedRoleIdsForActiveSlot = useMemo(() => {
    return Array.from(new Set(placementsForActiveSlot.map((placement) => placement.subject_role_id)));
  }, [placementsForActiveSlot]);

  const syntheticSlot = useMemo(() => {
    if (!activeSlot) return null;

    const actionByRoleId = new Map<number, DayBlueprintMomentAction>();
    (selectedMoment?.actions ?? []).forEach((action) => actionByRoleId.set(action.subject_role_id, action));

    const placementByRoleId = new Map<number, DayBlueprintMomentPlacement>();
    placementsForActiveSlot.forEach((placement) => placementByRoleId.set(placement.subject_role_id, placement));

    const roleIds = selectedMoment
      ? placedRoleIdsForActiveSlot
      : linkedRoleIds;

    const roleInstances = roleIds.flatMap((roleId) => {
      const roleLink = roleById.get(roleId);
      if (!roleLink) return [] as Array<{ roleId: number; roleLink: DayBlueprintSubjectRoleLink; copyIndex: number; copyCount: number }>;
      const copyCount = Math.max(roleLink.typical_count ?? 1, 1);
      return Array.from({ length: copyCount }, (_, copyIndex) => ({ roleId, roleLink, copyIndex, copyCount }));
    });

    const positionedSubjects = roleInstances
      .map((instance, index) => {
        const placement = placementByRoleId.get(instance.roleId);
        const action = actionByRoleId.get(instance.roleId);
        if (selectedMoment && !placement) return null;
        const roleLabel = subjectRoleLabel(instance.roleLink);
        const baseCoordinates = placement
          ? coordinatesFromPlacement(placement, index, roleInstances.length, spaceKind, roleLabel)
          : defaultCoordinates(index, roleInstances.length, 'overview', spaceKind, roleLabel);
        const coordinates = applyInstanceOffset(baseCoordinates, instance.copyIndex, instance.copyCount);

        return {
          id: instance.roleLink.id * 1000 + instance.copyIndex,
          package_space_slot_id: activeSlot.id,
          day_subject_id: instance.roleLink.subject_role_id,
          label: instance.copyCount > 1 ? `${roleLabel} ${instance.copyIndex + 1}` : roleLabel,
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
        };
      })
      .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));

    const slot: PackageSpaceSlot = {
      id: activeSlot.id,
      package_id: 0,
      event_day_template_id: 0,
      label: activeSlotLabel ?? activeSlot.label,
      description: activeSlot.description ?? null,
      location_slot_id: null,
      location_space_id: null,
      preset_id: null,
      canvas_width: CANVAS_WIDTH,
      canvas_height: CANVAS_HEIGHT,
      layout_json: null,
      created_at: '',
      updated_at: '',
      objects: buildSandboxObjects(activeSlot.id, spaceKind, activeSlotLabel ?? activeSlot.label),
      camera_positions: [],
      subject_positions: positionedSubjects,
      zones: buildSandboxZones(activeSlot.id, spaceKind, activeSlotLabel ?? activeSlot.label),
      type_tags: [],
    };

    return slot;
  }, [activeSlot, activeSlotLabel, linkedRoleIds, placedRoleIdsForActiveSlot, placementsForActiveSlot, roleById, selectedMoment, spaceKind]);

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
      {/* Single top info bar */}
      <Box
        sx={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
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

        {/* No-spatial badge */}
        {selectedMoment && selectedMomentNoSpatial && (
          <Chip
            label="No spatial"
            size="small"
            sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'none', flexShrink: 0 }}
          />
        )}

        {/* Placement status when in moment mode */}
        {selectedMoment && !selectedMomentNoSpatial && (
          <Chip
            label={placementsForActiveSlot.length > 0 ? `${placementsForActiveSlot.length} placed` : 'no positions yet'}
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
        sx={{
          position: 'relative',
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
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
              isEditing={false}
              lockSubjects
              lockCameras
              showCameras={false}
              fillViewport
              contentMaxSize={planSize}
              viewportBackgroundColor="transparent"
              hideLabels
              onControlsReady={handleControlsReady}
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
                {selectedMomentNoSpatial ? 'No-spatial people' : 'Linked without slot placement'}
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

      <Box
        sx={{
          flex: '0 0 15%',
          minHeight: 84,
          maxHeight: 180,
          mt: 0.75,
          pt: 1,
          px: 0.5,
          borderTop: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(180deg, rgba(148,163,184,0.04), rgba(148,163,184,0))',
          overflowY: 'auto',
        }}
      >
        <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8, px: 0.75 }}>
          People
        </Typography>
        {subjectRoles.length === 0 ? (
          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic', px: 0.75 }}>
            No subject roles linked to this blueprint yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {subjectRoles.map((link) => {
              const roleLabel = subjectRoleLabel(link);
              const roleCount = Math.max(link.typical_count ?? 1, 1);
              const shouldFilterByLinkedRoles = Boolean(selectedMoment || activeActivity);
              const isLinked = shouldFilterByLinkedRoles
                ? linkedRoleIds.includes(link.subject_role_id)
                : true;
              const initials = initialsFromLabel(roleLabel);
              const spatialStatus = subjectSpatialStatus?.get(link.subject_role_id);
              const isGeneratingSpatial = spatialStatus === 'generating';
              const isFlashingDone = Boolean(doneFlashAt[link.subject_role_id]);
              return (
                <Box
                  key={link.id}
                  onMouseEnter={() => {
                    if (isLinked) onHoverMomentRole(link.subject_role_id);
                  }}
                  onMouseLeave={() => {
                    onHoverMomentRole(null);
                  }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.4,
                    width: 62,
                    opacity: isGeneratingSpatial || isFlashingDone ? 1 : isLinked ? 1 : 0.28,
                    cursor: selectedMoment && isLinked ? 'pointer' : 'default',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isGeneratingSpatial
                        ? 'linear-gradient(135deg, rgba(167,139,250,0.45), rgba(96,165,250,0.45))'
                        : isLinked
                          ? 'linear-gradient(135deg, rgba(96,165,250,0.28), rgba(168,85,247,0.28))'
                          : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        isGeneratingSpatial
                          ? 'rgba(167,139,250,0.85)'
                          : isLinked
                            ? 'rgba(96,165,250,0.42)'
                            : 'rgba(255,255,255,0.08)'
                      }`,
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
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: isGeneratingSpatial ? '#ddd6fe' : isLinked ? '#93c5fd' : '#475569', lineHeight: 1 }}>
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
                  </Box>
                  <Typography sx={{ fontSize: '0.62rem', color: isGeneratingSpatial ? '#c4b5fd' : isLinked ? '#94a3b8' : '#475569', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {roleLabel}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

type SandboxSpaceKind = 'ceremony' | 'reception' | 'prep' | 'portraits' | 'cocktail' | 'generic';

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

function subjectRoleLabel(link: DayBlueprintSubjectRoleLink) {
  return link.subject_role?.role_name ?? `Role #${link.subject_role_id}`;
}

function isNoSpatialMoment(lockFlags: unknown): boolean {
  if (!lockFlags || typeof lockFlags !== 'object') return false;
  return Boolean((lockFlags as Record<string, unknown>).no_spatial);
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
  const text = [slot?.key, slot?.label, label, activity?.name, activity?.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/portrait|photoshoot|first look|family group|bridal party/.test(text)) return 'portraits';
  if (/prep|preparation|makeup|hair|dressing|getting ready/.test(text)) return 'prep';
  if (/reception|dinner|toast|dance|first dance|head table|banquet/.test(text)) return 'reception';
  if (/ceremony|vow|altar|aisle|church|chapel|catholic|processional|ring ceremony/.test(text)) return 'ceremony';
  if (/cocktail|line|queue|hour|welcome/.test(text)) return 'cocktail';
  return 'generic';
}

function buildSandboxObjects(slotId: number, kind: SandboxSpaceKind, label: string): SpaceSlotObject[] {
  const make = createObjectFactory(slotId);
  const base = buildRoomShell(make, label);

  switch (kind) {
    case 'ceremony':
      return [
        ...base,
        make('STAGE', 'Ceremony platform', 340, 88, 320, 128),
        make('ARCH', 'Ceremony arch', 410, 112, 180, 42),
        make('ALTAR', 'Altar', 425, 180, 150, 48),
        make('AISLE', 'Aisle', 470, 275, 60, 560),
        ...chairRows(make, 155, 345, 260, 7),
        ...chairRows(make, 585, 345, 260, 7),
        make('DOOR', 'Entrance', 455, 925, 90, 24),
        make('LABEL', 'Guest seating', 430, 665, 0, 0),
      ];
    case 'reception':
      return [
        ...base,
        make('TABLE_HEAD', 'Head table', 260, 100, 480, 58),
        make('DANCE_FLOOR', 'Dance floor', 350, 390, 300, 230),
        make('DJ_BOOTH', 'DJ booth', 710, 420, 110, 54),
        make('BAR', 'Bar', 120, 820, 220, 48),
        ...roundTables(make, [
          [205, 290], [500, 270], [795, 290],
          [235, 660], [765, 660], [500, 780],
        ]),
        make('LABEL', 'Reception seating', 425, 710, 0, 0),
      ];
    case 'prep':
      return [
        ...base,
        make('WINDOW', 'Window light', 165, 64, 210, 16),
        make('TABLE_RECT', 'Vanity', 170, 170, 180, 56),
        make('FURNITURE', 'Sofa', 610, 210, 210, 74),
        make('TABLE_RECT', 'Details table', 390, 420, 170, 90),
        make('FURNITURE', 'Wardrobe', 760, 675, 86, 200),
        make('DECORATIVE', 'Mirror', 216, 236, 80, 16),
      ];
    case 'portraits':
      return [
        ...base,
        make('STAGE', 'Portrait backdrop', 305, 115, 390, 56),
        make('FURNITURE', 'Bench', 380, 500, 240, 45),
        make('DECORATIVE', 'Key light zone', 190, 285, 90, 90),
        make('DECORATIVE', 'Fill light zone', 720, 285, 90, 90),
        make('AISLE', 'Standing mark', 470, 270, 60, 250),
      ];
    case 'cocktail':
      return [
        ...base,
        make('BAR', 'Bar', 110, 140, 260, 52),
        make('STAGE', 'Receiving line', 570, 120, 250, 60),
        ...roundTables(make, [[210, 370], [500, 380], [780, 370], [330, 650], [670, 650]], 70),
        make('AISLE', 'Guest flow', 460, 230, 80, 600),
      ];
    default:
      return [
        ...base,
        make('TABLE_RECT', 'Working area', 360, 210, 280, 90),
        make('FURNITURE', 'Seating', 180, 560, 220, 62),
        make('FURNITURE', 'Seating', 600, 560, 220, 62),
        make('AISLE', 'Movement lane', 470, 355, 60, 380),
      ];
  }
}

function buildSandboxZones(slotId: number, kind: SandboxSpaceKind, label: string): SpaceSlotZone[] {
  const baseZone: SpaceSlotZone = {
    id: slotId * 100 + 1,
    package_space_slot_id: slotId,
    name: stableKey(label),
    label,
    polygon: [
      { x: 60, y: 60 },
      { x: CANVAS_WIDTH - 60, y: 60 },
      { x: CANVAS_WIDTH - 60, y: CANVAS_HEIGHT - 60 },
      { x: 60, y: CANVAS_HEIGHT - 60 },
    ],
    color: kind === 'ceremony' ? '#93C5FD' : '#C4B5FD',
    description: null,
    order_index: 0,
    created_at: '',
    updated_at: '',
  };
  return [baseZone];
}

function createObjectFactory(slotId: number) {
  let orderIndex = 0;
  return (
    objectType: FloorPlanObjectType,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation = 0,
  ): SpaceSlotObject => {
    orderIndex += 1;
    return {
      id: slotId * 1000 + orderIndex,
      package_space_slot_id: slotId,
      object_type: objectType,
      label,
      x,
      y,
      width,
      height,
      rotation,
      metadata: null,
      order_index: orderIndex,
      created_at: '',
      updated_at: '',
    };
  };
}

function buildRoomShell(make: ReturnType<typeof createObjectFactory>, label: string) {
  return [
    make('LABEL', label, 460, 42, 0, 0),
    make('WALL', 'North wall', 60, 60, 880, 12),
    make('WALL', 'South wall', 60, 928, 880, 12),
    make('WALL', 'West wall', 60, 60, 12, 880),
    make('WALL', 'East wall', 928, 60, 12, 880),
    make('DOOR', 'Entry', 456, 928, 88, 16),
    make('WINDOW', 'Window', 700, 60, 160, 14),
  ];
}

function chairRows(make: ReturnType<typeof createObjectFactory>, x: number, startY: number, width: number, rows: number) {
  return Array.from({ length: rows }, (_, index) => (
    make('CHAIR_ROW', `Guest row ${index + 1}`, x, startY + index * 62, width, 26)
  ));
}

function roundTables(make: ReturnType<typeof createObjectFactory>, centers: Array<[number, number]>, size = 84) {
  return centers.map(([x, y], index) => (
    make('TABLE_ROUND', `Table ${index + 1}`, x - size / 2, y - size / 2, size, size)
  ));
}

function semanticSubjectPosition(kind: SandboxSpaceKind, roleLabel: string, index: number) {
  const role = normalizeValue(roleLabel);
  if (kind === 'ceremony') {
    if (role === 'officiant') return { x: 500, y: 185, rotation: 180 };
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
) {
  const text = [placement.position_hint, placement.facing_hint, placement.notes]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let x = CANVAS_WIDTH / 2;
  let y = CANVAS_HEIGHT / 2;

  if (/left|stage left|bride side/.test(text)) x = 330;
  if (/right|stage right|groom side/.test(text)) x = 670;
  if (/centre|center|middle|central/.test(text)) x = CANVAS_WIDTH / 2;
  if (/front|altar|top|north|ceremony|arch/.test(text)) y = kind === 'ceremony' ? 210 : 250;
  if (/back|rear|south|entrance|door/.test(text)) y = 830;
  if (/guest|audience|congregation|seating/.test(text)) y = kind === 'ceremony' ? 640 : 600;
  if (/aisle/.test(text)) x = CANVAS_WIDTH / 2;

  const clusterOffset = ((index % 5) - 2) * 34;
  const rowOffset = Math.floor(index / 5) * 28;

  return {
    x: clamp(x + clusterOffset, 90, CANVAS_WIDTH - 90),
    y: clamp(y + rowOffset, 80, CANVAS_HEIGHT - 80),
    rotation: rotationFromFacingHint(text, index, total, kind, roleLabel),
  };
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
