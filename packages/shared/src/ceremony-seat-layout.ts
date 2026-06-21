import type { FloorPlanChairObject } from './floor-plan-object.types';

export type CeremonyRoleLinkRef = { order_index?: number | null };

export function normalizeCeremonyRoleLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type CeremonySeatTier = 'guest' | 'party_bride' | 'party_groom' | 'party_ambiguous' | 'other';

function isOfficiantLikeRole(normalizedRoleLabel: string): boolean {
  return /\b(officiant|celebrant|minister|priest|vicar|rabbi|imam|registrar)\b/.test(normalizedRoleLabel);
}

function isBrideParentRole(normalizedRoleLabel: string): boolean {
  return (
    /\b(mob|fob)\b/.test(normalizedRoleLabel) ||
    /\bof\s+the\s+bride\b/.test(normalizedRoleLabel) ||
    /\bof\s+bride\b/.test(normalizedRoleLabel) ||
    /\bbride\s+side\b/.test(normalizedRoleLabel) ||
    (/\b(father|mother|parent)s?\b/.test(normalizedRoleLabel) && /\bbride\b/.test(normalizedRoleLabel))
  );
}

function isGroomParentRole(normalizedRoleLabel: string): boolean {
  return (
    /\b(mog|fog)\b/.test(normalizedRoleLabel) ||
    /\bof\s+the\s+groom\b/.test(normalizedRoleLabel) ||
    /\bof\s+groom\b/.test(normalizedRoleLabel) ||
    /\bgroom\s+side\b/.test(normalizedRoleLabel) ||
    (/\b(father|mother|parent)s?\b/.test(normalizedRoleLabel) && /\bgroom\b/.test(normalizedRoleLabel))
  );
}

function isParentRole(normalizedRoleLabel: string): boolean {
  return isBrideParentRole(normalizedRoleLabel) || isGroomParentRole(normalizedRoleLabel);
}

/** Tier for ceremony pew assignment (parents are `other`, not party rows A–B). */
export function classifyCeremonySeatTier(roleLabel: string): CeremonySeatTier {
  const r = normalizeCeremonyRoleLabel(roleLabel);
  if (isParentRole(r)) return 'other';
  if (isOfficiantLikeRole(r)) return 'other';
  if (/\b(congregation|audience|crowd)\b/.test(r) || /\bguests?\b/.test(r)) return 'guest';

  const brideParty =
    /\b(maid of honor|matron of honor|bridesmaid|bridesmaids|flower girl)\b/.test(r) ||
    (/\bmaid\b/.test(r) && /\bhonor\b/.test(r));
  const groomParty =
    /\b(best man|groomsman|groomsmen|ring bearer|ringbearer)\b/.test(r) ||
    (/\bring\b/.test(r) && /\bbearer\b/.test(r));

  if (brideParty && !groomParty) return 'party_bride';
  if (groomParty && !brideParty) return 'party_groom';
  if (brideParty && groomParty) return 'party_bride';

  if (/\b(wedding party|personal attendant|junior attendant)\b/.test(r)) return 'party_ambiguous';

  return 'other';
}

/** Prefer remaining C+ seats on bride side (left) vs groom side (right) for parents. */
export function inferParentSeatSidePreference(roleLabel: string): 'left' | 'right' | null {
  const r = normalizeCeremonyRoleLabel(roleLabel);
  const brideParent = isBrideParentRole(r);
  const groomParent = isGroomParentRole(r);
  if (brideParent && !groomParent) return 'left';
  if (groomParent && !brideParent) return 'right';
  return null;
}

export interface ChairRowSeat {
  readonly x: number;
  readonly y: number;
  readonly side: 'L' | 'R';
  readonly rowIndex: number;
  readonly seatIndex: number;
}

function readMetadata(obj: FloorPlanChairObject): Record<string, unknown> {
  return ((obj.metadata ?? null) as Record<string, unknown> | null) ?? {};
}

function inferSide(obj: FloorPlanChairObject): 'L' | 'R' {
  const meta = readMetadata(obj);
  const s = meta.side;
  if (s === 'L' || s === 'R') return s;
  if (typeof s === 'string') {
    const t = s.toLowerCase();
    if (t === 'left' || t === 'l') return 'L';
    if (t === 'right' || t === 'r') return 'R';
  }
  const cx = obj.x + obj.width / 2;
  return cx < 500 ? 'L' : 'R';
}

