import { GridService, GridPoint } from './GridService';

export interface Measurement {
    id: string;
    startPoint: GridPoint;
    endPoint: GridPoint;
    pixelDistance: number;
    realDistance: { value: number; unit: string };
    label: string;
    angle: number; // in degrees
}

export interface ElementDimensions {
    width: { pixel: number; real: { value: number; unit: string } };
    height: { pixel: number; real: { value: number; unit: string } };
    area: { value: number; unit: string };
    perimeter: { value: number; unit: string };
}

export class MeasurementService {
    /**
     * Create a measurement between two points
     */
    public static createMeasurement(
        startPoint: GridPoint,
        endPoint: GridPoint,
        gridScale: '1m' | '5m' | '10m',
        id?: string
    ): Measurement {
        const pixelDistance = GridService.distance(startPoint, endPoint);
        const realDistance = GridService.calculateRealDistance(pixelDistance, gridScale);
        const angle = this.calculateAngle(startPoint, endPoint);

        return {
            id: id || this.generateMeasurementId(),
            startPoint,
            endPoint,
            pixelDistance,
            realDistance,
            label: `${realDistance.value}${realDistance.unit}`,
            angle
        };
    }

    /**
     * Calculate angle between two points (in degrees)
     */
    public static calculateAngle(point1: GridPoint, point2: GridPoint): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const radians = Math.atan2(dy, dx);
        const degrees = radians * (180 / Math.PI);
        return degrees < 0 ? degrees + 360 : degrees;
    }

    /**
     * Calculate element dimensions
     */
    public static calculateElementDimensions(
        element: { x: number; y: number; width: number; height: number },
        gridScale: '1m' | '5m' | '10m'
    ): ElementDimensions {
        const realWidth = GridService.calculateRealDistance(element.width, gridScale);
        const realHeight = GridService.calculateRealDistance(element.height, gridScale);
        const area = GridService.calculateArea(element.width, element.height, gridScale);

        // Calculate perimeter
        const perimeter = 2 * (element.width + element.height);
        const realPerimeter = GridService.calculateRealDistance(perimeter, gridScale);

        return {
            width: { pixel: element.width, real: realWidth },
            height: { pixel: element.height, real: realHeight },
            area,
            perimeter: realPerimeter
        };
    }

    /**
     * Calculate circle dimensions
     */
    public static calculateCircleDimensions(
        circle: { x: number; y: number; radius: number },
        gridScale: '1m' | '5m' | '10m'
    ): {
        radius: { pixel: number; real: { value: number; unit: string } };
        diameter: { pixel: number; real: { value: number; unit: string } };
        area: { value: number; unit: string };
        circumference: { value: number; unit: string };
    } {
        const realRadius = GridService.calculateRealDistance(circle.radius, gridScale);
        const realDiameter = GridService.calculateRealDistance(circle.radius * 2, gridScale);

        // Calculate area (π * r²)
        const pixelArea = Math.PI * circle.radius * circle.radius;
        const area = GridService.calculateArea(Math.sqrt(pixelArea), Math.sqrt(pixelArea), gridScale);

        // Calculate circumference (2 * π * r)
        const pixelCircumference = 2 * Math.PI * circle.radius;
        const circumference = GridService.calculateRealDistance(pixelCircumference, gridScale);

        return {
            radius: { pixel: circle.radius, real: realRadius },
            diameter: { pixel: circle.radius * 2, real: realDiameter },
            area,
            circumference
        };
    }

    /**
     * Calculate wall length and properties
     */
    public static calculateWallMeasurements(
        wall: { startPoint: GridPoint; endPoint: GridPoint; thickness: number },
        gridScale: '1m' | '5m' | '10m'
    ): {
        length: { pixel: number; real: { value: number; unit: string } };
        thickness: { pixel: number; real: { value: number; unit: string } };
        area: { value: number; unit: string };
        angle: number;
    } {
        const pixelLength = GridService.distance(wall.startPoint, wall.endPoint);
        const realLength = GridService.calculateRealDistance(pixelLength, gridScale);
        const realThickness = GridService.calculateRealDistance(wall.thickness, gridScale);
        const area = GridService.calculateArea(pixelLength, wall.thickness, gridScale);
        const angle = this.calculateAngle(wall.startPoint, wall.endPoint);

        return {
            length: { pixel: pixelLength, real: realLength },
            thickness: { pixel: wall.thickness, real: realThickness },
            area,
            angle
        };
    }

    /**
     * Format measurement for display
     */
    public static formatMeasurement(
        value: number,
        unit: string,
        precision: number = 2
    ): string {
        if (unit === 'cm' && value >= 100) {
            // Convert large cm values to meters
            const meters = value / 100;
            return `${meters.toFixed(precision)}m`;
        }

        if (unit === 'm' && value < 1) {
            // Convert small meter values to centimeters
            const centimeters = value * 100;
            return `${Math.round(centimeters)}cm`;
        }

        return `${value.toFixed(precision)}${unit}`;
    }

    /**
     * Generate unique measurement ID
     */
    public static generateMeasurementId(): string {
        return `measurement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate center point of measurement
     */
    public static getMeasurementCenter(measurement: Measurement): GridPoint {
        return {
            x: (measurement.startPoint.x + measurement.endPoint.x) / 2,
            y: (measurement.startPoint.y + measurement.endPoint.y) / 2
        };
    }

    /**
     * Check if measurement is horizontal, vertical, or diagonal
     */
    public static getMeasurementOrientation(measurement: Measurement): 'horizontal' | 'vertical' | 'diagonal' {
        const angle = measurement.angle;
        const tolerance = 5; // degrees

        if (Math.abs(angle) <= tolerance || Math.abs(angle - 180) <= tolerance) {
            return 'horizontal';
        } else if (Math.abs(angle - 90) <= tolerance || Math.abs(angle - 270) <= tolerance) {
            return 'vertical';
        } else {
            return 'diagonal';
        }
    }

    /**
     * Calculate measurement label position
     */
    public static calculateLabelPosition(
        measurement: Measurement,
        offset: number = 20
    ): { x: number; y: number; rotation: number } {
        const center = this.getMeasurementCenter(measurement);
        const angle = measurement.angle;
        const radians = angle * (Math.PI / 180);

        // Calculate perpendicular offset
        const offsetX = -Math.sin(radians) * offset;
        const offsetY = Math.cos(radians) * offset;

        // Adjust rotation for readability
        let rotation = angle;
        if (angle > 90 && angle < 270) {
            rotation = angle + 180; // Flip text to avoid upside-down reading
        }

        return {
            x: center.x + offsetX,
            y: center.y + offsetY,
            rotation
        };
    }

    /**
     * Get measurement color based on type
     */
    public static getMeasurementColor(
        measurement: Measurement,
        type: 'wall' | 'element' | 'room' | 'general' = 'general'
    ): string {
        const colors = {
            wall: '#FF5722',      // Red-orange for walls
            element: '#2196F3',   // Blue for elements
            room: '#4CAF50',      // Green for rooms
            general: '#9E9E9E'    // Gray for general measurements
        };

        return colors[type];
    }

    /**
     * Convert measurement to different units
     */
    public static convertUnits(
        value: number,
        fromUnit: 'm' | 'cm' | 'ft' | 'in',
        toUnit: 'm' | 'cm' | 'ft' | 'in'
    ): number {
        // Convert to meters first
        let meters: number;
        switch (fromUnit) {
            case 'm':
                meters = value;
                break;
            case 'cm':
                meters = value / 100;
                break;
            case 'ft':
                meters = value * 0.3048;
                break;
            case 'in':
                meters = value * 0.0254;
                break;
        }

        // Convert from meters to target unit
        switch (toUnit) {
            case 'm':
                return meters;
            case 'cm':
                return meters * 100;
            case 'ft':
                return meters / 0.3048;
            case 'in':
                return meters / 0.0254;
        }
    }

    /**
     * Validate measurement
     */
    public static validateMeasurement(measurement: Measurement): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (measurement.pixelDistance <= 0) {
            errors.push('Measurement distance must be positive');
        }

        if (!measurement.id || measurement.id.trim() === '') {
            errors.push('Measurement must have a valid ID');
        }

        if (!measurement.startPoint || !measurement.endPoint) {
            errors.push('Measurement must have valid start and end points');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
