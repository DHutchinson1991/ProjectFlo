import { VenueFloorPlan } from '../types/editor';
import { Wall, Room } from '../types/WallTypes';

// Floor plan data structure
export interface FloorPlanData {
    svgContent: string;
    walls: Wall[];
    rooms: Room[];
    metadata: {
        version: number;
        createdAt: string;
        updatedAt: string;
        updatedBy: number | null;
        gridScale: '1m' | '5m' | '10m';
        canvasSize: { width: number; height: number };
    };
    settings: {
        showRoomLabels: boolean;
        showRoomAreas: boolean;
        showRoomDimensions: boolean;
        showMeasurements: boolean;
        wallType: 'interior' | 'exterior';
    };
}

export class FloorPlanDataService {
    /**
     * Serialize floor plan data for saving
     */
    public static serializeFloorPlan(
        svgContent: string,
        walls: Wall[],
        rooms: Room[],
        settings: FloorPlanData['settings'],
        version: number,
        gridScale: '1m' | '5m' | '10m',
        updatedBy?: number
    ): VenueFloorPlan {
        const floorPlanData: FloorPlanData = {
            svgContent,
            walls,
            rooms,
            metadata: {
                version,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: updatedBy || null,
                gridScale,
                canvasSize: { width: 1200, height: 800 }
            },
            settings
        };

        return {
            venue_floor_plan_data: floorPlanData as unknown as Record<string, unknown>,
            venue_floor_plan_version: version,
            venue_floor_plan_updated_at: new Date().toISOString(),
            venue_floor_plan_updated_by: updatedBy || null
        };
    }

    /**
     * Deserialize floor plan data for loading
     */
    public static deserializeFloorPlan(venueFloorPlan: VenueFloorPlan): FloorPlanData | null {
        try {
            if (!venueFloorPlan.venue_floor_plan_data) {
                return null;
            }

            const data = venueFloorPlan.venue_floor_plan_data as unknown as FloorPlanData;

            // Validate required fields
            if (!data.svgContent || !data.metadata) {
                console.warn('Invalid floor plan data structure');
                return null;
            }

            // Provide defaults for missing fields
            return {
                svgContent: data.svgContent,
                walls: data.walls || [],
                rooms: data.rooms || [],
                metadata: {
                    version: data.metadata.version || venueFloorPlan.venue_floor_plan_version,
                    createdAt: data.metadata.createdAt || venueFloorPlan.venue_floor_plan_updated_at || new Date().toISOString(),
                    updatedAt: data.metadata.updatedAt || venueFloorPlan.venue_floor_plan_updated_at || new Date().toISOString(),
                    updatedBy: data.metadata.updatedBy || venueFloorPlan.venue_floor_plan_updated_by,
                    gridScale: data.metadata.gridScale || '1m',
                    canvasSize: data.metadata.canvasSize || { width: 1200, height: 800 }
                },
                settings: {
                    showRoomLabels: data.settings?.showRoomLabels ?? true,
                    showRoomAreas: data.settings?.showRoomAreas ?? true,
                    showRoomDimensions: data.settings?.showRoomDimensions ?? false,
                    showMeasurements: data.settings?.showMeasurements ?? true,
                    wallType: data.settings?.wallType || 'interior'
                }
            };
        } catch (error) {
            console.error('Error deserializing floor plan data:', error);
            return null;
        }
    }

    /**
     * Create empty floor plan data
     */
    public static createEmptyFloorPlan(version: number = 1): FloorPlanData {
        return {
            svgContent: '',
            walls: [],
            rooms: [],
            metadata: {
                version,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: null,
                gridScale: '1m',
                canvasSize: { width: 1200, height: 800 }
            },
            settings: {
                showRoomLabels: true,
                showRoomAreas: true,
                showRoomDimensions: false,
                showMeasurements: true,
                wallType: 'interior'
            }
        };
    }

    /**
     * Validate floor plan data
     */
    public static validateFloorPlanData(data: unknown): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!data || typeof data !== 'object') {
            errors.push('Floor plan data must be an object');
            return { valid: false, errors, warnings };
        }

        const floorPlan = data as Partial<FloorPlanData>;

        // Check required fields
        if (typeof floorPlan.svgContent !== 'string') {
            errors.push('SVG content must be a string');
        }

        if (!floorPlan.metadata) {
            errors.push('Metadata is required');
        } else {
            if (typeof floorPlan.metadata.version !== 'number') {
                warnings.push('Version should be a number');
            }
            if (typeof floorPlan.metadata.createdAt !== 'string') {
                warnings.push('Created date should be a string');
            }
        }

        // Check optional fields
        if (floorPlan.walls && !Array.isArray(floorPlan.walls)) {
            warnings.push('Walls should be an array');
        }

        if (floorPlan.rooms && !Array.isArray(floorPlan.rooms)) {
            warnings.push('Rooms should be an array');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Merge floor plan data (for version conflicts)
     */
    public static mergeFloorPlanData(
        base: FloorPlanData,
        changes: Partial<FloorPlanData>
    ): FloorPlanData {
        return {
            svgContent: changes.svgContent || base.svgContent,
            walls: changes.walls || base.walls,
            rooms: changes.rooms || base.rooms,
            metadata: {
                ...base.metadata,
                ...changes.metadata,
                updatedAt: new Date().toISOString()
            },
            settings: {
                ...base.settings,
                ...changes.settings
            }
        };
    }

    /**
     * Get floor plan statistics
     */
    public static getFloorPlanStats(data: FloorPlanData): {
        elementCount: number;
        wallCount: number;
        roomCount: number;
        totalArea: number;
        lastUpdated: string;
    } {
        // Count SVG elements (rough estimate)
        const elementCount = (data.svgContent.match(/<(rect|circle|line|path|polygon)/g) || []).length;

        // Calculate total room area
        const totalArea = data.rooms.reduce((sum, room) => sum + room.area, 0);

        return {
            elementCount,
            wallCount: data.walls.length,
            roomCount: data.rooms.length,
            totalArea,
            lastUpdated: data.metadata.updatedAt
        };
    }

    /**
     * Clone floor plan data (deep copy)
     */
    public static cloneFloorPlanData(data: FloorPlanData): FloorPlanData {
        return JSON.parse(JSON.stringify(data));
    }

    /**
     * Compare two floor plan versions
     */
    public static compareFloorPlans(plan1: FloorPlanData, plan2: FloorPlanData): {
        identical: boolean;
        differences: string[];
    } {
        const differences: string[] = [];

        if (plan1.svgContent !== plan2.svgContent) {
            differences.push('SVG content differs');
        }

        if (plan1.walls.length !== plan2.walls.length) {
            differences.push(`Wall count differs: ${plan1.walls.length} vs ${plan2.walls.length}`);
        }

        if (plan1.rooms.length !== plan2.rooms.length) {
            differences.push(`Room count differs: ${plan1.rooms.length} vs ${plan2.rooms.length}`);
        }

        if (plan1.metadata.gridScale !== plan2.metadata.gridScale) {
            differences.push(`Grid scale differs: ${plan1.metadata.gridScale} vs ${plan2.metadata.gridScale}`);
        }

        return {
            identical: differences.length === 0,
            differences
        };
    }
}
