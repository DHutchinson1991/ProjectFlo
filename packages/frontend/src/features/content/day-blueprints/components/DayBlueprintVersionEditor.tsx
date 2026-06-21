'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  useDayBlueprint,
  useDayBlueprintAiProgress,
  useDayBlueprintAiRuns,
  useDayBlueprintVersion,
  useGenerateDayBlueprintSpatial,
  useGenerateDayBlueprintDay,
  useUpdateDayBlueprint,
  useUpdateMoment,
} from '../hooks';
import type {
  DayBlueprintSummary,
  DayBlueprintVersionDetail,
} from '../types';
import { VersionEditorHeader } from './version-editor/VersionEditorHeader';
import { PublishedVersionEditBanner } from './version-editor/PublishedVersionEditBanner';
import type { PendingDayBlueprintMomentPreview } from './DayBlueprintActivitiesRail';
import { DayBlueprintAiRunsPanel } from './DayBlueprintAiRunsPanel';
import { buildPendingMomentsByActivity } from './day-blueprint-pending-moments';
import { MomentDetailDialog } from './version-editor/moments/MomentDetailDialog';
import { VersionEditorWorkspace } from './version-editor/VersionEditorWorkspace';
import { isBlankAuthoringBlueprint } from '../utils/blueprint-variant-tags';

interface Props {
  blueprintId: number;
  versionId: number;
}

// ─── Main editor ─────────────────────────────────────────────────

