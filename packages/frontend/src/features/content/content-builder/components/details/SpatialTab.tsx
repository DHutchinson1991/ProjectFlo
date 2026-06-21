'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton, Tooltip } from '@mui/material';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import FitScreenRoundedIcon from '@mui/icons-material/FitScreenRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import {
    useSceneSpatialLayout,
    useMomentSpatialLayout,
    useUpsertCameraPosition,
    useUpsertMomentCameraPosition,
} from '@/features/workflow/locations/hooks/useSceneSpatial';
import { useFloorPlans } from '@/features/workflow/locations/hooks/useFloorPlan';
import { useSpaceSlotsByActivity, useSpaceSlotsByPackage, useUpdateSlotCameraPosition, useUpsertSlotMomentCamera, useUpsertSlotMomentSubject, useAimSlotCameras } from '@/features/workflow/locations/hooks/useSpaceSlotSpatial';
import { SpatialOverlay } from '@/features/workflow/locations/components/floor-plan/components/Panels/SpatialOverlay';
import { SpaceSlotOverlay } from '@/features/workflow/locations/components/floor-plan/components/Panels/SpaceSlotOverlay';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { GlowBorderOverlay } from '../shared/ShimmerOverlay';
import { ConflictListPanel } from './ConflictListPanel';
import { buildFramingSubjectsFromSlot, slotHasMisalignedCameraAiming } from '@/features/workflow/locations/utils/camera-framing';
import { computeFraming, resolveShotCoupling } from '@projectflo/shared';
import { scenesApi } from '@/features/content/scenes/api';

interface SpatialTabProps {
    sceneId: number | null;
    activityId?: number | null;
    packageId?: number | null;
    /** SceneMoment.id — film-side current moment. Used for location-mode moment overrides and conflict queries. */
    momentId?: number | null;
    /** PackageActivityMoment.id — package-side FK used by SpaceSlotMomentSubject / SpaceSlotMomentCamera. */
    packageMomentId?: number | null;
    momentName?: string | null;
}

/**
 * Spatial tab content for the ContentBuilder DetailsPanel.
 * Dual-mode:
 * - Location mode: Shows real floor plan from LocationsLibrary (when venue is assigned)
 * - Package mode: Shows virtual floor plan from PackageSpaceSlot (when planning at package level)
 *
 * Edit mode: Toggle via the pencil button. Camera/subject markers become draggable.
 * When a moment is active, edits create moment-level keyframe overrides (only the scene defaults
 * that differ are stored). Without a moment, edits update scene-level positions.
 */
