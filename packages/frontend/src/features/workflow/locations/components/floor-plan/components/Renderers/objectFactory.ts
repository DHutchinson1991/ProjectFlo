import { Rect, Circle, Line, Polygon, FabricText, Group, type FabricObject } from 'fabric';
import type { FloorPlanObject, FloorPlanObjectType, SpaceSlotZone } from '../../../../types/floor-plan.types';

/* ─── Floor-plan palette ─── */
const FLOOR = {
    bg:         '#F4F1EA',
    gridLine:   '#E4DED3',
    wall:       '#8A8278',
    furniture:  '#D8D0C3',
    furnitureStroke: '#9D9386',
    stage:      '#E3DCCD',
    stageStroke:'#B9AC9B',
    altar:      '#CBB891',
    altarStroke:'#A49170',
    arch:       '#CFC5B6',
    archStroke: '#A99D8D',
    aisle:      '#EFEAE0',
    aisleStroke:'#D4CBBE',
    label:      '#776F65',
    door:       '#B89465',
    window:     '#94C8DD',
    danceFloor: '#DDD5C4',
};

const CAMERA = {
    fill:   '#2979FF',   // vivid blue
    stroke: '#1565C0',
    label:  '#1E5FAA',
    fov:    'rgba(41,121,255,0.08)',  // field-of-view cone fill
    fovStroke: 'rgba(41,121,255,0.25)',
};

const SUBJECT = {
    fill:   '#E84A7A',
    stroke: '#C62555',
    label:  '#7A4058',
    directionStroke: 'rgba(232,74,122,0.45)',
};

const ZONE = {
    defaultFill: 'rgba(200,200,200,0.12)',
    stroke: 'rgba(150,140,130,0.35)',
    label: '#9C9488',
};

/**
 * Color palette for floor plan object types (fallback fills).
 */
const TYPE_COLORS: Record<FloorPlanObjectType, string> = {
    WALL: FLOOR.wall,
    DOOR: FLOOR.door,
    WINDOW: FLOOR.window,
    TABLE_ROUND: FLOOR.furniture,
    TABLE_RECT: FLOOR.furniture,
    TABLE_HEAD: FLOOR.altar,
    CHAIR_ROW: FLOOR.furniture,
    STAGE: FLOOR.stage,
    AISLE: FLOOR.aisle,
    ARCH: FLOOR.arch,
    ALTAR: FLOOR.altar,
    DANCE_FLOOR: FLOOR.danceFloor,
    BAR: '#B18F72',
    DJ_BOOTH: '#BA8C7A',
    FURNITURE: FLOOR.furniture,
    DECORATIVE: '#C4A86A',
    LABEL: 'transparent',
};

/**
 * Creates a Fabric.js object from a FloorPlanObject DB record.
 * Each object stores its DB `id` in `data.dbId` for reconciliation.
 */
