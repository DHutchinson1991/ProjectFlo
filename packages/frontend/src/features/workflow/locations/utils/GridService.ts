import { GRID_SIZES } from '../constants/dimensions';

export interface GridPoint {
    x: number;
    y: number;
}

export interface GridBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export class GridService {
    /**
     * Get grid size in pixels for a given scale
     */
    public static getGridSize(scale: '1m' | '5m' | '10m'): number {
        return GRID_SIZES[scale];
    }

    /**
     * Snap a point to the nearest grid intersection
     */
    public static snapToGrid(point: GridPoint, gridSize: number): GridPoint {
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    }

    /**
     * Snap a point to grid with custom offset
     */
    public static snapToGridWithOffset(
        point: GridPoint,
        gridSize: number,
        offset: GridPoint = { x: 0, y: 0 }
    ): GridPoint {
        return {
            x: Math.round((point.x - offset.x) / gridSize) * gridSize + offset.x,
            y: Math.round((point.y - offset.y) / gridSize) * gridSize + offset.y
        };
    }

    /**
     * Check if a point is on the grid
     */
    public static isOnGrid(point: GridPoint, gridSize: number, tolerance: number = 1): boolean {
        const snapped = this.snapToGrid(point, gridSize);
        return Math.abs(point.x - snapped.x) <= tolerance &&
            Math.abs(point.y - snapped.y) <= tolerance;
    }

    /**
     * Get the nearest grid lines to a point
     */
    public static getNearestGridLines(point: GridPoint, gridSize: number): {
        vertical: number[];
        horizontal: number[];
    } {
        const gridX = Math.floor(point.x / gridSize) * gridSize;
        const gridY = Math.floor(point.y / gridSize) * gridSize;

        return {
            vertical: [gridX, gridX + gridSize],
            horizontal: [gridY, gridY + gridSize]
        };
    }

    /**
     * Calculate distance between two points
     */
    public static distance(point1: GridPoint, point2: GridPoint): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate real-world distance based on grid scale
     */
    public static calculateRealDistance(
        pixelDistance: number,
        gridScale: '1m' | '5m' | '10m'
    ): { value: number; unit: string } {
        const gridSize = this.getGridSize(gridScale);
        const scaleValue = parseInt(gridScale.replace('m', ''));
        const realDistance = (pixelDistance / gridSize) * scaleValue;

        // Return appropriate unit
        if (realDistance >= 1) {
            return { value: Math.round(realDistance * 100) / 100, unit: 'm' };
        } else {
            return { value: Math.round(realDistance * 100), unit: 'cm' };
        }
    }

    /**
     * Convert real-world measurement to pixels
     */
    public static realToPixels(
        realValue: number,
        unit: 'm' | 'cm' | 'ft' | 'in',
        gridScale: '1m' | '5m' | '10m'
    ): number {
        const gridSize = this.getGridSize(gridScale);
        const scaleValue = parseInt(gridScale.replace('m', ''));

        // Convert to meters first
        let meters: number;
        switch (unit) {
            case 'm':
                meters = realValue;
                break;
            case 'cm':
                meters = realValue / 100;
                break;
            case 'ft':
                meters = realValue * 0.3048;
                break;
            case 'in':
                meters = realValue * 0.0254;
                break;
        }

        return (meters / scaleValue) * gridSize;
    }

    /**
     * Get grid bounds for a given area
     */
    public static getGridBounds(
        topLeft: GridPoint,
        bottomRight: GridPoint,
        gridSize: number
    ): GridBounds {
        const minX = Math.floor(topLeft.x / gridSize) * gridSize;
        const minY = Math.floor(topLeft.y / gridSize) * gridSize;
        const maxX = Math.ceil(bottomRight.x / gridSize) * gridSize;
        const maxY = Math.ceil(bottomRight.y / gridSize) * gridSize;

        return { minX, minY, maxX, maxY };
    }

    /**
     * Generate grid points within bounds
     */
    public static generateGridPoints(bounds: GridBounds, gridSize: number): GridPoint[] {
        const points: GridPoint[] = [];

        for (let x = bounds.minX; x <= bounds.maxX; x += gridSize) {
            for (let y = bounds.minY; y <= bounds.maxY; y += gridSize) {
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Find closest grid point to a given point
     */
    public static findClosestGridPoint(
        target: GridPoint,
        gridPoints: GridPoint[]
    ): GridPoint | null {
        if (gridPoints.length === 0) return null;

        let closest = gridPoints[0];
        let minDistance = this.distance(target, closest);

        for (const point of gridPoints) {
            const distance = this.distance(target, point);
            if (distance < minDistance) {
                minDistance = distance;
                closest = point;
            }
        }

        return closest;
    }

    /**
     * Check if two rectangles overlap on grid
     */
    public static rectanglesOverlap(
        rect1: { x: number; y: number; width: number; height: number },
        rect2: { x: number; y: number; width: number; height: number }
    ): boolean {
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect2.x + rect2.width < rect1.x ||
            rect1.y + rect1.height < rect2.y ||
            rect2.y + rect2.height < rect1.y
        );
    }

    /**
     * Get grid-aligned rectangle bounds
     */
    public static alignRectToGrid(
        rect: { x: number; y: number; width: number; height: number },
        gridSize: number
    ): { x: number; y: number; width: number; height: number } {
        const topLeft = this.snapToGrid({ x: rect.x, y: rect.y }, gridSize);
        const bottomRight = this.snapToGrid(
            { x: rect.x + rect.width, y: rect.y + rect.height },
            gridSize
        );

        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }

    /**
     * Calculate area in real-world units
     */
    public static calculateArea(
        width: number,
        height: number,
        gridScale: '1m' | '5m' | '10m'
    ): { value: number; unit: string } {
        const realWidth = this.calculateRealDistance(width, gridScale);
        const realHeight = this.calculateRealDistance(height, gridScale);

        const area = realWidth.value * realHeight.value;

        if (realWidth.unit === 'm' && realHeight.unit === 'm') {
            return { value: Math.round(area * 100) / 100, unit: 'm²' };
        } else {
            // Convert to cm² if dimensions are small
            const areaCm = area * 10000; // m² to cm²
            return { value: Math.round(areaCm), unit: 'cm²' };
        }
    }
}
