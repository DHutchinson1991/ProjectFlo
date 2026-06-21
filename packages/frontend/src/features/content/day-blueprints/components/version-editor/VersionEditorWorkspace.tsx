import { useCallback, useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { DraggableTabBar } from '@/shared/ui/DraggableTabBar';
import type { DayBlueprintAiProgressEvent } from '../../hooks';
import type {
  DayBlueprintActivity,
  DayBlueprintDay,
  DayBlueprintMoment,
  DayBlueprintVersionDetail,
} from '../../types';
import { DayBlueprintActivitiesRail, type PendingDayBlueprintMomentPreview } from '../DayBlueprintActivitiesRail';
import { DayBlueprintFloorPlanTab } from '../DayBlueprintFloorPlanTab';
import { DayBlueprintTimelineSection } from '../DayBlueprintTimelineSection';
import { BlueprintContextPanel } from './BlueprintContextPanel';
import { DayBlueprintPeopleTabPanel, DayBlueprintSpacesTabPanel } from './DayBlueprintEditTabPanels';
import {
    DAY_BLUEPRINT_EDIT_TAB_LABELS,
    DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER,
    loadDayBlueprintEditTabOrder,
    saveDayBlueprintEditTabOrder,
    type DayBlueprintEditTabId,
} from '../../utils/day-blueprint-edit-tabs';

interface VersionEditorWorkspaceProps {
  blueprintId: number;
  versionId: number;
  version: DayBlueprintVersionDetail;
  activeDay: DayBlueprintDay | null;
  selectedActivity: DayBlueprintActivity | null;
  selectedMoment: DayBlueprintMoment | null;
  activeDayId: number | null;
  selectedActivityId: number | null;
  selectedMomentId: number | null;
  hoveredMomentRoleId: number | null;
  onHoverMomentRole: (roleId: number | null) => void;
  onSelectDay: (dayId: number) => void;
  onSelectTimelineActivity: (dayId: number, activityId: number) => void;
  onSelectRailActivity: (activityId: number | null) => void;
  onSelectMoment: (activityId: number, momentId: number) => void;
  isDraft: boolean;
  isGeneratingMoments: boolean;
  pendingMomentsByActivity: Record<number, PendingDayBlueprintMomentPreview[]>;
  aiProgressEvents: ReadonlyArray<DayBlueprintAiProgressEvent>;
  aiProgressCurrentLabel: string;
  subjectSpatialStatus: Map<number, 'generating' | 'done'>;
  blankAuthoring?: boolean;
  selectedSubjectRoleId: number | null;
  onSelectSubjectRole: (roleId: number | null) => void;
  onCommitMomentDuration?: (activityId: number, momentId: number, durationSeconds: number) => void;
}

export function VersionEditorWorkspace({
  blueprintId,
  versionId,
  version,
  activeDay,
  selectedActivity,
  selectedMoment,
  activeDayId,
  selectedActivityId,
  selectedMomentId,
  hoveredMomentRoleId,
  onHoverMomentRole,
  onSelectDay,
  onSelectTimelineActivity,
  onSelectRailActivity,
  onSelectMoment,
  isDraft,
  isGeneratingMoments,
  pendingMomentsByActivity,
  aiProgressEvents,
  aiProgressCurrentLabel,
  subjectSpatialStatus,
  blankAuthoring = false,
  selectedSubjectRoleId,
  onSelectSubjectRole,
  onCommitMomentDuration,
}: VersionEditorWorkspaceProps) {
  const [activeEditTab, setActiveEditTab] = useState<DayBlueprintEditTabId>('blueprint');
  const [editTabOrder, setEditTabOrder] = useState<DayBlueprintEditTabId[]>(DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER);

  useEffect(() => {
    setEditTabOrder(loadDayBlueprintEditTabOrder());
  }, []);

  const handleEditTabReorder = useCallback((nextOrder: DayBlueprintEditTabId[]) => {
    setEditTabOrder(nextOrder);
    saveDayBlueprintEditTabOrder(nextOrder);
  }, []);

  const editTabs = editTabOrder.map((id) => ({
    id,
    label: DAY_BLUEPRINT_EDIT_TAB_LABELS[id],
  }));

  return (
    <>
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
          onSelectDay={onSelectDay}
          onSelectActivity={onSelectTimelineActivity}
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
            onSelectActivity={onSelectRailActivity}
            onSelectMoment={onSelectMoment}
            isDraft={isDraft}
            blueprintId={blueprintId}
            versionId={versionId}
            version={version}
            blankAuthoring={blankAuthoring}
            isGeneratingMoments={isGeneratingMoments}
            pendingMomentsByActivity={pendingMomentsByActivity}
            aiProgressEvents={aiProgressEvents}
            aiProgressCurrentLabel={aiProgressCurrentLabel}
            onCommitMomentDuration={onCommitMomentDuration}
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
          <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.09)', px: 2.5, pt: 2.5 }}>
            <DraggableTabBar
              tabs={editTabs}
              activeTab={activeEditTab}
              onTabChange={setActiveEditTab}
              onReorder={handleEditTabReorder}
            />
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', py: { xs: 2, md: 2.5 }, px: 0 }}>
            <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
              <Box sx={{ display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column' }}>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', pt: { xs: 1, md: 1.25 }, px: 0, pb: 0 }}>
                    {activeEditTab === 'blueprint' ? (
                      <DayBlueprintFloorPlanTab
                        blueprintId={blueprintId}
                        versionId={versionId}
                        readOnly={!isDraft}
                        slots={version.space_slots ?? []}
                        subjectRoles={version.subject_roles ?? []}
                        activeDay={activeDay}
                        selectedActivity={selectedActivity}
                        selectedMoment={selectedMoment}
                        hoveredMomentRoleId={hoveredMomentRoleId}
                        onHoverMomentRole={onHoverMomentRole}
                        subjectSpatialStatus={subjectSpatialStatus}
                        blankAuthoring={blankAuthoring}
                        selectedSubjectRoleId={selectedSubjectRoleId}
                        onSelectSubjectRole={onSelectSubjectRole}
                      />
                    ) : null}
                    {activeEditTab === 'people' ? (
                      <DayBlueprintPeopleTabPanel subjectRoles={version.subject_roles ?? []} />
                    ) : null}
                    {activeEditTab === 'spaces' ? (
                      <DayBlueprintSpacesTabPanel spaceSlots={version.space_slots ?? []} />
                    ) : null}
                  </Box>
                </Box>

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
            selectedSubjectRoleId={selectedSubjectRoleId}
          />
        </Box>
      </Box>

    </>
  );
}