export function createFabricObject(obj: FloorPlanObject): FabricObject {
    const color = TYPE_COLORS[obj.object_type] ?? FLOOR.furniture;
    const baseProps = {
        left: obj.x,
        top: obj.y,
        angle: obj.rotation,
        data: { dbId: obj.id, objectType: obj.object_type },
    };

    switch (obj.object_type) {
        case 'TABLE_ROUND': {
            const radius = Math.min(obj.width, obj.height) / 2;
            return new Circle({
                ...baseProps,
                radius,
                fill: color,
                stroke: FLOOR.furnitureStroke,
                strokeWidth: 1,
            });
        }

        case 'TABLE_RECT':
        case 'TABLE_HEAD':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: color,
                rx: 3,
                ry: 3,
                stroke: FLOOR.furnitureStroke,
                strokeWidth: 1,
            });

        case 'WALL':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.wall,
                stroke: '#6F675F',
                strokeWidth: 1.5,
            });

        case 'DOOR':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.door,
                rx: 2,
                ry: 2,
                stroke: '#8A7352',
                strokeWidth: 1,
            });

        case 'WINDOW':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: 'rgba(140,187,216,0.35)',
                stroke: FLOOR.window,
                strokeWidth: 2,
            });

        case 'STAGE':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.stage,
                stroke: FLOOR.stageStroke,
                strokeWidth: 1.5,
                rx: 6,
                ry: 6,
            });

        case 'DANCE_FLOOR':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.danceFloor,
                stroke: FLOOR.furnitureStroke,
                strokeWidth: 1.5,
                rx: 4,
                ry: 4,
            });

        case 'AISLE':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.aisle,
                stroke: FLOOR.aisleStroke,
                strokeWidth: 1,
                strokeDashArray: [6, 4],
            });

        case 'CHAIR_ROW': {
            // Individual seat bumps — must match `computeSeatCentersForChairRow` (day-blueprints utils).
            const seatSize = Math.min(obj.height * 0.8, 14);
            const seatGap = seatSize * 1.6;
            const meta = (obj.metadata ?? null) as Record<string, unknown> | null;
            const seatColsRaw = Number(meta?.seat_cols ?? meta?.capacity ?? 0);
            const countFromWidth = Math.max(1, Math.floor(obj.width / seatGap));
            const count =
                Number.isFinite(seatColsRaw) && seatColsRaw > 0 ? Math.floor(seatColsRaw) : countFromWidth;
            const totalW = (count - 1) * seatGap;
            const startX = (obj.width - totalW) / 2;
            const colStep = count > 1 ? obj.width / count : obj.width;

            const children: FabricObject[] = [
                // Bench background
                new Rect({
                    left: 0,
                    top: 0,
                    width: obj.width,
                    height: obj.height,
                    fill: FLOOR.furniture,
                    stroke: FLOOR.furnitureStroke,
                    strokeWidth: 0.8,
                    rx: 2,
                    ry: 2,
                }),
            ];
            for (let i = 0; i < count; i++) {
                const cx =
                    Number.isFinite(seatColsRaw) && seatColsRaw > 0
                        ? (i + 0.5) * colStep
                        : startX + i * seatGap;
                children.push(
                    new Rect({
                        left: cx - seatSize / 2,
                        top: (obj.height - seatSize) / 2,
                        width: seatSize,
                        height: seatSize,
                        fill: FLOOR.furnitureStroke,
                        rx: seatSize / 2,
                        ry: seatSize / 2,
                    }),
                );
            }
            return new Group(children, { ...baseProps });
        }

        case 'ALTAR':
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.altar,
                stroke: FLOOR.altarStroke,
                strokeWidth: 1.5,
                rx: 4,
                ry: 4,
            });

        case 'ARCH': {
            // Semi-elliptical arch shape
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: FLOOR.arch,
                stroke: FLOOR.archStroke,
                strokeWidth: 1.5,
                rx: obj.width / 2,
                ry: obj.height,
            });
        }

        case 'LABEL': {
            const label = obj.label ?? 'Label';
            return new FabricText(label, {
                ...baseProps,
                fontSize: 9,
                fill: FLOOR.label,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                opacity: 0.78,
            });
        }

        default:
            return new Rect({
                ...baseProps,
                width: obj.width,
                height: obj.height,
                fill: color,
                stroke: FLOOR.furnitureStroke,
                strokeWidth: 1,
                rx: 3,
                ry: 3,
            });
    }
}

/**
 * Creates a camera marker for the spatial overlay.
 * Blue camera icon with a FOV (field-of-view) cone showing aim direction.
 */
