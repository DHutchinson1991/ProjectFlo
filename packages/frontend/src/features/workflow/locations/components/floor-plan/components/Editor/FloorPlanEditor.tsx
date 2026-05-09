'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useFloorPlanCanvas } from '../Canvas/useFloorPlanCanvas';
import { createFabricObject } from '../Renderers/objectFactory';
import { createSpaceZone } from '../Renderers/spaceZoneRenderer';
import { ObjectToolbar } from '../Toolbars/ObjectToolbar';
import type { FloorPlan, FloorPlanObjectType, FloorPlanObject } from '../../../../types/floor-plan.types';

interface FloorPlanEditorProps {
    floorPlan: FloorPlan | null;
    /** Container dimensions — canvas scales to fit */
    containerWidth: number;
    containerHeight: number;
    readOnly?: boolean;
    onAutoSave?: (layoutJson: object, objects: Partial<FloorPlanObject>[]) => void;
}

/**
 * Core floor-plan editor component.
 * Manages Fabric.js canvas lifecycle, object add/edit, and auto-save.
 */
export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
    floorPlan,
    containerWidth,
    containerHeight,
    readOnly = false,
    onAutoSave,
}) => {
    const [activeTool, setActiveTool] = useState<FloorPlanObjectType | null>(null);
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Compute canvas dimensions maintaining aspect ratio
    const canvasW = floorPlan?.canvas_width ?? 1000;
    const canvasH = floorPlan?.canvas_height ?? 1000;
    const scale = Math.min(
        (containerWidth - 16) / canvasW,
        (containerHeight - 60) / canvasH,
        1,
    );
    const displayW = Math.floor(canvasW * scale);
    const displayH = Math.floor(canvasH * scale);

    const triggerAutoSave = useCallback(() => {
        if (!onAutoSave || readOnly) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            const canvas = getCanvas();
            if (!canvas) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const layoutJson = (canvas.toJSON as any)(['data']);
            // Extract objects with db metadata
            const objects: Partial<FloorPlanObject>[] = canvas
                .getObjects()
                .filter((o) => o.data?.dbId || o.data?.objectType)
                .map((o) => ({
                    id: o.data?.dbId,
                    object_type: o.data?.objectType,
                    x: o.left ?? 0,
                    y: o.top ?? 0,
                    width: (o as unknown as { width?: number }).width ?? 50,
                    height: (o as unknown as { height?: number }).height ?? 50,
                    rotation: o.angle ?? 0,
                }));
            onAutoSave(layoutJson, objects);
        }, 1500);
    }, [onAutoSave, readOnly]); // auto-save — getCanvas stable ref

    const { canvasRef, getCanvas } = useFloorPlanCanvas({
        width: displayW,
        height: displayH,
        readOnly,
        onObjectModified: triggerAutoSave,
    });

    // Load floor plan data onto canvas when floorPlan changes
    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas || !floorPlan) return;

        canvas.clear();
        canvas.backgroundColor = '#1a1a2e';

        // Draw space zones first (background layer)
        const zones = floorPlan.space_zones ?? [];
        zones.forEach((zone, idx) => {
            const group = createSpaceZone(zone, idx);
            canvas.add(group);
        });

        // Draw floor plan objects on top
        const objects = floorPlan.objects ?? [];
        objects
            .sort((a, b) => a.order_index - b.order_index)
            .forEach((obj) => {
                const fabricObj = createFabricObject(obj);
                fabricObj.selectable = !readOnly;
                fabricObj.evented = !readOnly;
                canvas.add(fabricObj);
            });

        canvas.requestRenderAll();
    }, [floorPlan, readOnly]); // re-render on data change

    // Handle canvas click to place new object when a tool is active
    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas || readOnly) return;

        const handler = (opt: { e: MouseEvent }) => {
            if (!activeTool) return;
            const pointer = canvas.getScenePoint(opt.e);            const newObj: FloorPlanObject = {
                id: 0,
                floor_plan_id: floorPlan?.id ?? 0,
                object_type: activeTool,
                label: null,
                x: pointer.x,
                y: pointer.y,
                width: activeTool === 'WALL' ? 120 : 50,
                height: activeTool === 'WALL' ? 10 : activeTool === 'AISLE' ? 200 : 50,
                rotation: 0,
                metadata: null,
                order_index: canvas.getObjects().length,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const fabricObj = createFabricObject(newObj);
            canvas.add(fabricObj);
            canvas.setActiveObject(fabricObj);
            canvas.requestRenderAll();
            setActiveTool(null); // Return to select mode after placement
            triggerAutoSave();
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvas.on('mouse:down', handler as any);
        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            canvas.off('mouse:down', handler as any);
        };
    }, [activeTool, readOnly, floorPlan, getCanvas, triggerAutoSave]);

    // Cleanup auto-save timer
    useEffect(() => {
        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        };
    }, []);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                height: '100%',
            }}
        >
            {/* Toolbar */}
            {!readOnly && (
                <ObjectToolbar
                    activeTool={activeTool}
                    onSelectTool={setActiveTool}
                />
            )}

            {/* Canvas container */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    border: '1px solid rgba(255,255,255,0.06)',
                    bgcolor: '#0d0d0d',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: activeTool ? 'crosshair' : 'default',
                }}
            >
                <canvas ref={canvasRef} />
                {!floorPlan && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography
                            sx={{
                                color: 'rgba(255,255,255,0.25)',
                                fontSize: '0.8rem',
                            }}
                        >
                            No floor plan loaded
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