function readRowIndexFromMeta(obj: FloorPlanChairObject): number | null {
  const meta = readMetadata(obj);
  const ri = meta.row_index;
  if (typeof ri === 'number' && Number.isFinite(ri)) return Math.floor(ri);
  if (typeof ri === 'string' && /^\d+$/.test(ri)) return parseInt(ri, 10);
  return null;
}

/** Seat centers in canvas coordinates; matches `objectFactory` CHAIR_ROW logic. */
export function computeSeatCentersForChairRow(
  o: Pick<FloorPlanChairObject, 'x' | 'y' | 'width' | 'height' | 'metadata'>,
): { x: number; y: number }[] {
  const meta = (o.metadata ?? null) as Record<string, unknown> | null;
  const seatColsRaw = Number(meta?.seat_cols ?? meta?.capacity ?? 0);
  const seatSize = Math.min(o.height * 0.8, 14);
  const seatGap = seatSize * 1.6;
  const countFromWidth = Math.max(1, Math.floor(o.width / seatGap));
  const count = Number.isFinite(seatColsRaw) && seatColsRaw > 0 ? Math.floor(seatColsRaw) : countFromWidth;
  const cy = o.y + o.height / 2;

  if (Number.isFinite(seatColsRaw) && seatColsRaw > 0) {
    const colStep = count > 1 ? o.width / count : o.width;
    return Array.from({ length: count }, (_, i) => ({
      x: o.x + (i + 0.5) * colStep,
      y: cy,
    }));
  }

  const totalW = (count - 1) * seatGap;
  const startX = (o.width - totalW) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: o.x + startX + i * seatGap,
    y: cy,
  }));
}

function buildChairSeats(objects: FloorPlanChairObject[]): ChairRowSeat[] {
  const chairs = objects.filter((o) => o.object_type === 'CHAIR_ROW');
  const withMeta = chairs.map((obj) => {
    const side = inferSide(obj);
    const metaRi = readRowIndexFromMeta(obj);
    return { obj, side, metaRi };
  });

  const bySide = (side: 'L' | 'R') =>
    withMeta
      .filter((e) => e.side === side)
      .sort((a, b) => a.obj.y - b.obj.y)
      .map((e, inferredIndex) => {
        const rowIndex = e.metaRi != null ? e.metaRi : inferredIndex;
        const centers = computeSeatCentersForChairRow(e.obj);
        return centers.map((c, seatIndex) => ({
          x: c.x,
          y: c.y,
          side,
          rowIndex,
          seatIndex,
        }));
      })
      .flat();

  return [...bySide('L'), ...bySide('R')].sort((a, b) => {
    if (a.side !== b.side) return a.side.localeCompare(b.side);
    if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
    return a.seatIndex - b.seatIndex;
  });
}

function buildDistributedFrontSeatQueue(
  byRow: Map<number, ChairRowSeat[]>,
  frontRowIndices: number[],
): ChairRowSeat[] {
  const rows = frontRowIndices
    .map((rowIndex) => ({
      rowIndex,
      seats: [...(byRow.get(rowIndex) ?? [])].sort((a, b) => a.seatIndex - b.seatIndex),
    }))
    .filter((entry) => entry.seats.length > 0);
  if (rows.length === 0) return [];
  const maxSeats = Math.max(...rows.map((entry) => entry.seats.length));
  const distributed: ChairRowSeat[] = [];
  for (let seatIndex = 0; seatIndex < maxSeats; seatIndex += 1) {
    for (const row of rows) {
      const seat = row.seats[seatIndex];
      if (seat) distributed.push(seat);
    }
  }
  return distributed;
}

function seatKey(s: ChairRowSeat): string {
  return `${s.side}:${s.rowIndex}:${s.seatIndex}`;
}

export interface CeremonyRoleInstanceInput {
  roleId: number;
  copyIndex: number;
  copyCount: number;
  roleLink: CeremonyRoleLinkRef;
  roleLabel: string;
  skipSeatSnap: boolean;
}

