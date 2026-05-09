'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useCreateLocationRole,
  useCreateMomentAction,
  useCreateMomentPlacement,
  useCreateSpaceSlot,
  useCreateSubjectRoleLink,
  useDayBlueprint,
  useDayBlueprintAiProgress,
  useDayBlueprintAiRuns,
  useDayBlueprintVersion,
  useDeleteDay,
  useDeleteMomentAction,
  useDeleteMomentPlacement,
  useDeleteSubjectRoleLink,
  useGenerateDayBlueprintSpatial,
  useGenerateDayBlueprintDay,
  useLinkActivityLocation,
  useLocationRoles,
  useUpdateActivity,
  useUpdateDay,
  useUpdateMoment,
  useUpdateMomentAction,
  useUpdateMomentPlacement,
  useUpdateSubjectRoleLink,
} from '../hooks';
import type {
  DayBlueprintActivity,
  DayBlueprintDay,
  DayBlueprintMoment,
  DayBlueprintMomentAction,
  DayBlueprintMomentPlacement,
  DayBlueprintSpaceSlot,
  DayBlueprintSubjectRoleLink,
  DayBlueprintSummary,
  DayBlueprintVersionDetail,
} from '../types';
import {
  detailBodyCellSx,
  detailGlassCardSx,
  detailHeaderCellSx,
} from '@/features/catalog/packages/components/detail/detail-tokens';
import { useEventTypes } from '@/features/catalog/package-templates/hooks';
import { rolesApi } from '@/features/content/subjects/api/roles.api';
import type { SubjectRole } from '@/features/content/subjects/types';
import { useQuery } from '@tanstack/react-query';
import { DayBlueprintFloorPlanTab } from './DayBlueprintFloorPlanTab';
import { PackageSurfaceHeader } from '@/shared/ui/PackageSurfaceHeader';
import { DayBlueprintTimelineSection } from './DayBlueprintTimelineSection';
import { DayBlueprintActivitiesRail, type PendingDayBlueprintMomentPreview } from './DayBlueprintActivitiesRail';
import { DayBlueprintAiRunsPanel } from './DayBlueprintAiRunsPanel';
import { parseTimeToMinutes, formatMinutes, formatSeconds } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';

interface Props {
  blueprintId: number;
  versionId: number;
}

// ─── Criticality colour map ──────────────────────────────────────
const CRITICALITY_META: Record<string, { color: string; label: string }> = {
  REQUIRED: { color: '#ef4444', label: 'Required' },
  RECOMMENDED: { color: '#f59e0b', label: 'Recommended' },
  OPTIONAL: { color: '#64748b', label: 'Optional' },
};

const MOMENT_CRITICALITY_META: Record<string, { color: string; label: string }> = {
  KEY: { color: '#fbbf24', label: 'Key' },
  STANDARD: { color: '#60a5fa', label: 'Standard' },
  OPTIONAL: { color: '#94a3b8', label: 'Optional' },
  REMOVABLE: { color: '#fb7185', label: 'Removable' },
};

const CRITICALITY_OPTIONS = ['REQUIRED', 'RECOMMENDED', 'OPTIONAL'];
const MOMENT_CRITICALITY_OPTIONS = ['KEY', 'STANDARD', 'OPTIONAL', 'REMOVABLE'];
const DEFAULT_WEDDING_ROLE_NAMES = [
  'Bride',
  'Groom',
  'Best Man',
  'Maid of Honor',
  'Father of Bride',
  'Mother of Bride',
  'Father of Groom',
  'Mother of Groom',
  'Bridesmaids',
  'Groomsmen',
  'Flower Girl',
  'Ring Bearer',
  'Guests',
  'Officiant',
];

function normalizeSeedName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeEventCategory(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function stableBlueprintKey(value: string) {
  return normalizeSeedName(value).replace(/ /g, '_');
}

function activitySandboxSlotKey(activity: DayBlueprintActivity) {
  return stableBlueprintKey(`${activity.name} space`);
}

function activitySandboxSlotKeyWithId(activity: DayBlueprintActivity) {
  return stableBlueprintKey(`${activity.name} space ${activity.id}`);
}

function activitySandboxSlotLabel(activity: DayBlueprintActivity) {
  return `${activity.name.trim() || 'Activity'} Space`;
}

function spaceSlotMatchesActivity(slot: DayBlueprintSpaceSlot, activity: DayBlueprintActivity) {
  const normalizedKey = stableBlueprintKey(slot.key);
  const normalizedLabel = normalizeSeedName(slot.label);
  return (
    normalizedKey === activitySandboxSlotKey(activity) ||
    normalizedKey === activitySandboxSlotKeyWithId(activity) ||
    normalizedLabel === normalizeSeedName(activitySandboxSlotLabel(activity)) ||
    normalizedLabel === normalizeSeedName(activity.name)
  );
}

const DEFAULT_WEDDING_ROLE_KEYS = DEFAULT_WEDDING_ROLE_NAMES.map((name) => normalizeSeedName(name));
const DEFAULT_WEDDING_PRIMARY_KEYS = new Set(['bride', 'groom']);
const DEFAULT_WEDDING_TYPICAL_COUNTS = new Map<string, number>([
  ['bridesmaids', 4],
  ['groomsmen', 4],
  ['guests', 100],
]);

function criticalityColor(c?: string | null) {
  return CRITICALITY_META[c ?? 'REQUIRED']?.color ?? '#64748b';
}

function momentCriticalityColor(c?: string | null) {
  return MOMENT_CRITICALITY_META[c ?? 'STANDARD']?.color ?? '#60a5fa';
}

function momentMinutes(m: DayBlueprintMoment): number {
  if (m.duration_seconds != null) return Math.round(m.duration_seconds / 60);
  if (m.expected_duration_minutes != null) return m.expected_duration_minutes;
  return 0;
}

function activityTotals(a: DayBlueprintActivity) {
  const moments = a.moments ?? [];
  const momentMin = moments.reduce((s, m) => s + momentMinutes(m), 0);
  const planned = a.default_duration_minutes ?? momentMin;
  return { momentCount: moments.length, momentMin, planned };
}

function formatTimeDisplay(time?: string | null): string {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) return 'Unscheduled';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

function formatTimelineHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const normalizedHours = hour % 12 || 12;
  return `${normalizedHours}${ampm}`;
}

function activityTimelineMinutes(activity: DayBlueprintActivity): number {
  const total = activityTotals(activity);
  return Math.max(activity.default_duration_minutes ?? total.planned ?? 0, 15);
}

function minutesToClockTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function assignActivityLanes(
  activities: DayBlueprintActivity[],
): Map<number, number> {
  const lanes = new Map<number, number>();
  const laneEnds: number[] = [];
  const timedActivities = activities
    .filter((activity) => parseTimeToMinutes(activity.default_start_time) != null)
    .sort((left, right) => {
      const leftStart = parseTimeToMinutes(left.default_start_time) ?? 0;
      const rightStart = parseTimeToMinutes(right.default_start_time) ?? 0;
      return leftStart - rightStart;
    });

  for (const activity of timedActivities) {
    const start = parseTimeToMinutes(activity.default_start_time);
    if (start == null) continue;
    const end = start + activityTimelineMinutes(activity);
    let placed = false;

    for (let laneIndex = 0; laneIndex < laneEnds.length; laneIndex += 1) {
      if (start >= laneEnds[laneIndex]) {
        lanes.set(activity.id, laneIndex);
        laneEnds[laneIndex] = end;
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.set(activity.id, laneEnds.length);
      laneEnds.push(end);
    }
  }

  return lanes;
}

function dayTotals(d: DayBlueprintDay) {
  const activities = d.activities ?? [];
  let moments = 0;
  let minutes = 0;
  for (const a of activities) {
    const t = activityTotals(a);
    moments += t.momentCount;
    minutes += t.planned;
  }
  return { activityCount: activities.length, momentCount: moments, minutes };
}

// ─── Main editor ─────────────────────────────────────────────────

export function DayBlueprintVersionEditor({ blueprintId, versionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blueprintQuery = useDayBlueprint(blueprintId);
  const versionQuery = useDayBlueprintVersion(blueprintId, versionId);
  const createSubjectRoleLink = useCreateSubjectRoleLink(blueprintId, versionId);
  const createSpaceSlot = useCreateSpaceSlot(blueprintId, versionId);
  const createLocationRole = useCreateLocationRole();
  const linkActivityLocation = useLinkActivityLocation(blueprintId, versionId);
  const locationRolesQuery = useLocationRoles();
  const generateDay = useGenerateDayBlueprintDay(blueprintId, versionId);
  const aiRunsQuery = useDayBlueprintAiRuns(versionId, { live: true, pollMs: 1000 });

  const [activeDayId, setActiveDayId] = useState<number | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
  const [hoveredMomentRoleId, setHoveredMomentRoleId] = useState<number | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'floorPlan' | false>('floorPlan');
  const autoSeededVersionsRef = useRef<Set<number>>(new Set());

  const blueprint = blueprintQuery.data as DayBlueprintSummary | undefined;
  const version = versionQuery.data as DayBlueprintVersionDetail | undefined;
  const brandId = blueprint?.brand_id ?? null;
  const brandRolesQuery = useBrandSubjectRoles(brandId);
  const eventTypesQuery = useEventTypes({ enabled: Boolean(brandId) });

  const activeDay = useMemo(
    () => (version?.days ?? []).find((day) => day.id === activeDayId) ?? null,
    [activeDayId, version],
  );

  const selectedActivity = useMemo(
    () => (activeDay?.activities ?? []).find((activity) => activity.id === selectedActivityId) ?? null,
    [activeDay, selectedActivityId],
  );

  const selectedMoment = useMemo(
    () => (selectedActivity?.moments ?? []).find((moment) => moment.id === selectedMomentId) ?? null,
    [selectedActivity, selectedMomentId],
  );
  const dayHasMoments = useMemo(
    () => (activeDay?.activities ?? []).some((entry) => (entry.moments?.length ?? 0) > 0),
    [activeDay],
  );
  const activityHasMoments = (selectedActivity?.moments?.length ?? 0) > 0;
  const dayHasPlacements = useMemo(
    () => (activeDay?.activities ?? []).some((entry) =>
      (entry.moments ?? []).some((moment) => (moment.placements?.length ?? 0) > 0),
    ),
    [activeDay],
  );
  const activityHasPlacements = useMemo(
    () => (selectedActivity?.moments ?? []).some((moment) => (moment.placements?.length ?? 0) > 0),
    [selectedActivity],
  );
  const activeAiRun = useMemo(
    () => (aiRunsQuery.data ?? []).find((run) => run.status === 'RUNNING') ?? null,
    [aiRunsQuery.data],
  );
  const aiProgress = useDayBlueprintAiProgress(versionId, activeAiRun?.id ?? null);
  const isGeneratingMoments = Boolean(activeAiRun) || generateDay.isPending || aiProgress.status === 'running' || aiProgress.status === 'connecting';
  const pendingMomentsByActivity = useMemo<Record<number, PendingDayBlueprintMomentPreview[]>>(() => {
    if (!isGeneratingMoments) return {};

    // Build a name → id lookup so streaming events (which only know the
    // activity by name as it arrives in the LLM JSON) can be associated
    // with the right activity row in the table.
    const nameToActivityId = new Map<string, number>();
    for (const day of version?.days ?? []) {
      for (const activity of day.activities ?? []) {
        if (activity?.name) nameToActivityId.set(activity.name.toLowerCase(), activity.id);
      }
    }

    const seenByActivity = new Map<number, Set<string>>();
    const byActivity = new Map<number, PendingDayBlueprintMomentPreview[]>();

    for (const event of aiProgress.events) {
      if (
        event.step !== 'moment-preview' &&
        event.step !== 'moment-persisted' &&
        event.step !== 'moment-streaming'
      )
        continue;
      const data = event.data;
      if (!data || typeof data.momentName !== 'string') continue;

      let activityId: number | undefined;
      if (typeof data.activityId === 'number') {
        activityId = data.activityId;
      } else if (typeof data.activityName === 'string') {
        activityId = nameToActivityId.get(data.activityName.toLowerCase());
      }
      if (typeof activityId !== 'number') continue;

      const previewKey = typeof data.previewKey === 'string'
        ? data.previewKey
        : `${event.runId}:${activityId}:${data.momentOrderIndex ?? 0}:${data.momentName}`;

      let seen = seenByActivity.get(activityId);
      if (!seen) {
        seen = new Set<string>();
        seenByActivity.set(activityId, seen);
      }
      if (seen.has(previewKey)) continue;
      seen.add(previewKey);

      let rows = byActivity.get(activityId);
      if (!rows) {
        rows = [];
        byActivity.set(activityId, rows);
      }

      rows.push({
        key: previewKey,
        activityId,
        name: data.momentName,
        durationSeconds: typeof data.previewDurationSeconds === 'number' ? data.previewDurationSeconds : 60,
        orderIndex: typeof data.momentOrderIndex === 'number' ? data.momentOrderIndex : rows.length,
        actionCount: typeof data.previewActionCount === 'number' ? data.previewActionCount : undefined,
        placementCount: typeof data.previewPlacementCount === 'number' ? data.previewPlacementCount : undefined,
      });
    }

    const result: Record<number, PendingDayBlueprintMomentPreview[]> = {};
    byActivity.forEach((rows, activityId) => {
      result[activityId] = rows.sort((left, right) => {
        if (left.orderIndex !== right.orderIndex) return left.orderIndex - right.orderIndex;
        return left.key.localeCompare(right.key);
      });
    });
    return result;
  }, [aiProgress.events, isGeneratingMoments, version]);

  // Per-subject spatial generation status — used by the People gallery in the
  // floor plan tab to flash an animation while the AI is reasoning about
  // placement for that subject. Derived from `subject-spatial-start` and
  // `subject-spatial-result` SSE events emitted by the spatial generator.
  const subjectSpatialStatus = useMemo<Map<number, 'generating' | 'done'>>(() => {
    const map = new Map<number, 'generating' | 'done'>();
    if (!activeAiRun) return map;
    for (const event of aiProgress.events) {
      const kind = event.data?.eventKind;
      const roleId = event.data?.subjectRoleId;
      if (typeof roleId !== 'number') continue;
      if (kind === 'subject-spatial-start') {
        if (map.get(roleId) !== 'done') map.set(roleId, 'generating');
      } else if (kind === 'subject-spatial-result') {
        map.set(roleId, 'done');
      }
    }
    return map;
  }, [aiProgress.events, activeAiRun]);

  useEffect(() => {
    const days = version?.days ?? [];
    setActiveDayId((prev) => {
      if (days.length === 0) return null;
      return prev != null && days.some((day) => day.id === prev) ? prev : days[0].id;
    });
  }, [version]);

  useEffect(() => {
    const activities = activeDay?.activities ?? [];
    setSelectedActivityId((prev) => {
      if (activities.length === 0) return null;
      return prev != null && activities.some((activity) => activity.id === prev) ? prev : null;
    });
  }, [activeDay]);

  useEffect(() => {
    const moments = selectedActivity?.moments ?? [];
    setSelectedMomentId((prev) => (
      prev != null && moments.some((moment) => moment.id === prev) ? prev : null
    ));
  }, [selectedActivity]);

  const handleSelectDay = (dayId: number) => {
    setActiveDayId(dayId);
    setSelectedActivityId(null);
    setSelectedMomentId(null);
  };

  const handleSelectActivity = (dayId: number, activityId: number) => {
    setActiveDayId(dayId);
    setSelectedActivityId(activityId);
    setSelectedMomentId(null);
  };

  const handleToggleActivitySelection = (activityId: number | null) => {
    setSelectedActivityId((prev) => (prev === activityId ? null : activityId));
    setSelectedMomentId(null);
  };

  // Auto-generate when coming from the create wizard
  const autoGenerateFiredRef = useRef(false);
  useEffect(() => {
    if (autoGenerateFiredRef.current) return;
    if (searchParams?.get('autogenerate') !== '1') return;
    const dayForGeneration = activeDay ?? (version?.days ?? [])[0] ?? null;
    if (!dayForGeneration) return;
    const stored = sessionStorage.getItem(`autogenerate-${blueprintId}`);
    if (!stored) return;
    autoGenerateFiredRef.current = true;
    sessionStorage.removeItem(`autogenerate-${blueprintId}`);
    try {
      const { brief } = JSON.parse(stored) as { brief: string[] };
      const prompt = brief.length > 0
        ? `Confirmed details from the Event Planner wizard:\n${brief.map((b) => `- ${b}`).join('\n')}`
        : undefined;
      generateDay.mutate({ dayId: dayForGeneration.id, prompt });
    } catch { /* ignore parse errors */ }
    // Clean up the URL param
    const url = new URL(window.location.href);
    url.searchParams.delete('autogenerate');
    router.replace(url.pathname + url.search);
  }, [activeDay, blueprintId, searchParams, generateDay, router, version]);

  const handleSelectMoment = (activityId: number, momentId: number) => {
    setSelectedActivityId(activityId);
    setSelectedMomentId((prev) => (prev === momentId ? null : momentId));
  };

  useEffect(() => {
    setHoveredMomentRoleId(null);
  }, [selectedActivityId, selectedMomentId]);

  useEffect(() => {
    if (!version || !blueprint || version.status !== 'DRAFT') return;
    if (autoSeededVersionsRef.current.has(version.id)) return;

    const isWeddingBlueprint = blueprint.event_category.toLowerCase().includes('wedding');

    if (locationRolesQuery.isLoading) return;
    if (isWeddingBlueprint && brandRolesQuery.isLoading) return;

    const locationRoles = locationRolesQuery.data ?? [];
    const roleKeyById = new Map(locationRoles.map((role) => [role.id, normalizeSeedName(role.key)]));
    const sandboxRole = locationRoles.find((role) => normalizeSeedName(role.key) === 'sandbox');
    const sandboxRoleId = sandboxRole?.id ?? null;
    const versionSlots = version.space_slots ?? [];
    const allActivities = (version.days ?? []).flatMap((day) => day.activities ?? []);

    const activityHasSpecificNonSandboxSpace = (activity: DayBlueprintActivity) => {
      const activityRoleIds = new Set((activity.activity_locations ?? []).map((link) => link.day_blueprint_location_role_id));
      return Array.from(activityRoleIds).some((roleId) => {
        if (roleKeyById.get(roleId) === 'sandbox') return false;
        return versionSlots.some((slot) => slot.day_blueprint_location_role_id === roleId);
      });
    };

    const missingSandboxActivities = allActivities.filter((activity) => {
      if (activityHasSpecificNonSandboxSpace(activity)) return false;
      return !versionSlots.some((slot) => {
        if (sandboxRoleId != null && slot.day_blueprint_location_role_id !== sandboxRoleId) return false;
        return spaceSlotMatchesActivity(slot, activity);
      });
    });

    const activitiesNeedingSandboxLink = allActivities.filter((activity) => {
      if (activityHasSpecificNonSandboxSpace(activity)) return false;
      if (sandboxRoleId == null) return true;
      return !(activity.activity_locations ?? []).some(
        (link) => link.day_blueprint_location_role_id === sandboxRoleId,
      );
    });

    const existingRoleIds = new Set((version.subject_roles ?? []).map((link) => link.subject_role_id));
    const matchingWeddingRoles = isWeddingBlueprint
      ? (brandRolesQuery.data ?? []).filter((role) =>
          DEFAULT_WEDDING_ROLE_KEYS.includes(normalizeSeedName(role.role_name)),
        )
      : [];
    const missingWeddingRoles = matchingWeddingRoles.filter((role) => !existingRoleIds.has(role.id));

    if (
      missingSandboxActivities.length === 0 &&
      activitiesNeedingSandboxLink.length === 0 &&
      missingWeddingRoles.length === 0
    ) return;

    autoSeededVersionsRef.current.add(version.id);

    void (async () => {
      try {
        let resolvedSandboxRole = sandboxRole;

        if (!resolvedSandboxRole && (missingSandboxActivities.length > 0 || activitiesNeedingSandboxLink.length > 0)) {
          resolvedSandboxRole = await createLocationRole.mutateAsync({
            key: 'sandbox',
            display_name: 'Sandbox',
            description: 'Generic sandbox location for drafting placements before real venue mappings are added.',
            order_index: 0,
            is_active: true,
          });
        }

        if (resolvedSandboxRole) {
          const plannedKeys = new Set(versionSlots
            .filter((slot) => slot.day_blueprint_location_role_id === resolvedSandboxRole.id)
            .map((slot) => stableBlueprintKey(slot.key)));

          for (const activity of activitiesNeedingSandboxLink) {
            await linkActivityLocation.mutateAsync({
              activityId: activity.id,
              data: {
                day_blueprint_location_role_id: resolvedSandboxRole.id,
                is_primary: true,
                order_index: 0,
              },
            });
          }

          for (const activity of missingSandboxActivities) {
            const preferredKey = activitySandboxSlotKey(activity);
            const key = plannedKeys.has(preferredKey)
              ? activitySandboxSlotKeyWithId(activity)
              : preferredKey;
            plannedKeys.add(key);

            await createSpaceSlot.mutateAsync({
              day_blueprint_location_role_id: resolvedSandboxRole.id,
              key,
              label: activitySandboxSlotLabel(activity),
              description: `Default sandbox canvas for ${activity.name}.`,
              order_index: versionSlots.length + plannedKeys.size,
            });
          }
        }

        if (missingWeddingRoles.length > 0) {
          for (const role of missingWeddingRoles) {
            const normalizedRole = normalizeSeedName(role.role_name);
            await createSubjectRoleLink.mutateAsync({
              subject_role_id: role.id,
              is_primary: DEFAULT_WEDDING_PRIMARY_KEYS.has(normalizedRole),
              typical_count: DEFAULT_WEDDING_TYPICAL_COUNTS.get(normalizedRole) ?? (role.is_group ? 4 : 1),
              order_index: DEFAULT_WEDDING_ROLE_KEYS.indexOf(normalizedRole),
            });
          }
        }
      } catch {
        autoSeededVersionsRef.current.delete(version.id);
      }
    })();
  }, [
    blueprint,
    brandRolesQuery.data,
    brandRolesQuery.isLoading,
    createLocationRole,
    createSpaceSlot,
    createSubjectRoleLink,
    linkActivityLocation,
    locationRolesQuery.data,
    locationRolesQuery.isLoading,
    version,
  ]);

  if (versionQuery.isLoading || blueprintQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (versionQuery.error || !version) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#ef4444' }}>Failed to load version.</Typography>
      </Box>
    );
  }

  const isDraft = version.status === 'DRAFT';

  return (
    <Box sx={{ mx: { xs: -2, md: -3 }, mt: { xs: -2, md: -3 }, pb: 0 }}>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          pb: 2,
          borderBottom: '1px solid rgba(52, 58, 68, 0.5)',
        }}
      >
        <PackageSurfaceHeader
          title={blueprint?.display_name ?? 'Blueprint'}
          titlePlaceholder="Blueprint"
          onVersionHistory={() => router.push('/day-designer')}
          chips={[
            {
              key: 'version',
              label: (
                <Chip
                  label={`v${version.version_number}`}
                  size="small"
                  sx={{ height: 20, bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none' }}
                />
              ),
            },
            {
              key: 'status',
              label: (
                <Chip
                  label={version.status}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor:
                      version.status === 'DRAFT'
                        ? 'rgba(245,158,11,0.14)'
                        : version.status === 'PUBLISHED'
                          ? 'rgba(34,197,94,0.14)'
                          : 'rgba(148,163,184,0.14)',
                    color:
                      version.status === 'DRAFT'
                        ? '#fbbf24'
                        : version.status === 'PUBLISHED'
                          ? '#22c55e'
                          : '#94a3b8',
                    border: 'none',
                  }}
                />
              ),
            },
            {
              key: 'category',
              label: (
                <Chip
                  label={blueprint?.event_category ?? 'Uncategorized'}
                  size="small"
                  sx={{ height: 20, bgcolor: 'rgba(148,163,184,0.14)', color: '#cbd5e1', border: 'none' }}
                />
              ),
            },
          ]}
          readOnlyMessage={!isDraft ? 'Read-only - create a new draft to edit.' : undefined}
        />
      </Box>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 1,
          pb: 1,
          background:
            'linear-gradient(to right, rgba(255,255,255,0.025) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.12) 65%, rgba(255,255,255,0.025) 100%)',
          borderBottom: '1px solid rgba(52, 58, 68, 0.4)',
        }}
      >
        <DayBlueprintTimelineSection
          days={version.days ?? []}
          activeDayId={activeDayId}
          selectedActivityId={selectedActivityId}
          onSelectDay={handleSelectDay}
          onSelectActivity={handleSelectActivity}
          isDraft={isDraft}
          blueprintId={blueprintId}
          versionId={versionId}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          height: { lg: 'calc(100dvh - 365px)' },
          minHeight: { xs: 'auto', lg: 460 },
          flexDirection: { xs: 'column', lg: 'row' },
          overflow: { lg: 'hidden' },
        }}
      >
        <Box
          sx={{
            width: { lg: '26%' },
            flexShrink: 0,
            background: 'rgba(255, 255, 255, 0.018)',
            borderRight: { lg: '1px solid rgba(52, 58, 68, 0.4)' },
            borderBottom: { xs: '1px solid rgba(52, 58, 68, 0.4)', lg: 'none' },
          }}
        >
          <DayBlueprintActivitiesRail
            day={activeDay}
            selectedActivityId={selectedActivityId}
            selectedMomentId={selectedMomentId}
            onSelectActivity={handleToggleActivitySelection}
            onSelectMoment={handleSelectMoment}
            isDraft={isDraft}
            blueprintId={blueprintId}
            versionId={versionId}
            version={version}
            isGeneratingMoments={isGeneratingMoments}
            pendingMomentsByActivity={pendingMomentsByActivity}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(160deg, rgba(139,92,246,0.04) 0%, transparent 50%)',
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
              <Box sx={{ display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column' }}>
                <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.09)', px: 2, pt: 0.75 }}>
                  <Tabs
                    value={rightPanelTab}
                    onChange={(_, value) => setRightPanelTab(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      minHeight: 32,
                      '& .MuiTab-root': {
                        minHeight: 28,
                        py: 0.25,
                        px: 1.25,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#64748b',
                        borderRadius: 1,
                        '&.Mui-selected': { color: '#e2e8f0', bgcolor: 'rgba(96, 165, 250, 0.12)' },
                      },
                      '& .MuiTabs-indicator': { display: 'none' },
                    }}
                  >
                    <Tab value="floorPlan" label="Floor plan" />
                  </Tabs>
                </Box>

                {rightPanelTab === false && (
                  <Box sx={{ p: 2.5 }}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                      Day switching is handled by the timeline chips above. Open Floor Plan here when you need spatial context.
                    </Typography>
                  </Box>
                )}

                {rightPanelTab === 'floorPlan' && (
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: { xs: 1, md: 1.25 } }}>
                      <DayBlueprintFloorPlanTab
                        slots={version.space_slots ?? []}
                        subjectRoles={version.subject_roles ?? []}
                        activeDay={activeDay}
                        selectedActivity={selectedActivity}
                        selectedMoment={selectedMoment}
                        hoveredMomentRoleId={hoveredMomentRoleId}
                        onHoverMomentRole={setHoveredMomentRoleId}
                        subjectSpatialStatus={subjectSpatialStatus}
                      />
                    </Box>
                  </Box>
                )}

              </Box>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            width: { lg: '22%' },
            flexShrink: 0,
            background: 'rgba(255, 255, 255, 0.018)',
            borderLeft: { lg: '1px solid rgba(52, 58, 68, 0.4)' },
            borderTop: { xs: '1px solid rgba(52, 58, 68, 0.4)', lg: 'none' },
          }}
        >
          <BlueprintContextPanel
            blueprintId={blueprintId}
            versionId={versionId}
            day={activeDay}
            activity={selectedActivity}
            moment={selectedMoment}
            version={version}
            readOnly={!isDraft}
            externalHoveredMomentRoleId={hoveredMomentRoleId}
            generateDay={generateDay}
            isGeneratingMoments={isGeneratingMoments}
          />
        </Box>
      </Box>

      <DayBlueprintAiRunsPanel
        blueprintId={blueprintId}
        versionId={versionId}
        versionLabel={`v${version.version_number} · ${blueprint?.display_name ?? 'Blueprint'}`}
        activeDay={activeDay}
        readOnly={!isDraft}
      />

    </Box>
  );
}

