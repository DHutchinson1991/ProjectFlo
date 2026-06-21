import { resolveSandboxSpaceKind, type SandboxSpaceKind } from './blueprint-sandbox-space-kind';

export type SandboxRoomObjectType =
  | 'LABEL'
  | 'WALL'
  | 'DOOR'
  | 'WINDOW'
  | 'STAGE'
  | 'ARCH'
  | 'ALTAR'
  | 'AISLE'
  | 'CHAIR_ROW'
  | 'TABLE_HEAD'
  | 'TABLE_ROUND'
  | 'TABLE_RECT'
  | 'DANCE_FLOOR'
  | 'DJ_BOOTH'
  | 'BAR'
  | 'FURNITURE'
  | 'DECORATIVE';

export interface SandboxRoomObjectSpec {
  object_type: SandboxRoomObjectType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  order_index: number;
  metadata?: Record<string, unknown> | null;
}

export interface SandboxRoomZoneSpec {
  name: string;
  label: string;
  polygon: Array<{ x: number; y: number }>;
  color: string;
  description: string;
  order_index: number;
}

/**
 * Named reference coordinate on the sandbox canvas (e.g. altar_center,
 * aisle_start). Shared landmark vocabulary used by the placement seed,
 * the blocking AI prompt, and the Day Designer preview.
 */
export interface SandboxRoomAnchorSpec {
  name: string;
  label: string;
  x: number;
  y: number;
  /** Suggested facing rotation (degrees, 0 = north/up) for a subject standing at this anchor. */
  rotation: number;
}

/** SpaceType enum names for Prisma mapping on the backend. */
export type SandboxRoomSpaceTypeTag =
  | 'CEREMONY_AREA'
  | 'RECEPTION_HALL'
  | 'BRIDAL_SUITE'
  | 'COCKTAIL_AREA'
  | 'OTHER';

export interface SandboxRoomLayoutSpec {
  description: string;
  typeTags: SandboxRoomSpaceTypeTag[];
  objects: SandboxRoomObjectSpec[];
  zones: SandboxRoomZoneSpec[];
  anchors: SandboxRoomAnchorSpec[];
}

export function buildSandboxRoomLayout(params: {
  label: string;
  activityName?: string | null;
  description?: string | null;
  /** Explicit space kind override; when omitted the kind is resolved from labels. */
  kind?: SandboxSpaceKind;
}): SandboxRoomLayoutSpec {
  const kind = params.kind ?? resolveSandboxSpaceKind({
    label: params.label,
    activityName: params.activityName,
    activityDescription: params.description,
  });
  const label = normalizeLabel(params.label) ?? normalizeLabel(params.activityName) ?? 'Sandbox Space';
  const make = objectFactory();
  const base = roomShell(make);
  const objects = objectsForKind(kind, make, base);

  return {
    description: params.description ?? descriptionForKind(kind, label),
    typeTags: typeTagsForKind(kind),
    objects,
    zones: deriveSandboxZones(kind, objects, label),
    anchors: deriveSandboxAnchors(objects),
  };
}

/** Minimal object shape needed for anchor/zone derivation (works for DB rows too). */
export interface SandboxAnchorSourceObject {
  object_type: string;
  label?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  metadata?: Record<string, unknown> | null;
}

function objectCenter(o: SandboxAnchorSourceObject): { x: number; y: number } {
  return { x: o.x + o.width / 2, y: o.y + o.height / 2 };
}

/**
 * Derive named anchor points from a set of floorplan objects.
 * Works for both the seeded sandbox layouts and arbitrary persisted
 * `SpaceSlotObject` rows, so every consumer (placement seed, blocking
 * prompt, Day Designer preview) shares one landmark vocabulary.
 */
