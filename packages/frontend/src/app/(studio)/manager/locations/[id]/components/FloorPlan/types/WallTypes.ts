// Wall system types and interfaces for professional floor planning

export interface Point {
    x: number;
    y: number;
}

export interface Wall {
    id: string;
    startPoint: Point;
    endPoint: Point;
    thickness: number; // in inches
    type: 'interior' | 'exterior' | 'load-bearing';
    material: 'drywall' | 'brick' | 'concrete' | 'wood' | 'steel';
    height: number; // in feet (default 8 or 9)
    connectedWalls: string[]; // IDs of connected walls
    style: {
        color: string;
        fillColor: string;
        strokeWidth: number;
        opacity: number;
    };
    metadata: {
        layer: string;
        locked: boolean;
        visible: boolean;
        created: Date;
        modified: Date;
    };
}

export interface WallIntersection {
    point: Point;
    wallIds: string[];
    connectionType: 'T' | 'L' | 'X' | 'end';
}

export interface Room {
    id: string;
    name: string;
    type: RoomType;
    boundary: Point[];
    polygon: Point[]; // Alternative property name for compatibility
    label?: string;
    area: number; // in square feet
    perimeter: number; // in linear feet
    wallIds: string[];
    center: Point;
    dimensions: {
        width: number;
        length: number;
        minWidth: number;
        minLength: number;
    };
    complianceIssues?: string[];
    metadata: {
        layer: string;
        locked: boolean;
        visible: boolean;
        created: Date;
        modified: Date;
    };
}

export type RoomType =
    | 'bedroom'
    | 'bathroom'
    | 'kitchen'
    | 'living-room'
    | 'dining-room'
    | 'office'
    | 'closet'
    | 'hallway'
    | 'foyer'
    | 'laundry'
    | 'pantry'
    | 'garage'
    | 'basement'
    | 'attic'
    | 'utility'
    | 'patio'
    | 'deck'
    | 'balcony'
    | 'other';

export interface Door {
    id: string;
    wallId: string;
    positionOnWall: number; // 0-1 percentage along wall
    type: DoorType;
    width: number; // in inches
    height: number; // in inches (default 80")
    swingDirection: 'left' | 'right' | 'double' | 'sliding' | 'pocket' | 'bi-fold';
    opening: {
        x: number;
        y: number;
        angle: number;
    };
    metadata: {
        layer: string;
        locked: boolean;
        visible: boolean;
        created: Date;
        modified: Date;
    };
}

export type DoorType =
    | 'interior'
    | 'exterior'
    | 'french'
    | 'sliding'
    | 'pocket'
    | 'bi-fold'
    | 'double'
    | 'entry'
    | 'patio'
    | 'storm'
    | 'screen';

export interface Window {
    id: string;
    wallId: string;
    positionOnWall: number; // 0-1 percentage along wall
    type: WindowType;
    width: number; // in inches
    height: number; // in inches
    sillHeight: number; // inches from floor (default 36")
    opening: {
        x: number;
        y: number;
        angle: number;
    };
    metadata: {
        layer: string;
        locked: boolean;
        visible: boolean;
        created: Date;
        modified: Date;
    };
}

export type WindowType =
    | 'single-hung'
    | 'double-hung'
    | 'casement'
    | 'sliding'
    | 'awning'
    | 'hopper'
    | 'fixed'
    | 'picture'
    | 'bay'
    | 'bow'
    | 'skylight';

export interface Dimension {
    id: string;
    type: 'linear' | 'angular' | 'radial' | 'area';
    startPoint: Point;
    endPoint: Point;
    label: string;
    value: number;
    units: 'feet' | 'inches' | 'meters' | 'centimeters';
    style: {
        color: string;
        fontSize: number;
        arrowSize: number;
        textPosition: 'above' | 'below' | 'center';
    };
    metadata: {
        layer: string;
        locked: boolean;
        visible: boolean;
        created: Date;
        modified: Date;
    };
}

// Standard wall thicknesses (in inches)
export const WALL_THICKNESSES = {
    INTERIOR_STANDARD: 4.5, // 2x4 with drywall
    INTERIOR_THICK: 6.5,    // 2x6 with drywall
    EXTERIOR_STANDARD: 6,   // 2x4 with sheathing and siding
    EXTERIOR_THICK: 8,      // 2x6 with sheathing and siding
    LOAD_BEARING: 6.5,      // Minimum for load bearing
    FOUNDATION: 8,          // Concrete foundation
    PARTY_WALL: 8,          // Between units
} as const;

