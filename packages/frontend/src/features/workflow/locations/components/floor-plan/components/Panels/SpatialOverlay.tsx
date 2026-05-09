'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useFloorPlanCanvas } from '../Canvas/useFloorPlanCanvas';
import { createFabricObject } from '../Renderers/objectFactory';
import { createSpaceZone } from '../Renderers/spaceZoneRenderer';
import { createCameraMarker, createSubjectMarker } from '../Renderers/objectFactory';
import type { FloorPlan, SceneCameraPosition, SceneSubjectPosition, SceneSpaceAssignment } from '../../../../types/floor-plan.types';

interface SpatialOverlayProps {
    floorPlan: FloorPlan | null;
    cameras: SceneCameraPosition[];
    subjects: SceneSubjectPosition[];
    spaces: SceneSpaceAssignment[];
    width: number;
    height: number;
    isLoading?: boolean;
    /** When true, camera/subject markers become draggable. */
    isEditing?: boolean;
    /** Called when a camera marker is dragged to a new position. */
    onCameraMove?: (trackId: number, x: number, y: number, rotation: number) => void;
    /** Called when a subject marker is dragged to a new position. */
    onSubjectMove?: (subjectId: number, x: number, y: number) => void;
    /** Subject IDs targeted by selected camera (for highlighting with gold glow) */
    selectedCameraSubjectIds?: number[];
    /** Called when a camera marker is clicked/selected on the canvas. Receives the camera number (1-based, e.g. 1 = "Cam 1"). */
    onCameraSelect?: (cameraNumber: number) => void;
}

/**
 * Spatial overlay used inside the ContentBuilder DetailsPanel.
 * Supports read-only and edit modes. In edit mode, camera and subject
 * markers are draggable and fire position-change callbacks on drag-end.
 */