export function deriveSandboxAnchors(objects: SandboxAnchorSourceObject[]): SandboxRoomAnchorSpec[] {
  const anchors: SandboxRoomAnchorSpec[] = [];
  const push = (name: string, label: string, x: number, y: number, rotation = 0) => {
    if (!anchors.some((a) => a.name === name)) {
      anchors.push({ name, label, x: Math.round(x), y: Math.round(y), rotation });
    }
  };

  const altar = objects.find((o) => o.object_type === 'ALTAR');
  if (altar) {
    const c = objectCenter(altar);
    // Officiant stands behind the altar facing the audience (south).
    push('altar_center', 'Altar center', c.x, c.y, 180);
    // Couple stands just in front of (south of) the altar facing it.
    push('couple_position', 'Couple position', c.x, altar.y + altar.height + 36, 0);
  }

  const aisle = objects.find((o) => o.object_type === 'AISLE');
  if (aisle) {
    const c = objectCenter(aisle);
    push('aisle_end', 'Aisle end (altar side)', c.x, aisle.y + 20, 0);
    push('aisle_start', 'Aisle start (entrance side)', c.x, aisle.y + aisle.height - 20, 0);
    push('aisle_mid', 'Aisle midpoint', c.x, c.y, 0);
  }

  const frontRow = (side: 'L' | 'R') => {
    const rows = objects.filter((o) => {
      if (o.object_type !== 'CHAIR_ROW') return false;
      const meta = o.metadata ?? {};
      return (meta as Record<string, unknown>).side === side;
    });
    if (rows.length === 0) return null;
    return rows.reduce((min, row) => (row.y < min.y ? row : min), rows[0]);
  };
  const frontL = frontRow('L');
  if (frontL) {
    const c = objectCenter(frontL);
    push('front_row_left', 'Front row (left / bride side)', c.x, c.y, 0);
  }
  const frontR = frontRow('R');
  if (frontR) {
    const c = objectCenter(frontR);
    push('front_row_right', 'Front row (right / groom side)', c.x, c.y, 0);
  }

  const headTable = objects.find((o) => o.object_type === 'TABLE_HEAD');
  if (headTable) {
    const c = objectCenter(headTable);
    push('head_table_center', 'Head table center', c.x, c.y, 180);
    push('head_table_front', 'In front of head table', c.x, headTable.y + headTable.height + 36, 180);
  }

  const danceFloor = objects.find((o) => o.object_type === 'DANCE_FLOOR');
  if (danceFloor) {
    const c = objectCenter(danceFloor);
    push('dance_floor_center', 'Dance floor center', c.x, c.y, 0);
  }

  const djBooth = objects.find((o) => o.object_type === 'DJ_BOOTH');
  if (djBooth) {
    const c = objectCenter(djBooth);
    push('dj_booth', 'DJ booth', c.x, c.y, 270);
  }

  const bar = objects.find((o) => o.object_type === 'BAR');
  if (bar) {
    const c = objectCenter(bar);
    push('bar_front', 'In front of the bar', c.x, bar.y + bar.height + 32, 0);
  }

  const stage = objects.find((o) => o.object_type === 'STAGE');
  if (stage) {
    const c = objectCenter(stage);
    push('stage_center', 'Stage / platform center', c.x, c.y, 180);
  }

  // Entrance: the southmost door.
  const doors = objects.filter((o) => o.object_type === 'DOOR');
  if (doors.length > 0) {
    const southmost = doors.reduce((max, d) => (d.y > max.y ? d : max), doors[0]);
    const c = objectCenter(southmost);
    push('entrance', 'Entrance', c.x, Math.max(72, c.y - 44), 0);
  }

  return anchors;
}

/** Axis-aligned bounding box over a set of objects, padded outward. */
function objectsBBox(
  objects: SandboxAnchorSourceObject[],
  pad: number,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (objects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const o of objects) {
    minX = Math.min(minX, o.x);
    minY = Math.min(minY, o.y);
    maxX = Math.max(maxX, o.x + o.width);
    maxY = Math.max(maxY, o.y + o.height);
  }
  return {
    minX: Math.max(60, minX - pad),
    minY: Math.max(60, minY - pad),
    maxX: Math.min(940, maxX + pad),
    maxY: Math.min(940, maxY + pad),
  };
}

