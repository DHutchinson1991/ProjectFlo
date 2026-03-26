import { SVG, Svg } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';
import { CANVAS_DIMENSIONS, GRID_SIZES } from '../constants/dimensions';
import { ELEMENT_DEFINITIONS } from '../constants/elements';
import { Tool } from '../constants/tools';

// SVG.js drawing instance type
export interface SVGDrawing extends Svg {
    // Add any additional methods we use
}

export class SVGCanvasService {
    private drawing: SVGDrawing | null = null;

    /**
     * Initialize SVG canvas
     */
    public initializeCanvas(container: HTMLElement): SVGDrawing {
        // Clear existing canvas
        if (this.drawing) {
            this.drawing.remove();
        }

        // Create new SVG drawing
        this.drawing = SVG()
            .addTo(container)
            .size(CANVAS_DIMENSIONS.width, CANVAS_DIMENSIONS.height)
            .viewbox(0, 0, CANVAS_DIMENSIONS.width, CANVAS_DIMENSIONS.height) as SVGDrawing;

        console.log('SVG Canvas initialized:', {
            width: CANVAS_DIMENSIONS.width,
            height: CANVAS_DIMENSIONS.height
        });

        return this.drawing;
    }

    /**
     * Create grid pattern
     */
    public createGrid(scale: '1m' | '5m' | '10m'): void {
        if (!this.drawing) return;

        // Remove existing grid
        const existingGrid = this.drawing.findOne('.grid-layer');
        if (existingGrid) {
            existingGrid.remove();
        }

        const gridSize = GRID_SIZES[scale];
        const gridGroup = this.drawing.group().addClass('grid-layer');

        // Create grid pattern
        const pattern = this.drawing.defs().pattern(gridSize, gridSize, (add: any) => {
            add.rect(gridSize, gridSize).fill('none').stroke('#E0E0E0').attr('stroke-width', 0.5);
            add.circle(1).cx(0).cy(0).fill('#BDBDBD');
        });

        // Apply grid background
        gridGroup.rect(CANVAS_DIMENSIONS.width, CANVAS_DIMENSIONS.height)
            .fill(pattern)
            .back(); // Ensure grid stays in background

        console.log(`Grid created with scale: ${scale} (${gridSize}px)`);
    }

    /**
     * Create an element on the canvas
     */
    public createElement(tool: Tool, x: number, y: number): any {
        if (!this.drawing) return null;

        const elementDef = ELEMENT_DEFINITIONS[tool as keyof typeof ELEMENT_DEFINITIONS];
        if (!elementDef) return null;

        let element: any;

        switch (elementDef.shape) {
            case 'rect':
                element = this.drawing.rect(
                    elementDef.attrs.width || 100,
                    elementDef.attrs.height || 60
                );
                break;
            case 'circle':
                element = this.drawing.circle(
                    (elementDef.attrs.r || 40) * 2
                );
                break;
            case 'line':
                element = this.drawing.line(
                    elementDef.attrs.x1 || 0,
                    elementDef.attrs.y1 || 0,
                    elementDef.attrs.x2 || 100,
                    elementDef.attrs.y2 || 0
                );
                break;
            default:
                return null;
        }

        // Apply styling
        // Only apply fill to shapes that support it (not lines)
        if (elementDef.shape !== 'line' && 'fill' in element && typeof element.fill === 'function') {
            element.fill(elementDef.attrs.fill || '#ccc');
        }

        element
            .stroke({
                color: elementDef.attrs.stroke || '#000',
                width: elementDef.attrs['stroke-width'] || 1
            })
            .move(x, y)
            .addClass(`element-${tool}`)
            .addClass('draggable-element');

        // Make element draggable
        if (element.draggable) {
            element.draggable();
        }

        console.log(`Created ${elementDef.name} at (${x}, ${y})`);
        return element;
    }

    /**
     * Make all elements interactive
     */
    public makeElementsInteractive(onElementSelect?: (element: any) => void): void {
        if (!this.drawing) return;

        // Find all elements that aren't grid or defs
        const elements = this.drawing.find('*').filter((element: any) => {
            return !element.hasClass('grid-layer') &&
                element.type !== 'defs' &&
                element.type !== 'svg' &&
                !element.parent()?.hasClass('grid-layer');
        });

        elements.forEach((element: any) => {
            // Make draggable if it has the draggable method
            if (element.draggable && typeof element.draggable === 'function') {
                try {
                    element.draggable();
                } catch (e) {
                    console.warn('Could not make element draggable:', e);
                }
            }

            // Add click handler for selection
            element.off('click'); // Remove any existing handlers
            element.click((clickEvent: Event) => {
                clickEvent.stopPropagation();
                if (onElementSelect) {
                    onElementSelect(element);
                }
            });

            // Add double-click handler for text elements
            if (element.type === 'text') {
                element.off('dblclick');
                element.dblclick((dblClickEvent: Event) => {
                    dblClickEvent.stopPropagation();
                    const newText = prompt('Enter text:', element.text()) || element.text();
                    element.text(newText);
                });
            }
        });

        console.log(`Made ${elements.length} elements interactive`);
    }

    /**
     * Update object count
     */
    public getObjectCount(): number {
        if (!this.drawing) return 0;

        const elements = this.drawing.children().filter((child: any) =>
            !child.hasClass('grid-layer') && child.type !== 'defs'
        );

        return elements.length;
    }

    /**
     * Clear canvas (except grid)
     */
    public clearCanvas(): void {
        if (!this.drawing) return;

        const elements = this.drawing.children().filter((child: any) =>
            !child.hasClass('grid-layer') && child.type !== 'defs'
        );

        elements.forEach((element: any) => {
            element.remove();
        });

        console.log('Canvas cleared');
    }

    /**
     * Get SVG data for saving
     */
    public getSVGData(): string {
        if (!this.drawing) return '';
        return this.drawing.svg();
    }

    /**
     * Load SVG data
     */
    public loadSVGData(svgData: string): void {
        if (!this.drawing) return;

        try {
            // Clear existing content (except grid)
            this.clearCanvas();

            // Load SVG data
            this.drawing.svg(svgData);

            // Ensure grid stays in background
            const gridLayer = this.drawing.findOne('.grid-layer');
            if (gridLayer) {
                gridLayer.back();
            }

            console.log('SVG data loaded successfully');
        } catch (error) {
            console.error('Error loading SVG data:', error);
        }
    }

    /**
     * Apply zoom transform
     */
    public applyZoom(zoomLevel: number, panOffset: { x: number; y: number }): void {
        if (!this.drawing) return;

        // Apply transform to the root SVG element
        this.drawing.transform({
            scale: zoomLevel,
            translate: [panOffset.x, panOffset.y]
        });
    }

    /**
     * Get current drawing instance
     */
    public getDrawing(): SVGDrawing | null {
        return this.drawing;
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        if (this.drawing) {
            this.drawing.remove();
            this.drawing = null;
        }
    }
}
