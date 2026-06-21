import { formatCeremonySeatLabel, parsePlacementSeatToken } from './ceremony-seat-layout';

const PLACEMENT_COORD_TOKEN = /\[\[coord:([0-9.-]+),([0-9.-]+),([0-9.-]+)\]\]/;
const COPY_COORD_G = /\[\[c(\d+):([0-9.-]+),([0-9.-]+),([0-9.-]+)\]\]/g;
const COPY_SEAT_G = /\[\[s(\d+):([LR]):(\d+):(\d+)\]\]/g;

export interface PerCopyPlacementLine {
  copyIndex: number;
  memberLabel: string;
  coords: { x: number; y: number; rotation: number } | null;
  seatLabel: string | null;
}

/** Reads legacy `[[coord]]` / `[[seat]]` plus per-copy `[[cN]]` / `[[sN]]` tokens from placement notes. */
export function buildPerCopyPlacementLines(
  notes: string | null | undefined,
  copyCount: number,
  roleName: string,
): PerCopyPlacementLine[] {
  const count = Math.max(1, Math.floor(copyCount));
  const coordByCopy = new Map<number, { x: number; y: number; rotation: number }>();
  const seatByCopy = new Map<number, { side: 'L' | 'R'; rowIndex: number; seatIndex: number }>();
  const n = notes ?? '';

  for (const m of n.matchAll(COPY_COORD_G)) {
    const idx = Number(m[1]);
    const x = Number(m[2]);
    const y = Number(m[3]);
    const rotation = Number(m[4]);
    if (Number.isFinite(idx) && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(rotation)) {
      coordByCopy.set(idx, { x, y, rotation });
    }
  }
  for (const m of n.matchAll(COPY_SEAT_G)) {
    const idx = Number(m[1]);
    const side = m[2] as 'L' | 'R';
    const rowIndex = Number(m[3]);
    const seatIndex = Number(m[4]);
    if (Number.isFinite(idx) && Number.isFinite(rowIndex) && Number.isFinite(seatIndex)) {
      seatByCopy.set(idx, { side, rowIndex, seatIndex });
    }
  }

  const legacy = n.match(PLACEMENT_COORD_TOKEN);
  if (legacy) {
    const x = Number(legacy[1]);
    const y = Number(legacy[2]);
    const rotation = Number(legacy[3]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(rotation)) {
      coordByCopy.set(0, { x, y, rotation });
    }
  }
  const seat0 = parsePlacementSeatToken(n);
  if (seat0) {
    seatByCopy.set(0, seat0);
  }

  const lines: PerCopyPlacementLine[] = [];
  for (let i = 0; i < count; i += 1) {
    const coords = coordByCopy.get(i) ?? null;
    const seatMeta = seatByCopy.get(i);
    const seatLabel = seatMeta ? formatCeremonySeatLabel(seatMeta) : null;
    const memberLabel = count > 1 ? `${roleName.trim()} ${i + 1}` : roleName.trim();
    lines.push({ copyIndex: i, memberLabel, coords, seatLabel });
  }
  return lines;
}
