'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { Canvas } from 'fabric';
import { createFabricObject } from '../Renderers/objectFactory';
import { ObjectToolbar } from '../Toolbars/ObjectToolbar';
import type {
    PackageSpaceSlot,
    FloorPlanObjectType,
    SaveSpaceSlotCanvasRequest,
} from '../../../../types/floor-plan.types';

interface SpaceSlotEditorProps {
    spaceSlot: PackageSpaceSlot;
    onClose: () => void;
    onAutoSave: (data: SaveSpaceSlotCanvasRequest) => void;
}

const CANVAS_BG = '#ffffff';

/**
 * Inline set-design editor for PackageSpaceSlot.
 * Objects only (furniture, walls, décor) — camera/subject blocking
 * lives at moment level in the Content Builder.
 *
 * Renders as a self-contained panel (no Dialog).
 * Uses ResizeObserver to fill whatever container it's placed in.
 */
export const SpaceSlotEditor: React.FC<SpaceSlotEditorProps> = ({
    spaceSlot,
    onClose,
    onAutoSave,
}) => {
    const [activeTool, setActiveTool] = useState<FloorPlanObjectType | null>(null);
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeToolRef = useRef<FloorPlanObjectType | null>(activeTool);
    activeToolRef.current = activeTool;

    const canvasW = spaceSlot.canvas_width ?? 1000;
    const canvasH = spaceSlot.canvas_height ?? 1000;

    // ── Auto-save: serialize objects → request ───────────────
    const triggerAutoSave = useCallback(() => {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            const canvas = fabricRef.current;
            if (!canvas) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const layoutJson = (canvas.toJSON as any)(['data']);
            const objects: SaveSpaceSlotCanvasRequest['objects'] = [];
            let objIdx = 0;

            canvas.getObjects().forEach((fObj) => {
                const d = fObj.data;
                if (!d?.objectType) return;
                objects.push({
                    id: d.dbId || undefined,
                    object_type: d.objectType,
                    label: d.label || undefined,
                    x: fObj.left ?? 0,
                    y: fObj.top ?? 0,
                    width: (fObj as unknown as { width?: number }).width ?? 50,
                    height: (fObj as unknown as { height?: number }).height ?? 50,
                    rotation: fObj.angle ?? 0,
                    order_index: objIdx++,
                });
            });

            onAutoSave({
                layout_json: layoutJson,
                canvas_width: canvasW,
                canvas_height: canvasH,
                objects,
                cameras: [],
                subjects: [],
            });
        }, 1500);
    }, [onAutoSave, canvasW, canvasH]);

    // ── Initialize Fabric via ResizeObserver ──────────────────
    useEffect(() => {
        const container = containerRef.current;
        const canvasEl = canvasElRef.current;
        if (!container || !canvasEl) return;

        let canvas: Canvas | null = null;

        const initCanvas = () => {
            // Dispose previous if exists (resize scenario)
            if (canvas) {
                canvas.dispose();
                canvas = null;
                fabricRef.current = null;
            }

            const rect = container.getBoundingClientRect();
            if (rect.width < 50 || rect.height < 50) return; // too small, skip

            const pad = 16;
            const availW = rect.width - pad;
            const availH = rect.height - pad;
            const scale = Math.min(availW / canvasW, availH / canvasH, 1);
            const displayW = Math.floor(canvasW * scale);
            const displayH = Math.floor(canvasH * scale);

            canvas = new Canvas(canvasEl, {
                width: displayW,
                height: displayH,
                backgroundColor: CANVAS_BG,
                selection: true,
                preserveObjectStacking: true,
            });
            fabricRef.current = canvas;

            // Load existing objects
            (spaceSlot.objects ?? [])
                .sort((a, b) => a.order_index - b.order_index)
                .forEach((obj) => {
                    const fObj = createFabricObject({
                        ...obj,
                        floor_plan_id: 0,
                        created_at: obj.created_at,
                        updated_at: obj.updated_at,
                    });
                    fObj.data = { ...fObj.data, dbId: obj.id, objectType: obj.object_type };
                    canvas!.add(fObj);
                });

            canvas.requestRenderAll();

            // Object modified → auto-save
            canvas.on('object:modified', () => triggerAutoSave());

            // Click-to-place
            canvas.on('mouse:down', (opt) => {
                const currentTool = activeToolRef.current;
                if (!currentTool) return;
                const pointer = canvas!.getScenePoint(opt.e);

                const newObj = {
                    id: 0,
                    floor_plan_id: 0,
                    object_type: currentTool,
                    label: null,
                    x: pointer.x,
                    y: pointer.y,
                    width: currentTool === 'WALL' ? 120 : 50,
                    height: currentTool === 'WALL' ? 10 : currentTool === 'AISLE' ? 200 : 50,
                    rotation: 0,
                    metadata: null,
                    order_index: canvas!.getObjects().length,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                const fabricObj = createFabricObject(newObj);
                fabricObj.data = { objectType: currentTool };
                canvas!.add(fabricObj);
                canvas!.setActiveObject(fabricObj);
                canvas!.requestRenderAll();
                setActiveTool(null);
                triggerAutoSave();
            });
        };

        // Use ResizeObserver to init once container has real dimensions
        let inited = false;
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            if (width > 50 && height > 50 && !inited) {
                inited = true;
                initCanvas();
            }
        });
        ro.observe(container);

        return () => {
            ro.disconnect();
            if (canvas) {
                canvas.dispose();
                fabricRef.current = null;
            }
        };
    }, [spaceSlot.id, canvasW, canvasH, triggerAutoSave]);

    // ── Delete selected ─────────────────────────────────────
    const handleDelete = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (active.length === 0) return;
        active.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        triggerAutoSave();
    }, [triggerAutoSave]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') handleDelete();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleDelete]);

    useEffect(() => {
        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        };
    }, []);

    const isPlacing = !!activeTool;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#0e1117',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {spaceSlot.label} — Set Design
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', p: 0.25 }}>
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Toolbar — compact, wrapping */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, px: 1, py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                <ObjectToolbar
                    activeTool={activeTool}
                    onSelectTool={(t) => setActiveTool(t)}
                />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Delete Selected (Del)" placement="top" arrow>
                    <IconButton size="small" onClick={handleDelete}
                        sx={{ width: 28, height: 28, borderRadius: 1, color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' } }}
                    ><DeleteRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                </Tooltip>
            </Box>

            {/* Canvas area — fills remaining space */}
            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: isPlacing ? 'crosshair' : 'default',
                    minHeight: 0, // allow flex shrink
                }}
            >
                <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', lineHeight: 0 }}>
                    <canvas ref={canvasElRef} />
                </Box>
            </Box>

            {/* Status bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.25, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>{canvasW}×{canvasH}</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)' }}>Auto-saves</Typography>
            </Box>
        </Box>
    );
};
