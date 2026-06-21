'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import CropFreeRoundedIcon from '@mui/icons-material/CropFreeRounded';
import DesignServicesRoundedIcon from '@mui/icons-material/DesignServicesRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import { SpaceSlotOverlay } from '@/features/workflow/locations/components/floor-plan/components/Panels/SpaceSlotOverlay';
import type { PackageSpaceSlot } from '@/features/workflow/locations/types/floor-plan.types';
import {
    useUpdateSlotCameraPosition,
    useUpsertSlotMomentCamera,
} from '@/features/workflow/locations/hooks/useSpaceSlotSpatial';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import { servicePackagesApi } from '../../../api';
import type { PackageActivityRecord } from '../../../types';
import { isGuestLikeRoleLabel } from '@projectflo/shared';
import { buildPackageBlueprintViewModel } from '../../../utils/package-blueprint-view-model';

type PackageBlueprintSpaceSlot = PackageSpaceSlot & {
    activity_assignments?: Array<{ package_activity_id?: number | null }>;
};

interface PackageBlueprintTabProps {
    packageId: number | null;
    blueprintBacked: boolean;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    activeDayId: number | null;
    selectedActivityId: number | null;
    selectedMomentId: number | null;
    selectedSubjectId: number | null;
    onSelectSubject: (id: number | null) => void;
}