export function createCameraMarker(opts: {
    x: number;
    y: number;
    rotation: number;
    color?: string;
    label?: string;
    /** Compact shot-size badge (e.g. MS, CU) shown above the camera body. */
    shotBadge?: string;
    trackId: number;
}) {
    const fill = opts.color ?? CAMERA.fill;

    // Aim line — thin dashed line showing camera direction
    const aimLine = new Line([0, 0, 0, -22], {
        stroke: fill,
        strokeWidth: 1.5,
        strokeDashArray: [3, 2],
        originX: 'center',
        originY: 'bottom',
    });

    // Camera body — wider rect with lens bump
    const body = new Rect({
        left: 0,
        top: 0,
        width: 16,
        height: 10,
        fill,
        stroke: '#fff',
        strokeWidth: 1.5,
        rx: 2,
        ry: 2,
        originX: 'center',
        originY: 'center',
    });

    // Lens bump (small rect on the front/top of the body)
    const lensBump = new Rect({
        left: 0,
        top: -5,
        width: 6,
        height: 4,
        fill,
        stroke: '#fff',
        strokeWidth: 1,
        rx: 1,
        ry: 1,
        originX: 'center',
        originY: 'bottom',
    });

    const children: FabricObject[] = [aimLine, body, lensBump];

    if (opts.shotBadge) {
        const badge = new FabricText(opts.shotBadge, {
            fontSize: 8,
            fill: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '700',
            originX: 'center',
            originY: 'bottom',
            top: -14,
            angle: -(opts.rotation || 0),
            backgroundColor: 'rgba(15,23,42,0.82)',
            padding: 2,
            data: { type: 'shot-badge' },
        });
        children.push(badge);
    }

    // Label below the marker — counter-rotated so it stays horizontal
    if (opts.label) {
        const labelText = new FabricText(opts.label, {
            fontSize: 9,
            fill: CAMERA.label,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            originX: 'center',
            originY: 'top',
            top: 10,
            angle: -(opts.rotation || 0),
        });
        children.push(labelText);
    }

    const group = new Group(children, {
        left: opts.x,
        top: opts.y,
        angle: opts.rotation,
        data: { type: 'camera', trackId: opts.trackId },
        hasControls: true,
        hasBorders: true,
    });

    return group;
}

/**
 * Creates a subject marker for the spatial overlay.
 * Coloured dot with a small direction line and clear label.
 */
export function createSubjectMarker(opts: {
    x: number;
    y: number;
    rotation?: number;
    color?: string;
    label?: string;
    subjectId: number;
    isSelected?: boolean;  // Gold glow when camera targets this subject
}) {
    const color = opts.color ?? SUBJECT.fill;
    const rot = opts.rotation ?? 0;
    const goldColor = '#FFD700'; // Gold for selected/targeted subjects

    const children: FabricObject[] = [];

    // Gold glow ring when selected (outermost layer)
    if (opts.isSelected) {
        const glowRing = new Circle({
            radius: 14,
            fill: 'transparent',
            stroke: goldColor,
            strokeWidth: 2.5,
            originX: 'center',
            originY: 'center',
            opacity: 0.8,
        });
        children.push(glowRing);
    }

    // Direction indicator (short line showing facing)
    const direction = new Line([0, 0, 0, -14], {
        stroke: SUBJECT.directionStroke,
        strokeWidth: 2,
        originX: 'center',
        originY: 'bottom',
    });
    children.push(direction);

    // Outer ring
    const ring = new Circle({
        radius: 8,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 1.5,
        originX: 'center',
        originY: 'center',
    });
    children.push(ring);

    // Inner dot
    const dot = new Circle({
        radius: 5,
        fill: color,
        originX: 'center',
        originY: 'center',
    });
    children.push(dot);

    if (opts.label) {
        const lines = opts.label.split('\n').map((line) => line.trim()).filter(Boolean);
        const fontSize = 6.5;
        const lineGap = 0.5;
        const maxLineChars = 12;
        lines.forEach((line, index) => {
            const labelText = new FabricText(line, {
                fontSize,
                fill: SUBJECT.label,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                originX: 'center',
                originY: 'top',
                top: 11 + index * (fontSize + lineGap),
                angle: -rot,
                maxWidth: maxLineChars * (fontSize * 0.58),
            });
            children.push(labelText);
        });
    }

    const group = new Group(children, {
        left: opts.x,
        top: opts.y,
        angle: rot,
        /** Match seat-centre math: (x,y) is the subject anchor, not bbox top-left. */
        originX: 'center',
        originY: 'center',
        data: { type: 'subject', subjectId: opts.subjectId },
        hasControls: false,
        hasBorders: true,
    });

    return group;
}

/**
 * Creates a semi-transparent zone overlay polygon on the canvas.
 * Zones define named spatial regions (altar_area, aisle, left_seating, etc.)
 * They render as background fill shapes the user can see through.
 */