// Standard door sizes (in inches)
export const DOOR_SIZES = {
    INTERIOR: [24, 28, 30, 32, 36],
    EXTERIOR: [30, 32, 36, 42],
    DOUBLE: [48, 60, 72],
    FRENCH: [48, 60, 72, 96],
    SLIDING: [60, 72, 96, 120],
} as const;

// Standard window sizes (in inches)
export const WINDOW_SIZES = {
    SINGLE: { widths: [24, 30, 36, 42], heights: [36, 48, 60, 72] },
    DOUBLE: { widths: [48, 60, 72, 96], heights: [36, 48, 60, 72] },
    SLIDING: { widths: [60, 72, 96, 120], heights: [36, 48, 60] },
    PICTURE: { widths: [48, 60, 72, 96, 120], heights: [36, 48, 60, 72] },
} as const;

// Room type configurations with minimum sizes (building code requirements)
export const ROOM_CONFIGS: Record<RoomType, {
    minArea: number; // square feet
    minWidth: number; // feet
    minLength: number; // feet
    ceilingHeight: number; // feet
    requiredWindows: boolean;
    requiredVentilation: boolean;
    color: string;
}> = {
    'bedroom': {
        minArea: 70,
        minWidth: 7,
        minLength: 10,
        ceilingHeight: 8,
        requiredWindows: true,
        requiredVentilation: true,
        color: '#E3F2FD'
    },
    'bathroom': {
        minArea: 30,
        minWidth: 5,
        minLength: 6,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#F3E5F5'
    },
    'kitchen': {
        minArea: 50,
        minWidth: 6,
        minLength: 8,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#FFF3E0'
    },
    'living-room': {
        minArea: 120,
        minWidth: 10,
        minLength: 12,
        ceilingHeight: 8,
        requiredWindows: true,
        requiredVentilation: false,
        color: '#E8F5E8'
    },
    'dining-room': {
        minArea: 80,
        minWidth: 8,
        minLength: 10,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#FFF8E1'
    },
    'office': {
        minArea: 60,
        minWidth: 7,
        minLength: 8,
        ceilingHeight: 8,
        requiredWindows: true,
        requiredVentilation: false,
        color: '#F1F8E9'
    },
    'closet': {
        minArea: 6,
        minWidth: 2,
        minLength: 3,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#FAFAFA'
    },
    'hallway': {
        minArea: 20,
        minWidth: 3,
        minLength: 6,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#F5F5F5'
    },
    'foyer': {
        minArea: 25,
        minWidth: 4,
        minLength: 6,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#ECEFF1'
    },
    'laundry': {
        minArea: 35,
        minWidth: 5,
        minLength: 7,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#E0F2F1'
    },
    'pantry': {
        minArea: 12,
        minWidth: 3,
        minLength: 4,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#F9FBE7'
    },
    'garage': {
        minArea: 240,
        minWidth: 12,
        minLength: 20,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#EFEBE9'
    },
    'basement': {
        minArea: 50,
        minWidth: 7,
        minLength: 7,
        ceilingHeight: 7,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#EEEEEE'
    },
    'attic': {
        minArea: 30,
        minWidth: 5,
        minLength: 6,
        ceilingHeight: 6,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#F3E5F5'
    },
    'utility': {
        minArea: 20,
        minWidth: 4,
        minLength: 5,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: true,
        color: '#ECEFF1'
    },
    'patio': {
        minArea: 60,
        minWidth: 8,
        minLength: 8,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#E8F5E8'
    },
    'deck': {
        minArea: 40,
        minWidth: 6,
        minLength: 8,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#F1F8E9'
    },
    'balcony': {
        minArea: 15,
        minWidth: 3,
        minLength: 5,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#E0F2F1'
    },
    'other': {
        minArea: 10,
        minWidth: 3,
        minLength: 3,
        ceilingHeight: 8,
        requiredWindows: false,
        requiredVentilation: false,
        color: '#F5F5F5'
    }
};

