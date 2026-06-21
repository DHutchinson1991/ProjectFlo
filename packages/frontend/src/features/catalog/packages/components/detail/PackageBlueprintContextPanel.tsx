'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { PackageSpaceSlot } from '@/features/workflow/locations/types/floor-plan.types';
import { scenesApi } from '@/features/content/scenes/api';
import { servicePackagesApi } from '../../api';
import type { PackageActivityRecord, PackageEventDaySubjectRecord } from '../../types';
import type { MomentActionRecord } from '../../utils/moment-subject-context';
import { buildPackageBlueprintViewModel } from '../../utils/package-blueprint-view-model';
import {
    buildPackageMomentCameraCards,
    findLinkedSceneMoment,
    type EditorialCameraAssignment,
} from '../../utils/package-moment-camera-context';

type PackageMomentRecord = NonNullable<PackageActivityRecord['moments']>[number] & {
    actions?: MomentActionRecord[];
    camera_subject_plan?: Record<string, string[]> | null;
    order_index?: number;
};

interface PackageBlueprintContextPanelProps {
    packageId: number | null;
    packageActivities: PackageActivityRecord[];
    packageSubjects: PackageEventDaySubjectRecord[];
    packageEventDays: EventDay[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    selectedMomentId: number | null;
    selectedSubjectId: number | null;
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function ContextMetaRow({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>{label}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1', textAlign: 'right' }}>{value}</Typography>
        </Box>
    );
}

function resolveLinkedSceneId(activity: PackageActivityRecord | null): number | null {
    const schedule = activity?.scene_schedules?.[0];
    if (!schedule) return null;
    if (typeof schedule.scene_id === 'number') return schedule.scene_id;
    if (typeof schedule.scene?.id === 'number') return schedule.scene.id;
    return null;
}

export function PackageBlueprintContextPanel({
    packageId,
    packageActivities,
    packageSubjects,
    packageEventDays,
    scheduleActiveDayId,
    selectedActivityId,
    selectedMomentId,
    selectedSubjectId,
}: PackageBlueprintContextPanelProps) {
    const activity = useMemo(() => {
        if (selectedActivityId != null) {
            return packageActivities.find((row) => row.id === selectedActivityId) ?? null;
        }
        if (selectedMomentId == null) return null;
        return packageActivities.find((row) =>
            (row.moments ?? []).some((moment) => moment.id === selectedMomentId),
        ) ?? null;
    }, [packageActivities, selectedActivityId, selectedMomentId]);

    const moment = useMemo((): PackageMomentRecord | null => {
        if (selectedMomentId == null) return null;
        for (const row of packageActivities) {
            const match = (row.moments ?? []).find((m) => m.id === selectedMomentId);
            if (match) return match as PackageMomentRecord;
        }
        return null;
    }, [packageActivities, selectedMomentId]);

    const dayName = scheduleActiveDayId != null
        ? packageEventDays.find((day) => day.id === scheduleActiveDayId)?.name ?? 'Unassigned'
        : 'Unassigned';

    const selectedSubject = selectedSubjectId != null
        ? packageSubjects.find((subject) => subject.id === selectedSubjectId) ?? null
        : null;

    const { data: spatialPayload } = useQuery({
        queryKey: ['package-blueprint-spatial', packageId],
        queryFn: () => servicePackagesApi.getBlueprintSpatial(packageId!),
        enabled: packageId != null,
        staleTime: 1000 * 60 * 2,
    });

    const activeSpaceSlot = useMemo((): PackageSpaceSlot | null => {
        const viewModel = buildPackageBlueprintViewModel({
            spaceSlots: (spatialPayload?.spaceSlots ?? []) as PackageSpaceSlot[],
            packageEventDays,
            packageActivities,
            activeDayId: scheduleActiveDayId,
            selectedActivityId,
            selectedMomentId,
            selectedSpaceSlotId: null,
        });
        return viewModel.activeSpaceSlot;
    }, [
        packageActivities,
        packageEventDays,
        scheduleActiveDayId,
        selectedActivityId,
        selectedMomentId,
        spatialPayload?.spaceSlots,
    ]);

    const linkedSceneId = resolveLinkedSceneId(activity);

    const { data: linkedScene } = useQuery({
        queryKey: ['scene-for-package-context', linkedSceneId],
        queryFn: () => scenesApi.scenes.getById(linkedSceneId!),
        enabled: linkedSceneId != null && selectedMomentId != null,
        staleTime: 1000 * 60 * 2,
    });

    const editorialAssignments = useMemo((): EditorialCameraAssignment[] => {
        if (!moment || !linkedScene?.moments) return [];
        const sceneMoment = findLinkedSceneMoment(
            linkedScene.moments as Array<{
                id: number;
                name: string;
                order_index: number;
                package_activity_moment_id?: number | null;
                recording_setup?: {
                    camera_assignments?: EditorialCameraAssignment[];
                } | null;
            }>,
            moment.id,
            moment.name,
            moment.order_index ?? 0,
        );
        return sceneMoment?.recording_setup?.camera_assignments ?? [];
    }, [linkedScene?.moments, moment]);

    const actionCards = useMemo(() => {
        if (!moment?.actions?.length) return [];
        const byRole = new Map<string, MomentActionRecord[]>();
        for (const action of moment.actions) {
            const roleName = action.subject_role?.role_name ?? `Role #${action.subject_role_id ?? '?'}`;
            const list = byRole.get(roleName) ?? [];
            list.push(action);
            byRole.set(roleName, list);
        }
        return Array.from(byRole.entries()).map(([roleName, actions]) => ({ roleName, actions }));
    }, [moment]);

    const filteredActionCards = useMemo(() => {
        if (!selectedSubject) return [];
        const keys = [
            selectedSubject.role_template?.role_name,
            selectedSubject.name,
        ]
            .filter((value): value is string => Boolean(value?.trim()))
            .map((value) => value.trim().toLowerCase());
        return actionCards.filter((card) =>
            keys.includes(card.roleName.trim().toLowerCase()),
        );
    }, [actionCards, selectedSubject]);

    const cameraCards = useMemo(
        () => buildPackageMomentCameraCards({
            packageMomentId: selectedMomentId,
            cameraSubjectPlan: moment?.camera_subject_plan,
            spaceSlot: activeSpaceSlot,
            packageSubjects: packageSubjects.map((subject) => ({
                id: subject.id,
                name: subject.name,
            })),
            editorialAssignments,
        }),
        [
            activeSpaceSlot,
            editorialAssignments,
            moment?.camera_subject_plan,
            packageSubjects,
            selectedMomentId,
        ],
    );

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Moment context
                </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
                {!moment && (
                    <Typography sx={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
                        Select an activity and moment to review blueprint actions and camera coverage.
                    </Typography>
                )}

                {activity && !moment && (
                    <Stack spacing={1.5}>
                        <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                            {activity.name}
                        </Typography>
                        {activity.description && (
                            <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.55 }}>
                                {activity.description}
                            </Typography>
                        )}
                        <ContextMetaRow label="Day" value={dayName} />
                        <ContextMetaRow label="Moments" value={String(activity.moments?.length ?? 0)} />
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
                        </Stack>

                        <Stack spacing={1}>
                            <ContextMetaRow label="Day" value={dayName} />
                            <ContextMetaRow label="Duration" value={formatDuration(moment.duration_seconds)} />
                            <ContextMetaRow label="Actions" value={String(moment.actions?.length ?? 0)} />
                        </Stack>

                        <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                                Subject actions
                            </Typography>
                            {selectedSubjectId == null ? (
                                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                                    Select someone on the floor plan to see their actions here.
                                </Typography>
                            ) : filteredActionCards.length === 0 ? (
                                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                                    No blueprint actions for this person in this moment.
                                </Typography>
                            ) : (
                                <Stack spacing={0.9}>
                                    {filteredActionCards.map((card) => (
                                        <Box
                                            key={card.roleName}
                                            sx={{
                                                p: 1.1,
                                                borderRadius: 1.5,
                                                bgcolor: 'rgba(255,215,0,0.07)',
                                                border: '1px solid rgba(255,215,0,0.24)',
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0' }}>
                                                {card.roleName}
                                            </Typography>
                                            <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                                                {card.actions.map((action, index) => (
                                                    <Typography key={`${card.roleName}-${index}`} sx={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                                                        {action.action_text}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                                Camera coverage
                            </Typography>
                            {cameraCards.length === 0 ? (
                                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                                    No camera coverage for this moment yet. Run package blocking or link a film to populate camera plans.
                                </Typography>
                            ) : (
                                <Stack spacing={0.75}>
                                    {cameraCards.map((card) => (
                                        <Box
                                            key={card.key}
                                            sx={{
                                                px: 1.1,
                                                py: 0.85,
                                                borderRadius: 1.25,
                                                bgcolor: 'rgba(96,165,250,0.08)',
                                                border: '1px solid rgba(96,165,250,0.18)',
                                            }}
                                        >
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                                <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#93c5fd' }}>
                                                    {card.label}
                                                </Typography>
                                                {card.shotLabel ? (
                                                    <Chip
                                                        label={card.shotLabel}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.62rem',
                                                            bgcolor: 'rgba(59,130,246,0.16)',
                                                            color: '#bfdbfe',
                                                            border: 'none',
                                                        }}
                                                    />
                                                ) : null}
                                            </Stack>
                                            {card.targets ? (
                                                <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1', mt: 0.45, lineHeight: 1.45 }}>
                                                    {card.targets}
                                                </Typography>
                                            ) : null}
                                            {card.editorialNotes ? (
                                                <Typography sx={{ fontSize: '0.64rem', color: '#94a3b8', mt: 0.35, lineHeight: 1.45, fontStyle: 'italic' }}>
                                                    {card.editorialNotes}
                                                </Typography>
                                            ) : null}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
