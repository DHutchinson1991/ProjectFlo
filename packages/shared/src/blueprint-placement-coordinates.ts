import type { FloorPlanChairObject } from './floor-plan-object.types';
import { isGuestLikeRoleLabel } from './blueprint-subject-instances';
import {
  parsePlacementSeatToken,
  resolveChairSeatCoordinates,
} from './ceremony-seat-layout';
import type { SandboxSpaceKind } from './blueprint-sandbox-space-kind';

/** Named landmark coordinate (see `deriveSandboxAnchors`). */
export interface BlueprintPlacementAnchor {
  name: string;
  x: number;
  y: number;
  rotation: number;
}

export interface BlueprintPlacementResolveOptions {
  motionText?: string | null;
  momentName?: string | null;
  /**
   * Named anchors derived from the slot's floor-plan objects. When present,
   * key narrative positions (altar, couple, aisle, front rows) resolve
   * relative to the actual room geometry instead of hardcoded defaults.
   */
  anchors?: BlueprintPlacementAnchor[] | null;
}

/**
 * Resolved ceremony landmark geometry, with fallbacks matching the default
 * sandbox ceremony layout so behaviour is unchanged when no anchors exist.
 */
interface CeremonyLandmarks {
  altar: { x: number; y: number };
  couple: { x: number; y: number };
  aisleX: number;
  aisleStartY: number;
  aisleEndY: number;
  frontRowLeft: { x: number; y: number };
  frontRowRight: { x: number; y: number };
}

const DEFAULT_CEREMONY_LANDMARKS: CeremonyLandmarks = {
  altar: { x: 500, y: 185 },
  couple: { x: 500, y: 264 },
  aisleX: 500,
  aisleStartY: 815,
  aisleEndY: 295,
  frontRowLeft: { x: 285, y: 358 },
  frontRowRight: { x: 715, y: 358 },
};

function resolveCeremonyLandmarks(anchors?: BlueprintPlacementAnchor[] | null): CeremonyLandmarks {
  if (!anchors || anchors.length === 0) return DEFAULT_CEREMONY_LANDMARKS;
  const byName = new Map(anchors.map((a) => [a.name, a]));
  const d = DEFAULT_CEREMONY_LANDMARKS;
  return {
    altar: byName.get('altar_center') ?? d.altar,
    couple: byName.get('couple_position') ?? d.couple,
    aisleX: byName.get('aisle_mid')?.x ?? byName.get('aisle_start')?.x ?? d.aisleX,
    aisleStartY: byName.get('aisle_start')?.y ?? d.aisleStartY,
    aisleEndY: byName.get('aisle_end')?.y ?? d.aisleEndY,
    frontRowLeft: byName.get('front_row_left') ?? d.frontRowLeft,
    frontRowRight: byName.get('front_row_right') ?? d.frontRowRight,
  };
}

/**
 * Map a default-layout aisle Y coordinate onto the actual aisle extent so
 * processional/recessional positions scale with the room geometry.
 */
function aisleY(landmarks: CeremonyLandmarks, defaultY: number): number {
  const d = DEFAULT_CEREMONY_LANDMARKS;
  const span = d.aisleStartY - d.aisleEndY;
  if (span === 0) return defaultY;
  const t = (defaultY - d.aisleEndY) / span;
  return Math.round(landmarks.aisleEndY + t * (landmarks.aisleStartY - landmarks.aisleEndY));
}

export const BLUEPRINT_CANVAS_WIDTH = 1000;
export const BLUEPRINT_CANVAS_HEIGHT = 1000;

export interface BlueprintPlacementInput {
  position_hint?: string | null;
  facing_hint?: string | null;
  notes?: string | null;
}

export interface PlacementCoordinates {
  x: number;
  y: number;
  rotation: number;
}

function normalizeValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CEREMONY_OFFICIANT_ROLE_RE =
  /\b(officiant|celebrant|minister|priest|vicar|rabbi|imam|registrar)\b/;

function isCeremonyOfficiantRole(normalizedRoleLabel: string): boolean {
  return CEREMONY_OFFICIANT_ROLE_RE.test(normalizedRoleLabel);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const PLACEMENT_COORD_TOKEN = /\[\[coord:([0-9.-]+),([0-9.-]+),([0-9.-]+)\]\]/;

function readPlacementCoordinatesToken(notes?: string | null): PlacementCoordinates | null {
  if (!notes) return null;
  const match = notes.match(PLACEMENT_COORD_TOKEN);
  if (!match) return null;
  const x = Number(match[1]);
  const y = Number(match[2]);
  const rotation = Number(match[3]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rotation)) return null;
  return {
    x: clamp(x, 40, BLUEPRINT_CANVAS_WIDTH - 40),
    y: clamp(y, 40, BLUEPRINT_CANVAS_HEIGHT - 40),
    rotation,
  };
}