// Utility functions for wall calculations
export class WallUtils {
    static calculateLength(wall: Wall): number {
        const dx = wall.endPoint.x - wall.startPoint.x;
        const dy = wall.endPoint.y - wall.startPoint.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static calculateAngle(wall: Wall): number {
        const dx = wall.endPoint.x - wall.startPoint.x;
        const dy = wall.endPoint.y - wall.startPoint.y;
        return Math.atan2(dy, dx);
    }

    static getWallMidpoint(wall: Wall): Point {
        return {
            x: (wall.startPoint.x + wall.endPoint.x) / 2,
            y: (wall.startPoint.y + wall.endPoint.y) / 2
        };
    }

    static getPerpendicularOffset(wall: Wall, distance: number): { p1: Point, p2: Point } {
        const angle = this.calculateAngle(wall);
        const perpAngle = angle + Math.PI / 2;
        const offsetX = Math.cos(perpAngle) * distance;
        const offsetY = Math.sin(perpAngle) * distance;

        return {
            p1: {
                x: wall.startPoint.x + offsetX,
                y: wall.startPoint.y + offsetY
            },
            p2: {
                x: wall.endPoint.x + offsetX,
                y: wall.endPoint.y + offsetY
            }
        };
    }

    static findWallIntersections(walls: Wall[]): WallIntersection[] {
        const intersections: WallIntersection[] = [];

        for (let i = 0; i < walls.length; i++) {
            for (let j = i + 1; j < walls.length; j++) {
                const intersection = this.calculateWallIntersection(walls[i], walls[j]);
                if (intersection) {
                    intersections.push(intersection);
                }
            }
        }

        return intersections;
    }

    private static calculateWallIntersection(wall1: Wall, wall2: Wall): WallIntersection | null {
        // Line intersection algorithm
        const x1 = wall1.startPoint.x, y1 = wall1.startPoint.y;
        const x2 = wall1.endPoint.x, y2 = wall1.endPoint.y;
        const x3 = wall2.startPoint.x, y3 = wall2.startPoint.y;
        const x4 = wall2.endPoint.x, y4 = wall2.endPoint.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null; // Parallel lines

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            const intersectionPoint: Point = {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };

            // Determine connection type
            let connectionType: 'T' | 'L' | 'X' | 'end' = 'X';
            if (t === 0 || t === 1 || u === 0 || u === 1) {
                connectionType = 'end';
            } else if (t === 0 || t === 1) {
                connectionType = 'T';
            } else if (u === 0 || u === 1) {
                connectionType = 'T';
            } else {
                connectionType = 'L';
            }

            return {
                point: intersectionPoint,
                wallIds: [wall1.id, wall2.id],
                connectionType
            };
        }

        return null;
    }

    static convertPixelsToFeet(pixels: number, scale: number = 20): number {
        // Default scale: 20 pixels = 1 foot
        return pixels / scale;
    }

    static convertFeetToPixels(feet: number, scale: number = 20): number {
        // Default scale: 20 pixels = 1 foot
        return feet * scale;
    }

    static convertInchesToPixels(inches: number, scale: number = 20): number {
        // Convert inches to feet, then to pixels
        return (inches / 12) * scale;
    }

    static snapToGrid(point: Point, gridSize: number): Point {
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    }

    static snapToWallEndpoint(point: Point, walls: Wall[], snapDistance: number = 10): Point | null {
        for (const wall of walls) {
            const distToStart = this.distance(point, wall.startPoint);
            const distToEnd = this.distance(point, wall.endPoint);

            if (distToStart <= snapDistance) {
                return wall.startPoint;
            }
            if (distToEnd <= snapDistance) {
                return wall.endPoint;
            }
        }
        return null;
    }

    private static distance(p1: Point, p2: Point): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static pixelsToMeters(pixels: number, scale: number = 20): number {
        // Convert pixels to feet first, then to meters
        const feet = this.convertPixelsToFeet(pixels, scale);
        return feet * 0.3048; // 1 foot = 0.3048 meters
    }

    static calculatePolygonArea(polygon: Point[]): number {
        if (polygon.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            area += polygon[i].x * polygon[j].y;
            area -= polygon[j].x * polygon[i].y;
        }
        return Math.abs(area) / 2;
    }

    static calculatePolygonPerimeter(polygon: Point[]): number {
        if (polygon.length < 2) return 0;

        let perimeter = 0;
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            perimeter += this.distance(polygon[i], polygon[j]);
        }
        return perimeter;
    }

    static checkRoomCompliance(room: {
        type: RoomType;
        area: number;
        dimensions: { width: number; length: number; };
    }): string[] {
        const issues: string[] = [];
        const config = ROOM_CONFIGS[room.type];

        if (!config) {
            issues.push(`Unknown room type: ${room.type}`);
            return issues;
        }

        if (room.area < config.minArea) {
            issues.push(`Room area (${room.area.toFixed(1)} sq ft) is below minimum (${config.minArea} sq ft)`);
        }

        if (room.dimensions.width < config.minWidth) {
            issues.push(`Room width (${room.dimensions.width.toFixed(1)} ft) is below minimum (${config.minWidth} ft)`);
        }

        if (room.dimensions.length < config.minLength) {
            issues.push(`Room length (${room.dimensions.length.toFixed(1)} ft) is below minimum (${config.minLength} ft)`);
        }

        return issues;
    }
}