function StatChip({ label, color }: { label: string; color: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22, fontSize: '0.7rem', fontWeight: 700,
        bgcolor: `${color}1A`, color, border: 'none',
      }}
    />
  );
}

function BlueprintContextPanel({
  blueprintId,
  versionId,
  day,
  activity,
  moment,
  version,
  readOnly,
  externalHoveredMomentRoleId,
  generateDay,
  isGeneratingMoments,
}: {
  blueprintId: number;
  versionId: number;
  day: DayBlueprintDay | null;
  activity: DayBlueprintActivity | null;
  moment: DayBlueprintMoment | null;
  version: DayBlueprintVersionDetail;
  readOnly: boolean;
  externalHoveredMomentRoleId: number | null;
  generateDay: ReturnType<typeof useGenerateDayBlueprintDay>;
  isGeneratingMoments: boolean;
}) {
  const updateActivity = useUpdateActivity(blueprintId, versionId);
  const updateMoment = useUpdateMoment(blueprintId, versionId);
  const updateMomentAction = useUpdateMomentAction(blueprintId, versionId);
  const updateMomentPlacement = useUpdateMomentPlacement(blueprintId, versionId);
  const generateSpatial = useGenerateDayBlueprintSpatial(blueprintId, versionId);

  const roleLabels = useMemo(() => new Map(
    (version.subject_roles ?? []).map((role) => [
      role.subject_role_id,
      role.subject_role?.role_name ?? `Role #${role.subject_role_id}`,
    ]),
  ), [version.subject_roles]);
  const roleTypicalCounts = useMemo(() => new Map(
    (version.subject_roles ?? []).map((role) => [role.subject_role_id, role.typical_count ?? 1]),
  ), [version.subject_roles]);
  const momentLocks = activeLockLabels(moment?.lock_flags, MOMENT_LOCK_OPTIONS);
  const momentNoSpatial = isNoSpatialMoment(moment?.lock_flags);
  const activitySummary = activity ? activityTotals(activity) : null;
  const daySummary = day ? dayTotals(day) : null;
  const activityReferencedRoleIds = useMemo(() => {
    if (!activity) return new Set<number>();
    const ids = new Set<number>();
    for (const row of activity.moments ?? []) {
      for (const action of row.actions ?? []) ids.add(action.subject_role_id);
      for (const placement of row.placements ?? []) ids.add(placement.subject_role_id);
    }
    return ids;
  }, [activity]);
  const momentSubjectRows = useMemo(() => {
    if (!moment) return [] as Array<{ roleId: number; actions: number; placements: number }>;
    const byRole = new Map<number, { actions: number; placements: number }>();
    for (const action of moment.actions ?? []) {
      const curr = byRole.get(action.subject_role_id) ?? { actions: 0, placements: 0 };
      curr.actions += 1;
      byRole.set(action.subject_role_id, curr);
    }
    for (const placement of moment.placements ?? []) {
      const curr = byRole.get(placement.subject_role_id) ?? { actions: 0, placements: 0 };
      curr.placements += 1;
      byRole.set(placement.subject_role_id, curr);
    }
    return Array.from(byRole.entries())
      .map(([roleId, counts]) => ({ roleId, ...counts }))
      .sort((left, right) => {
        const leftLabel = roleLabels.get(left.roleId) ?? '';
        const rightLabel = roleLabels.get(right.roleId) ?? '';
        return leftLabel.localeCompare(rightLabel);
      });
  }, [moment, roleLabels]);
  const [activeMomentRoleId, setActiveMomentRoleId] = useState<number | null>(null);
  const [hoverMomentRoleId, setHoverMomentRoleId] = useState<number | null>(null);
  const effectiveMomentRoleId = activeMomentRoleId ?? hoverMomentRoleId ?? externalHoveredMomentRoleId;
  useEffect(() => {
    setActiveMomentRoleId(null);
    setHoverMomentRoleId(null);
  }, [moment?.id]);

  const momentReferencedRoleIds = useMemo(() => {
    if (!moment) return new Set<number>();
    const ids = new Set<number>();
    for (const action of moment.actions ?? []) ids.add(action.subject_role_id);
    for (const placement of moment.placements ?? []) ids.add(placement.subject_role_id);
    return ids;
  }, [moment]);

  const visibleMomentActions = useMemo(() => {
    const rows = moment?.actions ?? [];
    if (!effectiveMomentRoleId) return [];
    return rows.filter((row) => row.subject_role_id === effectiveMomentRoleId);
  }, [moment, effectiveMomentRoleId]);

  const visibleMomentPlacements = useMemo(() => {
    if (momentNoSpatial) return [];
    const rows = moment?.placements ?? [];
    if (!effectiveMomentRoleId) return [];
    return rows.filter((row) => row.subject_role_id === effectiveMomentRoleId);
  }, [moment, momentNoSpatial, effectiveMomentRoleId]);

  const hoveredActivityRoleContext = useMemo(() => {
    if (!activity || !externalHoveredMomentRoleId) return null;
    const relevantMoments = (activity.moments ?? []).flatMap((row) => {
      const roleActions = (row.actions ?? []).filter((action) => action.subject_role_id === externalHoveredMomentRoleId);
      const rolePlacements = (row.placements ?? []).filter((placement) => placement.subject_role_id === externalHoveredMomentRoleId);
      if (roleActions.length === 0 && rolePlacements.length === 0) return [];
      return [{ row, roleActions, rolePlacements }];
    });
    if (relevantMoments.length === 0) return null;

    const actionCount = relevantMoments.reduce((sum, item) => sum + item.roleActions.length, 0);
    const placementCount = relevantMoments.reduce((sum, item) => sum + item.rolePlacements.length, 0);
    const emphasisValues = Array.from(new Set(
      relevantMoments.flatMap((item) => item.roleActions.map((action) => action.emphasis).filter(Boolean)),
    ));
    const positionHints = Array.from(new Set(
      relevantMoments.flatMap((item) => item.rolePlacements.map((placement) => placement.position_hint).filter(Boolean)),
    ));
    const facingHints = Array.from(new Set(
      relevantMoments.flatMap((item) => item.rolePlacements.map((placement) => placement.facing_hint).filter(Boolean)),
    ));
    const momentsMissingPlacements = relevantMoments
      .filter((item) => item.roleActions.length > 0 && item.rolePlacements.length === 0)
      .map((item) => item.row.name);
    const momentsMissingActions = relevantMoments
      .filter((item) => item.rolePlacements.length > 0 && item.roleActions.length === 0)
      .map((item) => item.row.name);

    return {
      roleId: externalHoveredMomentRoleId,
      roleName: roleLabels.get(externalHoveredMomentRoleId) ?? `Role #${externalHoveredMomentRoleId}`,
      actionCount,
      placementCount,
      moments: relevantMoments.map((item) => item.row),
      emphasisValues,
      positionHints,
      facingHints,
      momentsMissingPlacements,
      momentsMissingActions,
    };
  }, [activity, externalHoveredMomentRoleId, roleLabels]);

  const canGenerateSpatial = !readOnly && Boolean(day);
  const canGenerateMoments = !readOnly && Boolean(day);
  const generatingMoments = generateDay.isPending || isGeneratingMoments;
  const dayHasMoments = (day?.activities ?? []).some((entry) => (entry.moments?.length ?? 0) > 0);
  const activityHasMoments = (activity?.moments?.length ?? 0) > 0;
  const dayHasPlacements = (day?.activities ?? []).some((entry) =>
    (entry.moments ?? []).some((momentRow) => (momentRow.placements?.length ?? 0) > 0),
  );
  const activityHasPlacements = (activity?.moments ?? []).some(
    (momentRow) => (momentRow.placements?.length ?? 0) > 0,
  );
  const spatialActionLabel = activity
    ? (activityHasPlacements ? 'Regenerate Activity Spatial' : 'Generate Activity Spatial')
    : (dayHasPlacements ? 'Regenerate Day Spatial' : 'Generate Day Spatial');
  const momentActionLabel = activity
    ? (activityHasMoments ? 'Regenerate Moments for Activity' : 'Generate Moments for Activity')
    : (dayHasMoments ? 'Regenerate Moments for All Activities' : 'Generate Moments for All Activities');
  const spatialTooltip = activity
    ? 'Regenerate spatial placement and facing hints for the selected activity. Existing placements will be replaced.'
    : 'Regenerate spatial placement and facing hints for the current day. Existing placements will be replaced.';
  const momentTooltip = activity
    ? 'Regenerate moments for only the selected activity. Existing moments are replaced, then rebuilt.'
    : 'Regenerate moments for all activities on the current day. Existing moments are replaced, then rebuilt.';

  const handleGenerateSpatial = () => {
    if (!day) return;
    generateSpatial.mutate({
      dayId: day.id,
      activityId: activity?.id,
      momentId: moment?.id,
    });
  };

  const handleGenerateMomentsForActivity = () => {
    if (!day || !activity) return;
    generateDay.mutate({ dayId: day.id, activityId: activity.id });
  };

  const handleGenerateMomentsForDay = () => {
    if (!day) return;
    generateDay.mutate({ dayId: day.id });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {moment ? 'Moment Context' : activity ? 'Activity Context' : day ? 'Day Context' : 'Blueprint Context'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2 }}>
        {canGenerateMoments && (
          <Box sx={{ mb: 1.25 }}>
            <Tooltip title={generatingMoments ? 'Generating moments…' : momentTooltip}>
              <span>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={generatingMoments
                    ? <CircularProgress size={13} thickness={5} sx={{ color: '#34d399' }} />
                    : <AutoAwesomeRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                  disabled={generatingMoments}
                  onClick={activity ? handleGenerateMomentsForActivity : handleGenerateMomentsForDay}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#34d399',
                    borderColor: 'rgba(52,211,153,0.25)',
                    bgcolor: 'rgba(52,211,153,0.07)',
                    py: 0.65,
                    '&:hover': { borderColor: 'rgba(52,211,153,0.5)', bgcolor: 'rgba(52,211,153,0.12)' },
                    '&.Mui-disabled': { color: '#475569', borderColor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  {generatingMoments
                    ? 'Generating moments…'
                    : momentActionLabel}
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}

        {canGenerateSpatial && (
          <Box sx={{ mb: 2 }}>
            <Tooltip title={generateSpatial.isPending ? 'Generating spatial plan…' : spatialTooltip}>
              <span>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={generateSpatial.isPending
                    ? <CircularProgress size={13} thickness={5} sx={{ color: '#60a5fa' }} />
                    : <AutoAwesomeRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                  disabled={generateSpatial.isPending}
                  onClick={handleGenerateSpatial}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#60a5fa',
                    borderColor: 'rgba(96,165,250,0.25)',
                    bgcolor: 'rgba(96,165,250,0.06)',
                    py: 0.65,
                    '&:hover': { borderColor: 'rgba(96,165,250,0.5)', bgcolor: 'rgba(96,165,250,0.1)' },
                    '&.Mui-disabled': { color: '#475569', borderColor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  {generateSpatial.isPending ? 'Generating…' : spatialActionLabel}
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}

        {!day && (
          <Typography sx={{ fontSize: '0.74rem', color: '#475569', fontStyle: 'italic' }}>
            Select a day or activity to inspect its planning context.
          </Typography>
        )}

        {day && !activity && (
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                {day.name}
              </Typography>
              {day.description && (
                <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55, mt: 0.5 }}>
                  {day.description}
                </Typography>
              )}
            </Box>

            <Stack spacing={1}>
              <ContextMetaRow label="Activities" value={`${daySummary?.activityCount ?? 0}`} />
              <ContextMetaRow label="Moments" value={`${daySummary?.momentCount ?? 0}`} />
              <ContextMetaRow label="Planned runtime" value={formatMinutes(daySummary?.minutes ?? 0)} />
              <ContextMetaRow label="Day start" value={formatTimeDisplay(day.default_start_time)} />
            </Stack>

          </Stack>
        )}

        {activity && !moment && (
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                {activity.name}
              </Typography>
              {readOnly ? (
                activity.description && (
                  <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55, mt: 0.5 }}>
                    {activity.description}
                  </Typography>
                )
              ) : (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  placeholder="Add a description or planning note…"
                  defaultValue={activity.description ?? ''}
                  key={`activity-desc-${activity.id}`}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (activity.description ?? '')) {
                      updateActivity.mutate({ activityId: activity.id, data: { description: val || undefined } });
                    }
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 0.75,
                    '& .MuiOutlinedInput-root': { fontSize: '0.74rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.03)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96,165,250,0.3)' },
                  }}
                />
              )}
            </Box>

            <Stack spacing={1}>
              <ContextMetaRow label="Day" value={day?.name ?? 'Unassigned'} />
              <ContextMetaRow label="Start time" value={formatTimeDisplay(activity.default_start_time)} />
              <ContextMetaRow label="Target duration" value={formatMinutes(activity.default_duration_minutes ?? activitySummary?.planned ?? 0)} />
              <ContextMetaRow
                label="Duration band"
                value={activity.duration_min_minutes != null || activity.duration_max_minutes != null
                  ? `${activity.duration_min_minutes ?? '?'}-${activity.duration_max_minutes ?? '?'} min`
                  : 'No band set'}
              />
              <ContextMetaRow label="Moments" value={`${activitySummary?.momentCount ?? 0}`} />
              <ContextMetaRow label="Moment runtime" value={formatMinutes(activitySummary?.momentMin ?? 0)} />
            </Stack>

            {hoveredActivityRoleContext && (
              <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                  Person Focus
                </Typography>
                <Box sx={{ px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)' }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#dbeafe', fontWeight: 700 }}>
                    {hoveredActivityRoleContext.roleName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.35 }}>
                    {hoveredActivityRoleContext.actionCount} action{hoveredActivityRoleContext.actionCount === 1 ? '' : 's'} · {hoveredActivityRoleContext.placementCount} placement{hoveredActivityRoleContext.placementCount === 1 ? '' : 's'}
                  </Typography>
                  {hoveredActivityRoleContext.emphasisValues.length > 0 && (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.7 }}>
                      {hoveredActivityRoleContext.emphasisValues.map((value) => (
                        <Chip
                          key={`emphasis-${value}`}
                          label={`Action: ${value}`}
                          size="small"
                          sx={{ height: 20, bgcolor: 'rgba(56,189,248,0.14)', color: '#67e8f9', border: 'none' }}
                        />
                      ))}
                    </Stack>
                  )}
                  {(hoveredActivityRoleContext.positionHints.length > 0 || hoveredActivityRoleContext.facingHints.length > 0) && (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.55 }}>
                      {hoveredActivityRoleContext.positionHints.map((value) => (
                        <Chip
                          key={`position-${value}`}
                          label={`Position: ${value}`}
                          size="small"
                          sx={{ height: 20, bgcolor: 'rgba(167,139,250,0.14)', color: '#c4b5fd', border: 'none' }}
                        />
                      ))}
                      {hoveredActivityRoleContext.facingHints.map((value) => (
                        <Chip
                          key={`facing-${value}`}
                          label={`Facing: ${value}`}
                          size="small"
                          sx={{ height: 20, bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none' }}
                        />
                      ))}
                    </Stack>
                  )}
                  {(hoveredActivityRoleContext.momentsMissingPlacements.length > 0 || hoveredActivityRoleContext.momentsMissingActions.length > 0) && (
                    <Box sx={{ mt: 0.7, px: 0.9, py: 0.65, borderRadius: 1, bgcolor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)' }}>
                      <Typography sx={{ fontSize: '0.64rem', color: '#fcd34d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Assignment warnings
                      </Typography>
                      {hoveredActivityRoleContext.momentsMissingPlacements.length > 0 && (
                        <Typography sx={{ fontSize: '0.64rem', color: '#fbbf24', mt: 0.35 }}>
                          Actions without placement: {hoveredActivityRoleContext.momentsMissingPlacements.join(', ')}
                        </Typography>
                      )}
                      {hoveredActivityRoleContext.momentsMissingActions.length > 0 && (
                        <Typography sx={{ fontSize: '0.64rem', color: '#fbbf24', mt: 0.2 }}>
                          Placements without action: {hoveredActivityRoleContext.momentsMissingActions.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.5 }}>
                    Moments: {hoveredActivityRoleContext.moments.map((entry) => entry.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                Locations on this activity
              </Typography>
              {(activity.activity_locations?.length ?? 0) === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  No activity-level locations linked yet.
                </Typography>
              ) : (
                <Stack spacing={0.6}>
                  {activity.activity_locations?.map((entry) => (
                    <Box key={entry.id} sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>
                        {entry.location_role?.display_name ?? `Location #${entry.day_blueprint_location_role_id}`}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.35 }}>
                        {entry.is_primary ? 'Primary location' : 'Secondary location'}
                        {entry.notes ? ` · ${entry.notes}` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

          </Stack>
        )}

        {activity && moment && (
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                {moment.name}
              </Typography>
              {moment.description && (
                <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55, mt: 0.5 }}>
                  {moment.description}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              <Chip label={activity.name} size="small" sx={{ bgcolor: 'rgba(148,163,184,0.14)', color: '#cbd5e1', border: 'none' }} />
              {moment.is_key_moment && (
                <Chip label="Key moment" size="small" sx={{ bgcolor: 'rgba(251,191,36,0.14)', color: '#fbbf24', border: 'none' }} />
              )}
              {momentLocks.map((label) => (
                <Chip
                  key={label}
                  label={`Locked: ${label}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none' }}
                />
              ))}
              {momentNoSpatial && (
                <Chip
                  label="No spatial"
                  size="small"
                  sx={{ bgcolor: 'rgba(251,113,133,0.16)', color: '#fda4af', border: 'none' }}
                />
              )}
            </Stack>

            <Stack spacing={1}>
              <ContextMetaRow label="Day" value={day?.name ?? 'Unassigned'} />
              <ContextMetaRow label="Duration" value={formatSeconds(moment.duration_seconds)} />
              {readOnly ? (
                <ContextMetaRow label="Criticality" value={moment.criticality ?? 'STANDARD'} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Criticality
                  </Typography>
                  <Select
                    size="small"
                    value={moment.criticality ?? 'STANDARD'}
                    onChange={(e) => updateMoment.mutate({ momentId: moment.id, data: { criticality: e.target.value } })}
                    sx={{ fontSize: '0.72rem', color: '#cbd5e1', bgcolor: 'rgba(255,255,255,0.03)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' }, minWidth: 120 }}
                  >
                    {MOMENT_CRITICALITY_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt} sx={{ fontSize: '0.76rem' }}>
                        {MOMENT_CRITICALITY_META[opt]?.label ?? opt}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
              {!readOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Spatial mode
                  </Typography>
                  <FormControlLabel
                    sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.72rem', color: '#cbd5e1' } }}
                    control={(
                      <Checkbox
                        size="small"
                        checked={momentNoSpatial}
                        onChange={(event) => {
                          updateMoment.mutate({
                            momentId: moment.id,
                            data: {
                              lock_flags: {
                                ...parseLockFlags(moment.lock_flags),
                                no_spatial: event.target.checked,
                              },
                            },
                          });
                        }}
                      />
                    )}
                    label={momentNoSpatial ? 'No spatial' : 'Use placements'}
                  />
                </Box>
              )}
              {readOnly && (
                <ContextMetaRow
                  label="Spatial mode"
                  value={momentNoSpatial ? 'No spatial' : 'Use placements'}
                />
              )}
              <ContextMetaRow label="Actions" value={`${moment.actions?.length ?? 0}`} />
              <ContextMetaRow label="Placements" value={momentNoSpatial ? '0 (no spatial)' : `${moment.placements?.length ?? 0}`} />
            </Stack>

            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                Subjects in this moment
              </Typography>
              {(version.subject_roles ?? []).length === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  No subject roles configured for this version yet.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {(version.subject_roles ?? []).map((link) => {
                    const roleId = link.subject_role_id;
                    const count = link.typical_count ?? 1;
                    const label = link.subject_role?.role_name ?? `Role #${roleId}`;
                    const initials = label.split(' ').map((w: string) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
                    const isReferenced = momentReferencedRoleIds.has(roleId);
                    const isActive = effectiveMomentRoleId === roleId;
                    return (
                      <Box
                        key={roleId}
                        onClick={() => setActiveMomentRoleId((prev) => (prev === roleId ? null : roleId))}
                        onMouseEnter={() => setHoverMomentRoleId(roleId)}
                        onMouseLeave={() => setHoverMomentRoleId((prev) => (prev === roleId ? null : prev))}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.4,
                          width: 52,
                          opacity: isReferenced ? 1 : 0.28,
                          cursor: 'pointer',
                        }}
                      >
                        <Box
                          sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: isReferenced
                              ? 'linear-gradient(135deg, rgba(96,165,250,0.28), rgba(168,85,247,0.28))'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isActive ? '#60a5fa' : isReferenced ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                            boxShadow: isActive ? '0 0 0 1px rgba(96,165,250,0.35)' : 'none',
                          }}
                        >
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: isReferenced ? '#93c5fd' : '#475569', lineHeight: 1 }}>
                            {initials}
                          </Typography>
                          {count > 1 && (
                            <Box sx={{
                              position: 'absolute', bottom: -3, right: -3,
                              width: 14, height: 14, borderRadius: '50%',
                              bgcolor: '#1e293b', border: '1px solid rgba(96,165,250,0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Typography sx={{ fontSize: '0.52rem', fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>{count}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '0.6rem', color: isReferenced ? '#94a3b8' : '#475569', textAlign: 'center', lineHeight: 1.25, wordBreak: 'break-word' }}>
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
              {momentSubjectRows.length === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  No subjects mapped to this moment yet.
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', mt: 0.6 }}>
                  Hover a subject to preview its actions and placements. Click to pin.
                </Typography>
              )}
            </Box>

            {/* ── Actions editor ─────────────────────────────────── */}
            {visibleMomentActions.length > 0 && (
              <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                  Actions{effectiveMomentRoleId ? ` · ${roleLabels.get(effectiveMomentRoleId) ?? `Role #${effectiveMomentRoleId}`}` : ''}
                </Typography>
                <Stack spacing={1}>
                  {visibleMomentActions.map((action) => {
                    const roleName = roleLabels.get(action.subject_role_id) ?? `Role #${action.subject_role_id}`;
                    return (
                      <Box key={action.id} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#93c5fd', mb: 0.6 }}>{roleName}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0', mb: readOnly ? 0 : 0.75 }}>{action.action_text}</Typography>
                        {!readOnly && (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Add a note for this action…"
                            defaultValue={action.notes ?? ''}
                            key={`action-notes-${action.id}`}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (action.notes ?? '')) {
                                updateMomentAction.mutate({ actionId: action.id, data: { notes: val || undefined } });
                              }
                            }}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': { fontSize: '0.7rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.02)' },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.07)' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96,165,250,0.25)' },
                            }}
                          />
                        )}
                        {readOnly && action.notes && (
                          <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.35, fontStyle: 'italic' }}>{action.notes}</Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* ── Placements editor ──────────────────────────────── */}
            {momentNoSpatial && (
              <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  This moment is set to no-spatial, so people stay highlighted in the People section and are not placed on the floor plan.
                </Typography>
              </Box>
            )}
            {!momentNoSpatial && visibleMomentPlacements.length > 0 && (
              <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                  Placements{effectiveMomentRoleId ? ` · ${roleLabels.get(effectiveMomentRoleId) ?? `Role #${effectiveMomentRoleId}`}` : ''}
                </Typography>
                <Stack spacing={1}>
                  {visibleMomentPlacements.map((placement) => {
                    const roleName = roleLabels.get(placement.subject_role_id) ?? `Role #${placement.subject_role_id}`;
                    return (
                      <Box key={placement.id} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', mb: 0.5 }}>{roleName}</Typography>
                        {(placement.position_hint || placement.facing_hint) && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: readOnly ? 0 : 0.75 }}>
                            {[placement.position_hint, placement.facing_hint].filter(Boolean).join(' · ')}
                          </Typography>
                        )}
                        {!readOnly && (
                          <Stack spacing={0.6}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Position hint (e.g. Stage left)…"
                              defaultValue={placement.position_hint ?? ''}
                              key={`placement-pos-${placement.id}`}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (placement.position_hint ?? '')) {
                                  updateMomentPlacement.mutate({ placementId: placement.id, data: { position_hint: val || undefined } });
                                }
                              }}
                              variant="outlined"
                              sx={{
                                '& .MuiOutlinedInput-root': { fontSize: '0.7rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.02)' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.07)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(167,139,250,0.25)' },
                              }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Facing hint (e.g. Facing camera)…"
                              defaultValue={placement.facing_hint ?? ''}
                              key={`placement-facing-${placement.id}`}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (placement.facing_hint ?? '')) {
                                  updateMomentPlacement.mutate({ placementId: placement.id, data: { facing_hint: val || undefined } });
                                }
                              }}
                              variant="outlined"
                              sx={{
                                '& .MuiOutlinedInput-root': { fontSize: '0.7rem', color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.02)' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.07)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(167,139,250,0.25)' },
                              }}
                            />
                          </Stack>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

          </Stack>
        )}
      </Box>
    </Box>
  );
}

function ContextMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.74rem', color: '#cbd5e1', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

// ─── Day ───────────────────────────────────────────────────────────

function DayCard({
  day,
  blueprintId,
  versionId,
  readOnly,
  collapsed,
  onToggle,
  selectedActivityId,
  onSelectActivity,
  selectedMomentId,
  onSelectMoment,
  visibleActivities,
  allowActivitySorting,
  hideActivities,
}: {
  day: DayBlueprintDay;
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  collapsed: boolean;
  onToggle: () => void;
  selectedActivityId?: number | null;
  onSelectActivity?: (activityId: number) => void;
  selectedMomentId?: number | null;
  onSelectMoment?: (momentId: number) => void;
  visibleActivities?: DayBlueprintActivity[];
  allowActivitySorting?: boolean;
  hideActivities?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(day.name);
  const updateDay = useUpdateDay(blueprintId, versionId);
  const deleteDay = useDeleteDay(blueprintId, versionId);
  const createDay = useCreateDay(blueprintId, versionId);
  const createActivity = useCreateActivity(blueprintId, versionId);
  const createMoment = useCreateMoment(blueprintId, versionId);
  const createMomentAction = useCreateMomentAction(blueprintId, versionId);
  const createMomentPlacement = useCreateMomentPlacement(blueprintId, versionId);
  const [duplicating, setDuplicating] = useState(false);
  const activitiesToRender = visibleActivities ?? (day.activities ?? []);

  const totals = dayTotals(day);

  const handleSave = async () => {
    await updateDay.mutateAsync({ dayId: day.id, data: { name } });
    setEditing(false);
  };

  const handleDuplicate = async () => {
    if (!window.confirm(`Duplicate day "${day.name}" with all activities and moments?`)) return;
    setDuplicating(true);
    try {
      const newDay = await createDay.mutateAsync({
        name: `${day.name} (copy)`,
        description: day.description ?? undefined,
        default_start_time: day.default_start_time ?? undefined,
        default_duration_hours: day.default_duration_hours ?? undefined,
      });
      for (const a of day.activities ?? []) {
        const newActivity = await createActivity.mutateAsync({
          dayId: newDay.id,
          data: {
            name: a.name,
            description: a.description ?? undefined,
            icon: a.icon ?? undefined,
            color: a.color ?? undefined,
            default_start_time: a.default_start_time ?? undefined,
            default_duration_minutes: a.default_duration_minutes ?? undefined,
            duration_min_minutes: a.duration_min_minutes ?? undefined,
            duration_max_minutes: a.duration_max_minutes ?? undefined,
            criticality: a.criticality ?? undefined,
            order_index: a.order_index,
          },
        });
        for (const m of a.moments ?? []) {
          const newMoment = await createMoment.mutateAsync({
            activityId: newActivity.id,
            data: {
              name: m.name,
              description: m.description ?? undefined,
              duration_seconds: m.duration_seconds ?? undefined,
              is_key_moment: m.is_key_moment ?? undefined,
              criticality: m.criticality ?? undefined,
              lock_flags: parseLockFlags(m.lock_flags),
              order_index: m.order_index,
            },
          });
          for (const act of m.actions ?? []) {
            await createMomentAction.mutateAsync({
              momentId: newMoment.id,
              data: {
                subject_role_id: act.subject_role_id,
                action_text: act.action_text,
                emphasis: act.emphasis ?? undefined,
                notes: act.notes ?? undefined,
                order_index: act.order_index,
              },
            });
          }
          if (!isNoSpatialMoment(m.lock_flags)) {
            for (const pl of m.placements ?? []) {
              await createMomentPlacement.mutateAsync({
                momentId: newMoment.id,
                data: {
                  day_blueprint_space_slot_id: pl.day_blueprint_space_slot_id,
                  subject_role_id: pl.subject_role_id,
                  position_hint: pl.position_hint ?? undefined,
                  facing_hint: pl.facing_hint ?? undefined,
                  notes: pl.notes ?? undefined,
                  order_index: pl.order_index,
                },
              });
            }
          }
        }
      }
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(148,163,184,0.12)',
        bgcolor: 'rgba(255,255,255,0.02)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Sticky day header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 4,
          px: 2, py: 1.5,
          borderBottom: '1px solid rgba(148,163,184,0.08)',
          display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap',
          bgcolor: 'rgba(12, 17, 27, 0.96)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {!hideActivities && (
          <IconButton size="small" onClick={onToggle} sx={{ color: '#94a3b8', p: 0.25 }}>
            {collapsed ? <ExpandMoreRoundedIcon fontSize="small" /> : <ExpandLessRoundedIcon fontSize="small" />}
          </IconButton>
        )}

        <Chip
          label={`Day ${day.order_index + 1}`}
          size="small"
          sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none', fontWeight: 700 }}
        />
        {editing ? (
          <TextField
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            autoFocus
          />
        ) : (
          <Typography sx={{ flex: 1, color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', minWidth: 160 }}>
            {day.name}
          </Typography>
        )}

        {/* Day totals */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <StatChip label={`${totals.activityCount} act`} color="#a5b4fc" />
          <StatChip label={`${totals.momentCount} mom`} color="#86efac" />
          <StatChip label={formatMinutes(totals.minutes)} color="#fbbf24" />
        </Stack>

        {!readOnly && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {editing ? (
              <>
                <IconButton size="small" onClick={handleSave} disabled={updateDay.isPending}>
                  <SaveRoundedIcon fontSize="small" sx={{ color: '#22c55e' }} />
                </IconButton>
                <IconButton size="small" onClick={() => { setEditing(false); setName(day.name); }}>
                  <CloseRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </IconButton>
              </>
            ) : (
              <>
                <Tooltip title="Duplicate day (copies all activities & moments)">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleDuplicate}
                      disabled={duplicating}
                    >
                      <ContentCopyRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (window.confirm(`Delete day "${day.name}" and all its activities?`)) {
                      deleteDay.mutate(day.id);
                    }
                  }}
                  disabled={deleteDay.isPending}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#fb7185' }} />
                </IconButton>
              </>
            )}
          </Stack>
        )}
      </Box>

      {!collapsed && !hideActivities && (
        <Stack spacing={1} sx={{ p: 1.5 }}>
          {visibleActivities && (day.activities?.length ?? 0) > activitiesToRender.length && (
            <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>
              Focused view: {(day.activities?.length ?? 0) - activitiesToRender.length} other activities stay available in the left rail.
            </Typography>
          )}
          <SortableActivityList
            activities={activitiesToRender}
            blueprintId={blueprintId}
            versionId={versionId}
            readOnly={readOnly}
            selectedActivityId={selectedActivityId}
            onSelectActivity={onSelectActivity}
            selectedMomentId={selectedMomentId}
            onSelectMoment={onSelectMoment}
            sortable={allowActivitySorting}
          />
          {!readOnly && <AddActivityForm dayId={day.id} blueprintId={blueprintId} versionId={versionId} />}
        </Stack>
      )}

    </Paper>
  );
}

// ─── Activity ─────────────────────────────────────────────────────

function ActivityCard({
  activity,
  blueprintId,
  versionId,
  readOnly,
  dragHandle,
  onDuplicate,
  duplicating,
  selected,
  onSelect,
  selectedMomentId,
  onSelectMoment,
}: {
  activity: DayBlueprintActivity;
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  dragHandle?: React.ReactNode;
  onDuplicate?: () => void;
  duplicating?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedMomentId?: number | null;
  onSelectMoment?: (momentId: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);
  const [description, setDescription] = useState(activity.description ?? '');
  const [duration, setDuration] = useState(String(activity.default_duration_minutes ?? ''));
  const [minDur, setMinDur] = useState(String(activity.duration_min_minutes ?? ''));
  const [maxDur, setMaxDur] = useState(String(activity.duration_max_minutes ?? ''));
  const [criticality, setCriticality] = useState(activity.criticality ?? 'REQUIRED');
  const updateActivity = useUpdateActivity(blueprintId, versionId);
  const deleteActivity = useDeleteActivity(blueprintId, versionId);

  const critColor = criticalityColor(activity.criticality);
  const t = activityTotals(activity);

  const handleSave = async () => {
    await updateActivity.mutateAsync({
      activityId: activity.id,
      data: {
        name,
        description: description || undefined,
        default_duration_minutes: duration ? Number(duration) : undefined,
        duration_min_minutes: minDur ? Number(minDur) : undefined,
        duration_max_minutes: maxDur ? Number(maxDur) : undefined,
        criticality,
      },
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setName(activity.name);
    setDescription(activity.description ?? '');
    setDuration(String(activity.default_duration_minutes ?? ''));
    setMinDur(String(activity.duration_min_minutes ?? ''));
    setMaxDur(String(activity.duration_max_minutes ?? ''));
    setCriticality(activity.criticality ?? 'REQUIRED');
  };

  return (
    <Paper
      elevation={0}
      onClick={!editing ? onSelect : undefined}
      sx={{
        borderLeft: `3px solid ${critColor}`,
        borderTop: selected ? '1px solid rgba(96,165,250,0.32)' : '1px solid rgba(148,163,184,0.1)',
        borderRight: selected ? '1px solid rgba(96,165,250,0.32)' : '1px solid rgba(148,163,184,0.1)',
        borderBottom: selected ? '1px solid rgba(96,165,250,0.32)' : '1px solid rgba(148,163,184,0.1)',
        bgcolor: selected ? 'rgba(17, 24, 39, 0.82)' : 'rgba(15,23,42,0.4)',
        borderRadius: 1.5,
        p: 1.25,
        cursor: editing ? 'default' : 'pointer',
        boxShadow: selected ? '0 0 0 1px rgba(96,165,250,0.12)' : 'none',
      }}
    >
      {editing ? (
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 1 }} autoFocus label="Name" />
            <Select
              size="small"
              value={criticality}
              onChange={(e) => setCriticality(String(e.target.value))}
              sx={{ width: 150, fontSize: '0.78rem' }}
            >
              {CRITICALITY_OPTIONS.map((c) => (
                <MenuItem key={c} value={c} sx={{ fontSize: '0.78rem' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CRITICALITY_META[c].color, mr: 1, display: 'inline-block' }} />
                  {CRITICALITY_META[c].label}
                </MenuItem>
              ))}
            </Select>
            <IconButton size="small" onClick={handleSave} disabled={updateActivity.isPending}>
              <SaveRoundedIcon fontSize="small" sx={{ color: '#22c55e' }} />
            </IconButton>
            <IconButton size="small" onClick={handleCancel}>
              <CloseRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
            </IconButton>
          </Stack>
          <TextField
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            multiline
            minRows={1}
          />
          <Stack direction="row" spacing={1}>
            <TextField size="small" label="Target min" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} sx={{ width: 110 }} />
            <TextField size="small" label="Min" type="number" value={minDur} onChange={(e) => setMinDur(e.target.value)} sx={{ width: 90 }} />
            <TextField size="small" label="Max" type="number" value={maxDur} onChange={(e) => setMaxDur(e.target.value)} sx={{ width: 90 }} />
          </Stack>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: activity.description ? 0.5 : 0 }}>
          {dragHandle}
          <Tooltip title={CRITICALITY_META[activity.criticality ?? 'REQUIRED']?.label ?? 'Required'}>
            <Box sx={{ width: 6, height: 24, borderRadius: 0.5, bgcolor: critColor, flexShrink: 0 }} />
          </Tooltip>
          <Typography sx={{ flex: 1, color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>
            {activity.name}
          </Typography>

          {/* Duration band */}
          {(activity.default_duration_minutes != null || activity.duration_min_minutes != null) && (
            <Tooltip
              title={
                activity.duration_min_minutes != null || activity.duration_max_minutes != null
                  ? `Range: ${activity.duration_min_minutes ?? '?'}–${activity.duration_max_minutes ?? '?'} min`
                  : 'Target duration'
              }
            >
              <Chip
                label={
                  activity.default_duration_minutes != null
                    ? `${activity.default_duration_minutes} min`
                    : `${activity.duration_min_minutes}–${activity.duration_max_minutes} min`
                }
                size="small"
                sx={{ bgcolor: 'rgba(148,163,184,0.1)', color: '#cbd5e1', border: 'none', fontSize: '0.68rem' }}
              />
            </Tooltip>
          )}

          {/* Moments count */}
          {t.momentCount > 0 && (
            <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
              {t.momentCount} mom · {formatMinutes(t.momentMin)}
            </Typography>
          )}

          {!readOnly && (
            <>
              <LockFlagsButton
                lockFlags={activity.lock_flags}
                options={ACTIVITY_LOCK_OPTIONS}
                onChange={(next) =>
                  updateActivity.mutate({ activityId: activity.id, data: { lock_flags: next } })
                }
                disabled={updateActivity.isPending}
              />
              <Tooltip title="Duplicate activity">
                <span>
                  <IconButton size="small" onClick={onDuplicate} disabled={duplicating}>
                    <ContentCopyRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton size="small" onClick={() => setEditing(true)}>
                <EditRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  if (window.confirm(`Delete activity "${activity.name}"?`)) {
                    deleteActivity.mutate(activity.id);
                  }
                }}
                disabled={deleteActivity.isPending}
              >
                <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#fb7185' }} />
              </IconButton>
            </>
          )}
        </Stack>
      )}

      {!editing && activity.description && (
        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 0.75, pl: 1.5 }}>
          {activity.description}
        </Typography>
      )}

      <Box sx={{ pl: 1, borderLeft: '2px solid rgba(148,163,184,0.12)' }}>
        <Stack spacing={0.5}>
          <SortableMomentList
            moments={activity.moments ?? []}
            blueprintId={blueprintId}
            versionId={versionId}
            readOnly={readOnly}
            selectedMomentId={selectedMomentId}
            onSelectMoment={onSelectMoment}
          />
          {!readOnly && (
            <AddMomentForm activityId={activity.id} blueprintId={blueprintId} versionId={versionId} />
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

function AddActivityForm({
  dayId,
  blueprintId,
  versionId,
}: {
  dayId: number;
  blueprintId: number;
  versionId: number;
}) {
  const [name, setName] = useState('');
  const createActivity = useCreateActivity(blueprintId, versionId);

  const submit = async () => {
    if (!name.trim()) return;
    await createActivity.mutateAsync({ dayId, data: { name: name.trim() } });
    setName('');
  };

  return (
    <Stack direction="row" spacing={1}>
      <TextField
        size="small"
        fullWidth
        placeholder="New activity — e.g. Ceremony"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
      />
      <Button
        onClick={submit}
        startIcon={<AddIcon />}
        disabled={!name.trim() || createActivity.isPending}
        sx={{ textTransform: 'none', color: '#60a5fa' }}
      >
        Add activity
      </Button>
    </Stack>
  );
}

// ─── Moment ───────────────────────────────────────────────────────

function MomentRow({
  moment,
  blueprintId,
  versionId,
  readOnly,
  dragHandle,
  onDuplicate,
  duplicating,
  selected,
  onSelect,
}: {
  moment: DayBlueprintMoment;
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  dragHandle?: React.ReactNode;
  onDuplicate?: () => void;
  duplicating?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState(moment.name);
  const [description, setDescription] = useState(moment.description ?? '');
  const [seconds, setSeconds] = useState(String(moment.duration_seconds ?? ''));
  const [criticality, setCriticality] = useState(moment.criticality ?? 'REQUIRED');
  const updateMoment = useUpdateMoment(blueprintId, versionId);
  const deleteMoment = useDeleteMoment(blueprintId, versionId);

  const critColor = criticalityColor(moment.criticality);

  const handleSave = async () => {
    await updateMoment.mutateAsync({
      momentId: moment.id,
      data: {
        name,
        description: description || undefined,
        duration_seconds: seconds ? Number(seconds) : undefined,
        criticality,
      },
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setName(moment.name);
    setDescription(moment.description ?? '');
    setSeconds(String(moment.duration_seconds ?? ''));
    setCriticality(moment.criticality ?? 'REQUIRED');
  };

  const toggleKey = async () => {
    await updateMoment.mutateAsync({
      momentId: moment.id,
      data: { is_key_moment: !moment.is_key_moment },
    });
  };

  if (editing) {
    return (
      <Stack spacing={0.75} sx={{ px: 1, py: 0.75, borderRadius: 1, bgcolor: 'rgba(96,165,250,0.05)' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 1 }} autoFocus label="Name" />
          <TextField size="small" label="sec" type="number" value={seconds} onChange={(e) => setSeconds(e.target.value)} sx={{ width: 90 }} />
          <Select
            size="small"
            value={criticality}
            onChange={(e) => setCriticality(String(e.target.value))}
            sx={{ width: 140, fontSize: '0.72rem' }}
          >
            {CRITICALITY_OPTIONS.map((c) => (
              <MenuItem key={c} value={c} sx={{ fontSize: '0.72rem' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CRITICALITY_META[c].color, mr: 1, display: 'inline-block' }} />
                {CRITICALITY_META[c].label}
              </MenuItem>
            ))}
          </Select>
          <IconButton size="small" onClick={handleSave} disabled={updateMoment.isPending}>
            <SaveRoundedIcon fontSize="small" sx={{ color: '#22c55e' }} />
          </IconButton>
          <IconButton size="small" onClick={handleCancel}>
            <CloseRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
          </IconButton>
        </Stack>
        <TextField
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          multiline
          minRows={1}
          sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem' } }}
        />
      </Stack>
    );
  }

  return (
    <>
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      onClick={!editing ? (event) => {
        event.stopPropagation();
        onSelect?.();
      } : undefined}
      sx={{
        px: 1, py: 0.5,
        borderRadius: 1,
        cursor: editing ? 'default' : 'pointer',
        bgcolor: selected ? 'rgba(96,165,250,0.08)' : 'transparent',
        border: selected ? '1px solid rgba(96,165,250,0.22)' : '1px solid transparent',
        '&:hover': { bgcolor: selected ? 'rgba(96,165,250,0.1)' : 'rgba(148,163,184,0.05)' },
      }}
    >
      {dragHandle}
      <Tooltip title={CRITICALITY_META[moment.criticality ?? 'REQUIRED']?.label ?? 'Required'}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: critColor, flexShrink: 0 }} />
      </Tooltip>

      {!readOnly ? (
        <IconButton size="small" onClick={toggleKey} sx={{ p: 0.25 }}>
          {moment.is_key_moment ? (
            <StarRoundedIcon sx={{ fontSize: 15, color: '#fbbf24' }} />
          ) : (
            <StarBorderRoundedIcon sx={{ fontSize: 15, color: '#475569' }} />
          )}
        </IconButton>
      ) : moment.is_key_moment ? (
        <StarRoundedIcon sx={{ fontSize: 15, color: '#fbbf24' }} />
      ) : null}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.25 }}>
          {moment.name}
        </Typography>
        {moment.description && (
          <Typography sx={{ color: '#64748b', fontSize: '0.7rem', lineHeight: 1.2 }}>
            {moment.description}
          </Typography>
        )}
      </Box>

      {moment.duration_seconds != null && (
        <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>
          {moment.duration_seconds}s
        </Typography>
      )}
      {(moment.actions?.length ?? 0) > 0 && (
        <Chip
          label={`${moment.actions?.length} act`}
          size="small"
          sx={{ bgcolor: 'rgba(96,165,250,0.1)', color: '#93c5fd', border: 'none', fontSize: '0.62rem', height: 18 }}
        />
      )}
      {isNoSpatialMoment(moment.lock_flags) ? (
        <Chip
          label="no spatial"
          size="small"
          sx={{ bgcolor: 'rgba(251,113,133,0.16)', color: '#fda4af', border: 'none', fontSize: '0.62rem', height: 18 }}
        />
      ) : (
        (moment.placements?.length ?? 0) > 0 && (
          <Chip
            label={`${moment.placements?.length} pos`}
            size="small"
            sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#86efac', border: 'none', fontSize: '0.62rem', height: 18 }}
          />
        )
      )}
      {!readOnly && (
        <>
          <LockFlagsButton
            lockFlags={moment.lock_flags}
            options={MOMENT_LOCK_OPTIONS}
            onChange={(next) =>
              updateMoment.mutate({ momentId: moment.id, data: { lock_flags: next } })
            }
            disabled={updateMoment.isPending}
            small
          />
          <Tooltip title="Actions & placements">
            <IconButton size="small" onClick={() => setDetailsOpen(true)}>
              <TuneRoundedIcon sx={{ color: '#94a3b8', fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate moment">
            <span>
              <IconButton size="small" onClick={onDuplicate} disabled={duplicating}>
                <ContentCopyRoundedIcon sx={{ color: '#94a3b8', fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" onClick={() => setEditing(true)}>
            <EditRoundedIcon sx={{ color: '#94a3b8', fontSize: 14 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              if (window.confirm(`Delete moment "${moment.name}"?`)) {
                deleteMoment.mutate(moment.id);
              }
            }}
            disabled={deleteMoment.isPending}
          >
            <DeleteOutlineRoundedIcon sx={{ color: '#fb7185', fontSize: 14 }} />
          </IconButton>
        </>
      )}
      </Stack>
      {!readOnly && (
        <MomentDetailDialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          moment={moment}
          blueprintId={blueprintId}
          versionId={versionId}
        />
      )}
    </>
  );
}

function AddMomentForm({
  activityId,
  blueprintId,
  versionId,
}: {
  activityId: number;
  blueprintId: number;
  versionId: number;
}) {
  const [name, setName] = useState('');
  const createMoment = useCreateMoment(blueprintId, versionId);

  const submit = async () => {
    if (!name.trim()) return;
    await createMoment.mutateAsync({ activityId, data: { name: name.trim() } });
    setName('');
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 0.5, pl: 1.5 }}>
      <TextField
        size="small"
        fullWidth
        placeholder="New moment — e.g. Vows exchange"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem' } }}
      />
      <Button
        onClick={submit}
        size="small"
        startIcon={<AddIcon />}
        disabled={!name.trim() || createMoment.isPending}
        sx={{ textTransform: 'none', color: '#94a3b8', fontSize: '0.75rem' }}
      >
        Add
      </Button>
    </Stack>
  );
}

// ─── Sortable wrappers ───────────────────────────────────────────

function SortableActivityList({
  activities,
  blueprintId,
  versionId,
  readOnly,
  selectedActivityId,
  onSelectActivity,
  selectedMomentId,
  onSelectMoment,
  sortable = true,
}: {
  activities: DayBlueprintActivity[];
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  selectedActivityId?: number | null;
  onSelectActivity?: (activityId: number) => void;
  selectedMomentId?: number | null;
  onSelectMoment?: (momentId: number) => void;
  sortable?: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const updateActivity = useUpdateActivity(blueprintId, versionId);
  const createActivity = useCreateActivity(blueprintId, versionId);
  const createMoment = useCreateMoment(blueprintId, versionId);
  const createMomentAction = useCreateMomentAction(blueprintId, versionId);
  const createMomentPlacement = useCreateMomentPlacement(blueprintId, versionId);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activities.findIndex((a) => a.id === Number(active.id));
    const newIndex = activities.findIndex((a) => a.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(activities, oldIndex, newIndex);
    reordered.forEach((a, idx) => {
      if (a.order_index !== idx) {
        updateActivity.mutate({ activityId: a.id, data: { order_index: idx } });
      }
    });
  };

  const duplicate = async (a: DayBlueprintActivity) => {
    setDuplicatingId(a.id);
    try {
      const dayId = a.day_blueprint_day_id ?? a.day_id;
      const created = await createActivity.mutateAsync({
        dayId,
        data: {
          name: `${a.name} (copy)`,
          description: a.description ?? undefined,
          icon: a.icon ?? undefined,
          color: a.color ?? undefined,
          default_start_time: a.default_start_time ?? undefined,
          default_duration_minutes: a.default_duration_minutes ?? undefined,
          duration_min_minutes: a.duration_min_minutes ?? undefined,
          duration_max_minutes: a.duration_max_minutes ?? undefined,
          criticality: a.criticality ?? undefined,
          order_index: activities.length,
        },
      });
      for (const m of a.moments ?? []) {
        const newMoment = await createMoment.mutateAsync({
          activityId: created.id,
          data: {
            name: m.name,
            description: m.description ?? undefined,
            duration_seconds: m.duration_seconds ?? undefined,
            is_key_moment: m.is_key_moment ?? undefined,
            criticality: m.criticality ?? undefined,
            lock_flags: parseLockFlags(m.lock_flags),
            order_index: m.order_index,
          },
        });
        for (const act of m.actions ?? []) {
          await createMomentAction.mutateAsync({
            momentId: newMoment.id,
            data: {
              subject_role_id: act.subject_role_id,
              action_text: act.action_text,
              emphasis: act.emphasis ?? undefined,
              notes: act.notes ?? undefined,
              order_index: act.order_index,
            },
          });
        }
        if (!isNoSpatialMoment(m.lock_flags)) {
          for (const pl of m.placements ?? []) {
            await createMomentPlacement.mutateAsync({
              momentId: newMoment.id,
              data: {
                day_blueprint_space_slot_id: pl.day_blueprint_space_slot_id,
                subject_role_id: pl.subject_role_id,
                position_hint: pl.position_hint ?? undefined,
                facing_hint: pl.facing_hint ?? undefined,
                notes: pl.notes ?? undefined,
                order_index: pl.order_index,
              },
            });
          }
        }
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  if (!sortable) {
    return (
      <Stack spacing={1}>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            blueprintId={blueprintId}
            versionId={versionId}
            readOnly={readOnly}
            onDuplicate={() => duplicate(activity)}
            duplicating={duplicatingId === activity.id}
            selected={selectedActivityId === activity.id}
            onSelect={onSelectActivity ? () => onSelectActivity(activity.id) : undefined}
            selectedMomentId={selectedMomentId}
            onSelectMoment={onSelectMoment}
          />
        ))}
      </Stack>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <Stack spacing={1}>
          {activities.map((a) => (
            <SortableActivityItem
              key={a.id}
              activity={a}
              blueprintId={blueprintId}
              versionId={versionId}
              readOnly={readOnly}
              onDuplicate={() => duplicate(a)}
              duplicating={duplicatingId === a.id}
              selected={selectedActivityId === a.id}
              onSelect={onSelectActivity ? () => onSelectActivity(a.id) : undefined}
              selectedMomentId={selectedMomentId}
              onSelectMoment={onSelectMoment}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

function SortableActivityItem({
  activity,
  blueprintId,
  versionId,
  readOnly,
  onDuplicate,
  duplicating,
  selected,
  onSelect,
  selectedMomentId,
  onSelectMoment,
}: {
  activity: DayBlueprintActivity;
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  onDuplicate: () => void;
  duplicating: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedMomentId?: number | null;
  onSelectMoment?: (momentId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
    disabled: readOnly,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const handle = !readOnly ? (
    <Box
      {...attributes}
      {...listeners}
      sx={{
        display: 'flex', alignItems: 'center', cursor: 'grab',
        color: '#475569', '&:hover': { color: '#94a3b8' },
        touchAction: 'none',
      }}
    >
      <DragIndicatorRoundedIcon fontSize="small" />
    </Box>
  ) : null;
  return (
    <div ref={setNodeRef} style={style}>
      <ActivityCard
        activity={activity}
        blueprintId={blueprintId}
        versionId={versionId}
        readOnly={readOnly}
        dragHandle={handle}
        onDuplicate={onDuplicate}
        duplicating={duplicating}
        selected={selected}
        onSelect={onSelect}
        selectedMomentId={selectedMomentId}
        onSelectMoment={onSelectMoment}
      />
    </div>
  );
}

function SortableMomentList({
  moments,
  blueprintId,
  versionId,
  readOnly,
  selectedMomentId,
  onSelectMoment,
}: {
  moments: DayBlueprintMoment[];
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  selectedMomentId?: number | null;
  onSelectMoment?: (momentId: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const updateMoment = useUpdateMoment(blueprintId, versionId);
  const createMoment = useCreateMoment(blueprintId, versionId);
  const createMomentAction = useCreateMomentAction(blueprintId, versionId);
  const createMomentPlacement = useCreateMomentPlacement(blueprintId, versionId);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = moments.findIndex((m) => m.id === Number(active.id));
    const newIndex = moments.findIndex((m) => m.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(moments, oldIndex, newIndex);
    reordered.forEach((m, idx) => {
      if (m.order_index !== idx) {
        updateMoment.mutate({ momentId: m.id, data: { order_index: idx } });
      }
    });
  };

  const duplicate = async (m: DayBlueprintMoment) => {
    setDuplicatingId(m.id);
    try {
      const newMoment = await createMoment.mutateAsync({
        activityId: m.activity_id,
        data: {
          name: `${m.name} (copy)`,
          description: m.description ?? undefined,
          duration_seconds: m.duration_seconds ?? undefined,
          is_key_moment: m.is_key_moment ?? undefined,
          criticality: m.criticality ?? undefined,
          lock_flags: parseLockFlags(m.lock_flags),
          order_index: moments.length,
        },
      });
      for (const act of m.actions ?? []) {
        await createMomentAction.mutateAsync({
          momentId: newMoment.id,
          data: {
            subject_role_id: act.subject_role_id,
            action_text: act.action_text,
            emphasis: act.emphasis ?? undefined,
            notes: act.notes ?? undefined,
            order_index: act.order_index,
          },
        });
      }
      if (!isNoSpatialMoment(m.lock_flags)) {
        for (const pl of m.placements ?? []) {
          await createMomentPlacement.mutateAsync({
            momentId: newMoment.id,
            data: {
              day_blueprint_space_slot_id: pl.day_blueprint_space_slot_id,
              subject_role_id: pl.subject_role_id,
              position_hint: pl.position_hint ?? undefined,
              facing_hint: pl.facing_hint ?? undefined,
              notes: pl.notes ?? undefined,
              order_index: pl.order_index,
            },
          });
        }
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={moments.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <Stack spacing={0.5}>
          {moments.map((m) => (
            <SortableMomentItem
              key={m.id}
              moment={m}
              blueprintId={blueprintId}
              versionId={versionId}
              readOnly={readOnly}
              onDuplicate={() => duplicate(m)}
              duplicating={duplicatingId === m.id}
              selected={selectedMomentId === m.id}
              onSelect={onSelectMoment ? () => onSelectMoment(m.id) : undefined}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

function SortableMomentItem({
  moment,
  blueprintId,
  versionId,
  readOnly,
  onDuplicate,
  duplicating,
  selected,
  onSelect,
}: {
  moment: DayBlueprintMoment;
  blueprintId: number;
  versionId: number;
  readOnly: boolean;
  onDuplicate: () => void;
  duplicating: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: moment.id,
    disabled: readOnly,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const handle = !readOnly ? (
    <Box
      {...attributes}
      {...listeners}
      sx={{
        display: 'flex', alignItems: 'center', cursor: 'grab',
        color: '#475569', '&:hover': { color: '#94a3b8' },
        touchAction: 'none',
      }}
    >
      <DragIndicatorRoundedIcon sx={{ fontSize: 14 }} />
    </Box>
  ) : null;
  return (
    <div ref={setNodeRef} style={style}>
      <MomentRow
        moment={moment}
        blueprintId={blueprintId}
        versionId={versionId}
        readOnly={readOnly}
        dragHandle={handle}
        onDuplicate={onDuplicate}
        duplicating={duplicating}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
}

// ─── Lock flags ──────────────────────────────────────────────────

const ACTIVITY_LOCK_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'order', label: 'Order' },
  { key: 'duration', label: 'Duration' },
];

const MOMENT_LOCK_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'order', label: 'Order' },
  { key: 'duration', label: 'Duration' },
  { key: 'required_subjects', label: 'Required subjects' },
];

function parseLockFlags(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = Boolean(v);
  }
  return out;
}

function isNoSpatialMoment(lockFlags: unknown): boolean {
  return Boolean(parseLockFlags(lockFlags).no_spatial);
}

function activeLockLabels(
  lockFlags: unknown,
  options: Array<{ key: string; label: string }>,
): string[] {
  const parsed = parseLockFlags(lockFlags);
  return options.filter((option) => parsed[option.key]).map((option) => option.label);
}

function LockFlagsButton({
  lockFlags,
  options,
  onChange,
  disabled,
  small,
}: {
  lockFlags: unknown;
  options: Array<{ key: string; label: string }>;
  onChange: (next: Record<string, boolean>) => void;
  disabled?: boolean;
  small?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const flags = parseLockFlags(lockFlags);
  const activeCount = Object.values(flags).filter(Boolean).length;
  const hasAny = activeCount > 0;
  const iconSize = small ? 14 : 18;

  const toggle = (key: string) => {
    const next = { ...flags, [key]: !flags[key] };
    onChange(next);
  };

  return (
    <>
      <Tooltip title={hasAny ? `${activeCount} lock${activeCount === 1 ? '' : 's'}` : 'Lock fields'}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={disabled}
          sx={{ p: small ? 0.25 : 0.5 }}
        >
          {hasAny ? (
            <LockRoundedIcon sx={{ fontSize: iconSize, color: '#fbbf24' }} />
          ) : (
            <LockOpenRoundedIcon sx={{ fontSize: iconSize, color: '#94a3b8' }} />
          )}
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(9,12,18,0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            p: 1.25,
            minWidth: 180,
          },
        }}
      >
        <Typography sx={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 700, mb: 0.5 }}>
          Lock fields
        </Typography>
        <Stack>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.key}
              control={
                <Checkbox
                  size="small"
                  checked={Boolean(flags[opt.key])}
                  onChange={() => toggle(opt.key)}
                />
              }
              label={
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{opt.label}</Typography>
              }
              sx={{ m: 0 }}
            />
          ))}
        </Stack>
      </Popover>
    </>
  );
}

function useBrandSubjectRoles(brandId: number | null) {
  return useQuery({
    queryKey: ['subject-roles', 'brand', brandId],
    queryFn: () => rolesApi.getRoles(brandId as number),
    enabled: Boolean(brandId),
  });
}

function SubjectRolesTab({
  blueprintId,
  versionId,
  brandId,
  links,
  eventCategory,
  eventTypes,
  selectedActivity,
  selectedMoment,
  spaceSlots,
  readOnly,
}: {
  blueprintId: number;
  versionId: number;
  brandId: number | null;
  links: DayBlueprintSubjectRoleLink[];
  eventCategory: string | null;
  eventTypes: ReturnType<typeof useEventTypes>['data'];
  selectedActivity: DayBlueprintActivity | null;
  selectedMoment: DayBlueprintMoment | null;
  spaceSlots: DayBlueprintSpaceSlot[];
  readOnly: boolean;
}) {
  const rolesQuery = useBrandSubjectRoles(brandId);
  const create = useCreateSubjectRoleLink(blueprintId, versionId);
  const update = useUpdateSubjectRoleLink(blueprintId, versionId);
  const remove = useDeleteSubjectRoleLink(blueprintId, versionId);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [draftRoleId, setDraftRoleId] = useState<number | ''>('');
  const [draftTypicalCount, setDraftTypicalCount] = useState(1);
  const [draftIsPrimary, setDraftIsPrimary] = useState(false);

  const eventTypeRoles = useMemo(() => {
    const categoryKey = normalizeEventCategory(eventCategory);
    if (!categoryKey) return null;

    const matchedEventType = eventTypes.find((eventType) => {
      const eventCategoryKey = normalizeEventCategory(eventType.event_category);
      const eventNameKey = normalizeEventCategory(eventType.name);
      return eventCategoryKey === categoryKey || eventNameKey === categoryKey;
    });

    const roles = matchedEventType?.subject_roles
      ?.map((link) => link.subject_role)
      .filter((role): role is NonNullable<typeof role> => Boolean(role)) ?? [];

    return roles.length > 0 ? roles : null;
  }, [eventCategory, eventTypes]);

  const available = useMemo(() => {
    const existingIds = new Set(links.map((link) => link.subject_role_id));
    return (eventTypeRoles ?? rolesQuery.data ?? []).filter((role) => !existingIds.has(role.id));
  }, [eventTypeRoles, links, rolesQuery.data]);

  const selectedMomentNoSpatial = selectedMoment ? isNoSpatialMoment(selectedMoment.lock_flags) : false;
  const momentActionsByRoleId = useMemo(() => new Map(
    (selectedMoment?.actions ?? []).map((action) => [action.subject_role_id, action]),
  ), [selectedMoment]);
  const momentPlacementsByRoleId = useMemo(() => new Map(
    (selectedMoment?.placements ?? []).map((placement) => [placement.subject_role_id, placement]),
  ), [selectedMoment]);
  const slotLabels = useMemo(() => new Map(
    spaceSlots.map((slot) => [
      slot.id,
      slot.location_role?.display_name ? `${slot.label} · ${slot.location_role.display_name}` : slot.label,
    ]),
  ), [spaceSlots]);
  const selectedActivityRoleIds = useMemo(() => {
    if (!selectedActivity) return null;
    const ids = new Set<number>();
    for (const moment of selectedActivity.moments ?? []) {
      for (const action of moment.actions ?? []) ids.add(action.subject_role_id);
      for (const placement of moment.placements ?? []) ids.add(placement.subject_role_id);
    }
    return ids;
  }, [selectedActivity]);
  const selectedMomentRoleIds = useMemo(() => {
    if (!selectedMoment) return null;
    const ids = new Set<number>();
    for (const action of selectedMoment.actions ?? []) ids.add(action.subject_role_id);
    for (const placement of selectedMoment.placements ?? []) ids.add(placement.subject_role_id);
    return ids;
  }, [selectedMoment]);
  const contextualLinks = useMemo(() => {
    const roleIds = selectedMomentRoleIds ?? selectedActivityRoleIds;
    if (!roleIds) return links;
    return [...links].sort((left, right) => {
      const leftActive = roleIds.has(left.subject_role_id) ? 0 : 1;
      const rightActive = roleIds.has(right.subject_role_id) ? 0 : 1;
      if (leftActive !== rightActive) return leftActive - rightActive;
      return left.order_index - right.order_index;
    });
  }, [links, selectedActivityRoleIds, selectedMomentRoleIds]);

  const resetDraft = () => {
    setDraftRoleId('');
    setDraftTypicalCount(1);
    setDraftIsPrimary(false);
    setIsAddingRole(false);
  };

  const openDraft = () => {
    setIsAddingRole(true);
    setDraftRoleId('');
    setDraftTypicalCount(1);
    setDraftIsPrimary(false);
  };

  const setDraftRole = (value: number | '') => {
    setDraftRoleId(value);
    const role = (rolesQuery.data ?? []).find((entry) => entry.id === value);
    setDraftTypicalCount(role?.is_group ? 4 : 1);
  };

  const addRole = async (params: { roleId: number; typicalCount?: number; isPrimary?: boolean }) => {
    await create.mutateAsync({
      subject_role_id: params.roleId,
      typical_count: Math.max(params.typicalCount ?? 1, 1),
      is_primary: params.isPrimary ?? false,
    });
  };

  const addDraftRole = async () => {
    if (!draftRoleId) return;
    await addRole({
      roleId: Number(draftRoleId),
      typicalCount: draftTypicalCount,
      isPrimary: draftIsPrimary,
    });
    resetDraft();
  };

  const adjustTypicalCount = async (link: DayBlueprintSubjectRoleLink, delta: number) => {
    const next = Math.max(1, (link.typical_count ?? 1) + delta);
    if (next === (link.typical_count ?? 1)) return;
    update.mutate({ rowId: link.id, data: { typical_count: next } });
  };

  const changeDraftCount = (delta: number) => {
    setDraftTypicalCount((current) => Math.max(1, current + delta));
  };

  const placementLabel = (placement: DayBlueprintMomentPlacement | undefined) => {
    if (!placement) return null;
    const slotLabel = slotLabels.get(placement.day_blueprint_space_slot_id) ?? `Slot #${placement.day_blueprint_space_slot_id}`;
    const details = [placement.position_hint, placement.facing_hint, placement.notes].filter(Boolean).join(' · ');
    return details ? `${slotLabel} · ${details}` : slotLabel;
  };

  return (
    <Box sx={detailGlassCardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
          People
        </Typography>
        {selectedMoment ? (
          <Typography sx={{ fontSize: '0.55rem', color: '#38bdf8', fontWeight: 600 }}>
            Moment: {selectedMoment.name}
          </Typography>
        ) : selectedActivity ? (
          <Typography sx={{ fontSize: '0.55rem', color: selectedActivity.color || '#f59e0b', fontWeight: 600 }}>
            Filtering: {selectedActivity.name}
          </Typography>
        ) : null}
        {!readOnly && (
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={openDraft}
              disabled={available.length === 0}
              sx={{
                p: 0.25,
                color: '#64748b',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                '&.Mui-disabled': { color: 'rgba(100,116,139,0.35)' },
              }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {(links.length > 0 || isAddingRole) ? (
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: selectedMoment ? '24%' : '48%' }} />
            {selectedMoment && <col style={{ width: '12%' }} />}
            {selectedMoment && <col style={{ width: '24%' }} />}
            {selectedMoment && <col style={{ width: '20%' }} />}
            <col style={{ width: selectedMoment ? '8%' : '18%' }} />
            <col style={{ width: selectedMoment ? '8%' : '20%' }} />
            <col style={{ width: selectedMoment ? '4%' : '14%' }} />
          </colgroup>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableCell sx={detailHeaderCellSx}>Subject</TableCell>
              {selectedMoment && <TableCell sx={detailHeaderCellSx}>Focal</TableCell>}
              {selectedMoment && <TableCell sx={detailHeaderCellSx}>Action</TableCell>}
              {selectedMoment && <TableCell sx={detailHeaderCellSx}>Placement</TableCell>}
              <TableCell sx={detailHeaderCellSx}>Primary</TableCell>
              <TableCell sx={detailHeaderCellSx}>Count</TableCell>
              <TableCell sx={detailHeaderCellSx} />
            </TableRow>
          </TableHead>
          <TableBody>
            {contextualLinks.map((link) => {
              const roleName = link.subject_role?.role_name ?? `Role #${link.subject_role_id}`;
              const typicalCount = Math.max(link.typical_count ?? 1, 1);
              const momentAction = momentActionsByRoleId.get(link.subject_role_id);
              const momentPlacement = momentPlacementsByRoleId.get(link.subject_role_id);
              const isInSelectedActivity = selectedActivityRoleIds?.has(link.subject_role_id) ?? true;
              const isInSelectedMoment = selectedMomentRoleIds?.has(link.subject_role_id) ?? true;
              const focal = momentAction?.emphasis || momentPlacement?.position_hint || null;
              const placement = selectedMomentNoSpatial && isInSelectedMoment
                ? 'No spatial'
                : placementLabel(momentPlacement);

              return (
                <TableRow
                  key={link.id}
                  sx={{
                    transition: 'all 0.2s ease',
                    opacity: isInSelectedMoment && isInSelectedActivity ? 1 : 0.35,
                    '&:hover': {
                      bgcolor: 'rgba(167, 139, 250, 0.03)',
                      opacity: isInSelectedMoment && isInSelectedActivity ? 1 : 0.7,
                      '& .role-del': { opacity: 1 },
                    },
                  }}
                >
                  <TableCell sx={detailBodyCellSx}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        color: '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {roleName}
                    </Typography>
                  </TableCell>
                  {selectedMoment && (
                    <TableCell sx={detailBodyCellSx}>
                      {isInSelectedMoment && focal ? (
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#38bdf8', textTransform: 'capitalize', letterSpacing: '0.2px' }}>
                          {focal.toLowerCase()}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontStyle: 'italic' }}>—</Typography>
                      )}
                    </TableCell>
                  )}
                  {selectedMoment && (
                    <TableCell sx={detailBodyCellSx}>
                      {momentAction?.action_text ? (
                        <Typography sx={{ fontSize: '0.62rem', color: '#cbd5e1', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {momentAction.action_text}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontStyle: 'italic' }}>—</Typography>
                      )}
                    </TableCell>
                  )}
                  {selectedMoment && (
                    <TableCell sx={detailBodyCellSx}>
                      {placement ? (
                        <Typography sx={{ fontSize: '0.62rem', color: '#cbd5e1', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {placement}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontStyle: 'italic' }}>—</Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell sx={{ ...detailBodyCellSx, textAlign: 'center' }}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: link.is_primary ? '#38bdf8' : '#475569' }}>
                        {link.is_primary ? 'Primary' : '—'}
                      </Typography>
                    ) : (
                      <Checkbox
                        size="small"
                        checked={link.is_primary}
                        onChange={(e) => update.mutate({ rowId: link.id, data: { is_primary: e.target.checked } })}
                        sx={{
                          p: 0,
                          '& .MuiSvgIcon-root': { fontSize: 16 },
                          color: 'rgba(255,255,255,0.15)',
                          '&.Mui-checked': { color: '#38bdf8' },
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={detailBodyCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
                        {typicalCount}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15 }}>
                        <IconButton
                          size="small"
                          onClick={() => adjustTypicalCount(link, -1)}
                          sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}
                        >
                          <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>−</Box>
                        </IconButton>
                        <Typography
                          sx={{
                            minWidth: 20,
                            textAlign: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#a78bfa',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {typicalCount}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => adjustTypicalCount(link, 1)}
                          sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}
                        >
                          <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>+</Box>
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...detailBodyCellSx, textAlign: 'right' }}>
                    {!readOnly && (
                      <Box className="role-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm(`Remove role "${roleName}"?`)) {
                              remove.mutate(link.id);
                            }
                          }}
                          sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {isAddingRole && (
              <TableRow>
                <TableCell sx={detailBodyCellSx}>
                  <Select
                    size="small"
                    displayEmpty
                    value={draftRoleId}
                    onChange={(e) => setDraftRole(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                    sx={{
                      '& .MuiSelect-select': {
                        py: 0.6,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      },
                    }}
                  >
                    <MenuItem value=""><em>Select subject role…</em></MenuItem>
                    {available.map((role) => (
                      <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
                {selectedMoment && <TableCell sx={detailBodyCellSx} />}
                {selectedMoment && <TableCell sx={detailBodyCellSx} />}
                {selectedMoment && <TableCell sx={detailBodyCellSx} />}
                <TableCell sx={{ ...detailBodyCellSx, textAlign: 'center' }}>
                  <Checkbox
                    size="small"
                    checked={draftIsPrimary}
                    onChange={(e) => setDraftIsPrimary(e.target.checked)}
                    disabled={!draftRoleId}
                    sx={{
                      p: 0,
                      '& .MuiSvgIcon-root': { fontSize: 16 },
                      color: 'rgba(255,255,255,0.15)',
                      '&.Mui-checked': { color: '#38bdf8' },
                    }}
                  />
                </TableCell>
                <TableCell sx={detailBodyCellSx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15 }}>
                    <IconButton
                      size="small"
                      onClick={() => changeDraftCount(-1)}
                      sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}
                    >
                      <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>−</Box>
                    </IconButton>
                    <Typography
                      sx={{
                        minWidth: 20,
                        textAlign: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#a78bfa',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {draftTypicalCount}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => changeDraftCount(1)}
                      sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}
                    >
                      <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>+</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell sx={{ ...detailBodyCellSx, textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                    <IconButton
                      size="small"
                      onClick={resetDraft}
                      sx={{ p: 0.25, color: 'rgba(255,255,255,0.25)', '&:hover': { color: '#cbd5e1' } }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => void addDraftRole()}
                      disabled={!draftRoleId || create.isPending}
                      sx={{ p: 0.25, color: '#a78bfa', '&:hover': { color: '#c4b5fd', bgcolor: 'rgba(167,139,250,0.12)' } }}
                    >
                      <AddIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.72rem', color: '#475569', mb: 1 }}>
            No subject roles linked yet
          </Typography>
        </Box>
      )}

      {!readOnly && available.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          {links.length === 0 && (
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.58rem', display: 'block', mb: 0.75 }}>
              Suggested roles:
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {available.map((role) => (
              <Chip
                key={role.id}
                label={`${role.role_name}${role.is_group ? ' (Group)' : ''}`}
                size="small"
                onClick={() => void addRole({ roleId: role.id, typicalCount: role.is_group ? 4 : 1 })}
                icon={<AddIcon sx={{ fontSize: '10px !important' }} />}
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: 'rgba(167, 139, 250, 0.07)',
                  color: '#a78bfa',
                  border: '1px dashed rgba(167, 139, 250, 0.3)',
                  '& .MuiChip-icon': { color: '#a78bfa' },
                  '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.15)', borderStyle: 'solid' },
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function SpaceSlotsTab({
  slots,
}: {
  blueprintId: number;
  versionId: number;
  slots: DayBlueprintSpaceSlot[];
  readOnly: boolean;
}) {
  return (
    <Stack spacing={1}>
      {slots.length === 0 && (
        <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
          No space slots defined. Slots represent named positions inside a location (e.g. Altar centre, Guest seating front row).
        </Typography>
      )}
      <Stack spacing={0.5}>
        {slots.map((slot) => (
          <Stack
            key={slot.id}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 1, py: 0.75, borderRadius: 1, bgcolor: 'rgba(15,23,42,0.4)' }}
          >
            <Chip
              label={slot.location_role?.display_name ?? `loc #${slot.day_blueprint_location_role_id}`}
              size="small"
              sx={{ bgcolor: 'rgba(34,197,94,0.14)', color: '#86efac', border: 'none', fontWeight: 700 }}
            />
            <Box sx={{ minWidth: 140 }}>
              <Typography sx={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Key
              </Typography>
              <Typography sx={{ fontSize: '0.76rem', color: '#e2e8f0', fontWeight: 600 }}>
                {slot.key}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 160 }}>
              <Typography sx={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Label
              </Typography>
              <Typography sx={{ fontSize: '0.76rem', color: '#e2e8f0', fontWeight: 600 }}>
                {slot.label}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ─── Moment detail dialog (actions + placements) ────────────────

function MomentDetailDialog({
  open,
  onClose,
  moment,
  blueprintId,
  versionId,
}: {
  open: boolean;
  onClose: () => void;
  moment: DayBlueprintMoment;
  blueprintId: number;
  versionId: number;
}) {
  const versionQuery = useDayBlueprintVersion(blueprintId, versionId);
  const version = versionQuery.data as DayBlueprintVersionDetail | undefined;
  const subjectRoles: DayBlueprintSubjectRoleLink[] = version?.subject_roles ?? [];
  const spaceSlots: DayBlueprintSpaceSlot[] = version?.space_slots ?? [];
  const noSpatial = isNoSpatialMoment(moment.lock_flags);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(9,12,18,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: '#f8fafc', fontWeight: 800 }}>
        {moment.name}
        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
          Subject actions & space placements
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.8rem', mb: 1 }}>
          Subject actions
        </Typography>
        {subjectRoles.length === 0 ? (
          <Typography sx={{ color: '#fb7185', fontSize: '0.78rem', mb: 2 }}>
            No subject roles linked to this version yet. Add roles in the top "Subject roles" tab first.
          </Typography>
        ) : (
          <MomentActionsEditor
            moment={moment}
            subjectRoles={subjectRoles}
            blueprintId={blueprintId}
            versionId={versionId}
          />
        )}
        <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.1)' }} />
        <Typography sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.8rem', mb: 1 }}>
          Placements
        </Typography>
        {noSpatial ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>
            This moment is marked no-spatial, so placement editing is disabled and people stay highlighted only.
          </Typography>
        ) : subjectRoles.length === 0 || spaceSlots.length === 0 ? (
          <Typography sx={{ color: '#fb7185', fontSize: '0.78rem' }}>
            Need at least one subject role and one space slot. Set them up in the top panels first.
          </Typography>
        ) : (
          <MomentPlacementsEditor
            moment={moment}
            subjectRoles={subjectRoles}
            spaceSlots={spaceSlots}
            blueprintId={blueprintId}
            versionId={versionId}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#94a3b8' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function MomentActionsEditor({
  moment,
  subjectRoles,
  blueprintId,
  versionId,
}: {
  moment: DayBlueprintMoment;
  subjectRoles: DayBlueprintSubjectRoleLink[];
  blueprintId: number;
  versionId: number;
}) {
  const create = useCreateMomentAction(blueprintId, versionId);
  const update = useUpdateMomentAction(blueprintId, versionId);
  const remove = useDeleteMomentAction(blueprintId, versionId);
  const [roleId, setRoleId] = useState<number | ''>('');
  const [actionText, setActionText] = useState('');

  const roleName = (id: number) =>
    subjectRoles.find((l) => l.subject_role_id === id)?.subject_role?.role_name ?? `role #${id}`;

  const add = async () => {
    if (!roleId || !actionText.trim()) return;
    await create.mutateAsync({ momentId: moment.id, data: { subject_role_id: Number(roleId), action_text: actionText.trim() } });
    setRoleId('');
    setActionText('');
  };

  return (
    <Stack spacing={0.75}>
      {(moment.actions ?? []).map((act: DayBlueprintMomentAction) => (
        <Stack
          key={act.id}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ p: 1, borderRadius: 1, bgcolor: 'rgba(15,23,42,0.4)' }}
        >
          <Chip
            label={roleName(act.subject_role_id)}
            size="small"
            sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none', fontWeight: 700 }}
          />
          <TextField
            size="small"
            value={act.action_text}
            onChange={(e) => update.mutate({ actionId: act.id, data: { action_text: e.target.value } })}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => remove.mutate(act.id)}>
            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#fb7185' }} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          displayEmpty
          value={roleId}
          onChange={(e) => setRoleId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 160, fontSize: '0.8rem' }}
        >
          <MenuItem value=""><em>Role…</em></MenuItem>
          {subjectRoles.map((l) => (
            <MenuItem key={l.subject_role_id} value={l.subject_role_id}>
              {l.subject_role?.role_name ?? `#${l.subject_role_id}`}
            </MenuItem>
          ))}
        </Select>
        <TextField
          size="small"
          placeholder="What do they do? e.g. Walk down the aisle"
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          onClick={add}
          variant="contained"
          disabled={!roleId || !actionText.trim() || create.isPending}
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', bgcolor: '#60a5fa', '&:hover': { bgcolor: '#3b82f6' } }}
        >
          Add
        </Button>
      </Stack>
    </Stack>
  );
}

function MomentPlacementsEditor({
  moment,
  subjectRoles,
  spaceSlots,
  blueprintId,
  versionId,
}: {
  moment: DayBlueprintMoment;
  subjectRoles: DayBlueprintSubjectRoleLink[];
  spaceSlots: DayBlueprintSpaceSlot[];
  blueprintId: number;
  versionId: number;
}) {
  const create = useCreateMomentPlacement(blueprintId, versionId);
  const update = useUpdateMomentPlacement(blueprintId, versionId);
  const remove = useDeleteMomentPlacement(blueprintId, versionId);
  const [roleId, setRoleId] = useState<number | ''>('');
  const [slotId, setSlotId] = useState<number | ''>('');
  const [positionHint, setPositionHint] = useState('');

  const roleName = (id: number) =>
    subjectRoles.find((l) => l.subject_role_id === id)?.subject_role?.role_name ?? `role #${id}`;
  const slotLabel = (id: number) =>
    spaceSlots.find((s) => s.id === id)?.label ?? `slot #${id}`;

  const add = async () => {
    if (!roleId || !slotId) return;
    await create.mutateAsync({
      momentId: moment.id,
      data: {
        subject_role_id: Number(roleId),
        day_blueprint_space_slot_id: Number(slotId),
        position_hint: positionHint.trim() || undefined,
      },
    });
    setRoleId('');
    setSlotId('');
    setPositionHint('');
  };

  return (
    <Stack spacing={0.75}>
      {(moment.placements ?? []).map((p: DayBlueprintMomentPlacement) => (
        <Stack
          key={p.id}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ p: 1, borderRadius: 1, bgcolor: 'rgba(15,23,42,0.4)' }}
        >
          <Chip
            label={roleName(p.subject_role_id)}
            size="small"
            sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none', fontWeight: 700 }}
          />
          <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>→</Typography>
          <Chip
            label={slotLabel(p.day_blueprint_space_slot_id)}
            size="small"
            sx={{ bgcolor: 'rgba(34,197,94,0.14)', color: '#86efac', border: 'none', fontWeight: 700 }}
          />
          <TextField
            size="small"
            placeholder="Position hint"
            value={p.position_hint ?? ''}
            onChange={(e) => update.mutate({ placementId: p.id, data: { position_hint: e.target.value } })}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => remove.mutate(p.id)}>
            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#fb7185' }} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          displayEmpty
          value={roleId}
          onChange={(e) => setRoleId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 160, fontSize: '0.8rem' }}
        >
          <MenuItem value=""><em>Role…</em></MenuItem>
          {subjectRoles.map((l) => (
            <MenuItem key={l.subject_role_id} value={l.subject_role_id}>
              {l.subject_role?.role_name ?? `#${l.subject_role_id}`}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={slotId}
          onChange={(e) => setSlotId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 180, fontSize: '0.8rem' }}
        >
          <MenuItem value=""><em>Slot…</em></MenuItem>
          {spaceSlots.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
          ))}
        </Select>
        <TextField
          size="small"
          placeholder="Position hint (e.g. centre, facing guests)"
          value={positionHint}
          onChange={(e) => setPositionHint(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          onClick={add}
          variant="contained"
          disabled={!roleId || !slotId || create.isPending}
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', bgcolor: '#60a5fa', '&:hover': { bgcolor: '#3b82f6' } }}
        >
          Add
        </Button>
      </Stack>
    </Stack>
  );
}
