'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import ViewInArRoundedIcon from '@mui/icons-material/ViewInArRounded';
import { Rect } from 'fabric';
import { useFloorPlanCanvas } from '../Canvas/useFloorPlanCanvas';
import { createFabricObject, createCameraMarker, createSubjectMarker, createZoneOverlay, createZoneLabel, createFovCone, createFocalDistanceRings } from '../Renderers/objectFactory';
import type { PackageSpaceSlot } from '../../../../types/floor-plan.types';
import { getEquipmentShortLabelForTrackName } from '@/features/content/films/utils/equipmentAssignments';
import type { FilmEquipmentAssignmentsBySlot } from '@/features/content/films/types/film-equipment.types';
import {
    buildFramingSubjectsFromSlot,
    computeCameraShotBadge,
} from '../../../../utils/camera-framing';
import { computeFraming, focalDistanceRingRadii, type FramingSubject } from '@projectflo/shared';
import type { Group } from 'fabric';

interface SpaceSlotOverlayProps {
    spaceSlot: PackageSpaceSlot | null;
    width: number;
    height: number;
    /** When true, camera/subject markers become draggable. */
    isEditing?: boolean;
    /** Current moment ID — when set, positions merge with moment_overrides on camera/subject positions. */
    momentId?: number | null;
    /** Lock cameras — prevents user dragging */
    lockCameras?: boolean;
    /** Lock subjects — prevents user dragging */
    lockSubjects?: boolean;
    /** Film-level equipment assignments by slot key, used to derive dynamic camera labels. */
    equipmentAssignmentsBySlot?: FilmEquipmentAssignmentsBySlot;
    /** Active film video track count; extra stale package cameras are hidden past this limit. */
    cameraTrackCount?: number;
    /** Hide camera markers/FOV cones when the floor plan is used outside film blocking. */
    showCameras?: boolean;
    /** Keep the canvas viewport at the full provided width/height while fitting the plan within contentMaxSize. */
    fillViewport?: boolean;
    /** Initial maximum rendered plan size inside a larger viewport. Wheel zoom can grow beyond this inside the viewport. */
    contentMaxSize?: number;
    /** Background for the full viewport outside the centered plan frame. */
    viewportBackgroundColor?: string;
    /** Called when a camera marker is dragged to a new position. Receives the position row ID. */
    onCameraMove?: (positionId: number, x: number, y: number, rotation: number) => void;
    /** Called when a subject marker is dragged to a new position. Receives the position row ID. */
    onSubjectMove?: (positionId: number, x: number, y: number) => void;
    /** Expose fitToView + isZoomed + hand-pan controls to parent */
    onControlsReady?: (controls: { fitToView: () => void; isZoomed: boolean; isPanMode: boolean; togglePanMode: () => void }) => void;
    /** Suppress all text labels (zone labels, LABEL-type objects). Day Designer read-only usage only. */
    hideLabels?: boolean;
    /** Show subject name labels only for highlighted/selected subjects (reduces floor-plan clutter). */
    compactSubjectLabels?: boolean;
    /** Subject IDs targeted by selected camera (for highlighting with gold glow) */
    selectedCameraSubjectIds?: number[];
    /** Called when a camera marker is clicked/selected on the canvas. Receives the camera number (1-based, e.g. 1 = "Cam 1"). */
    onCameraSelect?: (cameraNumber: number) => void;
    /** Subject role IDs to show with the same highlight ring as camera-targeted subjects (e.g. Day Designer selection). */
    highlightSubjectRoleIds?: readonly number[];
    /** Called when a subject marker is clicked without dragging (Day Designer). Receives subject role id. */
    onSubjectSelect?: (subjectRoleId: number) => void;
    /** Camera number (1-based) → editorial subject IDs for shot-size inference. */
    cameraSubjectIdsByCamNum?: Record<number, number[]>;
    /** Camera number → persisted assignment shot type (for pinned vs linked coupling). */
    shotTypeByCamNum?: Record<number, string | null | undefined>;
    /** Camera number → explicit shot coupling override (LINKED / PINNED). */
    shotCouplingByCamNum?: Record<number, string | null | undefined>;
    /** Selected camera number (1-based) — shows focal distance rings when set. */
    selectedCameraNumber?: number | null;
}