export interface CeremonySeatAssignmentResult {
  seatByInstanceKey: Map<string, { x: number; y: number; rotation: number }>;
  seatMetaByInstanceKey: Map<string, { rowIndex: number; side: 'L' | 'R'; seatIndex: number }>;
  totalSeatCapacity: number;
  assignableSeatCount: number;
  seatedSubjectCount: number;
  overflowSubjectCount: number;
}

function instanceKey(roleId: number, copyIndex: number): string {
  return `${roleId}:${copyIndex}`;
}

export enum CeremonySeatLayoutMode {
  FLUID = 'fluid',
  DISTRIBUTED = 'distributed',
}

export interface CeremonySeatAssignmentOptions {
  /** `fluid` (default): guests in back two rows; non-guests in front two. */
  seatLayout?: CeremonySeatLayoutMode;
}

export function computeCeremonyGuestSeatCapacity(
  objects: FloorPlanChairObject[],
  seatLayout: CeremonySeatLayoutMode = CeremonySeatLayoutMode.FLUID,
): number {
  const allSeats = buildChairSeats(objects);
  if (allSeats.length === 0) return 0;

  const leftByRow = new Map<number, ChairRowSeat[]>();
  const rightByRow = new Map<number, ChairRowSeat[]>();
  for (const seat of allSeats) {
    const bucket = seat.side === 'L' ? leftByRow : rightByRow;
    const row = bucket.get(seat.rowIndex) ?? [];
    row.push(seat);
    bucket.set(seat.rowIndex, row);
  }

  const rowIndices = new Set<number>([...leftByRow.keys(), ...rightByRow.keys()]);
  const sortedRowIndices = Array.from(rowIndices).sort((a, b) => a - b);
  const { guestRowIndices } = deriveCeremonyRowBands(sortedRowIndices, seatLayout);

  let capacity = 0;
  for (const rowIndex of guestRowIndices) {
    capacity += (leftByRow.get(rowIndex)?.length ?? 0) + (rightByRow.get(rowIndex)?.length ?? 0);
  }
  return capacity;
}

function deriveCeremonyRowBands(
  sortedRowIndices: number[],
  seatLayout: CeremonySeatLayoutMode,
): {
  frontRowIndices: number[];
  guestRowIndices: number[];
  middleRowIndices: number[];
} {
  const frontRowIndices = sortedRowIndices.slice(0, 2);
  if (seatLayout === CeremonySeatLayoutMode.DISTRIBUTED) {
    const guestRowIndices = sortedRowIndices.filter((ri) => !frontRowIndices.includes(ri));
    return { frontRowIndices, guestRowIndices, middleRowIndices: [] };
  }

  const backRowIndices =
    sortedRowIndices.length >= 4
      ? sortedRowIndices.slice(-2)
      : sortedRowIndices.filter((ri) => !frontRowIndices.includes(ri));
  const middleRowIndices = sortedRowIndices.filter(
    (ri) => !frontRowIndices.includes(ri) && !backRowIndices.includes(ri),
  );
  return { frontRowIndices, guestRowIndices: backRowIndices, middleRowIndices };
}

/**
 * Assigns canvas seat coordinates for ceremony synthetic subjects.
 * Callers still compute coordinates for `skipSeatSnap` instances (altar / motion).
 */