function rectPolygon(b: { minX: number; minY: number; maxX: number; maxY: number }): Array<{ x: number; y: number }> {
  return [
    { x: Math.round(b.minX), y: Math.round(b.minY) },
    { x: Math.round(b.maxX), y: Math.round(b.minY) },
    { x: Math.round(b.maxX), y: Math.round(b.maxY) },
    { x: Math.round(b.minX), y: Math.round(b.maxY) },
  ];
}

/**
 * Deterministic named zones derived from the sandbox objects. Zone names
 * intentionally match the blocking guardrails' `SUBJECT_ZONE_RULES`
 * vocabulary (altar_area, aisle, left_seating, right_seating, entrance, ...).
 */
export function deriveSandboxZones(
  kind: SandboxSpaceKind,
  objects: SandboxAnchorSourceObject[],
  label: string,
): SandboxRoomZoneSpec[] {
  const zones: SandboxRoomZoneSpec[] = [];
  const add = (
    name: string,
    zoneLabel: string,
    bbox: { minX: number; minY: number; maxX: number; maxY: number } | null,
    color: string,
    description: string,
  ) => {
    if (!bbox) return;
    zones.push({
      name,
      label: zoneLabel,
      polygon: rectPolygon(bbox),
      color,
      description,
      order_index: zones.length,
    });
  };

  const byType = (...types: string[]) => objects.filter((o) => types.includes(o.object_type));
  const chairRows = (side: 'L' | 'R') =>
    byType('CHAIR_ROW').filter((o) => ((o.metadata ?? {}) as Record<string, unknown>).side === side);

  if (kind === 'ceremony') {
    add('altar_area', 'Altar area', objectsBBox(byType('STAGE', 'ARCH', 'ALTAR'), 28), 'rgba(96,165,250,0.12)',
      'Ceremony platform, arch, and altar — where the couple, officiant, and wedding party stand.');
    add('aisle', 'Aisle', objectsBBox(byType('AISLE'), 14), 'rgba(167,139,250,0.10)',
      'Central aisle used for the processional and recessional.');
    add('left_seating', 'Left seating (bride side)', objectsBBox(chairRows('L'), 20), 'rgba(52,211,153,0.08)',
      'Guest chair rows left of the aisle — bride side seating.');
    add('right_seating', 'Right seating (groom side)', objectsBBox(chairRows('R'), 20), 'rgba(52,211,153,0.08)',
      'Guest chair rows right of the aisle — groom side seating.');
    const door = byType('DOOR');
    add('entrance', 'Entrance', objectsBBox(door, 0) && {
      minX: 100, minY: 840, maxX: 900, maxY: 928,
    }, 'rgba(251,191,36,0.08)',
      'Back-of-room entrance band where subjects arrive and depart.');
  } else if (kind === 'reception') {
    add('head_table', 'Head table', objectsBBox(byType('TABLE_HEAD'), 36), 'rgba(96,165,250,0.10)',
      'Head table area where the couple and wedding party sit.');
    add('dance_floor', 'Dance floor', objectsBBox(byType('DANCE_FLOOR'), 16), 'rgba(167,139,250,0.10)',
      'Dance floor for first dance and open dancing.');
    add('guest_tables', 'Guest tables', objectsBBox(byType('TABLE_ROUND'), 40), 'rgba(52,211,153,0.08)',
      'Round guest tables where seated guests dine.');
    add('dj_area', 'DJ area', objectsBBox(byType('DJ_BOOTH'), 24), 'rgba(244,114,182,0.08)',
      'DJ booth and speaker area.');
    add('bar_area', 'Bar', objectsBBox(byType('BAR'), 30), 'rgba(251,191,36,0.08)',
      'Bar service area.');
  } else if (kind === 'prep') {
    add('vanity_area', 'Vanity', objectsBBox(byType('TABLE_RECT').slice(0, 1), 40), 'rgba(244,114,182,0.10)',
      'Vanity and mirror — hair and makeup happens here.');
    add('lounge', 'Lounge', objectsBBox(byType('FURNITURE'), 36), 'rgba(167,139,250,0.08)',
      'Sofa and lounge seating for the party.');
  } else if (kind === 'portraits') {
    add('backdrop_area', 'Backdrop', objectsBBox(byType('STAGE'), 36), 'rgba(52,211,153,0.10)',
      'Portrait backdrop and posing position.');
    add('standing_area', 'Standing marks', objectsBBox(byType('AISLE', 'FURNITURE'), 30), 'rgba(96,165,250,0.08)',
      'Subject standing marks in front of the backdrop.');
  } else if (kind === 'cocktail') {
    add('bar_area', 'Bar', objectsBBox(byType('BAR'), 30), 'rgba(251,191,36,0.10)',
      'Bar service area.');
    add('receiving_line', 'Receiving line', objectsBBox(byType('STAGE'), 30), 'rgba(96,165,250,0.08)',
      'Receiving line where the couple greets guests.');
    add('mingling_area', 'Mingling', objectsBBox(byType('TABLE_ROUND', 'AISLE'), 36), 'rgba(167,139,250,0.08)',
      'Open mingling space with high tables.');
  }

  if (zones.length === 0) {
    zones.push({
      name: stableKey(label),
      label,
      polygon: [{ x: 60, y: 60 }, { x: 940, y: 60 }, { x: 940, y: 940 }, { x: 60, y: 940 }],
      color: 'rgba(167,139,250,0.09)',
      description: descriptionForKind(kind, label),
      order_index: 0,
    });
  }

  return zones;
}

