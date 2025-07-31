import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wall, WALL_THICKNESSES } from '../../types/WallTypes';

export interface WallToolProps {
    svgDrawing: React.MutableRefObject<any>;
    isActive: boolean;
    wallType: 'interior' | 'exterior';
    wallMaterial: string;
    wallThickness: number;
    gridSize: number;
    zoomLevel: number;
    existingWalls: Wall[];
    onWallCreated: (wall: Wall) => void;
    onWallUpdated?: (wall: Wall) => void; // Make optional
}

export const WallTool: React.FC<WallToolProps> = ({
    svgDrawing,
    isActive,
    wallType,
    wallMaterial,
    wallThickness: propWallThickness,
    gridSize,
    zoomLevel,
    existingWalls,
    onWallCreated
}) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [previewLine, setPreviewLine] = useState<any>(null);
    const currentWallRef = useRef<Wall | null>(null);

    // Get wall thickness based on type
    const wallThickness = wallType === 'exterior' ? WALL_THICKNESSES.EXTERIOR_STANDARD : WALL_THICKNESSES.INTERIOR_STANDARD;

    // Helper function to snap coordinates to grid
    const snapToGrid = useCallback((x: number, y: number) => {
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        return { x: snappedX, y: snappedY };
    }, [gridSize]);

    // Helper function to get wall style based on type (simplified - no brown colors!)
    const getWallStyle = useCallback(() => {
        const baseStyle = {
            stroke: wallType === 'exterior' ? '#2c3e50' : '#34495e', // Dark blue/gray colors
            'stroke-width': wallThickness,
            'stroke-linecap': 'square' as const,
            fill: 'none'
        };

        return baseStyle;
    }, [wallType, wallThickness]);

    // Handle mouse events for wall drawing
    const handleMouseDown = useCallback((event: MouseEvent) => {
        if (!svgDrawing.current) return;

        const drawing = svgDrawing.current;
        const rect = drawing.node.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const snappedPoint = snapToGrid(x, y);

        if (!isDrawing) {
            // Start drawing a wall
            setIsDrawing(true);
            setStartPoint(snappedPoint);

            // Create preview line
            const preview = drawing.line()
                .plot(snappedPoint.x, snappedPoint.y, snappedPoint.x, snappedPoint.y)
                .attr({
                    ...getWallStyle(),
                    'stroke-dasharray': '5,5',
                    opacity: 0.6
                })
                .addClass('wall-preview');

            setPreviewLine(preview);
        } else {
            // Finish drawing the wall
            if (startPoint) {
                const endPoint = snappedPoint;

                // Don't create zero-length walls
                if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
                    return;
                }

                // Create the wall object
                const newWall: Wall = {
                    id: `wall_${Date.now()}`,
                    startPoint: { x: startPoint.x, y: startPoint.y },
                    endPoint: { x: endPoint.x, y: endPoint.y },
                    thickness: wallThickness,
                    type: wallType,
                    material: wallType === 'exterior' ? 'brick' : 'drywall',
                    height: 8, // Default 8 feet
                    connectedWalls: [],
                    style: {
                        color: '#000000',
                        fillColor: '#cccccc',
                        strokeWidth: 2,
                        opacity: 1
                    },
                    metadata: {
                        layer: 'walls',
                        locked: false,
                        visible: true,
                        created: new Date(),
                        modified: new Date()
                    }
                };

                // Create the actual wall line
                const wallLine = drawing.line()
                    .plot(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
                    .attr(getWallStyle())
                    .addClass('wall')
                    .data('wall-id', newWall.id);

                // Add interaction handlers
                wallLine
                    .style('cursor', 'pointer')
                    .on('click', function (this: any, event: Event) {
                        event.stopPropagation();
                        // Handle wall selection/editing
                    })
                    .on('mouseover', function (this: any) {
                        this.attr('stroke-width', wallThickness + 2);
                    })
                    .on('mouseout', function (this: any) {
                        this.attr('stroke-width', wallThickness);
                    });

                // Callback to parent
                onWallCreated(newWall);

                // Clean up
                if (previewLine) {
                    previewLine.remove();
                    setPreviewLine(null);
                }

                setIsDrawing(false);
                setStartPoint(null);
            }
        }
    }, [
        isDrawing,
        startPoint,
        snapToGrid,
        getWallStyle,
        wallType,
        wallThickness,
        onWallCreated,
        previewLine
    ]);

    // Handle mouse move for preview
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!isDrawing || !startPoint || !previewLine || !svgDrawing.current) return;

        const drawing = svgDrawing.current;
        const rect = drawing.node.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const snappedPoint = snapToGrid(x, y);

        // Update preview line
        previewLine.plot(startPoint.x, startPoint.y, snappedPoint.x, snappedPoint.y);
    }, [isDrawing, startPoint, previewLine, snapToGrid]);

    // Handle escape key to cancel drawing
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape' && isDrawing) {
            // Cancel drawing
            if (previewLine) {
                previewLine.remove();
                setPreviewLine(null);
            }
            setIsDrawing(false);
            setStartPoint(null);
        }
    }, [isDrawing, previewLine]);

    // Add event listeners
    useEffect(() => {
        if (!svgDrawing.current) return;

        const drawing = svgDrawing.current;
        const svgElement = drawing.node;

        svgElement.addEventListener('mousedown', handleMouseDown);
        svgElement.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            svgElement.removeEventListener('mousedown', handleMouseDown);
            svgElement.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleMouseDown, handleMouseMove, handleKeyDown]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previewLine) {
                previewLine.remove();
            }
        };
    }, [previewLine]);

    return null; // This component only manages event handlers
};