export function DayBlueprintVersionEditor({ blueprintId, versionId }: Props) {
  const router = useRouter();
  const blueprintQuery = useDayBlueprint(blueprintId);
  const versionQuery = useDayBlueprintVersion(blueprintId, versionId);
  const generateDay = useGenerateDayBlueprintDay(blueprintId, versionId);
  const generateSpatial = useGenerateDayBlueprintSpatial(blueprintId, versionId);
  const updateBlueprint = useUpdateDayBlueprint();
  const aiRunsQuery = useDayBlueprintAiRuns(versionId, { live: true, pollMs: 1000 });

  const [activeDayId, setActiveDayId] = useState<number | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
  const [hoveredMomentRoleId, setHoveredMomentRoleId] = useState<number | null>(null);

  const [selectedSubjectRoleId, setSelectedSubjectRoleId] = useState<number | null>(null);

  const blueprint = blueprintQuery.data as DayBlueprintSummary | undefined;
  const version = versionQuery.data as DayBlueprintVersionDetail | undefined;
  const [editableBlueprintName, setEditableBlueprintName] = useState('');
  const blueprintNameSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const activeAiRun = useMemo(
    () => (aiRunsQuery.data ?? []).find((run) => run.status === 'RUNNING') ?? null,
    [aiRunsQuery.data],
  );
  const aiProgress = useDayBlueprintAiProgress(versionId, activeAiRun?.id ?? null);
  const isGeneratingMoments = Boolean(activeAiRun) || generateDay.isPending || aiProgress.status === 'running' || aiProgress.status === 'connecting';
  const pendingMomentsByActivity = useMemo<Record<number, PendingDayBlueprintMomentPreview[]>>(
    () => buildPendingMomentsByActivity(aiProgress.events, version, isGeneratingMoments),
    [aiProgress.events, isGeneratingMoments, version],
  );

  const updateMoment = useUpdateMoment(blueprintId, versionId);

  const blankAuthoring = useMemo(
    () => isBlankAuthoringBlueprint(blueprint?.variant_tags as Record<string, unknown> | null | undefined),
    [blueprint?.variant_tags],
  );

  const handleCommitMomentDuration = useCallback(
    (_activityId: number, momentId: number, durationSeconds: number) => {
      void updateMoment.mutateAsync({ momentId, data: { duration_seconds: durationSeconds } });
    },
    [updateMoment],
  );

  useEffect(() => {
    setSelectedSubjectRoleId(null);
  }, [selectedActivityId, selectedMomentId, activeDayId]);

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
    setEditableBlueprintName(blueprint?.display_name ?? '');
  }, [blueprint?.id, blueprint?.display_name]);

  useEffect(() => () => {
    if (blueprintNameSaveTimeoutRef.current) {
      clearTimeout(blueprintNameSaveTimeoutRef.current);
    }
  }, []);

  const handleBlueprintTitleChange = (nextTitle: string) => {
    setEditableBlueprintName(nextTitle);
    if (!blueprint || version?.status !== 'DRAFT') return;

    if (blueprintNameSaveTimeoutRef.current) {
      clearTimeout(blueprintNameSaveTimeoutRef.current);
    }
    blueprintNameSaveTimeoutRef.current = setTimeout(() => {
      const trimmed = nextTitle.trim();
      if (!trimmed || trimmed === blueprint.display_name) return;
      updateBlueprint.mutate({ id: blueprint.id, data: { display_name: trimmed } });
    }, 500);
  };

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

  const contextualGeneratePending = selectedMoment
    ? generateSpatial.isPending
    : isGeneratingMoments;
  const contextualGenerateLabel = selectedMoment
    ? 'Generate for Moment'
    : selectedActivity
      ? 'Generate for Activity'
      : activeDay
        ? 'Generate for Day'
        : 'Generate';
  const contextualGenerateTooltip = selectedMoment
    ? 'Generate spatial placement for this moment.'
    : selectedActivity
      ? 'Generate moments for this activity.'
      : 'Generate moments for this day.';
  const canRunContextualGenerate = version?.status === 'DRAFT' && Boolean(activeDay);
  const handleContextualGenerate = () => {
    if (!activeDay) return;
    if (selectedMoment) {
      generateSpatial.mutate({
        dayId: activeDay.id,
        activityId: selectedActivity?.id,
        momentId: selectedMoment.id,
      });
      return;
    }
    if (selectedActivity) {
      generateDay.mutate({ dayId: activeDay.id, activityId: selectedActivity.id, mode: 'AI' });
      return;
    }
    generateDay.mutate({ dayId: activeDay.id, mode: 'AI' });
  };

  const handleSelectMoment = (activityId: number, momentId: number) => {
    setSelectedActivityId(activityId);
    setSelectedMomentId((prev) => (prev === momentId ? null : momentId));
  };

  useEffect(() => {
    setHoveredMomentRoleId(null);
  }, [selectedActivityId, selectedMomentId]);

  const latestDraft = useMemo(
    () =>
      [...(blueprint?.versions ?? [])]
        .filter((v) => v.status === 'DRAFT')
        .sort((a, b) => b.version_number - a.version_number)[0] ?? null,
    [blueprint?.versions],
  );

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
      <VersionEditorHeader
        blueprint={blueprint}
        version={version}
        editableBlueprintName={editableBlueprintName}
        isDraft={isDraft}
        isSaving={updateBlueprint.isPending}
        onTitleChange={handleBlueprintTitleChange}
        onVersionHistory={() => router.push('/packages')}
      />

      {!isDraft && (
        <PublishedVersionEditBanner
          blueprintId={blueprintId}
          sourceVersionId={versionId}
          sourceVersionNumber={version.version_number}
          existingDraftVersionId={latestDraft?.id}
          existingDraftVersionNumber={latestDraft?.version_number}
        />
      )}

      <VersionEditorWorkspace
        blueprintId={blueprintId}
        versionId={versionId}
        version={version}
        activeDay={activeDay}
        selectedActivity={selectedActivity}
        selectedMoment={selectedMoment}
        activeDayId={activeDayId}
        selectedActivityId={selectedActivityId}
        selectedMomentId={selectedMomentId}
        hoveredMomentRoleId={hoveredMomentRoleId}
        onHoverMomentRole={setHoveredMomentRoleId}
        onSelectDay={handleSelectDay}
        onSelectTimelineActivity={handleSelectActivity}
        onSelectRailActivity={handleToggleActivitySelection}
        onSelectMoment={handleSelectMoment}
        isDraft={isDraft}
        isGeneratingMoments={isGeneratingMoments}
        pendingMomentsByActivity={pendingMomentsByActivity}
        aiProgressEvents={aiProgress.events}
        aiProgressCurrentLabel={aiProgress.currentLabel}
        subjectSpatialStatus={subjectSpatialStatus}
        blankAuthoring={blankAuthoring}
        selectedSubjectRoleId={selectedSubjectRoleId}
        onSelectSubjectRole={setSelectedSubjectRoleId}
        onCommitMomentDuration={handleCommitMomentDuration}
      />

      <DayBlueprintAiRunsPanel
        blueprintId={blueprintId}
        versionId={versionId}
        versionLabel={`v${version.version_number} · ${blueprint?.display_name ?? 'Blueprint'}`}
        activeDay={activeDay}
        readOnly={!isDraft}
        onGenerate={handleContextualGenerate}
        generateLabel={contextualGenerateLabel}
        generateTooltip={contextualGenerateTooltip}
        generatePending={contextualGeneratePending}
        generateDisabled={!canRunContextualGenerate || contextualGeneratePending}
      />

    </Box>
  );
}