function copyCoordTokenRegex(copyIndex: number): RegExp {
  return new RegExp(`\\[\\[c${copyIndex}:([0-9.-]+),([0-9.-]+),([0-9.-]+)\\]\\]`);
}

function readPlacementCoordForCopy(
  notes?: string | null,
  copyIndex = 0,
): PlacementCoordinates | null {
  if (!notes) return null;
  const m = notes.match(copyCoordTokenRegex(copyIndex));
  if (m) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const rotation = Number(m[3]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(rotation)) {
      return {
        x: clamp(x, 40, BLUEPRINT_CANVAS_WIDTH - 40),
        y: clamp(y, 40, BLUEPRINT_CANVAS_HEIGHT - 40),
        rotation,
      };
    }
  }
  if (copyIndex === 0) {
    return readPlacementCoordinatesToken(notes);
  }
  return null;
}

function parsePlacementSeatForCopy(
  notes: string | null | undefined,
  copyIndex: number,
): { side: 'L' | 'R'; rowIndex: number; seatIndex: number } | null {
  if (!notes) return null;
  if (copyIndex > 0) {
    const re = new RegExp(`\\[\\[s${copyIndex}:([LR]):(\\d+):(\\d+)\\]\\]`);
    const match = notes.match(re);
    if (!match) return null;
    const side = match[1] as 'L' | 'R';
    const rowIndex = Number(match[2]);
    const seatIndex = Number(match[3]);
    if (!Number.isFinite(rowIndex) || !Number.isFinite(seatIndex)) return null;
    return { side, rowIndex, seatIndex };
  }
  return parsePlacementSeatToken(notes);
}

function ceremonyAisleCoordinates(
  text: string,
  roleLabel: string,
  index: number,
  copyIndex: number,
  landmarks: CeremonyLandmarks,
): PlacementCoordinates | null {
  const isAisleStart =
    /\b(aisle_start|aisle start|processional|procession|entrance|entry|enter|down\s+the\s+aisle)\b/.test(text);
  const isAisleEnd = /\b(aisle_end|aisle end|recessional|recession|exit|depart|dismiss)\b/.test(text);
  if (!isAisleStart && !isAisleEnd) return null;

  const role = normalizeValue(roleLabel);
  if (isCeremonyOfficiantRole(role)) {
    return { x: landmarks.altar.x, y: landmarks.altar.y, rotation: 180 };
  }

  const isBrideParent = /\b(father|mother|parent)s?\b/.test(role) && /\bbride\b/.test(role);
  const isGroomParent = /\b(father|mother|parent)s?\b/.test(role) && /\bgroom\b/.test(role);
  const isBridesideParty = /\b(maid of honor|matron of honor|maid|bridesmaid|bridesmaids|flower girl|flower)\b/.test(role);
  const isGroomsideParty = /\b(best man|groomsman|groomsmen|ring bearer|ringbearer|ring)\b/.test(role);
  const isBrideLead = /\bbride\b/.test(role) && !isBridesideParty && !isBrideParent;
  const isGroomLead = /\bgroom\b/.test(role) && !isGroomsideParty && !isGroomParent;

  const lane = isBridesideParty || isBrideParent
    ? -18
    : isGroomsideParty || isGroomParent
      ? 18
      : 0;
  const partyStep = Math.min(copyIndex, 5) * 42;
  const fallbackStep = (index % 5) * 34;
  const laneX = landmarks.aisleX + lane;
  const y = (defaultY: number) => aisleY(landmarks, defaultY);

  if (isBrideLead) {
    return { x: laneX, y: y(isAisleEnd ? 440 : 760), rotation: isAisleEnd ? 180 : 0 };
  }
  if (isGroomLead) {
    return { x: laneX, y: y(isAisleEnd ? 470 : 705), rotation: isAisleEnd ? 180 : 0 };
  }
  if (/\b(flower|ring)\b/.test(role)) {
    return { x: laneX, y: y(isAisleEnd ? 650 : 665), rotation: isAisleEnd ? 180 : 0 };
  }
  if (isBridesideParty || isGroomsideParty || /\b(attendant|wedding party)\b/.test(role)) {
    return {
      x: laneX,
      y: y(isAisleEnd ? 535 + partyStep : 690 - partyStep),
      rotation: isAisleEnd ? 180 : 0,
    };
  }

  return { x: laneX, y: y(isAisleEnd ? 560 + fallbackStep : 760 - fallbackStep), rotation: isAisleEnd ? 180 : 0 };
}

