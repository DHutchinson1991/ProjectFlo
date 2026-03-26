// Professional Room Detection Algorithm
// Automatically detects enclosed spaces from wall layouts

import { Wall, Room, Point, WallUtils, RoomType } from '../../../../types/floor-plan/WallTypes';

export class RoomDetector {
    private readonly SNAP_TOLERANCE = 5; // pixels
    private readonly MIN_ROOM_AREA = 1; // square meters

    /**
     * Detect rooms from a collection of walls
     */
    detectRooms(walls: Wall[]): Room[] {
        if (walls.length < 3) return [];

        const rooms: Room[] = [];
        const processedPolygons = new Set<string>();

        // Create a graph of wall connections
        const wallGraph = this.buildWallGraph(walls);

        // Find all closed polygons
        const polygons = this.findClosedPolygons(wallGraph, walls);

        polygons.forEach((polygon, index) => {
            // Create a unique key for this polygon
            const polygonKey = this.getPolygonKey(polygon);

            if (processedPolygons.has(polygonKey)) return;
            processedPolygons.add(polygonKey);

            // Calculate room properties
            const area = WallUtils.pixelsToMeters(WallUtils.calculatePolygonArea(polygon));
            const perimeter = WallUtils.pixelsToMeters(WallUtils.calculatePolygonPerimeter(polygon));

            // Filter out very small areas (likely errors)
            if (area < this.MIN_ROOM_AREA) return;

            // Determine room type based on area
            const roomType = this.determineRoomType(area);

            // Get walls that form this room
            const roomWallIds = this.getWallsForRoom(polygon, walls);

            // Check compliance - pass the room properties that match the expected structure
            const complianceIssues = WallUtils.checkRoomCompliance({
                type: roomType as RoomType,
                area,
                dimensions: this.calculateRoomDimensions(polygon)
            });

            const room: Room = {
                id: `room_${index}`,
                name: this.generateRoomLabel(roomType, index),
                type: roomType as RoomType,
                boundary: polygon,
                polygon: polygon, // For compatibility
                label: this.generateRoomLabel(roomType, index),
                area: WallUtils.convertPixelsToFeet(area), // Convert to square feet
                perimeter: WallUtils.convertPixelsToFeet(perimeter), // Convert to linear feet
                wallIds: roomWallIds,
                center: this.getPolygonCenter(polygon),
                dimensions: this.calculateRoomDimensions(polygon),
                complianceIssues,
                metadata: {
                    layer: 'rooms',
                    locked: false,
                    visible: true,
                    created: new Date(),
                    modified: new Date()
                }
            };

            rooms.push(room);
        });

        return rooms;
    }

    /**
     * Build a graph of wall connections
     */
    private buildWallGraph(walls: Wall[]): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        // Initialize graph nodes
        walls.forEach(wall => {
            const startKey = `${wall.startPoint.x},${wall.startPoint.y}`;
            const endKey = `${wall.endPoint.x},${wall.endPoint.y}`;

            if (!graph.has(startKey)) graph.set(startKey, []);
            if (!graph.has(endKey)) graph.set(endKey, []);

            graph.get(startKey)!.push(endKey);
            graph.get(endKey)!.push(startKey);
        });

