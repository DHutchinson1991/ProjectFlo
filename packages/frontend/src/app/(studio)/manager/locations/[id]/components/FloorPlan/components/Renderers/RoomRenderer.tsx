import React, { useEffect, useCallback } from 'react';
import { Svg } from '@svgdotjs/svg.js';
import { Room } from '../../types/WallTypes';

interface RoomRendererProps {
    svgDrawing: React.MutableRefObject<Svg | null>;
    rooms: Room[];
    selectedRoomId?: string;
    showRoomLabels: boolean;
    showRoomAreas: boolean;
    showRoomDimensions: boolean;
    onRoomSelected: (roomId: string) => void;
    onRoomDeselected: () => void;
    onRoomUpdated?: (room: Room) => void;
    onRoomDeleted?: (roomId: string) => void;
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({
    svgDrawing,
    rooms,
    showRoomLabels,
    showRoomAreas,
    showRoomDimensions,
    onRoomSelected
}) => {
    // Detect rooms automatically when walls change
    const renderRooms = useCallback(() => {
        if (!svgDrawing.current || rooms.length === 0) return;

        // Use rooms directly instead of detecting from walls
        const detectedRooms = rooms;

        if (!svgDrawing.current) return;

        // Clear existing room visualizations
        const existingRooms = svgDrawing.current.find('.room-element');
        existingRooms.forEach((room) => room.remove());

        // Render detected rooms
        detectedRooms.forEach((room) => {
            const polygon = room.polygon || room.boundary;
            if (!polygon || polygon.length < 3 || !svgDrawing.current) return;

            // Create room polygon
            const pathData = polygon.map((point: { x: number; y: number }, index: number) =>
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ') + ' Z';

            // Create room overlay group
            const roomGroup = svgDrawing.current.group()
                .addClass('room-overlay')
                .data('room-id', room.id);

            // Room fill
            const roomPath = roomGroup.path(pathData)
                .fill(getRoomFillColor(room.type))
                .opacity(0.2)
                .stroke('none')
                .addClass('room-fill');

            // Room outline
            roomGroup.path(pathData)
                .fill('none')
                .stroke(getRoomStrokeColor(room.type))
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .addClass('room-outline');

            // Add room label if enabled
            if (showRoomLabels) {
                const center = calculatePolygonCenter(polygon);
                const labelGroup = roomGroup.group().addClass('room-label');

                // Background for label
                labelGroup.rect()
                    .width(100)
                    .height(40)
                    .x(center.x - 50)
                    .y(center.y - 20)
                    .fill('white')
                    .stroke('#666')
                    .attr('stroke-width', 1)
                    .attr('rx', 4);

                // Room name
                labelGroup.text(room.label || room.name)
                    .x(center.x)
                    .y(center.y - 5)
                    .font({ size: 12, weight: 'bold' })
                    .fill('#333')
                    .attr('text-anchor', 'middle');

                // Room area if enabled
                if (showRoomAreas) {
                    labelGroup.text(`${room.area.toFixed(1)} m²`)
                        .x(center.x)
                        .y(center.y + 10)
                        .font({ size: 10 })
                        .fill('#666')
                        .attr('text-anchor', 'middle');
                }
            }

            // Add dimensions if enabled
            if (showRoomDimensions) {
                addRoomDimensions(roomGroup, room);
            }

            // Add interaction handlers
            roomPath
                .attr('cursor', 'pointer')
                .on('click', () => onRoomSelected(room.id))
                .on('mouseover', () => {
                    roomPath.opacity(0.4);
                })
                .on('mouseout', () => {
                    roomPath.opacity(0.2);
                });
        });

    }, [rooms, showRoomLabels, showRoomAreas, showRoomDimensions, onRoomSelected]);

    // Re-render rooms when dependencies change
    useEffect(() => {
        renderRooms();
    }, [renderRooms]);

    // Helper functions
    const getRoomFillColor = (roomType: string): string => {
        const colors: Record<string, string> = {
            'living': '#4CAF50',
            'bedroom': '#2196F3',
            'bathroom': '#9C27B0',
            'kitchen': '#FF9800',
            'office': '#607D8B',
            'closet': '#795548',
            'ballroom': '#E91E63',
            'default': '#9E9E9E'
        };
        return colors[roomType] || colors.default;
    };

    const getRoomStrokeColor = (roomType: string): string => {
        const colors: Record<string, string> = {
            'living': '#388E3C',
            'bedroom': '#1976D2',
            'bathroom': '#7B1FA2',
            'kitchen': '#F57C00',
            'office': '#455A64',
            'closet': '#5D4037',
            'ballroom': '#C2185B',
            'default': '#616161'
        };
        return colors[roomType] || colors.default;
    };

    const calculatePolygonCenter = (polygon: { x: number; y: number }[]): { x: number; y: number } => {
        const sum = polygon.reduce(
            (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
            { x: 0, y: 0 }
        );
        return {
            x: sum.x / polygon.length,
            y: sum.y / polygon.length
        };
    };

    // Helper function to suppress ESLint for SVG.js methods that don't have proper types  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addRoomDimensions = (roomGroup: any, room: Room) => {
        // Add dimension lines for each side of the room
        const polygon = room.polygon || room.boundary;
        if (!polygon) return;

        polygon.forEach((point: { x: number; y: number }, index: number) => {
            const nextPoint = polygon[(index + 1) % polygon.length];
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;

            // Calculate distance in meters
            const distance = Math.sqrt(
                Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
            ) / 20; // Assuming 20px = 1m

            // Add dimension text
            roomGroup.text(`${distance.toFixed(1)}m`)
                .x(midX)
                .y(midY)
                .font({ size: 10 })
                .fill('#333')
                .attr('text-anchor', 'middle')
                .addClass('room-dimension');
        });
    };

    // Public methods for external control
    const highlightRoom = useCallback((roomId: string) => {
        if (!svgDrawing.current) return;

        const drawing = svgDrawing.current;
        const roomOverlay = drawing.find(`[data-room-id="${roomId}"]`);

        roomOverlay.forEach((element) => {
            const fill = element.findOne('.room-fill');
            if (fill) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (fill as any).opacity(0.6); // SVG.js opacity method not in types
            }
        });
    }, []);

    const unhighlightRoom = useCallback((roomId: string) => {
        if (!svgDrawing.current) return;

        const drawing = svgDrawing.current;
        const roomOverlay = drawing.find(`[data-room-id="${roomId}"]`);

        roomOverlay.forEach((element) => {
            const fill = element.findOne('.room-fill');
            if (fill) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (fill as any).opacity(0.2);
            }
        });
    }, []);

    const clearRoomHighlights = useCallback(() => {
        if (!svgDrawing.current) return;

        const drawing = svgDrawing.current;
        const roomFills = drawing.find('.room-fill');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roomFills.forEach((fill: any) => {
            fill.opacity(0.2);
        });
    }, []);

    // Expose methods via ref
    React.useImperativeHandle(React.createRef(), () => ({
        highlightRoom,
        unhighlightRoom,
        clearRoomHighlights,
        renderRooms
    }));

    return null; // This component only manages SVG rendering
};