function defaultCoordinates(
  index: number,
  total: number,
  kind: SandboxSpaceKind,
  roleLabel: string,
  landmarks: CeremonyLandmarks = DEFAULT_CEREMONY_LANDMARKS,
): PlacementCoordinates {
  const role = normalizeValue(roleLabel);
  if (kind === 'ceremony') {
    const couple = landmarks.couple;
    if (isCeremonyOfficiantRole(role)) {
      return { x: landmarks.altar.x, y: landmarks.altar.y, rotation: 180 };
    }
    if (role === 'bride') return { x: couple.x - 70, y: couple.y - 9, rotation: 20 };
    if (role === 'groom') return { x: couple.x + 70, y: couple.y - 9, rotation: 340 };
    if (/maid|bridesmaid|flower/.test(role)) {
      return { x: couple.x - 185 + (index % 3) * 38, y: couple.y + 71 + (index % 3) * 34, rotation: 45 };
    }
    if (/best man|groomsmen|ring/.test(role)) {
      return { x: couple.x + 150 + (index % 3) * 38, y: couple.y + 71 + (index % 3) * 34, rotation: 315 };
    }
    if (/father|mother|parent/.test(role)) {
      const left = index % 2 === 0;
      const row = left ? landmarks.frontRowLeft : landmarks.frontRowRight;
      return { x: row.x + (left ? -35 : 35), y: row.y + 182 + (index % 3) * 38, rotation: 0 };
    }
    if (/guest|congregation|audience/.test(role)) {
      return { x: landmarks.aisleX, y: aisleY(landmarks, 680), rotation: 0 };
    }
  }

  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radiusX = kind === 'ceremony' ? 220 : 260;
  const radiusY = kind === 'ceremony' ? 160 : 200;
  return {
    x: BLUEPRINT_CANVAS_WIDTH / 2 + Math.cos(angle) * radiusX,
    y: BLUEPRINT_CANVAS_HEIGHT / 2 + Math.sin(angle) * radiusY,
    rotation: ((angle * 180) / Math.PI + 90 + 360) % 360,
  };
}

function rotationFromFacingHint(
  text: string,
  index: number,
  total: number,
  kind: SandboxSpaceKind,
  roleLabel: string,
): number {
  if (/left|west/.test(text)) return 270;
  if (/right|east/.test(text)) return 90;
  if (/back|rear|south|entrance/.test(text)) return 180;
  if (/front|altar|north|ceremony|camera/.test(text)) return 0;
  return defaultCoordinates(index, total, kind, roleLabel).rotation;
}

function ceremonyGuestPlacementCoordinates(
  motionText: string,
  momentName: string,
  copyIndex: number,
  index: number,
): PlacementCoordinates | null {
  const text = `${motionText} ${momentName}`.toLowerCase();

  if (/\b(seated|sitting|from seated|taking seats|settled and seated|listens from seated|observes from seated|applauds from seated)\b/.test(text)) {
    return null;
  }
  if (/\bobserve(?:s|ing)?\s+the\s+processional\b/.test(text)) {
    return null;
  }

  if (/\b(recessional|recession|exit|depart|follow(?:s|ing)?(?:\s+the)?\s+(?:couple\s+)?exit|confetti|celebrates and follows)\b/.test(text)) {
    const side = copyIndex % 2 === 0 ? -1 : 1;
    const band = Math.floor(copyIndex / 8);
    const column = copyIndex % 8;
    return {
      x: clamp(500 + side * (60 + column * 38), 120, 880),
      y: clamp(770 + band * 20, 720, 920),
      rotation: 180,
    };
  }

  if (/\b(mingl|arriv(?:es|al)?|find(?:s|ing)?\s+seating|usher)\b/.test(text) && !/\bsettled\b/.test(text)) {
    const angle = ((index % 12) / 12) * Math.PI;
    return {
      x: clamp(500 + Math.cos(angle) * 220, 140, 860),
      y: clamp(820 + Math.sin(angle) * 40, 760, 920),
      rotation: 0,
    };
  }

  if (/\b(stand(?:ing)?|rise|applaud|ovation)\b/.test(text)) {
    const row = Math.floor(copyIndex / 10);
    const column = copyIndex % 10;
    return {
      x: clamp(280 + column * 48, 120, 880),
      y: clamp(580 - row * 28, 480, 640),
      rotation: 0,
    };
  }

  return null;
}