export const SpatialOverlay: React.FC<SpatialOverlayProps> = ({
    floorPlan,
    cameras,
    subjects,
    // spaces reserved for future multi-space stitching
    width,
    height,
    isLoading,
    isEditing = false,
    onCameraMove,
    onSubjectMove,
    selectedCameraSubjectIds = [],
    onCameraSelect,
}) => {
    const canvasW = floorPlan?.canvas_width ?? 1000;
    const canvasH = floorPlan?.canvas_height ?? 1000;
    const scale = Math.min(width / canvasW, height / canvasH, 1);
    const displayW = Math.floor(canvasW * scale);
    const displayH = Math.floor(canvasH * scale);

    // Stable refs for callbacks inside canvas event handlers
    const onCameraMoveRef = useRef(onCameraMove);
    const onSubjectMoveRef = useRef(onSubjectMove);
    const getCanvasRef = useRef<() => import('fabric').Canvas | null>(() => null);
    onCameraMoveRef.current = onCameraMove;
    onSubjectMoveRef.current = onSubjectMove;

    const handleObjectModified = useCallback(() => {
        const canvas = getCanvasRef.current();
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active?.data) return;
        const d = active.data;
        if (d.type === 'camera' && onCameraMoveRef.current) {
            onCameraMoveRef.current(d.trackId, active.left ?? 0, active.top ?? 0, active.angle ?? 0);
        } else if (d.type === 'subject' && onSubjectMoveRef.current) {
            onSubjectMoveRef.current(d.subjectId, active.left ?? 0, active.top ?? 0);
        }
    }, []);

    // The canvas hook's onObjectModified fires when a marker is dragged
    const { canvasRef, getCanvas, isReady } = useFloorPlanCanvas({
        width: displayW,
        height: displayH,
        readOnly: !isEditing,
        onObjectModified: isEditing ? handleObjectModified : undefined,
    });
    getCanvasRef.current = getCanvas;

    // Render everything onto the canvas
    const renderAll = useCallback(() => {
        const canvas = getCanvas();
        if (!canvas || !floorPlan) return;

        canvas.clear();
        canvas.backgroundColor = '#1a1a2e';

        // 1. Space zones (background)
        const zones = floorPlan.space_zones ?? [];
        zones.forEach((zone, idx) => {
            canvas.add(createSpaceZone(zone, idx));
        });

        // 2. Floor plan objects (furniture, walls, etc.)
        const objects = floorPlan.objects ?? [];
        objects
            .sort((a, b) => a.order_index - b.order_index)
            .forEach((obj) => {
                const fObj = createFabricObject(obj);
                fObj.selectable = false;
                fObj.evented = false;
                canvas.add(fObj);
            });

        // 3. Subject positions (rendered before cameras so cameras are on top)
        subjects.forEach((subj) => {
            const subjName = subj.label ?? subj.subject?.name ?? '';
            const normName = subjName.toLowerCase().trim();
            const isCouple = normName === 'bride' || normName === 'groom';
            const isGuest = /guest|crowd|congregation|audience/i.test(subjName);
            const marker = createSubjectMarker({
                x: subj.x,
                y: subj.y,
                label: subjName || undefined,
                subjectId: subj.subject_id,
                // Three-tone palette: bride/groom rose, wedding party purple, guests slate.
                color: isCouple ? '#f472b6' : isGuest ? '#94a3b8' : '#a78bfa',
                isSelected: selectedCameraSubjectIds.includes(subj.subject_id),
            });
            marker.selectable = isEditing;
            marker.evented = isEditing;
            marker.hasControls = false;
            canvas.add(marker);
        });

        // 4. Camera positions (topmost layer)
        cameras.forEach((cam, idx) => {
            const marker = createCameraMarker({
                x: cam.x,
                y: cam.y,
                rotation: cam.rotation,
                trackId: cam.track_id,
                label: cam.label ?? cam.track?.name ?? undefined,
                color: '#7B61FF',
            });
            marker.data = { ...marker.data, cameraNumber: idx + 1 };
            marker.selectable = isEditing;
            // Always evented so camera selection fires onCameraSelect even outside edit mode
            marker.evented = true;
            // In edit mode allow rotation (angle) but not scale
            marker.hasControls = isEditing;
            if (isEditing) {
                marker.lockScalingX = true;
                marker.lockScalingY = true;
            }
            canvas.add(marker);
        });

        canvas.requestRenderAll();
    }, [getCanvas, floorPlan, cameras, subjects, selectedCameraSubjectIds, isEditing]);

    useEffect(() => {
        if (isReady) renderAll();
    }, [isReady, renderAll]);

    // Camera selection handler — fires onCameraSelect when user clicks a camera marker
    // Camera selection — only mouse:down (selection events double-fire on the same click).
    const onCameraSelectRef = useRef(onCameraSelect);
    onCameraSelectRef.current = onCameraSelect;
    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas) return;
        const handler = (e: any) => {
            const target = e.target;
            if (target?.data?.type === 'camera' && target.data.cameraNumber != null) {
                console.debug('[SpatialOverlay] camera click →', target.data.cameraNumber);
                onCameraSelectRef.current?.(target.data.cameraNumber);
            }
        };
        canvas.on('mouse:down', handler);
        return () => {
            canvas.off('mouse:down', handler);
        };
    }, [isReady, getCanvas]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.3)' }} />
            </Box>
        );
    }

    if (!floorPlan) {
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
                <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', textAlign: 'center' }}>
                    No floor plan for this location
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
            {/* Legend chips */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {cameras.length > 0 && (
                    <Chip
                        icon={<VideocamRoundedIcon sx={{ fontSize: 14 }} />}
                        label={`${cameras.length} camera${cameras.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            bgcolor: alpha('#7B61FF', 0.12),
                            color: 'rgba(255,255,255,0.7)',
                            '& .MuiChip-icon': { color: '#7B61FF' },
                        }}
                    />
                )}
                {subjects.length > 0 && (
                    <Chip
                        icon={<PersonRoundedIcon sx={{ fontSize: 14 }} />}
                        label={`${subjects.length} subject${subjects.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            bgcolor: alpha('#FF6B9D', 0.12),
                            color: 'rgba(255,255,255,0.7)',
                            '& .MuiChip-icon': { color: '#FF6B9D' },
                        }}
                    />
                )}
            </Box>

            {/* Canvas */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    border: isEditing ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    bgcolor: '#0a0a1a',
                    overflow: 'hidden',
                }}
            >
                <canvas ref={canvasRef} />
            </Box>
        </Box>
    );
};