function objectsForKind(
  kind: SandboxSpaceKind,
  make: ReturnType<typeof objectFactory>,
  base: SandboxRoomObjectSpec[],
): SandboxRoomObjectSpec[] {
  switch (kind) {
    case 'ceremony':
      return [
        ...base,
        make('STAGE', 'Ceremony platform', 340, 88, 320, 128),
        make('ARCH', 'Ceremony arch', 410, 112, 180, 42),
        make('ALTAR', 'Altar', 425, 180, 150, 48),
        make('AISLE', 'Aisle', 470, 275, 60, 560),
        ...chairRows(make, 155, 345, 260, 7, 'L'),
        ...chairRows(make, 585, 345, 260, 7, 'R'),
        make('DOOR', 'Entrance', 455, 925, 90, 24),
      ];
    case 'reception':
      return [
        ...base,
        make('TABLE_HEAD', 'Head table', 260, 100, 480, 58),
        make('DANCE_FLOOR', 'Dance floor', 350, 390, 300, 230),
        make('DJ_BOOTH', 'DJ booth', 710, 420, 110, 54),
        make('BAR', 'Bar', 120, 820, 220, 48),
        ...roundTables(make, [[205, 290], [500, 270], [795, 290], [235, 660], [765, 660], [500, 780]]),
      ];
    case 'prep':
      return [
        ...base,
        make('WINDOW', 'Window light', 165, 64, 210, 16),
        make('TABLE_RECT', 'Vanity', 170, 170, 180, 56),
        make('FURNITURE', 'Sofa', 610, 210, 210, 74),
        make('TABLE_RECT', 'Details table', 390, 420, 170, 90),
        make('FURNITURE', 'Wardrobe', 760, 675, 86, 200),
        make('DECORATIVE', 'Mirror', 216, 236, 80, 16),
      ];
    case 'portraits':
      return [
        ...base,
        make('STAGE', 'Portrait backdrop', 305, 115, 390, 56),
        make('FURNITURE', 'Bench', 380, 500, 240, 45),
        make('DECORATIVE', 'Key light zone', 190, 285, 90, 90),
        make('DECORATIVE', 'Fill light zone', 720, 285, 90, 90),
        make('AISLE', 'Standing mark', 470, 270, 60, 250),
      ];
    case 'cocktail':
      return [
        ...base,
        make('BAR', 'Bar', 110, 140, 260, 52),
        make('STAGE', 'Receiving line', 570, 120, 250, 60),
        ...roundTables(make, [[210, 370], [500, 380], [780, 370], [330, 650], [670, 650]], 70),
        make('AISLE', 'Guest flow', 460, 230, 80, 600),
      ];
    default:
      return [
        ...base,
        make('TABLE_RECT', 'Working area', 360, 210, 280, 90),
        make('FURNITURE', 'Seating', 180, 560, 220, 62),
        make('FURNITURE', 'Seating', 600, 560, 220, 62),
        make('AISLE', 'Movement lane', 470, 355, 60, 380),
      ];
  }
}