/**
 * Read-only overlay for PackageSpaceSlot virtual floor plans.
 * Renders the slot's objects + camera positions + subject positions on a Fabric.js canvas.
 * Used in ContentBuilder when no real venue floor plan exists yet.
 */
export const SpaceSlotOverlay: React.FC<SpaceSlotOverlayProps> = ({
    spaceSlot,
    width,
    height,
    isEditing = false,
    momentId,
    lockCameras = false,
    lockSubjects = false,
    equipmentAssignmentsBySlot,
    cameraTrackCount,
    showCameras = true,
    fillViewport = false,
    contentMaxSize,
    viewportBackgroundColor,
    onCameraMove,
    onSubjectMove,
    onControlsReady,
    selectedCameraSubjectIds = [],
    onCameraSelect,
    highlightSubjectRoleIds = [],
    onSubjectSelect,
    hideLabels = false,
    compactSubjectLabels = false,
    cameraSubjectIdsByCamNum = {},
    shotTypeByCamNum = {},
    shotCouplingByCamNum = {},
    selectedCameraNumber = null,
}) => {
    const canvasW = spaceSlot?.canvas_width ?? 1000;
    const canvasH = spaceSlot?.canvas_height ?? 1000;
    const baseScale = Math.min(width / canvasW, height / canvasH);
    const cappedScale = contentMaxSize
        ? Math.min(baseScale, contentMaxSize / Math.max(canvasW, canvasH))
        : baseScale;
    const scale = cappedScale;
    const contentW = Math.floor(canvasW * scale);
    const contentH = Math.floor(canvasH * scale);
    const displayW = fillViewport ? Math.floor(width) : contentW;
    const displayH = fillViewport ? Math.floor(height) : contentH;
    const fitOffsetX = fillViewport ? Math.floor((displayW - contentW) / 2) : 0;
    const fitOffsetY = fillViewport ? Math.floor((displayH - contentH) / 2) : 0;
    const fitViewportTransform: [number, number, number, number, number, number] = [1, 0, 0, 1, fitOffsetX, fitOffsetY];

    // Stable refs for callbacks
    const onCameraMoveRef = useRef(onCameraMove);
    const onSubjectMoveRef = useRef(onSubjectMove);
    const getCanvasRef = useRef<() => import('fabric').Canvas | null>(() => null);
    onCameraMoveRef.current = onCameraMove;
    onSubjectMoveRef.current = onSubjectMove;

    // Stable ref for scale so the callback can convert display → logical coords
    const scaleRef = useRef(scale);
    scaleRef.current = scale;

    const framingSubjectsRef = useRef<FramingSubject[]>([]);
    const cameraSubjectIdsRef = useRef(cameraSubjectIdsByCamNum);
    const shotTypeByCamRef = useRef(shotTypeByCamNum);
    const shotCouplingByCamRef = useRef(shotCouplingByCamNum);
    const spaceSlotRef = useRef(spaceSlot);
    const momentIdRef = useRef(momentId);
    framingSubjectsRef.current = spaceSlot
        ? buildFramingSubjectsFromSlot(spaceSlot, momentId)
        : [];
    cameraSubjectIdsRef.current = cameraSubjectIdsByCamNum;
    shotTypeByCamRef.current = shotTypeByCamNum;
    shotCouplingByCamRef.current = shotCouplingByCamNum;
    spaceSlotRef.current = spaceSlot;
    momentIdRef.current = momentId;

    const updateCameraShotBadge = useCallback((marker: Group, cameraNumber: number) => {
        const slot = spaceSlotRef.current;
        if (!slot) return;
        const cam = slot.camera_positions?.find((row) => row.order_index + 1 === cameraNumber);
        if (!cam) return;

        let cx = marker.left ?? cam.x;
        let cy = marker.top ?? cam.y;
        let cRot = marker.angle ?? cam.rotation;
        let fov = cam.fov_angle;
        const pkgMomentId = momentIdRef.current;
        if (pkgMomentId) {
            const override = cam.moment_overrides?.find((o) => o.moment_id === pkgMomentId);
            if (override) {
                cx = (marker.left ?? override.x * scaleRef.current) / scaleRef.current;
                cy = (marker.top ?? override.y * scaleRef.current) / scaleRef.current;
                cRot = marker.angle ?? override.rotation ?? cRot;
                if (override.fov_angle != null) fov = override.fov_angle;
            }
        } else {
            cx = (marker.left ?? 0) / (scaleRef.current || 1);
            cy = (marker.top ?? 0) / (scaleRef.current || 1);
        }

        const badge = computeCameraShotBadge({
            camera: { x: cx, y: cy, rotation: cRot, fov_angle: fov },
            subjects: framingSubjectsRef.current,
            subjectIds: cameraSubjectIdsRef.current[cameraNumber] ?? [],
            currentShotType: shotTypeByCamRef.current[cameraNumber],
            shotCoupling: shotCouplingByCamRef.current[cameraNumber],
        });

        const objects = marker.getObjects();
        const badgeObj = objects.find((o) => o.data?.type === 'shot-badge');
        if (badgeObj && 'set' in badgeObj) {
            (badgeObj as { set: (key: string, value: unknown) => void }).set('text', badge);
            marker.set('angle', cRot);
            marker.canvas?.requestRenderAll();
        }
    }, []);

    const handleObjectModified = useCallback(() => {
        const canvas = getCanvasRef.current();
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active?.data) return;
        const d = active.data;
        const s = scaleRef.current || 1;
        if (d.type === 'camera' && d.positionId && onCameraMoveRef.current) {
            onCameraMoveRef.current(d.positionId, (active.left ?? 0) / s, (active.top ?? 0) / s, active.angle ?? 0);
        } else if (d.type === 'subject' && d.positionId && onSubjectMoveRef.current) {
            onSubjectMoveRef.current(d.positionId, (active.left ?? 0) / s, (active.top ?? 0) / s);
        }
    }, []);

    const { canvasRef, getCanvas, isReady, isZoomed, fitToView, isPanMode, togglePanMode } = useFloorPlanCanvas({
        width: displayW,
        height: displayH,
        readOnly: !isEditing,
        onObjectModified: isEditing ? handleObjectModified : undefined,
        fitViewportTransform,
    });
    getCanvasRef.current = getCanvas;

    // Push controls to parent
    useEffect(() => {
        onControlsReady?.({ fitToView, isZoomed, isPanMode, togglePanMode });
    }, [fitToView, isZoomed, isPanMode, togglePanMode, onControlsReady]);

    const renderAll = useCallback(() => {
        const canvas = getCanvas();
        if (!canvas || !spaceSlot) return;

        canvas.clear();
        canvas.backgroundColor = fillViewport ? (viewportBackgroundColor ?? 'transparent') : '#F4F1EA';

        // Scale factor: map logical coords (1000×800) → display pixels
        // We scale coordinates, NOT the viewport, so fonts/shapes stay readable.
        const s = scale;

        if (fillViewport) {
            canvas.add(new Rect({
                left: 0,
                top: 0,
                width: canvasW * s,
                height: canvasH * s,
                fill: '#F4F1EA',
                stroke: 'rgba(222,211,194,0.65)',
                strokeWidth: 1,
                rx: 8,
                ry: 8,
                selectable: false,
                evented: false,
                data: { type: 'plan-frame' },
            }));
        }

        // 0. Zone overlays (background layer — rendered first)
        const zones = spaceSlot.zones ?? [];
        zones.forEach((zone) => {
            const overlay = createZoneOverlay(zone, s);
            canvas.add(overlay);
            if (!hideLabels) {
                const label = createZoneLabel(zone, s);
                canvas.add(label);
            }
        });

        // 1. Space slot objects (furniture, walls, etc.)
        const objects = spaceSlot.objects ?? [];
        objects
            .sort((a, b) => a.order_index - b.order_index)
            .forEach((obj) => {
                if (hideLabels && obj.object_type === 'LABEL') return;
                const fObj = createFabricObject({
                    ...obj,
                    x: obj.x * s,
                    y: obj.y * s,
                    width: obj.width * s,
                    height: obj.height * s,
                    floor_plan_id: 0, // Adapter: SpaceSlotObject → FloorPlanObject shape
                    created_at: obj.created_at,
                    updated_at: obj.updated_at,
                });
                fObj.selectable = false;
                fObj.evented = false;
                canvas.add(fObj);
            });

        // 2. Subject positions (merge with moment overrides if active)
        // Contract: a subject is "in space" for a moment iff an explicit
        // SpaceSlotMomentSubject override exists. Subjects without an override
        // belong in the tray below the floor plan and are NOT rendered on the canvas.
        const subjects = spaceSlot.subject_positions ?? [];
        subjects.forEach((subj) => {
            let sx = subj.x;
            let sy = subj.y;
            let sRot = subj.rotation ?? 0;
            if (momentId) {
                const override = subj.moment_overrides?.find((o) => o.moment_id === momentId);
                if (!override) return; // not placed in space for this moment → tray
                if (override.present === false) return;
                sx = override.x;
                sy = override.y;
                sRot = override.rotation ?? sRot;
            }
            const roleNameForTone = (subj.label?.trim() || subj.day_subject?.name || '').trim();
            const normName = roleNameForTone.toLowerCase();
            const isCouple = normName === 'bride' || normName === 'groom';
            const isGuest = /guest|crowd|congregation|audience/i.test(roleNameForTone);
            const sid = subj.day_subject_id ?? subj.id;
            const highlightSet = new Set<number>([
                ...selectedCameraSubjectIds,
                ...highlightSubjectRoleIds,
            ]);
            const isHighlighted = highlightSet.has(sid);
            const rawLabel = (subj.label && subj.label.trim())
                ? subj.label
                : subj.day_subject?.name || undefined;
            const displayLabel = isGuest || (compactSubjectLabels && !isHighlighted)
                ? undefined
                : rawLabel;
            const marker = createSubjectMarker({
                x: sx * s,
                y: sy * s,
                rotation: sRot,
                label: displayLabel,
                subjectId: sid,
                // Three-tone palette matches the shot-preview overlay:
                // bride/groom = rose, wedding party = purple, guests = slate.
                color: isCouple ? '#f472b6' : isGuest ? '#94a3b8' : '#a78bfa',
                isSelected: highlightSet.has(sid),
            });
            marker.data = { ...marker.data, positionId: subj.id };
            marker.selectable = isEditing && !lockSubjects;
            marker.evented = Boolean(onSubjectSelect) || (isEditing && !lockSubjects);
            marker.hasControls = false;
            canvas.add(marker);
        });

        // 3. Camera positions (topmost, merge with moment overrides if active)
        const cameras = showCameras
            ? (spaceSlot.camera_positions ?? [])
                .filter((cam) => cameraTrackCount == null || cameraTrackCount <= 0 || cam.order_index < cameraTrackCount)
            : [];
        cameras.forEach((cam) => {
            let cx = cam.x;
            let cy = cam.y;
            let cRot = cam.rotation;
            let fovAngle = cam.fov_angle;
            if (momentId) {
                const override = cam.moment_overrides?.find((o) => o.moment_id === momentId);
                if (override) {
                    cx = override.x;
                    cy = override.y;
                    cRot = override.rotation ?? cRot;
                    if (override.fov_angle != null) fovAngle = override.fov_angle;
                }
            }

            // Derive label dynamically from track name + equipment (same as viewfinder cards).
            // Camera positions are ordered by order_index → "Camera {index+1}" → equipment lookup.
            let label: string | undefined;
            const cameraNumber = cam.order_index + 1;
            const trackName = `Camera ${cameraNumber}`;
            const equipmentLabel = getEquipmentShortLabelForTrackName(trackName, equipmentAssignmentsBySlot);
            const shortName = `Cam ${cameraNumber}`;
            label = equipmentLabel ? `${shortName} · ${equipmentLabel}` : shortName;

            const framingSubjects = buildFramingSubjectsFromSlot(spaceSlot, momentId);
            const shotBadge = computeCameraShotBadge({
                camera: { x: cx, y: cy, rotation: cRot, fov_angle: fovAngle },
                subjects: framingSubjects,
                subjectIds: cameraSubjectIdsByCamNum[cameraNumber] ?? [],
                currentShotType: shotTypeByCamNum[cameraNumber],
                shotCoupling: shotCouplingByCamNum[cameraNumber],
            });

            const marker = createCameraMarker({
                x: cx * s,
                y: cy * s,
                rotation: cRot,
                trackId: cam.crew_slot_id ?? cam.id,
                label,
                shotBadge,
                color: '#2979FF',
            });

            // FOV cone — apex derived from the marker's actual rendered centre
            // so it stays glued to the camera body regardless of Group bbox.
            if (fovAngle && fovAngle > 0) {
                const center = marker.getCenterPoint();
                const cone = createFovCone({
                    x: center.x,
                    y: center.y,
                    rotation: cRot,
                    fovAngle,
                    range: 100 * s,
                });
                canvas.add(cone);
            }
            marker.data = { ...marker.data, positionId: cam.id, cameraNumber };
            marker.selectable = isEditing && !lockCameras;
            // Always evented so camera selection fires onCameraSelect even outside edit mode
            marker.evented = true;
            marker.hasControls = isEditing && !lockCameras;
            if (isEditing && !lockCameras) {
                marker.lockScalingX = true;
                marker.lockScalingY = true;
            }
            canvas.add(marker);
        });

        // 4. Focal distance rings for selected camera
        if (selectedCameraNumber && showCameras) {
            const selectedCam = (spaceSlot.camera_positions ?? []).find(
                (row) => row.order_index + 1 === selectedCameraNumber,
            );
            if (selectedCam) {
                let cx = selectedCam.x;
                let cy = selectedCam.y;
                let cRot = selectedCam.rotation;
                let fovAngle = selectedCam.fov_angle;
                if (momentId) {
                    const override = selectedCam.moment_overrides?.find((o) => o.moment_id === momentId);
                    if (override) {
                        cx = override.x;
                        cy = override.y;
                        cRot = override.rotation ?? cRot;
                        if (override.fov_angle != null) fovAngle = override.fov_angle;
                    }
                }

                const framingSubjects = buildFramingSubjectsFromSlot(spaceSlot, momentId);
                const framing = computeFraming({
                    camera: { x: cx, y: cy, rotation: cRot, fovDegrees: fovAngle ?? 60 },
                    subjects: framingSubjects,
                    subjectIds: cameraSubjectIdsByCamNum[selectedCameraNumber] ?? [],
                    currentShotType: shotTypeByCamNum[selectedCameraNumber],
                    shotCoupling: shotCouplingByCamNum[selectedCameraNumber],
                });
                const focalId = framing.focalSubjectIds[0];
                const focalSubject = framingSubjects.find((subj) => subj.id === focalId);
                if (focalSubject) {
                    const rings = createFocalDistanceRings({
                        x: focalSubject.x * s,
                        y: focalSubject.y * s,
                        radii: focalDistanceRingRadii(fovAngle ?? 60),
                        scale: s,
                    });
                    rings.forEach((ring) => canvas.add(ring));
                }
            }
        }

        canvas.requestRenderAll();
    }, [getCanvas, spaceSlot, isEditing, scale, momentId, lockCameras, lockSubjects, equipmentAssignmentsBySlot, selectedCameraSubjectIds, highlightSubjectRoleIds, cameraTrackCount, showCameras, fillViewport, viewportBackgroundColor, canvasW, canvasH, hideLabels, compactSubjectLabels, cameraSubjectIdsByCamNum, shotTypeByCamNum, shotCouplingByCamNum, selectedCameraNumber]);

    useEffect(() => {
        if (isReady) renderAll();
    }, [isReady, renderAll]);

    // Camera selection handler — fires onCameraSelect on mouse:up only when the user
    // clicked (did not drag). Firing on mouse:down caused selection state to update mid-click,
    // which re-triggered renderAll (via selectedCameraSubjectIds dep) → canvas.clear() → the
    // camera object was disposed before Fabric could start its drag transform. Result: stuck camera.
    const onCameraSelectRef = useRef(onCameraSelect);
    onCameraSelectRef.current = onCameraSelect;
    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas) return;
        let pendingCameraNumber: number | null = null;
        let downX = 0;
        let downY = 0;
        const DRAG_THRESHOLD = 4; // px
        const onDown = (e: any) => {
            const target = e.target;
            if (target?.data?.type === 'camera' && target.data.cameraNumber != null) {
                pendingCameraNumber = target.data.cameraNumber;
                downX = e.pointer?.x ?? 0;
                downY = e.pointer?.y ?? 0;
            } else {
                pendingCameraNumber = null;
            }
        };
        const onUp = (e: any) => {
            if (pendingCameraNumber == null) return;
            const upX = e.pointer?.x ?? 0;
            const upY = e.pointer?.y ?? 0;
            const moved = Math.hypot(upX - downX, upY - downY) > DRAG_THRESHOLD;
            const cam = pendingCameraNumber;
            pendingCameraNumber = null;
            if (!moved) {
                onCameraSelectRef.current?.(cam);
            }
        };
        canvas.on('mouse:down', onDown);
        canvas.on('mouse:up', onUp);
        return () => {
            canvas.off('mouse:down', onDown);
            canvas.off('mouse:up', onUp);
        };
    }, [isReady, getCanvas]);

    // Live shot-size badge while dragging a camera (no full canvas rebuild).
    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas || !isEditing || lockCameras) return;
        const onMoving = (e: { target?: Group }) => {
            const target = e.target;
            if (target?.data?.type !== 'camera' || target.data.cameraNumber == null) return;
            updateCameraShotBadge(target, target.data.cameraNumber);
        };
        canvas.on('object:moving', onMoving as (options: unknown) => void);
        return () => {
            canvas.off('object:moving', onMoving);
        };
    }, [isReady, getCanvas, isEditing, lockCameras, updateCameraShotBadge]);

    const onSubjectSelectRef = useRef(onSubjectSelect);
    onSubjectSelectRef.current = onSubjectSelect;
    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas || !onSubjectSelect) return;
        let pendingSubjectId: number | null = null;
        let downX = 0;
        let downY = 0;
        const DRAG_THRESHOLD = 4;
        const onDown = (e: any) => {
            let o: any = e.target;
            while (o) {
                if (o.data?.type === 'subject' && typeof o.data.subjectId === 'number') {
                    pendingSubjectId = o.data.subjectId;
                    downX = e.pointer?.x ?? 0;
                    downY = e.pointer?.y ?? 0;
                    return;
                }
                o = o.parent ?? o.group;
            }
            pendingSubjectId = null;
        };
        const onUp = (e: any) => {
            if (pendingSubjectId == null) return;
            const upX = e.pointer?.x ?? 0;
            const upY = e.pointer?.y ?? 0;
            const moved = Math.hypot(upX - downX, upY - downY) > DRAG_THRESHOLD;
            const sid = pendingSubjectId;
            pendingSubjectId = null;
            if (!moved) {
                onSubjectSelectRef.current?.(sid);
            }
        };
        canvas.on('mouse:down', onDown);
        canvas.on('mouse:up', onUp);
        return () => {
            canvas.off('mouse:down', onDown);
            canvas.off('mouse:up', onUp);
        };
    }, [isReady, getCanvas, onSubjectSelect]);

    if (!spaceSlot) {
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
                <ViewInArRoundedIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.18)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', textAlign: 'center' }}>
                    No space assigned to this activity
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem', textAlign: 'center' }}>
                    Assign a space slot in the package schedule to see a spatial layout
                </Typography>
            </Box>
        );
    }

    const cameras = spaceSlot.camera_positions ?? [];
    const subjects = spaceSlot.subject_positions ?? [];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: fillViewport ? 'transparent' : '#F4F1EA', borderRadius: 1.5, border: fillViewport ? 'none' : '1px solid #DDD4C6', overflow: 'hidden' }}>
            {/* Canvas — fills all available height */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                <canvas ref={canvasRef} />
            </Box>

            {!fillViewport && (
                <Typography
                    sx={{
                        fontSize: '0.6rem',
                        color: 'rgba(120,110,100,0.6)',
                        textAlign: 'center',
                        py: 0.25,
                        flexShrink: 0,
                    }}
                >
                    {spaceSlot.label}
                </Typography>
            )}
        </Box>
    );
};
