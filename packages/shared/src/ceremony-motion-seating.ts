import { isGuestLikeRoleLabel } from './blueprint-subject-instances';

function normalizeRoleLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const MOTION_OR_RITUAL_RE = new RegExp(
  [
    String.raw`\bwalk`,
    String.raw`\bwalking`,
    String.raw`\bwalks`,
    String.raw`\bprocessional`,
    String.raw`\brecessional`,
    String.raw`\bdown\s+the\s+aisle`,
    String.raw`\benter(?:s|ing)?\b`,
    String.raw`\bexit(?:s|ing)?\b`,
    String.raw`\bstand\s+up\b`,
    String.raw`\bstanding\s+ovation\b`,
    String.raw`\bapproach(?:ing)?\s+(?:the\s+)?altar\b`,
    String.raw`\bring\s+exchange\b`,
    String.raw`\bkiss\b`,
    String.raw`\bvows?\b`,
    String.raw`\bexchange\s+vows\b`,
    String.raw`\bsigning\b`,
    String.raw`\bat\s+altar\b`,
    String.raw`\bprocession\b`,
    String.raw`\bescort`,
    String.raw`\bmove\s+to\s+(?:the\s+)?(?:altar|mic|pulpit|lectern)\b`,
  ].join('|'),
  'i',
);

const CEREMONY_ALTAR_ANCHOR_ROLE_RE =
  /\b(officiant|celebrant|minister|priest|vicar|rabbi|imam|registrar)\b/;

const GUEST_SEATED_RE =
  /\b(seated|sitting|from seated|taking seats|settled and seated|listens from seated|observes from seated|applauds from seated)\b/i;

const GUEST_MOVEMENT_RE =
  /\b(recessional|recession|exit|depart|follow(?:s|ing)?(?:\s+the)?\s+(?:couple\s+)?exit|confetti|celebrates and follows|stand(?:ing)?|rise|ovation|mingl|arriv(?:es|al)?|find(?:s|ing)?\s+seating)\b/i;

/** Bride, groom, officiant stay at altar / focal coordinates, not pews. */
export function ceremonyHardExemptFromSeating(roleLabel: string): boolean {
  const role = normalizeRoleLabel(roleLabel);
  if (role === 'bride' || role === 'groom') return true;
  if (CEREMONY_ALTAR_ANCHOR_ROLE_RE.test(role)) return true;
  return false;
}

/** True when this role's moment copy should use placement/semantic coords instead of pew snap. */
export function ceremonyMotionExemptFromMomentText(combinedLowercase: string): boolean {
  const text = combinedLowercase.trim();
  if (text.length === 0) return false;
  return MOTION_OR_RITUAL_RE.test(text);
}

export function buildCeremonyMotionTextForRole(params: {
  actionText?: string | null;
  actionNotes?: string | null;
  placementPositionHint?: string | null;
  placementNotes?: string | null;
  momentName?: string | null;
}): string {
  return [
    params.actionText ?? '',
    params.actionNotes ?? '',
    params.placementPositionHint ?? '',
    params.placementNotes ?? '',
    params.momentName ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Whether a ceremony role should skip pew snapping for this moment.
 * Guests default to seated pews unless their action/moment implies movement or standing.
 */
export function shouldSkipCeremonySeatSnap(
  roleLabel: string,
  motionText: string,
): boolean {
  if (ceremonyHardExemptFromSeating(roleLabel)) return true;

  const text = motionText.trim().toLowerCase();
  if (text.length === 0) return false;

  if (isGuestLikeRoleLabel(roleLabel)) {
    if (GUEST_SEATED_RE.test(text)) return false;
    if (/\bobserve(?:s|ing)?\s+the\s+processional\b/.test(text)) return false;
    if (GUEST_MOVEMENT_RE.test(text)) return true;
    return false;
  }

  return ceremonyMotionExemptFromMomentText(text);
}

/**
 * Whether a ceremony role should be treated as seated for this moment.
 * Used when seeding `SpaceSlotMomentSubject.seated` and by spatial inference.
 */
export function inferCeremonyMomentSeated(
  roleLabel: string,
  motionText: string,
  options?: { pewSnapped?: boolean },
): boolean {
  if (ceremonyHardExemptFromSeating(roleLabel)) return false;
  if (options?.pewSnapped) return true;

  const text = motionText.trim().toLowerCase();

  if (isGuestLikeRoleLabel(roleLabel)) {
    if (GUEST_SEATED_RE.test(text)) return true;
    if (/\bobserve(?:s|ing)?\s+the\s+processional\b/.test(text)) return true;
    if (GUEST_MOVEMENT_RE.test(text)) return false;
    if (text.length > 0 && ceremonyMotionExemptFromMomentText(text)) return false;
    return true;
  }

  if (GUEST_SEATED_RE.test(text)) return true;
  if (/\bobserve|watch(?:es|ing)?|listen(?:s|ing)?|applaud/i.test(text)) return true;
  if (text.length > 0 && ceremonyMotionExemptFromMomentText(text)) return false;
  return false;
}