export const SpatialTab: React.FC<SpatialTabProps> = ({ sceneId, activityId, packageId, momentId, packageMomentId, momentName }) => {
    const { aiBlockingPending, equipmentAssignmentsBySlot, tracks, selectedCameraId, selectedCameraSubjectIds, cameraSubjectsByCamNum, cameraVisibleSubjectsByCamNum, setSelectedCameraId, setSelectedCameraSubjectIds, packageSubjects, currentMoment, setScenes } = useContentBuilder();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 260, height: 400 });
    const [lockCameras, setLockCameras] = useState(false);
    const [optimisticShotByCamNum, setOptimisticShotByCamNum] = useState<Record<number, string>>({});
    const [optimisticCouplingByCamNum, setOptimisticCouplingByCamNum] = useState<Record<number, string>>({});
    // Subjects are placed exclusively by AI blocking; users cannot drag them.
    const lockSubjects = true;
    const [canvasControls, setCanvasControls] = useState<{ fitToView: () => void; isZoomed: boolean } | null>(null);

    const handleControlsReady = useCallback((controls: { fitToView: () => void; isZoomed: boolean }) => {
        setCanvasControls(controls);
    }, []);

    // ── Location-based path (real venue) ──────────────────
    const { data: layout, isLoading: layoutLoading } = useSceneSpatialLayout(sceneId);
    const primarySpace = layout?.spaces?.[0];
    const locationId = primarySpace?.space?.location?.id ?? null;
    const { data: floorPlans, isLoading: fpLoading } = useFloorPlans(locationId ?? 0);
    const defaultFloorPlan = floorPlans?.find((fp) => fp.is_default) ?? floorPlans?.[0] ?? null;

    // ── Moment-level overrides (keyframe positions) ──────
    const { data: momentLayout } = useMomentSpatialLayout(sceneId, momentId);

    // ── Package space slot path (virtual floor plan) ──────
    // Always fetch when activityId exists — package mode is the fallback when
    // no real venue floor plan is available.
    const { data: activitySpaceSlots, isLoading: activitySlotsLoading } = useSpaceSlotsByActivity(
        activityId ?? undefined
    );
    const { data: packageSpaceSlots, isLoading: packageSlotsLoading } = useSpaceSlotsByPackage(
        packageId ?? undefined
    );
    const primarySpaceSlot = React.useMemo(() => {
        if (activitySpaceSlots?.length) return activitySpaceSlots[0];
        if (!packageSpaceSlots?.length) return null;
        if (activityId) {
            const matched = packageSpaceSlots.find((slot) =>
                ((slot as unknown as { activity_assignments?: Array<{ package_activity_id?: number }> }).activity_assignments || []).some((a) => a.package_activity_id === activityId),
            );
            if (matched) return matched;
        }
        return packageSpaceSlots[0];
    }, [activitySpaceSlots, packageSpaceSlots, activityId]);

    // Determine which mode to display — prefer real venue floor plan
    const hasLocationSpatial = !!defaultFloorPlan;
    const hasSpaceSlotSpatial = !!primarySpaceSlot;
    const isPackageMode = !hasLocationSpatial && hasSpaceSlotSpatial;
    const cameraTrackCount = React.useMemo(
        () => tracks.filter((track) => (track.track_type || '').toLowerCase() === 'video').length,
        [tracks],
    );

    const shotTypeByCamNum = React.useMemo(() => {
        const map: Record<number, string | null> = {};
        const assignments = (currentMoment as { recording_setup?: { camera_assignments?: Array<{ track_id: number; shot_type?: string | null }> } } | null)
            ?.recording_setup?.camera_assignments ?? [];
        for (const assignment of assignments) {
            const track = tracks.find((t) => Number(t.id) === assignment.track_id);
            const numMatch = (track?.name ?? '').match(/\d+/);
            const camNum = numMatch ? parseInt(numMatch[0], 10) : 0;
            if (camNum > 0) {
                map[camNum] = assignment.shot_type ?? null;
            }
        }
        return map;
    }, [currentMoment, tracks]);

    const shotCouplingByCamNum = React.useMemo(() => {
        const map: Record<number, string | null> = {};
        const assignments = (currentMoment as { recording_setup?: { camera_assignments?: Array<{ track_id: number; shot_coupling?: string | null }> } } | null)
            ?.recording_setup?.camera_assignments ?? [];
        for (const assignment of assignments) {
            const track = tracks.find((t) => Number(t.id) === assignment.track_id);
            const numMatch = (track?.name ?? '').match(/\d+/);
            const camNum = numMatch ? parseInt(numMatch[0], 10) : 0;
            if (camNum > 0) {
                map[camNum] = assignment.shot_coupling ?? null;
            }
        }
        return map;
    }, [currentMoment, tracks]);

    const effectiveShotTypeByCamNum = React.useMemo(
        () => ({ ...shotTypeByCamNum, ...optimisticShotByCamNum }),
        [shotTypeByCamNum, optimisticShotByCamNum],
    );

    const effectiveCouplingByCamNum = React.useMemo(
        () => ({ ...shotCouplingByCamNum, ...optimisticCouplingByCamNum }),
        [shotCouplingByCamNum, optimisticCouplingByCamNum],
    );

    const selectedShotCoupling = selectedCameraId
        ? resolveShotCoupling(
            effectiveShotTypeByCamNum[selectedCameraId],
            effectiveCouplingByCamNum[selectedCameraId],
        )
        : null;

    React.useEffect(() => {
        setOptimisticShotByCamNum({});
        setOptimisticCouplingByCamNum({});
    }, [momentId, packageMomentId]);
    const isLoading =
        layoutLoading ||
        (locationId ? fpLoading : false) ||
        (activityId ? activitySlotsLoading : false) ||
        (packageId ? packageSlotsLoading : false);

    // ── Mutations ────────────────────────────────────────
    // Location mode: scene-level / moment-level camera upserts.
    // Subject placement is owned by AI blocking; no user-driven subject mutations exist here.
    const upsertSceneCamera = useUpsertCameraPosition();
    const upsertMomentCamera = useUpsertMomentCameraPosition();
    // Package mode: individual camera position row updates
    const updateSlotCamera = useUpdateSlotCameraPosition();
    const upsertSlotMomentCamera = useUpsertSlotMomentCamera();
    const upsertSlotMomentSubject = useUpsertSlotMomentSubject();
    const aimSlotCameras = useAimSlotCameras();
    const repairAttemptedRef = useRef<string | null>(null);

    // ── Merge scene + moment positions (keyframe override logic) ──
    const mergedCameras = React.useMemo(() => {
        const sceneCameras = layout?.cameras ?? [];
        if (!momentId || !momentLayout) return sceneCameras;
        // Moment overrides replace scene positions for the same track
        const momentCamMap = new Map((momentLayout.cameras ?? []).map((mc: any) => [mc.track_id, mc]));
        return sceneCameras.map((sc) => {
            const override = momentCamMap.get(sc.track_id);
            return override ? { ...sc, x: override.x, y: override.y, rotation: override.rotation ?? sc.rotation } : sc;
        });
    }, [layout?.cameras, momentId, momentLayout]);

    const mergedSubjects = React.useMemo(() => {
        const sceneSubjects = layout?.subjects ?? [];
        if (!momentId || !momentLayout) return sceneSubjects;
        const momentSubMap = new Map((momentLayout.subjects ?? []).map((ms: any) => [ms.subject_id, ms]));
        return sceneSubjects.map((ss) => {
            const override = momentSubMap.get(ss.subject_id);
            return override ? { ...ss, x: override.x, y: override.y } : ss;
        });
    }, [layout?.subjects, momentId, momentLayout]);

    // ── Auto-save handlers ──────────────────────────────
    const spaceId = primarySpace?.space_id ?? null;

    // Location mode: markers fire with trackId / subjectId
    const handleCameraMove = useCallback(
        (trackId: number, x: number, y: number, rotation: number) => {
            if (!sceneId || !spaceId) return;
            if (momentId) {
                upsertMomentCamera.mutate({
                    sceneId,
                    momentId,
                    data: { track_id: trackId, space_id: spaceId, x, y, rotation },
                });
            } else {
                upsertSceneCamera.mutate({
                    sceneId,
                    data: { track_id: trackId, space_id: spaceId, x, y, rotation },
                });
            }
        },
        [sceneId, spaceId, momentId, upsertSceneCamera, upsertMomentCamera],
    );

    const handleSubjectMove = undefined;

    // Package mode: SpaceSlotOverlay fires with position row IDs (cameras only)
    const handleSlotCameraMove = useCallback(
        (positionId: number, x: number, y: number, rotation: number) => {
            if (primarySpaceSlot) {
                const cam = primarySpaceSlot.camera_positions?.find((row) => row.id === positionId);
                if (cam) {
                    const cameraNumber = cam.order_index + 1;
                    const framing = computeFraming({
                        camera: {
                            x,
                            y,
                            rotation,
                            fovDegrees: cam.fov_angle ?? 60,
                        },
                        subjects: buildFramingSubjectsFromSlot(primarySpaceSlot, packageMomentId),
                        subjectIds: cameraSubjectsByCamNum[cameraNumber] ?? [],
                        currentShotType: shotTypeByCamNum[cameraNumber],
                        shotCoupling: effectiveCouplingByCamNum[cameraNumber],
                    });
                    if (framing.shouldPersistShot) {
                        setOptimisticShotByCamNum((prev) => ({
                            ...prev,
                            [cameraNumber]: framing.resolvedShot,
                        }));
                    }
                }
            }

            if (packageMomentId) {
                upsertSlotMomentCamera.mutate({
                    cameraPositionId: positionId,
                    momentId: packageMomentId,
                    sceneMomentId: momentId ?? undefined,
                    x,
                    y,
                    rotation,
                });
            } else {
                updateSlotCamera.mutate({
                    id: positionId,
                    sceneMomentId: momentId ?? undefined,
                    x,
                    y,
                    rotation,
                });
            }
        },
        [updateSlotCamera, upsertSlotMomentCamera, packageMomentId, momentId, primarySpaceSlot, cameraSubjectsByCamNum, shotTypeByCamNum, effectiveCouplingByCamNum],
    );

    const handleToggleShotCoupling = useCallback(async () => {
        if (!momentId || !selectedCameraId || !currentMoment?.recording_setup) return;

        const recordingSetup = currentMoment.recording_setup as {
            camera_assignments?: Array<{
                track_id: number;
                subject_ids?: number[];
                shot_type?: string | null;
                shot_coupling?: string | null;
                enabled?: boolean;
            }>;
            audio_track_ids?: number[];
            audio_assignments?: Array<{ track_id: number; subject_ids?: number[] }>;
            graphics_enabled?: boolean;
            graphics_title?: string | null;
        };

        const track = tracks.find((row) => {
            const numMatch = (row.name ?? '').match(/\d+/);
            return numMatch ? parseInt(numMatch[0], 10) === selectedCameraId : false;
        });
        if (!track) return;

        const nextCoupling = selectedShotCoupling === 'pinned' ? 'LINKED' : 'PINNED';
        setOptimisticCouplingByCamNum((prev) => ({ ...prev, [selectedCameraId]: nextCoupling }));

        const cameraAssignments = (recordingSetup.camera_assignments ?? []).map((assignment) => {
            if (Number(assignment.track_id) !== Number(track.id)) return assignment;
            return { ...assignment, shot_coupling: nextCoupling };
        });

        const payload = {
            camera_assignments: cameraAssignments.map((assignment) => ({
                track_id: assignment.track_id,
                subject_ids: assignment.subject_ids ?? [],
                shot_type: assignment.shot_type ?? null,
                shot_coupling: assignment.shot_coupling ?? null,
                enabled: assignment.enabled !== false,
            })),
            audio_track_ids: recordingSetup.audio_track_ids ?? [],
            audio_assignments: recordingSetup.audio_assignments ?? [],
            graphics_enabled: recordingSetup.graphics_enabled,
            graphics_title: recordingSetup.graphics_title ?? undefined,
        };

        setScenes((prev) => prev.map((scene) => {
            const originalScene = (scene as { original_scene?: Record<string, unknown> }).original_scene || scene;
            const moments = (originalScene as { moments?: Array<Record<string, unknown>> }).moments || [];
            const momentIdx = moments.findIndex((row) => row.id === momentId);
            if (momentIdx === -1) return scene;

            const updatedMoments = [...moments];
            const existingSetup = (updatedMoments[momentIdx].recording_setup ?? {}) as Record<string, unknown>;
            const existingCameras = (existingSetup.camera_assignments ?? []) as Array<Record<string, unknown>>;
            const mergedCameras = payload.camera_assignments.map((newCam) => {
                const existing = existingCameras.find((row) => row.track_id === newCam.track_id);
                return existing ? { ...existing, ...newCam } : newCam;
            });

            updatedMoments[momentIdx] = {
                ...updatedMoments[momentIdx],
                recording_setup: {
                    ...existingSetup,
                    camera_assignments: mergedCameras,
                },
            };

            if ((scene as { original_scene?: Record<string, unknown> }).original_scene) {
                return {
                    ...scene,
                    original_scene: { ...originalScene, moments: updatedMoments },
                    moments: updatedMoments,
                };
            }
            return { ...scene, moments: updatedMoments };
        }));

        try {
            await scenesApi.moments.upsertRecordingSetup(momentId, payload);
        } catch (err) {
            console.error('[SpatialTab] Failed to toggle shot coupling', err);
            setOptimisticCouplingByCamNum((prev) => {
                const next = { ...prev };
                delete next[selectedCameraId];
                return next;
            });
        }
    }, [
        momentId,
        selectedCameraId,
        currentMoment,
        tracks,
        selectedShotCoupling,
        setScenes,
    ]);

    const handleSlotSubjectMove = useCallback(
        (positionId: number, x: number, y: number) => {
            if (!packageMomentId || !momentId) return;
            upsertSlotMomentSubject.mutate({
                subjectPositionId: positionId,
                momentId: packageMomentId,
                x,
                y,
                sceneMomentId: momentId,
            });
        },
        [packageMomentId, momentId, upsertSlotMomentSubject],
    );

    React.useEffect(() => {
        repairAttemptedRef.current = null;
    }, [momentId, packageMomentId, primarySpaceSlot?.id]);

    React.useEffect(() => {
        if (!isPackageMode || !primarySpaceSlot || !packageMomentId || !momentId) return;

        const repairKey = `${primarySpaceSlot.id}:${packageMomentId}`;
        if (repairAttemptedRef.current === repairKey) return;

        const misaligned = slotHasMisalignedCameraAiming({
            spaceSlot: primarySpaceSlot,
            packageMomentId,
            cameraSubjectIdsByCamNum: cameraSubjectsByCamNum,
        });
        if (!misaligned) return;

        repairAttemptedRef.current = repairKey;
        aimSlotCameras.mutate({
            slotId: primarySpaceSlot.id,
            packageMomentId,
            sceneMomentId: momentId,
        });
    }, [
        isPackageMode,
        primarySpaceSlot,
        packageMomentId,
        momentId,
        cameraSubjectsByCamNum,
        aimSlotCameras,
    ]);

    // Floor plan camera click → highlight targeted subjects
    const handleFloorPlanCameraSelect = useCallback(
        (cameraNumber: number) => {
            // Toggle: click same camera again to deselect
            if (selectedCameraId === cameraNumber) {
                console.debug('[SpatialTab] toggle off camera', cameraNumber);
                setSelectedCameraId(null);
                setSelectedCameraSubjectIds([]);
                return;
            }
            const subjectIds = cameraSubjectsByCamNum[cameraNumber] ?? [];
            const visibleIds = cameraVisibleSubjectsByCamNum[cameraNumber] ?? [];
            // Phase D: highlight = editorial ∩ visible. Conflicts (targets
            // not in FOV) are reported by ConflictListPanel, not glowed.
            const visibleSet = new Set(visibleIds);
            const highlighted = visibleIds.length > 0
                ? subjectIds.filter((id) => visibleSet.has(id))
                : subjectIds;
            console.debug('[SpatialTab] select camera', cameraNumber, '→ editorial', subjectIds, 'visible', visibleIds, 'highlight', highlighted);
            setSelectedCameraId(cameraNumber);
            setSelectedCameraSubjectIds(highlighted);
        },
        [cameraSubjectsByCamNum, cameraVisibleSubjectsByCamNum, selectedCameraId, setSelectedCameraId, setSelectedCameraSubjectIds],
    );

    // Measure container for responsive canvas sizing
    // Re-run when loading finishes because the containerRef element only mounts after early returns.
    const hasSpatialData = hasLocationSpatial || hasSpaceSlotSpatial;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerSize({
                    width: Math.floor(entry.contentRect.width),
                    height: Math.floor(entry.contentRect.height),
                });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [isLoading, hasSpatialData]);

    if (!sceneId) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 1,
                    py: 4,
                }}
            >
                <MapRoundedIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center' }}>
                    Scrub the playback cursor over a scene to view spatial layout
                </Typography>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.3)' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Canvas area — always editable */}
            <GlowBorderOverlay active={aiBlockingPending} label="AI Blocking">
            <Box ref={containerRef} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {isPackageMode ? (
                    <SpaceSlotOverlay
                        spaceSlot={primarySpaceSlot}
                        width={containerSize.width}
                        height={containerSize.height}
                        isEditing
                        momentId={packageMomentId ?? null}
                        lockCameras={lockCameras}
                        lockSubjects={lockSubjects}
                        equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
                        cameraTrackCount={cameraTrackCount}
                        cameraSubjectIdsByCamNum={cameraSubjectsByCamNum}
                        shotTypeByCamNum={effectiveShotTypeByCamNum}
                        shotCouplingByCamNum={effectiveCouplingByCamNum}
                        selectedCameraNumber={selectedCameraId}
                        onCameraMove={handleSlotCameraMove}
                        onSubjectMove={handleSlotSubjectMove}
                        onControlsReady={handleControlsReady}
                        selectedCameraSubjectIds={selectedCameraSubjectIds}
                        onCameraSelect={handleFloorPlanCameraSelect}
                        fillViewport
                        hideLabels
                        compactSubjectLabels
                    />
                ) : hasLocationSpatial ? (
                    <SpatialOverlay
                        floorPlan={defaultFloorPlan}
                        cameras={mergedCameras}
                        subjects={mergedSubjects}
                        spaces={layout?.spaces ?? []}
                        width={containerSize.width}
                        height={containerSize.height}
                        isEditing
                        onCameraMove={handleCameraMove}
                        onSubjectMove={handleSubjectMove}
                        selectedCameraSubjectIds={selectedCameraSubjectIds}
                        onCameraSelect={handleFloorPlanCameraSelect}
                    />
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 1,
                            py: 4,
                        }}
                    >
                        <MapRoundedIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.12)' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textAlign: 'center' }}>
                            No spatial layout yet
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', textAlign: 'center', maxWidth: 200 }}>
                            Assign a location or space to this scene to start blocking camera and subject positions
                        </Typography>
                    </Box>
                )}
            </Box>
            </GlowBorderOverlay>

            {/* Phase D: conflict list panel — geometry vs. editorial intent */}
            <ConflictListPanel
                sceneMomentId={momentId ?? null}
                sourceType="package"
                packageSubjects={packageSubjects as unknown as Array<{ id: number; name: string }>}
            />

            {/* AI provenance banner — shown when zones were AI-generated */}
            {isPackageMode && primarySpaceSlot && (primarySpaceSlot.zones?.length ?? 0) > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        bgcolor: 'rgba(139,92,246,0.06)',
                        borderRadius: 0.5,
                        mx: 0.5,
                        mt: 0.25,
                    }}
                >
                    <AutoAwesomeRoundedIcon sx={{ fontSize: 11, color: 'rgba(139,92,246,0.5)' }} />
                    <Typography
                        sx={{
                            fontSize: '0.55rem',
                            color: 'rgba(139,92,246,0.6)',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                        }}
                    >
                        Zones auto-generated by AI from floor plan objects
                    </Typography>
                </Box>
            )}

            {/* Bottom toolbar — fit, lock cameras, lock subjects */}
            {hasSpatialData && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        pt: 0.5,
                        pb: 0.25,
                        flexShrink: 0,
                    }}
                >
                    <Tooltip title="Fit to screen" placement="top" arrow>
                        <span>
                            <IconButton
                                size="small"
                                disabled={!canvasControls?.isZoomed}
                                onClick={() => canvasControls?.fitToView()}
                                sx={{
                                    width: 26, height: 26, borderRadius: 1,
                                    color: canvasControls?.isZoomed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                                }}
                            >
                                <FitScreenRoundedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Box sx={{ width: 1, height: 14, bgcolor: 'rgba(255,255,255,0.06)', mx: 0.25 }} />

                    <Tooltip title={lockCameras ? 'Unlock cameras' : 'Lock cameras'} placement="top" arrow>
                        <IconButton
                            size="small"
                            onClick={() => setLockCameras((v) => !v)}
                            sx={{
                                width: 26, height: 26, borderRadius: 1,
                                color: lockCameras ? '#2979FF' : 'rgba(255,255,255,0.3)',
                                bgcolor: lockCameras ? 'rgba(41,121,255,0.12)' : 'transparent',
                                '&:hover': { bgcolor: lockCameras ? 'rgba(41,121,255,0.18)' : 'rgba(255,255,255,0.06)' },
                            }}
                        >
                            {lockCameras ? <VideocamOffRoundedIcon sx={{ fontSize: 15 }} /> : <VideocamRoundedIcon sx={{ fontSize: 15 }} />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Subjects are placed by AI blocking. Re-run blocking to reposition." placement="top" arrow>
                        <Box
                            sx={{
                                width: 26, height: 26, borderRadius: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(232,74,122,0.55)',
                                bgcolor: 'rgba(232,74,122,0.08)',
                                cursor: 'not-allowed',
                            }}
                        >
                            <PersonOffRoundedIcon sx={{ fontSize: 15 }} />
                        </Box>
                    </Tooltip>

                    {selectedCameraId ? (
                        <>
                            <Box sx={{ width: 1, height: 14, bgcolor: 'rgba(255,255,255,0.06)', mx: 0.25 }} />
                            <Tooltip
                                title={
                                    selectedShotCoupling === 'pinned'
                                        ? 'Pinned — shot type stays fixed. Click to link to camera distance.'
                                        : 'Linked — shot type follows camera distance. Click to pin.'
                                }
                                placement="top"
                                arrow
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => void handleToggleShotCoupling()}
                                    sx={{
                                        width: 26, height: 26, borderRadius: 1,
                                        color: selectedShotCoupling === 'pinned' ? '#FFB74D' : 'rgba(41,121,255,0.75)',
                                        bgcolor: selectedShotCoupling === 'pinned' ? 'rgba(255,183,77,0.14)' : 'rgba(41,121,255,0.1)',
                                        '&:hover': {
                                            bgcolor: selectedShotCoupling === 'pinned'
                                                ? 'rgba(255,183,77,0.22)'
                                                : 'rgba(41,121,255,0.16)',
                                        },
                                    }}
                                >
                                    {selectedShotCoupling === 'pinned'
                                        ? <PushPinRoundedIcon sx={{ fontSize: 15 }} />
                                        : <LinkRoundedIcon sx={{ fontSize: 15 }} />}
                                </IconButton>
                            </Tooltip>
                        </>
                    ) : null}
                </Box>
            )}
        </Box>
    );
};