        return graph;
    }

    /**
     * Find all closed polygons in the wall graph
     */
    private findClosedPolygons(graph: Map<string, string[]>, walls: Wall[]): Point[][] {
        const polygons: Point[][] = [];
        const visited = new Set<string>();

        // Convert walls to point connections for easier traversal
        const pointConnections = new Map<string, Point[]>();

        walls.forEach(wall => {
            const startKey = `${wall.startPoint.x},${wall.startPoint.y}`;
            const endKey = `${wall.endPoint.x},${wall.endPoint.y}`;

            if (!pointConnections.has(startKey)) {
                pointConnections.set(startKey, []);
            }
            if (!pointConnections.has(endKey)) {
                pointConnections.set(endKey, []);
            }

            pointConnections.get(startKey)!.push(wall.endPoint);
            pointConnections.get(endKey)!.push(wall.startPoint);
        });

        // Try to find cycles from each unvisited point
        for (const [startKey, connections] of pointConnections) {
            if (visited.has(startKey)) continue;

            const startPoint = this.parsePointKey(startKey);

            // Try each connection as a potential cycle
            for (const firstConnection of connections) {
                const polygon = this.findCycle(startPoint, firstConnection, pointConnections, new Set());

                if (polygon && polygon.length >= 3) {
                    // Check if this is a valid room polygon
                    if (this.isValidRoomPolygon(polygon)) {
                        polygons.push(polygon);

                        // Mark all points in this polygon as visited
                        polygon.forEach(point => {
                            visited.add(`${point.x},${point.y}`);
                        });
                    }
                }
            }
        }

        return polygons;
    }

    /**
     * Find a cycle starting from a given point
     */
    private findCycle(
        startPoint: Point,
        currentPoint: Point,
        connections: Map<string, Point[]>,
        visited: Set<string>
    ): Point[] | null {
        const path = [startPoint];
        const current = currentPoint;
        const visitedInPath = new Set([`${startPoint.x},${startPoint.y}`]);

        let steps = 0;
        const maxSteps = 20; // Prevent infinite loops

        while (steps < maxSteps) {
            steps++;

            const currentKey = `${current.x},${current.y}`;

            // If we've returned to start, we have a cycle
            if (this.pointsEqual(current, startPoint) && path.length > 2) {
                return path;
            }

            // If we've visited this point in this path, it's not a valid cycle to start
            if (visitedInPath.has(currentKey)) {
                return null;
            }

            visitedInPath.add(currentKey);
            path.push(current);

            // Get next connections
            const nextConnections = connections.get(currentKey) || [];

            // Filter out the previous point and already visited points
            const validNext = nextConnections.filter(next => {
                const nextKey = `${next.x},${next.y}`;
                return !visitedInPath.has(nextKey) || this.pointsEqual(next, startPoint);
            });

            if (validNext.length === 0) {
                return null; // Dead end
            }

            // Choose the next point (prefer the one that might close the loop)
            const nextPoint = validNext.find(p => this.pointsEqual(p, startPoint)) || validNext[0];

            // Update current for next iteration
            Object.assign(current, nextPoint);
        }

        return null;
    }

    /**
     * Check if a polygon represents a valid room
     */
    private isValidRoomPolygon(polygon: Point[]): boolean {
        if (polygon.length < 3) return false;

        const area = WallUtils.calculatePolygonArea(polygon);
        const areaInMeters = WallUtils.pixelsToMeters(area);

        return areaInMeters >= this.MIN_ROOM_AREA;
    }

    /**
     * Get walls that form the boundary of a room
     */
    private getWallsForRoom(polygon: Point[], walls: Wall[]): string[] {
        const roomWallIds: string[] = [];

        for (let i = 0; i < polygon.length; i++) {
            const start = polygon[i];
            const end = polygon[(i + 1) % polygon.length];

            // Find the wall that connects these two points
            const wall = walls.find(w =>
                (this.pointsEqual(w.startPoint, start) && this.pointsEqual(w.endPoint, end)) ||
                (this.pointsEqual(w.startPoint, end) && this.pointsEqual(w.endPoint, start))
            );

            if (wall) {
                roomWallIds.push(wall.id);
            }
        }

        return roomWallIds;
    }

    /**
     * Determine room type based on area
     */
    private determineRoomType(areaInMeters: number): string {
        if (areaInMeters < 5) return 'closet';
        if (areaInMeters < 10) return 'bathroom';
        if (areaInMeters < 15) return 'bedroom';
        if (areaInMeters < 25) return 'office';
        if (areaInMeters < 40) return 'living';
        return 'ballroom';
    }

    /**
     * Generate a room label
     */
    private generateRoomLabel(type: string, index: number): string {
        const typeNames: Record<string, string> = {
            closet: 'Closet',
            bathroom: 'Bathroom',
            bedroom: 'Bedroom',
            office: 'Office',
            living: 'Living Room',
            ballroom: 'Ballroom'
        };

        const name = typeNames[type] || 'Room';
        return `${name} ${index + 1}`;
    }

    /**
     * Create a unique key for a polygon
     */
    private getPolygonKey(polygon: Point[]): string {
        const sortedPoints = polygon
            .map(p => `${Math.round(p.x)},${Math.round(p.y)}`)
            .sort();
        return sortedPoints.join('|');
    }

    /**
     * Parse a point key back to a Point object
     */
    private parsePointKey(key: string): Point {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }

    /**
     * Check if two points are equal within tolerance
     */
    private pointsEqual(p1: Point, p2: Point): boolean {
        return (
            Math.abs(p1.x - p2.x) < this.SNAP_TOLERANCE &&
            Math.abs(p1.y - p2.y) < this.SNAP_TOLERANCE
        );
    }

    /**
     * Update room detection after wall changes
     */
    updateRooms(walls: Wall[], existingRooms: Room[]): Room[] {
        // Re-detect all rooms
        const newRooms = this.detectRooms(walls);

        // Try to preserve existing room labels and types where possible
        return newRooms.map((newRoom, index) => {
            // Find a matching existing room based on similar area and position
            const matchingRoom = existingRooms.find(existing => {
                const areaDiff = Math.abs(existing.area - newRoom.area);
                const center1 = this.getPolygonCenter(existing.polygon);
                const center2 = this.getPolygonCenter(newRoom.polygon);
                const distanceFromCenter = Math.sqrt(
                    Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
                );

                return areaDiff < 5 && distanceFromCenter < 50; // 5m² area diff, 50px center diff
            });

            if (matchingRoom) {
                return {
                    ...newRoom,
                    id: matchingRoom.id,
                    label: matchingRoom.label,
                    type: matchingRoom.type
                };
            }

            return newRoom;
        });
    }

    /**
     * Get the center point of a polygon
     */
    private getPolygonCenter(polygon: Point[]): Point {
        const sum = polygon.reduce(
            (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
            { x: 0, y: 0 }
        );

        return {
            x: sum.x / polygon.length,
            y: sum.y / polygon.length
        };
    }

    /**
     * Get room statistics
     */
    getRoomStatistics(rooms: Room[]): {
        totalCount: number;
        totalArea: number;
        averageArea: number;
        roomTypes: Record<string, number>;
        complianceIssuesCount: number;
    } {
        const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);
        const roomTypes: Record<string, number> = {};
        let complianceIssuesCount = 0;

        rooms.forEach(room => {
            roomTypes[room.type] = (roomTypes[room.type] || 0) + 1;
            complianceIssuesCount += (room.complianceIssues?.length || 0);
        });

        return {
            totalCount: rooms.length,
            totalArea,
            averageArea: totalArea / rooms.length || 0,
            roomTypes,
            complianceIssuesCount
        };
    }

    /**
     * Calculate room dimensions from polygon
     */
    private calculateRoomDimensions(polygon: Point[]): { width: number; length: number; minWidth: number; minLength: number; } {
        if (polygon.length < 3) {
            return { width: 0, length: 0, minWidth: 0, minLength: 0 };
        }

        // Find bounding box
        let minX = polygon[0].x;
        let maxX = polygon[0].x;
        let minY = polygon[0].y;
        let maxY = polygon[0].y;

        polygon.forEach(point => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        });

        const width = WallUtils.convertPixelsToFeet(maxX - minX);
        const length = WallUtils.convertPixelsToFeet(maxY - minY);

        return {
            width,
            length,
            minWidth: width,
            minLength: length
        };
    }
}