export function assignCeremonySyntheticSeats(
  objects: FloorPlanChairObject[],
  instances: CeremonyRoleInstanceInput[],
  options?: CeremonySeatAssignmentOptions,
): CeremonySeatAssignmentResult {
  const seatLayout = options?.seatLayout ?? CeremonySeatLayoutMode.FLUID;
  const seatByInstanceKey = new Map<string, { x: number; y: number; rotation: number }>();
  const seatMetaByInstanceKey = new Map<string, { rowIndex: number; side: 'L' | 'R'; seatIndex: number }>();
  const allSeats = buildChairSeats(objects);
  if (allSeats.length === 0) {
    return {
      seatByInstanceKey,
      seatMetaByInstanceKey,
      totalSeatCapacity: 0,
      assignableSeatCount: 0,
      seatedSubjectCount: 0,
      overflowSubjectCount: 0,
    };
  }

  const used = new Set<string>();
  const takeSeat = (seat: ChairRowSeat | undefined): boolean => {
    if (!seat) return false;
    const k = seatKey(seat);
    if (used.has(k)) return false;
    used.add(k);
    return true;
  };

  const leftByRow = new Map<number, ChairRowSeat[]>();
  const rightByRow = new Map<number, ChairRowSeat[]>();
  for (const s of allSeats) {
    const m = s.side === 'L' ? leftByRow : rightByRow;
    const arr = m.get(s.rowIndex) ?? [];
    arr.push(s);
    m.set(s.rowIndex, arr);
  }
  for (const m of [leftByRow, rightByRow]) {
    for (const arr of m.values()) {
      arr.sort((a, b) => a.seatIndex - b.seatIndex);
    }
  }

  const rowIndices = new Set<number>([...leftByRow.keys(), ...rightByRow.keys()]);
  const sortedRowIndices = Array.from(rowIndices).sort((a, b) => a - b);
  const { frontRowIndices, guestRowIndices, middleRowIndices } = deriveCeremonyRowBands(
    sortedRowIndices,
    seatLayout,
  );

  const leftParty = buildDistributedFrontSeatQueue(leftByRow, frontRowIndices);
  const rightParty = buildDistributedFrontSeatQueue(rightByRow, frontRowIndices);
  const guestSeatOrder: ChairRowSeat[] = [];
  for (const ri of guestRowIndices) {
    guestSeatOrder.push(...(leftByRow.get(ri) ?? []));
    guestSeatOrder.push(...(rightByRow.get(ri) ?? []));
  }

  const totalSeatCapacity = allSeats.length;
  const assignableSeatCount = guestSeatOrder.length + leftParty.length + rightParty.length;

  const leftPartyQ = [...leftParty];
  const rightPartyQ = [...rightParty];
  const guestQ = [...guestSeatOrder];

  const allocatable = instances.filter((i) => !i.skipSeatSnap);
  const partyBride = allocatable.filter((i) => classifyCeremonySeatTier(i.roleLabel) === 'party_bride');
  const partyGroom = allocatable.filter((i) => classifyCeremonySeatTier(i.roleLabel) === 'party_groom');
  const partyAmbiguous = allocatable.filter((i) => classifyCeremonySeatTier(i.roleLabel) === 'party_ambiguous');
  const partyInMotion = instances.filter((i) => {
    if (!i.skipSeatSnap) return false;
    const tier = classifyCeremonySeatTier(i.roleLabel);
    return tier === 'party_bride' || tier === 'party_groom' || tier === 'party_ambiguous';
  });
  const guests = allocatable.filter((i) => classifyCeremonySeatTier(i.roleLabel) === 'guest');
  const others = allocatable
    .filter((i) => {
      const t = classifyCeremonySeatTier(i.roleLabel);
      return t === 'other';
    })
    .sort((a, b) => {
      const aParent = isParentRole(normalizeCeremonyRoleLabel(a.roleLabel));
      const bParent = isParentRole(normalizeCeremonyRoleLabel(b.roleLabel));
      if (aParent !== bParent) return aParent ? -1 : 1;
      const oa = a.roleLink.order_index ?? 0;
      const ob = b.roleLink.order_index ?? 0;
      if (oa !== ob) return oa - ob;
      if (a.roleId !== b.roleId) return a.roleId - b.roleId;
      return a.copyIndex - b.copyIndex;
    });

  let overflow = 0;
  let seated = 0;

  for (const inst of partyBride) {
    let seat = leftPartyQ.shift();
    if (!seat) seat = rightPartyQ.shift();
    if (!seat) {
      overflow += 1;
      continue;
    }
    takeSeat(seat);
    const key = instanceKey(inst.roleId, inst.copyIndex);
    seatByInstanceKey.set(key, { x: seat.x, y: seat.y, rotation: 0 });
    seatMetaByInstanceKey.set(key, { rowIndex: seat.rowIndex, side: seat.side, seatIndex: seat.seatIndex });
    seated += 1;
  }

  for (const inst of partyGroom) {
    let seat = rightPartyQ.shift();
    if (!seat) seat = leftPartyQ.shift();
    if (!seat) {
      overflow += 1;
      continue;
    }
    takeSeat(seat);
    const key = instanceKey(inst.roleId, inst.copyIndex);
    seatByInstanceKey.set(key, { x: seat.x, y: seat.y, rotation: 0 });
    seatMetaByInstanceKey.set(key, { rowIndex: seat.rowIndex, side: seat.side, seatIndex: seat.seatIndex });
    seated += 1;
  }

  for (const inst of partyAmbiguous) {
    const preferLeft = leftPartyQ.length >= rightPartyQ.length;
    let seat = preferLeft ? leftPartyQ.shift() : rightPartyQ.shift();
    if (!seat) seat = preferLeft ? rightPartyQ.shift() : leftPartyQ.shift();
    if (!seat) {
      overflow += 1;
      continue;
    }
    takeSeat(seat);
    const key = instanceKey(inst.roleId, inst.copyIndex);
    seatByInstanceKey.set(key, { x: seat.x, y: seat.y, rotation: 0 });
    seatMetaByInstanceKey.set(key, { rowIndex: seat.rowIndex, side: seat.side, seatIndex: seat.seatIndex });
    seated += 1;
  }

  for (const inst of partyInMotion) {
    const tier = classifyCeremonySeatTier(inst.roleLabel);
    let seat: ChairRowSeat | undefined;
    if (tier === 'party_bride') {
      seat = leftPartyQ.shift() ?? rightPartyQ.shift();
    } else if (tier === 'party_groom') {
      seat = rightPartyQ.shift() ?? leftPartyQ.shift();
    } else {
      const preferLeft = leftPartyQ.length >= rightPartyQ.length;
      seat = preferLeft ? leftPartyQ.shift() : rightPartyQ.shift();
      if (!seat) seat = preferLeft ? rightPartyQ.shift() : leftPartyQ.shift();
    }
    if (!seat) {
      overflow += 1;
      continue;
    }
    takeSeat(seat);
    const key = instanceKey(inst.roleId, inst.copyIndex);
    seatByInstanceKey.set(key, { x: seat.x, y: seat.y, rotation: 0 });
    seatMetaByInstanceKey.set(key, { rowIndex: seat.rowIndex, side: seat.side, seatIndex: seat.seatIndex });
    seated += 1;
  }

  const remainingRowsInOrder = (rows: number[]): ChairRowSeat[] => {
    const out: ChairRowSeat[] = [];
    for (const ri of rows) {
      for (const side of ['L', 'R'] as const) {
        const arr = side === 'L' ? leftByRow.get(ri) : rightByRow.get(ri);
        for (const s of arr ?? []) {
          if (!used.has(seatKey(s))) out.push(s);
        }
      }
    }
    return out;
  };

  // Product rule: non-guest ceremony roles use front rows, then middle (fluid keeps back rows for guests).
  const nonGuestPreferredRows =
    seatLayout === CeremonySeatLayoutMode.FLUID
      ? [...frontRowIndices, ...middleRowIndices]
      : [...frontRowIndices, ...guestRowIndices];
  const pickOtherSeat = (inst: CeremonyRoleInstanceInput): ChairRowSeat | undefined => {
    const rem = remainingRowsInOrder(nonGuestPreferredRows);
    if (rem.length === 0) return undefined;
    const pref = inferParentSeatSidePreference(inst.roleLabel);
    if (pref === 'left') {
      const leftFirst = rem.find((s) => s.side === 'L');
      if (leftFirst) return leftFirst;
      return rem[0];
    }
    if (pref === 'right') {
      const rightFirst = rem.find((s) => s.side === 'R');
      if (rightFirst) return rightFirst;
      return rem[0];
    }
    return rem[0];
  };

  // Guest-tier roles claim guest-row seats before `others` (parents, readers, etc.),
  // otherwise `pickOtherSeat` can fill guest pews first and the guest queue has nothing left
  // (persist shows seatKeysForRole: 0 on first drop — see debug logs).
  // Leave front-row seats empty for guests (reserved for wedding party / aisle).
  // Do not push unused front-row seats into the guest queue when no party is placed.

  for (const inst of guests) {
    let seat: ChairRowSeat | undefined;
    while (guestQ.length > 0) {
      const candidate = guestQ.shift();
      if (candidate && takeSeat(candidate)) {
        seat = candidate;
        break;
      }
    }
    if (!seat) {
      overflow += 1;
      continue;
    }
    const key = instanceKey(inst.roleId, inst.copyIndex);
    seatByInstanceKey.set(key, { x: seat.x, y: seat.y, rotation: 0 });
    seatMetaByInstanceKey.set(key, { rowIndex: seat.rowIndex, side: seat.side, seatIndex: seat.seatIndex });
    seated += 1;
  }

  for (const inst of others) {
    const seat = pickOtherSeat(inst);
    if (!seat) {
      overflow += 1;
      continue;
    }
    if (!takeSeat(seat)) {
      overflow += 1;
      continue;
    }
    const key = instanceKey(inst.roleId, inst.copyIndex);
    seatByInstanceKey.set(key, { x: seat.x, y: seat.y, rotation: 0 });
    seatMetaByInstanceKey.set(key, { rowIndex: seat.rowIndex, side: seat.side, seatIndex: seat.seatIndex });
    seated += 1;
  }

  return {
    seatByInstanceKey,
    seatMetaByInstanceKey,
    totalSeatCapacity,
    assignableSeatCount,
    seatedSubjectCount: seated,
    overflowSubjectCount: overflow,
  };
}