export function createZoneOverlay(zone: SpaceSlotZone, scale: number = 1): FabricObject {
    const fill = zone.color ? hexToRgba(zone.color, 0.12) : ZONE.defaultFill;
    const points = zone.polygon.map(p => ({ x: p.x * scale, y: p.y * scale }));

    const polygon = new Polygon(points, {
        fill,
        stroke: ZONE.stroke,
        strokeWidth: 1,
        strokeDashArray: [4, 3],
        selectable: false,
        evented: false,
        data: { type: 'zone', zoneId: zone.id, zoneName: zone.name },
    });

    return polygon;
}

/**
 * Creates a zone label positioned at the centroid of the zone polygon.
 */
export function createZoneLabel(zone: SpaceSlotZone, scale: number = 1): FabricObject {
    if (!zone.label) return new Group([], { visible: false });

    // Calculate centroid
    const cx = zone.polygon.reduce((s, p) => s + p.x, 0) / zone.polygon.length * scale;
    const cy = zone.polygon.reduce((s, p) => s + p.y, 0) / zone.polygon.length * scale;

    return new FabricText(zone.label, {
        left: cx,
        top: cy,
        fontSize: 9,
        fill: ZONE.label,
        fontFamily: 'Inter, sans-serif',
        fontWeight: '400',
        fontStyle: 'italic',
        opacity: 0.6,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        data: { type: 'zone-label', zoneId: zone.id },
    });
}

/**
 * Creates a FOV (field of view) cone for a camera.
 * Renders as a semi-transparent triangle in front of the camera position.
 */
export function createFovCone(opts: {
    x: number;
    y: number;
    rotation: number;
    fovAngle: number;
    range?: number;
}): FabricObject {
    const range = opts.range ?? 120;
    const halfFov = (opts.fovAngle / 2) * (Math.PI / 180);
    const rotRad = opts.rotation * (Math.PI / 180);

    // Compute absolute screen-space vertices so the apex sits exactly at
    // (opts.x, opts.y) — no origin/pathOffset maths required.
    // At rotation = 0 the camera faces up (−Y).  CW rotation convention.
    const cone = new Polygon([
        { x: opts.x, y: opts.y },
        { x: opts.x + Math.sin(rotRad - halfFov) * range,
          y: opts.y - Math.cos(rotRad - halfFov) * range },
        { x: opts.x + Math.sin(rotRad + halfFov) * range,
          y: opts.y - Math.cos(rotRad + halfFov) * range },
    ], {
        fill: CAMERA.fov,
        stroke: CAMERA.fovStroke,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        data: { type: 'fov-cone' },
    });

    return cone;
}

const FOCAL_RING_LABELS = ['ECU', 'CU', 'MS', 'WS'] as const;

/**
 * Concentric distance rings around a focal subject showing shot-size thresholds.
 */
export function createFocalDistanceRings(opts: {
    x: number;
    y: number;
    radii: number[];
    scale?: number;
}): FabricObject[] {
    const scale = opts.scale ?? 1;
    return opts.radii.map((radius, index) => {
        const displayRadius = radius * scale;
        const ring = new Circle({
            left: opts.x,
            top: opts.y,
            radius: displayRadius,
            fill: 'transparent',
            stroke: `rgba(41,121,255,${0.42 - index * 0.07})`,
            strokeWidth: 1,
            strokeDashArray: [5, 4],
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            data: { type: 'focal-ring', band: FOCAL_RING_LABELS[index] ?? index },
        });
        const label = new FabricText(FOCAL_RING_LABELS[index] ?? '', {
            left: opts.x + displayRadius - 10,
            top: opts.y - 4,
            fontSize: 5.5,
            fill: 'rgba(41,121,255,0.55)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            selectable: false,
            evented: false,
            data: { type: 'focal-ring-label' },
        });
        return new Group([ring, label], {
            selectable: false,
            evented: false,
            data: { type: 'focal-ring-group' },
        });
    });
}

/** Helper: convert hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
    if (hex.startsWith('rgba(') || hex.startsWith('rgb(')) return hex;
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return ZONE.defaultFill;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