export function PackageBlueprintTab({
    packageId,
    blueprintBacked,
    packageEventDays,
    packageActivities,
    activeDayId,
    selectedActivityId,
    selectedMomentId,
    selectedSubjectId,
    onSelectSubject,
}: PackageBlueprintTabProps) {
    const {
        data: spatialPayload,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['package-blueprint-spatial', packageId],
        queryFn: () => servicePackagesApi.getBlueprintSpatial(packageId!),
        enabled: blueprintBacked && Boolean(packageId),
        staleTime: 1000 * 60 * 2,
    });
    const spaceSlots = spatialPayload?.spaceSlots ?? [];
    const updateSlotCamera = useUpdateSlotCameraPosition();
    const upsertSlotMomentCamera = useUpsertSlotMomentCamera();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 420, height: 520 });
    const [canvasControls, setCanvasControls] = useState<{
        fitToView: () => void;
        isPanMode: boolean;
        togglePanMode: () => void;
    } | null>(null);

    const viewModel = useMemo(
        () => buildPackageBlueprintViewModel({
            spaceSlots,
            packageEventDays,
            packageActivities,
            activeDayId,
            selectedActivityId,
            selectedMomentId,
            selectedSpaceSlotId: null,
        }),
        [
            activeDayId,
            packageActivities,
            packageEventDays,
            selectedActivityId,
            selectedMomentId,
            spaceSlots,
        ],
    );

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            setContainerSize({
                width: Math.max(320, Math.floor(entry.contentRect.width)),
                height: Math.max(360, Math.floor(entry.contentRect.height)),
            });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [isLoading, viewModel.activeSpaceSlot?.id]);

    const handleControlsReady = useCallback(
        (controls: { fitToView: () => void; isZoomed: boolean; isPanMode: boolean; togglePanMode: () => void }) => {
            setCanvasControls({
                fitToView: controls.fitToView,
                isPanMode: controls.isPanMode,
                togglePanMode: controls.togglePanMode,
            });
        },
        [],
    );

    const handleCameraMove = useCallback(
        (positionId: number, x: number, y: number, rotation: number) => {
            if (selectedMomentId) {
                upsertSlotMomentCamera.mutate({
                    cameraPositionId: positionId,
                    momentId: selectedMomentId,
                    x,
                    y,
                    rotation,
                });
                return;
            }
            updateSlotCamera.mutate({ id: positionId, x, y, rotation });
        },
        [selectedMomentId, updateSlotCamera, upsertSlotMomentCamera],
    );

    if (!blueprintBacked) {
        return (
            <CenteredState
                icon={<DesignServicesRoundedIcon sx={{ fontSize: 34, color: 'rgba(148,163,184,0.28)' }} />}
                title="Blueprint tools need a day design"
                body="Choose a day design when creating this package to review the floor plan, activities, moments, and camera blocking here."
            />
        );
    }

    if (!packageId) {
        return (
            <CenteredState
                icon={<DesignServicesRoundedIcon sx={{ fontSize: 34, color: 'rgba(148,163,184,0.28)' }} />}
                title="Save the package first"
                body="Package blueprint planning is available after the package clone exists."
            />
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}>
                <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.35)' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <CenteredState
                icon={<MapRoundedIcon sx={{ fontSize: 32, color: 'rgba(248,113,113,0.45)' }} />}
                title="Could not load package floor plan"
                body="The package clone loaded, but the spatial plan could not be retrieved."
            />
        );
    }

    if (!viewModel.activeSpaceSlot) {
        return (
            <CenteredState
                icon={<MapRoundedIcon sx={{ fontSize: 32, color: 'rgba(148,163,184,0.28)' }} />}
                title="No package space slots yet"
                body="Assign a location or space to the package activities to create a package-scoped floor plan."
            />
        );
    }

    const contextLabel = [
        viewModel.activeDayName,
        viewModel.activeActivity?.name,
        viewModel.activeMomentName,
        viewModel.activeSpaceSlot?.label,
    ].filter(Boolean).join(' / ');
    const peopleGallery = buildPeopleGallery(viewModel.activeSpaceSlot, selectedMomentId);
    const peopleCount = peopleGallery.reduce((sum, person) => sum + person.count, 0);
    const peopleOnFloorCount = peopleGallery
        .filter((person) => person.isOnFloor)
        .reduce((sum, person) => sum + person.count, 0);

    return (
        <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: 'rgba(15,23,42,0.25)',
                }}
            >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.82rem' }}>
                        Package Blueprint
                    </Typography>
                    <Typography noWrap sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.15 }}>
                        {contextLabel || 'Package-scoped floor plan and blocking'}
                    </Typography>
                </Box>

                <Tooltip title="Fit floor plan to view">
                    <span>
                        <IconButton
                            size="small"
                            disabled={!canvasControls}
                            onClick={() => canvasControls?.fitToView()}
                            sx={{ color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.04)' }}
                        >
                            <CropFreeRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Toggle pan mode">
                    <span>
                        <IconButton
                            size="small"
                            disabled={!canvasControls}
                            onClick={() => canvasControls?.togglePanMode()}
                            sx={{
                                color: canvasControls?.isPanMode ? '#dbeafe' : '#94a3b8',
                                bgcolor: canvasControls?.isPanMode ? 'rgba(96,165,250,0.16)' : 'rgba(255,255,255,0.04)',
                            }}
                        >
                            <PanToolRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            <Box ref={containerRef} sx={{ flex: '1 1 auto', minHeight: 360, overflow: 'hidden' }}>
                <SpaceSlotOverlay
                    spaceSlot={viewModel.activeSpaceSlot}
                    width={containerSize.width}
                    height={containerSize.height}
                    isEditing
                    momentId={selectedMomentId}
                    lockSubjects
                    onCameraMove={handleCameraMove}
                    onControlsReady={handleControlsReady}
                    highlightSubjectRoleIds={selectedSubjectId ? [selectedSubjectId] : []}
                    onSubjectSelect={onSelectSubject}
                    fillViewport
                    contentMaxSize={720}
                    viewportBackgroundColor="rgba(2,6,23,0.35)"
                    hideLabels
                    compactSubjectLabels
                />
            </Box>

            <Box
                sx={{
                    flex: '0 0 auto',
                    minHeight: 84,
                    maxHeight: 118,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    borderTop: '1px solid rgba(148,163,184,0.16)',
                    background: 'linear-gradient(180deg, rgba(148,163,184,0.04), rgba(148,163,184,0))',
                    px: 2,
                    py: 1,
                    pb: 1.25,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.85 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        People
                    </Typography>
                    <Chip
                        label={selectedMomentId ? `${peopleOnFloorCount}/${peopleCount} on floor` : `${peopleCount} subjects`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'none' }}
                    />
                </Stack>
                {peopleGallery.length === 0 ? (
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic' }}>
                        No people are linked to this package space yet.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1.15, minWidth: 'min-content', pr: 1 }}>
                        {peopleGallery.map((person) => {
                            const selected = selectedSubjectId === person.subjectId;
                            return (
                                <Box
                                    key={person.subjectId}
                                    onClick={() => {
                                        if (!person.isOnFloor) return;
                                        onSelectSubject(selected ? null : person.subjectId);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.45,
                                        width: 72,
                                        flexShrink: 0,
                                        opacity: person.isOnFloor ? 1 : 0.3,
                                        cursor: person.isOnFloor ? 'pointer' : 'default',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: person.isOnFloor
                                                ? 'linear-gradient(135deg, rgba(96,165,250,0.28), rgba(168,85,247,0.28))'
                                                : 'rgba(255,255,255,0.04)',
                                            border: selected
                                                ? '2px solid rgba(255,215,0,0.9)'
                                                : `1px solid ${person.isOnFloor ? 'rgba(96,165,250,0.42)' : 'rgba(255,255,255,0.08)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: person.isOnFloor ? '#93c5fd' : '#475569', lineHeight: 1 }}>
                                            {initialsFromLabel(person.label)}
                                        </Typography>
                                        {person.count > 1 && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    right: -3,
                                                    bottom: -3,
                                                    width: 15,
                                                    height: 15,
                                                    borderRadius: '50%',
                                                    bgcolor: '#1e293b',
                                                    border: '1px solid rgba(96,165,250,0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>
                                                    {person.count}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography
                                        title={person.label}
                                        sx={{
                                            fontSize: '0.58rem',
                                            color: person.isOnFloor ? '#94a3b8' : '#475569',
                                            textAlign: 'center',
                                            lineHeight: 1.25,
                                            width: '100%',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {person.label}
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

function buildPeopleGallery(
    slot: PackageBlueprintSpaceSlot | null,
    selectedMomentId: number | null,
): Array<{ subjectId: number; label: string; count: number; isOnFloor: boolean; orderIndex: number }> {
    if (!slot) return [];
    const bySubject = new Map<number, {
        subjectId: number;
        label: string;
        count: number;
        instanceCount: number;
        isOnFloor: boolean;
        orderIndex: number;
    }>();

    for (const position of slot.subject_positions ?? []) {
        const subjectId = position.day_subject_id;
        if (subjectId == null) continue;
        const existing = bySubject.get(subjectId);
        const label = position.day_subject?.name ?? position.label ?? `Subject #${subjectId}`;
        const hasMomentOverride = selectedMomentId == null
            ? true
            : Boolean(position.moment_overrides?.some((override) => override.moment_id === selectedMomentId));
        const count = Math.max(position.day_subject?.count ?? 1, 1);
        if (existing) {
            existing.instanceCount += 1;
            existing.count = Math.max(existing.count, count, existing.instanceCount);
            existing.isOnFloor = existing.isOnFloor || hasMomentOverride;
            existing.orderIndex = Math.min(existing.orderIndex, position.day_subject?.order_index ?? position.order_index ?? 0);
            continue;
        }
        bySubject.set(subjectId, {
            subjectId,
            label,
            count,
            instanceCount: 1,
            isOnFloor: hasMomentOverride,
            orderIndex: position.day_subject?.order_index ?? position.order_index ?? 0,
        });
    }

    const people = Array.from(bySubject.values())
        .map((person) => ({
            subjectId: person.subjectId,
            label: person.label,
            count: Math.max(person.count, person.instanceCount),
            isOnFloor: person.isOnFloor,
            orderIndex: person.orderIndex,
        }))
        .sort((left, right) => {
            if (left.orderIndex !== right.orderIndex) return left.orderIndex - right.orderIndex;
            return left.label.localeCompare(right.label);
        });

    const keyRoles = people.filter((person) => !isGuestLikeRoleLabel(person.label));
    const guestRoles = people.filter((person) => isGuestLikeRoleLabel(person.label));
    if (guestRoles.length === 0) return keyRoles;

    const guestSummary = {
        subjectId: guestRoles[0]!.subjectId,
        label: 'Guests',
        count: guestRoles.reduce((sum, guest) => sum + guest.count, 0),
        isOnFloor: guestRoles.some((guest) => guest.isOnFloor),
        orderIndex: 9_999,
    };

    return [...keyRoles, guestSummary];
}

function initialsFromLabel(label: string) {
    return label
        .split(' ')
        .map((part) => part[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function CenteredState({
    icon,
    title,
    body,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
}) {
    return (
        <Box
            sx={{
                minHeight: 420,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
            }}
        >
            <Stack spacing={1.2} alignItems="center" sx={{ maxWidth: 360, textAlign: 'center' }}>
                {icon}
                <Typography sx={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>
                    {title}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.76rem', lineHeight: 1.55 }}>
                    {body}
                </Typography>
            </Stack>
        </Box>
    );
}