const PLACEMENT_SEAT_TOKEN = /\[\[seat:([LR]):(\d+):(\d+)\]\]/;

export function parsePlacementSeatToken(notes?: string | null): { side: 'L' | 'R'; rowIndex: number; seatIndex: number } | null {
  if (!notes) return null;
  const match = notes.match(PLACEMENT_SEAT_TOKEN);
  if (!match) return null;
  const side = match[1] as 'L' | 'R';
  const rowIndex = Number(match[2]);
  const seatIndex = Number(match[3]);
  if (!Number.isFinite(rowIndex) || !Number.isFinite(seatIndex)) return null;
  return { side, rowIndex, seatIndex };
}

export function formatCeremonySeatLabel(meta: { side: 'L' | 'R'; rowIndex: number; seatIndex: number }): string {
  const side = meta.side === 'L' ? 'Left' : 'Right';
  return `${side} · row ${meta.rowIndex + 1} · seat ${meta.seatIndex + 1}`;
}

function clampCanvasComponent(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface ChairSeatSnapResult {
  x: number;
  y: number;
  rotation: number;
  nearestDistance: number;
  seatCount: number;
  meta: { side: 'L' | 'R'; rowIndex: number; seatIndex: number } | null;
}

export function findNearestChairSeatMeta(
  objects: FloorPlanChairObject[],
  x: number,
  y: number,
  canvas: { width: number; height: number } = { width: 1000, height: 1000 },
): ChairSeatSnapResult {
  const seats = buildChairSeats(objects);
  if (seats.length === 0) {
    return {
      x: clampCanvasComponent(x, 40, canvas.width - 40),
      y: clampCanvasComponent(y, 40, canvas.height - 40),
      rotation: 0,
      nearestDistance: Number.POSITIVE_INFINITY,
      seatCount: 0,
      meta: null,
    };
  }
  let nearest = seats[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const seat of seats) {
    const distance = Math.hypot(seat.x - x, seat.y - y);
    if (distance < nearestDistance) {
      nearest = seat;
      nearestDistance = distance;
    }
  }
  return {
    x: clampCanvasComponent(nearest.x, 40, canvas.width - 40),
    y: clampCanvasComponent(nearest.y, 40, canvas.height - 40),
    rotation: 0,
    nearestDistance,
    seatCount: seats.length,
    meta: { side: nearest.side, rowIndex: nearest.rowIndex, seatIndex: nearest.seatIndex },
  };
}

export function resolveChairSeatCoordinates(
  objects: FloorPlanChairObject[],
  meta: { side: 'L' | 'R'; rowIndex: number; seatIndex: number },
): { x: number; y: number; rotation: number } | null {
  const seat = buildChairSeats(objects).find(
    (s) => s.side === meta.side && s.rowIndex === meta.rowIndex && s.seatIndex === meta.seatIndex,
  );
  if (!seat) return null;
  return { x: seat.x, y: seat.y, rotation: 0 };
}