/**
 * Resolve canvas coordinates for a blueprint moment placement (matches Day Designer floor plan).
 */
export function coordinatesFromBlueprintPlacement(
  placement: BlueprintPlacementInput,
  index: number,
  total: number,
  kind: SandboxSpaceKind,
  roleLabel: string,
  copyIndex = 0,
  chairObjects?: FloorPlanChairObject[],
  options?: BlueprintPlacementResolveOptions,
): PlacementCoordinates {
  const role = normalizeValue(roleLabel);
  const motionText = options?.motionText ?? '';
  const momentName = options?.momentName ?? '';
  const landmarks = resolveCeremonyLandmarks(options?.anchors);

  if (kind === 'ceremony' && isGuestLikeRoleLabel(roleLabel)) {
    const guestCoords = ceremonyGuestPlacementCoordinates(motionText, momentName, copyIndex, index);
    if (guestCoords) return guestCoords;
  }

  if (kind === 'ceremony' && isCeremonyOfficiantRole(role)) {
    return { x: landmarks.altar.x, y: landmarks.altar.y, rotation: 180 };
  }
  const persisted = readPlacementCoordForCopy(placement.notes, copyIndex);
  if (persisted) return persisted;

  // Guest seats are assigned exclusively via assignCeremonySyntheticSeats at runtime.
  // Blueprint [[seat:…]] / [[sN:…]] tokens are authoring hints and must not be reused
  // for guest copies — they cause multiple guests to stack on the same pew.
  if (
    kind === 'ceremony' &&
    chairObjects &&
    chairObjects.length > 0 &&
    !isGuestLikeRoleLabel(roleLabel)
  ) {
    const seatMeta = parsePlacementSeatForCopy(placement.notes, copyIndex);
    if (seatMeta) {
      const resolved = resolveChairSeatCoordinates(chairObjects, seatMeta);
      if (resolved) return resolved;
    }
  }

  const positionText = (placement.position_hint ?? '').toLowerCase();
  const facingText = (placement.facing_hint ?? '').toLowerCase();
  const notesText = (placement.notes ?? '').toLowerCase();
  const text = [positionText, facingText, notesText].filter(Boolean).join(' ');
  const positionAndNotesText = [positionText, notesText].filter(Boolean).join(' ');

  const aisleCoordinates = ceremonyAisleCoordinates(text, roleLabel, index, copyIndex, landmarks);
  if (kind === 'ceremony' && aisleCoordinates) return aisleCoordinates;

  if (kind === 'ceremony' && placement.position_hint === 'ALTAR_FRONT') {
    const base = defaultCoordinates(index, total, kind, roleLabel, landmarks);
    const facingAudience = (placement.facing_hint ?? '').toUpperCase() === 'TOWARD_AUDIENCE';
    const copySpreadX = (copyIndex % 3 - 1) * 22;
    const copySpreadY = Math.floor(copyIndex / 3) * 18;
    return {
      x: clamp(base.x + copySpreadX, 90, BLUEPRINT_CANVAS_WIDTH - 90),
      y: clamp(base.y + copySpreadY, 80, BLUEPRINT_CANVAS_HEIGHT - 80),
      rotation: facingAudience && (role === 'bride' || role === 'groom' || isCeremonyOfficiantRole(role))
        ? 180
        : base.rotation,
    };
  }

  let x = BLUEPRINT_CANVAS_WIDTH / 2;
  let y = BLUEPRINT_CANVAS_HEIGHT / 2;

  if (/left|stage left|bride side/.test(text)) x = 330;
  if (/right|stage right|groom side/.test(text)) x = 670;
  if (/centre|center|middle|central/.test(text)) x = BLUEPRINT_CANVAS_WIDTH / 2;
  if (/front|altar|top|north|ceremony|arch/.test(text)) y = kind === 'ceremony' ? 210 : 250;
  if (/back|rear|south|entrance|door/.test(text)) y = 830;
  if (/guest|audience|congregation|seating/.test(positionAndNotesText)) {
    y = kind === 'ceremony' ? 640 : 600;
  }
  if (/aisle/.test(text)) x = BLUEPRINT_CANVAS_WIDTH / 2;

  const clusterOffset = ((index % 5) - 2) * 34;
  const rowOffset = Math.floor(index / 5) * 28;

  return {
    x: clamp(x + clusterOffset, 90, BLUEPRINT_CANVAS_WIDTH - 90),
    y: clamp(y + rowOffset, 80, BLUEPRINT_CANVAS_HEIGHT - 80),
    rotation: rotationFromFacingHint(text, index, total, kind, roleLabel),
  };
}
