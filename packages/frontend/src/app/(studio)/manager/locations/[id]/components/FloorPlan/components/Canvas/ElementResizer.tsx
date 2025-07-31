'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GridService } from '../../services/GridService';

interface ElementResizerProps {
    svgDrawingRef: React.RefObject<unknown>; // SVG.js drawing instance
    isEnabled: boolean; // Whether resize functionality is enabled
    onElementResize?: (element: unknown, newDimensions: { width: number; height: number; x: number; y: number }) => void;
    onRefreshNeeded?: () => void; // Callback to trigger refresh from parent
    gridSize?: number; // Grid size for snap-to-grid functionality
    showMeasurements?: boolean; // Whether to show real-time measurements
}

export const ElementResizer: React.FC<ElementResizerProps> = ({
    svgDrawingRef,
    isEnabled,
    onElementResize,
    onRefreshNeeded,
    gridSize = 20,
    showMeasurements = true
}) => {
    const [selectedElement, setSelectedElement] = useState<unknown>(null); // Currently selected SVG.js element
    const [isResizing, setIsResizing] = useState(false);
    const [resizeData, setResizeData] = useState<{
        element: unknown;
        handle: string;
        startBbox: unknown;
        startMousePos: { x: number; y: number };
        originalRatio?: number;
        constrainProportions?: boolean;
        resizeFromCenter?: boolean;
    } | null>(null);

    const resizeHandlesRef = useRef<unknown>(null); // SVG.js group for resize handles
    const measurementOverlayRef = useRef<unknown>(null); // Real-time measurement display
    const snapIndicatorRef = useRef<unknown>(null); // Snap-to-grid indicator

    // Force refresh state to trigger useEffect when SVG content changes
    const [refreshKey, setRefreshKey] = useState(0);

    // Throttle resize operations for better performance
    const resizeThrottle = useRef<NodeJS.Timeout | null>(null);

    // Snap value to grid
    const snapToGrid = useCallback((value: number): number => {
        return GridService.snapToGrid({ x: value, y: 0 }, gridSize).x;
    }, [gridSize]);

    // Convert pixels to meters for display
    const pixelsToMeters = useCallback((pixels: number): string => {
        const realDistance = GridService.calculateRealDistance(pixels, '1m'); // Using 1m as default
        return `${realDistance.value.toFixed(1)}${realDistance.unit}`;
    }, []);

    // Create resize handles around selected element
    const createResizeHandles = useCallback((element: any) => {
        if (!svgDrawingRef.current || !element) return;

        const drawing = svgDrawingRef.current as any;

        // Remove existing handles
        if (resizeHandlesRef.current) {
            (resizeHandlesRef.current as any).remove();
        }

        const bbox = element.bbox();
        const handleSize = 8;
        const handleColor = '#007bff';
        const handleStroke = '#ffffff';

        // Create handles group
        const handlesGroup = drawing.group().addClass('resize-handles');
        resizeHandlesRef.current = handlesGroup;

        // Define handle positions
        const handles = [
            { type: 'nw', x: bbox.x - handleSize / 2, y: bbox.y - handleSize / 2 },
            { type: 'n', x: bbox.x + bbox.width / 2 - handleSize / 2, y: bbox.y - handleSize / 2 },
            { type: 'ne', x: bbox.x + bbox.width - handleSize / 2, y: bbox.y - handleSize / 2 },
            { type: 'e', x: bbox.x + bbox.width - handleSize / 2, y: bbox.y + bbox.height / 2 - handleSize / 2 },
            { type: 'se', x: bbox.x + bbox.width - handleSize / 2, y: bbox.y + bbox.height - handleSize / 2 },
            { type: 's', x: bbox.x + bbox.width / 2 - handleSize / 2, y: bbox.y + bbox.height - handleSize / 2 },
            { type: 'sw', x: bbox.x - handleSize / 2, y: bbox.y + bbox.height - handleSize / 2 },
            { type: 'w', x: bbox.x - handleSize / 2, y: bbox.y + bbox.height / 2 - handleSize / 2 }
        ];

        // Create handle elements
        handles.forEach(handle => {
            const handleRect = handlesGroup.rect(handleSize, handleSize)
                .move(handle.x, handle.y)
                .fill(handleColor)
                .stroke({ color: handleStroke, width: 1 })
                .addClass(`resize-handle-${handle.type}`)
                .style('cursor', `${handle.type}-resize`);

            // Add resize event listeners
            handleRect.on('mousedown', (event: MouseEvent) => {
                event.stopPropagation();
                event.preventDefault();

                setIsResizing(true);
                setResizeData({
                    element,
                    handle: handle.type,
                    startBbox: element.bbox(),
                    startMousePos: { x: event.clientX, y: event.clientY },
                    constrainProportions: event.shiftKey,
                    resizeFromCenter: event.altKey
                });
            });
        });

        // Position handles group
        handlesGroup.front();
    }, [svgDrawingRef]);

    // Handle mouse move during resize
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!isResizing || !resizeData || !svgDrawingRef.current) return;

        const { element, handle, startBbox, startMousePos } = resizeData;
        const drawing = svgDrawingRef.current as any;

        // Calculate mouse delta
        const deltaX = event.clientX - startMousePos.x;
        const deltaY = event.clientY - startMousePos.y;

        // Get current element bbox
        const currentBbox = (element as any).bbox();
        let newX = currentBbox.x;
        let newY = currentBbox.y;
        let newWidth = currentBbox.width;
        let newHeight = currentBbox.height;

        // Apply resize based on handle type
        switch (handle) {
            case 'nw':
                newX = (startBbox as any).x + deltaX;
                newY = (startBbox as any).y + deltaY;
                newWidth = (startBbox as any).width - deltaX;
                newHeight = (startBbox as any).height - deltaY;
                break;
            case 'n':
                newY = (startBbox as any).y + deltaY;
                newHeight = (startBbox as any).height - deltaY;
                break;
            case 'ne':
                newY = (startBbox as any).y + deltaY;
                newWidth = (startBbox as any).width + deltaX;
                newHeight = (startBbox as any).height - deltaY;
                break;
            case 'e':
                newWidth = (startBbox as any).width + deltaX;
                break;
            case 'se':
                newWidth = (startBbox as any).width + deltaX;
                newHeight = (startBbox as any).height + deltaY;
                break;
            case 's':
                newHeight = (startBbox as any).height + deltaY;
                break;
            case 'sw':
                newX = (startBbox as any).x + deltaX;
                newWidth = (startBbox as any).width - deltaX;
                newHeight = (startBbox as any).height + deltaY;
                break;
            case 'w':
                newX = (startBbox as any).x + deltaX;
                newWidth = (startBbox as any).width - deltaX;
                break;
        }

        // Apply grid snapping
        if (gridSize > 0) {
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);
            newWidth = snapToGrid(newWidth);
            newHeight = snapToGrid(newHeight);
        }

        // Enforce minimum size
        const minSize = 10;
        newWidth = Math.max(minSize, newWidth);
        newHeight = Math.max(minSize, newHeight);

        // Apply constraints for proportional resize
        if (resizeData.constrainProportions) {
            const originalRatio = (startBbox as any).width / (startBbox as any).height;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / originalRatio;
            } else {
                newWidth = newHeight * originalRatio;
            }
        }

        // Update element
        try {
            if ((element as any).type === 'rect') {
                (element as any).size(newWidth, newHeight).move(newX, newY);
            } else if ((element as any).type === 'circle') {
                const radius = Math.min(newWidth, newHeight) / 2;
                (element as any).radius(radius).center(newX + newWidth / 2, newY + newHeight / 2);
            }

            // Update resize handles
            createResizeHandles(element);

            // Show real-time measurements
            if (showMeasurements) {
                showResizeMeasurements(newWidth, newHeight, newX, newY);
            }

            // Throttled callback
            if (resizeThrottle.current) {
                clearTimeout(resizeThrottle.current);
            }
            resizeThrottle.current = setTimeout(() => {
                onElementResize?.(element, { width: newWidth, height: newHeight, x: newX, y: newY });
            }, 16); // ~60fps

        } catch (error) {
            console.error('Error during resize:', error);
        }
    }, [isResizing, resizeData, svgDrawingRef, snapToGrid, createResizeHandles, showMeasurements, onElementResize, gridSize]);

    // Show real-time measurements during resize
    const showResizeMeasurements = useCallback((width: number, height: number, x: number, y: number) => {
        if (!svgDrawingRef.current) return;

        const drawing = svgDrawingRef.current as any;

        // Remove existing measurement overlay
        if (measurementOverlayRef.current) {
            (measurementOverlayRef.current as any).remove();
        }

        // Create new measurement overlay
        const overlay = drawing.group().addClass('resize-measurement-overlay');
        measurementOverlayRef.current = overlay;

        const fontSize = 12;
        const textColor = '#007bff';
        const bgColor = 'rgba(255, 255, 255, 0.9)';

        // Width measurement
        const widthText = overlay.text(`W: ${pixelsToMeters(width)}`)
            .font({ size: fontSize, family: 'Arial', weight: 'bold' })
            .fill(textColor);

        const widthBg = overlay.rect(widthText.bbox().width + 8, widthText.bbox().height + 4)
            .fill(bgColor)
            .stroke({ color: textColor, width: 1 })
            .radius(3);

        widthBg.move(x + width / 2 - widthBg.width() / 2, y - 30);
        widthText.move(x + width / 2 - widthText.bbox().width / 2, y - 28);

        // Height measurement
        const heightText = overlay.text(`H: ${pixelsToMeters(height)}`)
            .font({ size: fontSize, family: 'Arial', weight: 'bold' })
            .fill(textColor);

        const heightBg = overlay.rect(heightText.bbox().width + 8, heightText.bbox().height + 4)
            .fill(bgColor)
            .stroke({ color: textColor, width: 1 })
            .radius(3);

        heightBg.move(x + width + 10, y + height / 2 - heightBg.height() / 2);
        heightText.move(x + width + 14, y + height / 2 - heightText.bbox().height / 2);

        overlay.front();
    }, [svgDrawingRef, pixelsToMeters]);

    // Handle mouse up (end resize)
    const handleMouseUp = useCallback(() => {
        if (isResizing && resizeData) {
            setIsResizing(false);

            // Remove measurement overlay
            if (measurementOverlayRef.current) {
                (measurementOverlayRef.current as any).remove();
                measurementOverlayRef.current = null;
            }

            // Final callback
            const { element } = resizeData;
            const finalBbox = (element as any).bbox();
            onElementResize?.(element, {
                width: finalBbox.width,
                height: finalBbox.height,
                x: finalBbox.x,
                y: finalBbox.y
            });

            setResizeData(null);
        }
    }, [isResizing, resizeData, onElementResize]);

    // Set up global mouse event listeners
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Handle element selection
    useEffect(() => {
        if (!svgDrawingRef.current || !isEnabled) {
            setSelectedElement(null);
            if (resizeHandlesRef.current) {
                (resizeHandlesRef.current as any).remove();
                resizeHandlesRef.current = null;
            }
            return;
        }

        const drawing = svgDrawingRef.current as any;

        // Add click listener to canvas
        const handleCanvasClick = (event: Event) => {
            const target = (event.target as any);

            // Check if clicked on an element that can be resized
            if (target && target.instance &&
                (target.instance.type === 'rect' || target.instance.type === 'circle') &&
                !target.instance.hasClass('grid-layer') &&
                !target.instance.hasClass('resize-handle') &&
                !target.instance.hasClass('measurement-overlay')) {

                setSelectedElement(target.instance);
                createResizeHandles(target.instance);
            } else if (!target?.instance?.hasClass('resize-handle')) {
                // Clicked on empty space or non-resizable element
                setSelectedElement(null);
                if (resizeHandlesRef.current) {
                    (resizeHandlesRef.current as any).remove();
                    resizeHandlesRef.current = null;
                }
            }
        };

        drawing.on('click', handleCanvasClick);

        return () => {
            drawing.off('click', handleCanvasClick);
        };
    }, [svgDrawingRef, isEnabled, createResizeHandles, refreshKey]);

    // Handle external refresh requests
    useEffect(() => {
        if (onRefreshNeeded) {
            setRefreshKey(prev => prev + 1);
        }
    }, [onRefreshNeeded]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (resizeHandlesRef.current) {
                (resizeHandlesRef.current as any).remove();
            }
            if (measurementOverlayRef.current) {
                (measurementOverlayRef.current as any).remove();
            }
            if (resizeThrottle.current) {
                clearTimeout(resizeThrottle.current);
            }
        };
    }, []);

    return null; // This component doesn't render any React elements
};
