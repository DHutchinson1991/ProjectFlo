import { Polygon, FabricText, Group } from 'fabric';
import type { SpaceZone } from '../../../../types/floor-plan.types';

/**
 * Default space colors cycled when no fill_color is set.
 */
const SPACE_PALETTE = [
    'rgba(123,97,255,0.12)',   // Purple
    'rgba(78,205,196,0.12)',   // Teal
    'rgba(255,107,157,0.12)',  // Pink
    'rgba(255,179,71,0.12)',   // Amber
    'rgba(52,152,219,0.12)',   // Blue
    'rgba(46,204,113,0.12)',   // Green
];

/**
 * Creates a Fabric.js polygon group for a space zone on the floor plan.
 * Shows the boundary polygon + a centered name label.
 */
export function createSpaceZone(
    zone: SpaceZone,
    index: number,
): Group {
    const points = zone.boundary_json ?? [];
    if (points.length < 3) {
        // Fallback: not enough points for a polygon, render a placeholder rect
        const placeholder = new Polygon(
            [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }, { x: 0, y: 80 }],
            {
                fill: SPACE_PALETTE[index % SPACE_PALETTE.length],
                stroke: 'rgba(255,255,255,0.15)',
                strokeWidth: 1,
                selectable: false,
                evented: false,
            },
        );
        return new Group([placeholder], {
            data: { type: 'spaceZone', spaceId: zone.id },
            selectable: false,
            evented: false,
        });
    }

    const fill = zone.fill_color
        ? zone.fill_color
        : SPACE_PALETTE[index % SPACE_PALETTE.length];

    const polygon = new Polygon(points, {
        fill,
        stroke: 'rgba(255,255,255,0.2)',
        strokeWidth: 1,
        selectable: false,
        evented: false,
    });

    // Center the label inside the polygon bounding box
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

    const label = new FabricText(zone.name ?? `Space ${zone.id}`, {
        left: cx,
        top: cy,
        fontSize: 11,
        fill: 'rgba(255,255,255,0.45)',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '600',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
    });

    return new Group([polygon, label], {
        data: { type: 'spaceZone', spaceId: zone.id },
        selectable: false,
        evented: false,
    });
}
