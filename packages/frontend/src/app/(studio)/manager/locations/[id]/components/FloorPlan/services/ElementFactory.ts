import { ELEMENT_DEFINITIONS } from '../constants/elements';
import { Tool } from '../constants/tools';

// Element creation result
export interface ElementCreationResult {
    element: unknown; // SVG element (keeping as unknown for now due to SVG.js typing complexity)
    elementType: Tool;
    elementName: string;
    position: { x: number; y: number };
    dimensions?: { width: number; height: number; radius?: number };
}

// Element definition with proper typing
interface ElementAttributes {
    fill?: string;
    stroke?: string;
    'stroke-width'?: number;
    width?: number;
    height?: number;
    r?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

interface ElementDefinition {
    name: string;
    shape: 'rect' | 'circle' | 'line';
    attrs: ElementAttributes;
}

export class ElementFactory {
    /**
     * Create element definition for a tool
     */
    public static getElementDefinition(tool: Tool): ElementDefinition | null {
        const elementDef = ELEMENT_DEFINITIONS[tool as keyof typeof ELEMENT_DEFINITIONS];
        return elementDef || null;
    }

    /**
     * Get element attributes with defaults
     */
    public static getElementAttributes(tool: Tool): ElementAttributes {
        const elementDef = this.getElementDefinition(tool);
        if (!elementDef) {
            return {
                fill: '#cccccc',
                stroke: '#000000',
                'stroke-width': 1,
                width: 100,
                height: 60
            };
        }

        return elementDef.attrs;
    }

    /**
     * Calculate element bounds
     */
    public static getElementBounds(tool: Tool, x: number, y: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    } {
        const attrs = this.getElementAttributes(tool);
        const elementDef = this.getElementDefinition(tool);

        if (!elementDef) {
            return { x, y, width: 100, height: 60 };
        }

        switch (elementDef.shape) {
            case 'rect':
                return {
                    x,
                    y,
                    width: attrs.width || 100,
                    height: attrs.height || 60
                };
            case 'circle':
                const radius = attrs.r || 40;
                return {
                    x: x - radius,
                    y: y - radius,
                    width: radius * 2,
                    height: radius * 2
                };
            case 'line':
                const x2 = x + (attrs.x2 || 100);
                const y2 = y + (attrs.y2 || 0);
                return {
                    x: Math.min(x, x2),
                    y: Math.min(y, y2),
                    width: Math.abs(x2 - x),
                    height: Math.abs(y2 - y) || 1 // Minimum height for lines
                };
            default:
                return { x, y, width: 100, height: 60 };
        }
    }

    /**
     * Get element center point
     */
    public static getElementCenter(tool: Tool, x: number, y: number): { x: number; y: number } {
        const bounds = this.getElementBounds(tool, x, y);
        return {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };
    }

    /**
     * Validate element creation parameters
     */
    public static validateElementCreation(tool: Tool, x: number, y: number): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check if tool is valid
        if (!this.getElementDefinition(tool)) {
            errors.push(`Invalid tool: ${tool}`);
        }

        // Check coordinates
        if (typeof x !== 'number' || typeof y !== 'number') {
            errors.push('Invalid coordinates');
        }

        if (x < 0 || y < 0) {
            errors.push('Coordinates cannot be negative');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get all available element categories
     */
    public static getElementCategories(): Record<string, Tool[]> {
        return {
            drawing: ['rectangle', 'circle', 'line'],
            venue: ['door', 'window', 'stage', 'elevator', 'stairs'],
            amenities: ['bar', 'restroom', 'parking', 'security', 'emergency'],
            furniture: ['table', 'chair', 'sofa', 'bartable', 'couch'],
            outdoor: ['deck', 'pool'],
            equipment: ['djbooth', 'piano', 'micstand']
        };
    }

    /**
     * Get element styling for different states
     */
    public static getElementStyling(tool: Tool, state: 'normal' | 'selected' | 'hovered' = 'normal'): ElementAttributes {
        const baseAttrs = this.getElementAttributes(tool);

        switch (state) {
            case 'selected':
                return {
                    ...baseAttrs,
                    stroke: '#2196F3',
                    'stroke-width': 3
                };
            case 'hovered':
                return {
                    ...baseAttrs,
                    'stroke-width': (baseAttrs['stroke-width'] || 1) + 1
                };
            default:
                return baseAttrs;
        }
    }

    /**
     * Get snap-to-grid position
     */
    public static snapToGrid(x: number, y: number, gridSize: number): { x: number; y: number } {
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }
}