function roomShell(make: ReturnType<typeof objectFactory>) {
  return [
    make('WALL', 'North wall', 60, 60, 880, 12),
    make('WALL', 'South wall', 60, 928, 880, 12),
    make('WALL', 'West wall', 60, 60, 12, 880),
    make('WALL', 'East wall', 928, 60, 12, 880),
    make('DOOR', 'Entry', 456, 928, 88, 16),
    make('WINDOW', 'Window', 700, 60, 160, 14),
  ];
}

function objectFactory() {
  let orderIndex = 0;
  return (
    objectType: SandboxRoomObjectType,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation = 0,
    metadata: Record<string, unknown> | null = null,
  ): SandboxRoomObjectSpec => {
    orderIndex += 1;
    return { object_type: objectType, label, x, y, width, height, rotation, order_index: orderIndex, metadata };
  };
}

function chairRows(
  make: ReturnType<typeof objectFactory>,
  x: number,
  startY: number,
  width: number,
  rows: number,
  side: 'L' | 'R',
) {
  return Array.from({ length: rows }, (_, index) =>
    make('CHAIR_ROW', `Guest row ${index + 1} ${side}`, x, startY + index * 62, width, 26, 0, {
      side,
      row_index: index,
      seat_cols: 5,
      capacity: 5,
    }),
  );
}

function roundTables(
  make: ReturnType<typeof objectFactory>,
  centers: Array<[number, number]>,
  size = 84,
) {
  return centers.map(([x, y], index) =>
    make('TABLE_ROUND', `Table ${index + 1}`, x - size / 2, y - size / 2, size, size),
  );
}

function typeTagsForKind(kind: SandboxSpaceKind): SandboxRoomSpaceTypeTag[] {
  if (kind === 'ceremony') return ['CEREMONY_AREA'];
  if (kind === 'reception') return ['RECEPTION_HALL'];
  if (kind === 'prep') return ['BRIDAL_SUITE'];
  if (kind === 'portraits') return ['OTHER'];
  if (kind === 'cocktail') return ['COCKTAIL_AREA'];
  return [];
}

function descriptionForKind(kind: SandboxSpaceKind, label: string) {
  if (kind === 'ceremony') return `${label}: ceremony sandbox with altar, aisle, arch, and guest seating rows.`;
  if (kind === 'reception') return `${label}: reception sandbox with head table, guest tables, dance floor, DJ booth, and bar.`;
  if (kind === 'prep') return `${label}: preparation room sandbox with vanity, sofa, detail table, wardrobe, and window light.`;
  if (kind === 'portraits') return `${label}: portrait sandbox with backdrop, standing mark, bench, and light zones.`;
  if (kind === 'cocktail') return `${label}: cocktail sandbox with bar, guest flow lane, high tables, and receiving line.`;
  return `${label}: generic sandbox room with walls, entry, seating, and a movement lane.`;
}

function normalizeLabel(value: string | null | undefined) {
  const trimmed = (value ?? '').trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed : null;
}

function stableKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sandbox';
}
