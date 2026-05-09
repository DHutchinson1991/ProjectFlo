'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Point } from 'fabric';

export interface UseFloorPlanCanvasOptions {
    width: number;
    height: number;
    readOnly?: boolean;
    onCanvasReady?: (canvas: Canvas) => void;
    onObjectModified?: () => void;
    fitViewportTransform?: [number, number, number, number, number, number];
}

/**
 * Core hook that initializes a Fabric.js v6 Canvas on a <canvas> ref.
 * Supports scroll-to-zoom and drag-to-pan.
 * Returns the canvas instance, ref, and a fitToView helper.
 */
export function useFloorPlanCanvas({
    width,
    height,
    readOnly = false,
    onCanvasReady,
    onObjectModified,
    fitViewportTransform,
}: UseFloorPlanCanvasOptions) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isPanMode, setIsPanMode] = useState(false);
    const fitViewportTransformRef = useRef<[number, number, number, number, number, number]>([1, 0, 0, 1, 0, 0]);
    const isPanModeRef = useRef(false);
    const isSpacePressedRef = useRef(false);

    useEffect(() => {
        fitViewportTransformRef.current = fitViewportTransform ?? [1, 0, 0, 1, 0, 0];
    }, [fitViewportTransform]);

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: '#1a1a2e',
            selection: !readOnly,
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;
        setIsReady(true);
        onCanvasReady?.(canvas);

        return () => {
            canvas.dispose();
            fabricRef.current = null;
            setIsReady(false);
        };
    }, []); // canvas init — intentionally runs once

    // Update dimensions when container resizes
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.setDimensions({ width, height });
        if (!isZoomed) {
            canvas.setViewportTransform(fitViewportTransformRef.current);
        }
        canvas.requestRenderAll();
    }, [width, height, isZoomed]);

    // ── Scroll-to-zoom ──────────────────────────────────
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const handleWheel = (opt: any) => {
            const e: WheelEvent = opt.e;
            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            zoom = Math.min(Math.max(zoom, 0.5), 5);

            const point = new Point(e.offsetX, e.offsetY);
            canvas.zoomToPoint(point, zoom);
            setIsZoomed(Math.abs(zoom - 1) > 0.01);
            canvas.requestRenderAll();
        };

        canvas.on('mouse:wheel', handleWheel);
        return () => { canvas.off('mouse:wheel', handleWheel); };
    }, [isReady]);

    // ── Drag-to-pan (middle-click or right-click) ───────
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        let isPanning = false;
        let lastX = 0;
        let lastY = 0;

        const onDown = (opt: any) => {
            const e: MouseEvent = opt.e;
            // Pan on middle-click, right-click, alt+left-click, hand-mode, or Space+drag
            const activatePan = e.button === 1 || e.button === 2 || e.altKey || isPanModeRef.current || isSpacePressedRef.current;
            if (activatePan) {
                isPanning = true;
                lastX = e.clientX;
                lastY = e.clientY;
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
                e.preventDefault();
            }
        };

        const onMove = (opt: any) => {
            if (!isPanning) return;
            const e: MouseEvent = opt.e;
            const vpt = canvas.viewportTransform!;
            vpt[4] += e.clientX - lastX;
            vpt[5] += e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.requestRenderAll();
            setIsZoomed(true);
        };

        const onUp = () => {
            if (isPanning) {
                canvas.defaultCursor = (isPanModeRef.current || isSpacePressedRef.current) ? 'grab' : 'default';
            }
            isPanning = false;
            if (!readOnly) canvas.selection = true;
        };

        canvas.on('mouse:down', onDown);
        canvas.on('mouse:move', onMove);
        canvas.on('mouse:up', onUp);
        return () => {
            canvas.off('mouse:down', onDown);
            canvas.off('mouse:move', onMove);
            canvas.off('mouse:up', onUp);
        };
    }, [isReady, readOnly]);

    // Listen for object modifications (move, scale, rotate)
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || !onObjectModified) return;

        const handler = () => onObjectModified();
        canvas.on('object:modified', handler);
        return () => {
            canvas.off('object:modified', handler);
        };
    }, [onObjectModified]);

    // Toggle selection mode
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.selection = !readOnly;
        canvas.forEachObject((obj) => {
            obj.selectable = !readOnly;
            obj.evented = !readOnly;
        });
        canvas.requestRenderAll();
    }, [readOnly]);

    // ── Pan mode cursor update ──────────────────────────
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        isPanModeRef.current = isPanMode;
        canvas.defaultCursor = isPanMode ? 'grab' : 'default';
    }, [isPanMode]);

    // ── Space-to-pan keyboard shortcut ─────────────────
    useEffect(() => {
        if (!isReady) return;
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        let isHovering = false;
        const onMouseEnter = () => { isHovering = true; };
        const onMouseLeave = () => { isHovering = false; };
        canvasEl.addEventListener('mouseenter', onMouseEnter);
        canvasEl.addEventListener('mouseleave', onMouseLeave);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && isHovering) {
                e.preventDefault();
                isSpacePressedRef.current = true;
                const c = fabricRef.current;
                if (c) c.defaultCursor = 'grab';
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressedRef.current = false;
                const c = fabricRef.current;
                if (c) c.defaultCursor = isPanModeRef.current ? 'grab' : 'default';
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            canvasEl.removeEventListener('mouseenter', onMouseEnter);
            canvasEl.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        };
    }, [isReady]);

    // ── Fit-to-view: reset zoom + pan ───────────────────
    const fitToView = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.setViewportTransform(fitViewportTransformRef.current);
        setIsZoomed(false);
        canvas.requestRenderAll();
    }, []);

    const togglePanMode = useCallback(() => {
        setIsPanMode((prev) => !prev);
    }, []);

    const getCanvas = useCallback(() => fabricRef.current, []);

    return {
        canvasRef,
        canvas: fabricRef.current,
        getCanvas,
        isReady,
        isZoomed,
        isPanMode,
        fitToView,
        togglePanMode,
    };
}
