/**
 * Moonrise — Wedding Blueprint Templates
 *
 * Seeds three reusable Day Blueprint templates for the Moonrise Films brand:
 *  1. Standard UK Wedding   — single-day, full coverage
 *  2. Punjabi Wedding       — multi-ceremony structure
 *  3. Catholic Ceremony     — single ceremony with 17 locked canonical moments
 *
 * Idempotent: skips any blueprint whose (brand_id, key) already exists.
 * Each blueprint is created as DRAFT v1 with full day/activity/moment hierarchy.
 *
 * Moment naming (used by `buildMomentSubjectSeeds`): keep **Wedding Party Processional** and
 * **Bride's Processional** (or Catholic `Processional — … Entrance`) distinct so aisle subjects
 * stay ordered — party first, bride second. Pre-ceremony beats live under **Pre-Ceremony & Guest Seating**.
 */

import { PrismaClient } from '@prisma/client';
import { SeedSummary } from '../utils/seed-logger';
import { deriveSpatialHints } from '../../src/content/day-blueprints/services/day-blueprint-spatial-heuristics';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MomentDef {
  name: string;
  description?: string;
  duration_seconds?: number;
  is_key_moment?: boolean;
  criticality?: 'KEY' | 'STANDARD' | 'OPTIONAL' | 'REMOVABLE' | 'RECOMMENDED';
  lock_flags?: Record<string, boolean>;
}

interface ActivityDef {
  name: string;
  description?: string;
  default_start_time?: string;
  default_duration_minutes?: number;
  duration_min_minutes?: number;
  duration_max_minutes?: number;
  criticality?: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  location_label?: string;
  moments: MomentDef[];
}

interface DayDef {
  name: string;
  description?: string;
  default_start_time?: string;
  default_duration_hours?: number;
  activities: ActivityDef[];
}

interface BlueprintTemplateDef {
  key: string;
  display_name: string;
  event_category: string;
  description?: string;
  days: DayDef[];
  /** Extra subject role names beyond the standard wedding set */
  extra_subject_role_names?: string[];
}

interface MomentSubjectSeed {
  roleKey: string;
  actionText: string;
  notes?: string;
}

export function normalizeSeedKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** UK pre-ceremony + main ceremony, Catholic liturgy block, Anand Karaj — not Mehndi/Sangeet “ceremony” wording. */
function isCeremonyFamilyActivity(activityName: string): boolean {
  const a = normalizeSeedKey(activityName);
  if (a.includes('pre_ceremony')) return true;
  if (a === 'ceremony') return true;
  if (a.includes('catholic') && a.includes('ceremony')) return true;
  if (a.includes('anand_karaj')) return true;
  return false;
}

/** Moonrise `Ceremony (100 guests)` chair rows — pew tokens must match this grid. */
function usesMoonriseCeremonyChairSeatGrid(locationLabel?: string): boolean {
  if (!locationLabel) return false;
  const k = locationLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return k === 'ceremony_space';
}

type MoonriseSeatMeta = { side: 'L' | 'R'; rowIndex: number; seatIndex: number };

/** Moonrise ceremony sandbox: 7 rows/side, 5 seats/row — matches `sandbox-room-layout` chairRows. */
const MOONRISE_CEREMONY_SEATS_PER_ROW = 5;
const MOONRISE_PARTY_ROW_INDICES = [0, 1];
const MOONRISE_GUEST_ROW_INDICES = [5, 6];

function buildMoonriseGuestSeatStream(): MoonriseSeatMeta[] {
  const out: MoonriseSeatMeta[] = [];
  for (const rowIndex of MOONRISE_GUEST_ROW_INDICES) {
    for (const side of ['L', 'R'] as const) {
      for (let seatIndex = 0; seatIndex < MOONRISE_CEREMONY_SEATS_PER_ROW; seatIndex += 1) {
        out.push({ side, rowIndex, seatIndex });
      }
    }
  }
  return out;
}

function buildMoonrisePartySeatStream(): MoonriseSeatMeta[] {
  const out: MoonriseSeatMeta[] = [];
  for (const rowIndex of MOONRISE_PARTY_ROW_INDICES) {
    for (const side of ['L', 'R'] as const) {
      for (let seatIndex = 0; seatIndex < MOONRISE_CEREMONY_SEATS_PER_ROW; seatIndex += 1) {
        out.push({ side, rowIndex, seatIndex });
      }
    }
  }
  return out;
}

function formatMoonrisePlacementSeatNotes(copies: MoonriseSeatMeta[]): string {
  if (copies.length === 0) return '';
  const parts: string[] = [];
  for (let i = 0; i < copies.length; i += 1) {
    const s = copies[i];
    if (i === 0) {
      parts.push(`[[seat:${s.side}:${s.rowIndex}:${s.seatIndex}]]`);
    } else {
      parts.push(`[[s${i}:${s.side}:${s.rowIndex}:${s.seatIndex}]]`);
    }
  }
  return parts.join('\n');
}

/** Separate guest-row vs front-row pools so seeded roles never share the same pew seat. */
class MoonriseCeremonySeatAllocator {
  private readonly guest: MoonriseSeatMeta[];
  private readonly party: MoonriseSeatMeta[];
  private gi = 0;
  private pi = 0;

  constructor() {
    this.guest = [...buildMoonriseGuestSeatStream()];
    this.party = [...buildMoonrisePartySeatStream()];
  }

  take(roleLabelLower: string, typicalCount: number): string {
    const isGuest = /\bguest/.test(roleLabelLower);
    const pool = isGuest ? this.guest : this.party;
    let idx = isGuest ? this.gi : this.pi;
    const taken: MoonriseSeatMeta[] = [];
    for (let c = 0; c < typicalCount; c += 1) {
      if (idx >= pool.length) break;
      taken.push(pool[idx]);
      idx += 1;
    }
    if (isGuest) this.gi = idx;
    else this.pi = idx;
    return formatMoonrisePlacementSeatNotes(taken);
  }
}

export function buildMomentSubjectSeeds(activityName: string, momentName: string): MomentSubjectSeed[] {
  const activity = normalizeSeedKey(activityName);
  const moment = normalizeSeedKey(momentName);
  const seeds = new Map<string, MomentSubjectSeed>();

  const add = (roleKey: string, actionText: string, details?: Omit<MomentSubjectSeed, 'roleKey' | 'actionText'>) => {
    const key = normalizeSeedKey(roleKey);
    if (!key || seeds.has(key)) return;
    seeds.set(key, { roleKey: key, actionText, ...(details ?? {}) });
  };

  const finish = (): MomentSubjectSeed[] => Array.from(seeds.values());

  // --- Pre-ceremony (Standard UK: same Ceremony Space canvas, earlier window) ---
  if (activity.includes('pre_ceremony')) {
    if (moment.includes('guest_arrival') || (moment.includes('guest') && moment.includes('mingling'))) {
      add('guests', 'Arrives and mingles; finds seating.', {
        notes: 'Bride is often not in the room yet; adjust placements if your flow differs.',
      });
      add('groomsmen', 'Supports guest flow as ushers.');
      return finish();
    }
    if (moment.includes('family') && moment.includes('vip') && moment.includes('seating')) {
      add('guests', 'Continues taking seats.');
      add('father_of_bride', 'Escorts family toward reserved seating.');
      add('mother_of_bride', 'Takes reserved seating with family.');
      add('father_of_groom', 'Escorts family toward reserved seating.');
      add('mother_of_groom', 'Takes reserved seating with family.');
      add('groomsmen', 'Supports VIP and family seating.');
      return finish();
    }
    if (moment.includes('groom') && moment.includes('groomsmen') && moment.includes('front')) {
      add('groom', 'Takes position at the ceremony front.');
      add('best_man', 'Stands with the groom at the front.');
      add('groomsmen', 'Lines up on the groom side at the front.');
      add('officiant', 'Coordinates lineup and timing with the party.');
      return finish();
    }
    if (moment.includes('final') && moment.includes('seating') && moment.includes('quiet')) {
      add('guests', 'Settled and seated before the processional.');
      add('groom', 'At the front awaiting the ceremony start.');
      add('best_man', 'At the front with the groom.');
      add('groomsmen', 'At positions flanking the ceremony front.');
      add('officiant', 'Signals the room is ready for the entrance sequence.');
      return finish();
    }
    add('guests', 'Present for pre-ceremony flow.');
    add('groomsmen', 'Supports seating and guest flow.');
    return finish();
  }

  // --- Bridal prep (scoped — avoids accidental matches outside prep) ---
  if (activity.includes('bridal_prep')) {
    if (moment.includes('hair') || moment.includes('dress') || moment.includes('make_up') || moment.includes('bouquet')) {
      add('bride', 'Completes bridal prep details.');
      add('bridesmaids', 'Supports bride during prep.');
    }
    if (moment.includes('first_look') && moment.includes('father')) {
      add('bride', 'Greets father for first look moment.');
      add('father_of_bride', 'Sees bride for first look moment.');
    }
  }

  // --- Groom prep (scoped; never use moment.includes('groom') alone — "groomsmen" contains "groom") ---
  if (activity.includes('groom_prep')) {
    if (moment.includes('suit') || moment.includes('buttonhole')) {
      add('groom', 'Completes suit and detail shots.');
      add('groomsmen', 'Supports detail coverage nearby.');
    } else if (moment.includes('groom_getting_ready')) {
      add('groom', 'Completes groom prep details.');
      add('groomsmen', 'Supports groom during prep.');
    } else if (moment.includes('groomsmen_ready')) {
      add('groom', 'Joins groomsmen for the ready shot.');
      add('groomsmen', 'Prepares for group ready shot.');
    }
  }

  // --- Ceremony / liturgy (single matching branch per moment where possible) ---
  const isCeremonyLike =
    activity.includes('ceremony') || activity.includes('anand_karaj') || activity.includes('catholic');

  if (isCeremonyLike) {
    if (moment.includes('opening') && moment.includes('prayer')) {
      add('officiant', 'Leads opening prayer.');
      add('guests', 'Participates per liturgical standing or seating cues.');
    } else if (moment.includes('opening')) {
      add('officiant', 'Delivers opening welcome.');
      add('bride', 'At the front for opening words.');
      add('groom', 'At the front for opening words.');
      add('guests', 'Listens from seated positions.');
    } else if (moment.includes('reading')) {
      add('officiant', 'Introduces readings.');
      add('maid_of_honour', 'May deliver a reading if assigned.');
      add('bride', 'At the front.');
      add('groom', 'At the front.');
      add('guests', 'Listens from seated positions.');
    } else if (moment.includes('vow')) {
      add('bride', 'Exchanges vows during the ceremony.');
      add('groom', 'Exchanges vows during the ceremony.');
      add('officiant', 'Leads the vows section of the ceremony.');
    } else if (moment.includes('ring')) {
      add('bride', 'Places ring on partner.');
      add('groom', 'Places ring on partner.');
      add('best_man', 'Presents the rings when prompted.');
      add('maid_of_honour', 'Presents the rings when prompted.');
    } else if (moment.includes('first_kiss')) {
      add('bride', 'Shares the first kiss.');
      add('groom', 'Shares the first kiss.');
    } else if (moment.includes('pronouncement')) {
      add('officiant', 'Pronounces the couple married.');
      add('bride', 'Hears the pronouncement at the front.');
      add('groom', 'Hears the pronouncement at the front.');
      add('guests', 'Applauds from seated positions.');
    } else if (moment.includes('signing')) {
      add('bride', 'Signs the marriage schedule.');
      add('groom', 'Signs the marriage schedule.');
      add('officiant', 'Completes register formalities.');
      add('best_man', 'Acts as statutory witness when assigned.');
      add('maid_of_honour', 'Acts as statutory witness when assigned.');
      add('guests', 'Observes from seated positions.');
    } else if (moment.includes('photograph')) {
      add('bride', 'Poses for register table photographs.');
      add('groom', 'Poses for register table photographs.');
      add('officiant', 'Coordinates signing-table photographs.');
      add('guests', 'Observes permitted photography.');
    } else if (moment.includes('processional')) {
      const weddingPartyProcessional =
        (moment.includes('wedding') && moment.includes('party')) || moment.includes('wedding_party');
      const brideProcessional =
        (moment.includes('bride') && moment.includes('processional')) || moment.includes('bride_s_processional');
      const darbarProcessional = moment.includes('darbar');

      if (weddingPartyProcessional) {
        add('bridesmaids', 'Walks the aisle in the wedding-party processional.');
        add('groomsmen', 'Walks the aisle in the wedding-party processional.');
        add('best_man', 'Walks the aisle in the wedding-party processional.');
        add('maid_of_honour', 'Walks the aisle in the wedding-party processional.');
        add('flower_girl', 'Walks in the wedding-party processional if included.');
        add('ring_bearer', 'Walks in the wedding-party processional if included.');
        add('groom', 'Waits at the ceremony front for the bride\'s entrance.');
        add('officiant', 'Welcomes the wedding party from the front.');
      } else if (brideProcessional) {
        add('bride', 'Walks the processional aisle.');
        add('father_of_bride', 'Escorts the bride down the aisle when applicable.');
        add('groom', 'Waits at the ceremony front.');
        add('bridesmaids', 'Stands in position after the wedding-party processional.', {
          notes: 'Assumes party entrance precedes bride; reorder moments if your venue combines them.',
        });
        add('groomsmen', 'Stands in position after the wedding-party processional.', {
          notes: 'Assumes party entrance precedes bride; reorder moments if your venue combines them.',
        });
        add('best_man', 'Stands at the front with the groom.');
        add('maid_of_honour', 'Stands in position after the wedding-party processional.');
        add('officiant', 'Greets the bride\'s arrival at the front.');
      } else if (darbarProcessional) {
        add('bride', 'Joins the processional toward the Darbar hall.');
        add('groom', 'Joins the processional toward the Darbar hall.');
        add('officiant', 'Supports the processional lead as applicable.');
        add('guests', 'Observes or follows the processional.');
      } else {
        add('bride', 'Walks or joins the processional.');
        add('groom', 'Leads or joins the processional.');
        add('officiant', 'Welcomes processional arrivals.');
        add('guests', 'Observes the processional.');
      }
    } else if (moment.includes('recessional')) {
      add('bride', 'Leads the recessional exit.');
      add('groom', 'Leads the recessional exit.');
      add('guests', 'Celebrates and follows the couple exit.');
      add('bridesmaids', 'Recesses in party order.');
      add('groomsmen', 'Recesses in party order.');
    } else if (moment.includes('confetti')) {
      add('bride', 'Departs amid confetti.');
      add('groom', 'Departs amid confetti.');
      add('guests', 'Celebrates with confetti.');
      add('bridesmaids', 'Joins the exit line.');
      add('groomsmen', 'Joins the exit line.');
    }
  }

  if (moment.includes('cake')) {
    add('bride', 'Cuts the cake.');
    add('groom', 'Cuts the cake.');
  }
  if (moment.includes('first_dance')) {
    add('bride', 'Performs first dance.');
    add('groom', 'Performs first dance.');
  }
  if (moment.includes('parent_dance')) {
    add('father_of_bride', 'Performs parent dance moment.');
    add('mother_of_bride', 'Performs parent dance moment.');
    add('father_of_groom', 'Performs parent dance moment.');
    add('mother_of_groom', 'Performs parent dance moment.');
  }
  if (moment.includes('speech') || moment.includes('toast')) {
    add('best_man', 'Delivers speech/toast.');
    add('maid_of_honour', 'Delivers speech/toast.');
    add('father_of_bride', 'Delivers speech/toast.');
  }

  // Activity-level fallback
  if (seeds.size === 0) {
    if (activity.includes('bridal_prep')) {
      add('bride', 'Prepares for the wedding day.');
      add('bridesmaids', 'Supports bridal preparations.');
    } else if (activity.includes('groom_prep')) {
      add('groom', 'Prepares for the wedding day.');
      add('groomsmen', 'Supports groom preparations.');
    } else if (activity.includes('ceremony') || activity.includes('anand_karaj') || activity.includes('catholic')) {
      add('bride', 'Takes part in the ceremony.');
      add('groom', 'Takes part in the ceremony.');
      add('officiant', 'Leads the ceremony.');
      add('guests', 'Witnesses the ceremony.');
    } else if (activity.includes('portrait')) {
      add('bride', 'Participates in portraits.');
      add('groom', 'Participates in portraits.');
    } else if (activity.includes('reception') || activity.includes('breakfast')) {
      add('bride', 'Participates in reception coverage.');
      add('groom', 'Participates in reception coverage.');
      add('guests', 'Participates in reception coverage.');
    }
  }

  if (seeds.size === 0) {
    add('bride', `Participates in ${momentName}.`);
    add('groom', `Participates in ${momentName}.`);
  }

  return finish();
}

/**
 * Whether a role should be added as ceremony-family filler for a moment.
 * Prevents absent roles (e.g. bride during wedding-party processional) from
 * receiving "Present for this beat" placements at the altar.
 */
export function shouldIncludeFillerRole(
  activityName: string,
  momentName: string,
  roleKey: string,
): boolean {
  const activity = normalizeSeedKey(activityName);
  const moment = normalizeSeedKey(momentName);
  const role = normalizeSeedKey(roleKey);

  if (activity.includes('bridal_prep')) {
    return ['bride', 'bridesmaids', 'flower_girl', 'maid_of_honour', 'maid_of_honor', 'father_of_bride', 'mother_of_bride'].includes(role);
  }
  if (activity.includes('groom_prep')) {
    return ['groom', 'groomsmen', 'best_man', 'father_of_groom', 'mother_of_groom'].includes(role);
  }

  if (activity.includes('pre_ceremony')) {
    return !['bride', 'bridesmaids', 'maid_of_honour', 'maid_of_honor', 'flower_girl'].includes(role);
  }

  const isCeremonyLike =
    activity.includes('ceremony') ||
    activity.includes('anand_karaj') ||
    (activity.includes('catholic') && activity.includes('ceremony'));

  if (isCeremonyLike) {
    const weddingPartyProcessional =
      (moment.includes('wedding') && moment.includes('party') && moment.includes('processional')) ||
      (moment.includes('wedding_party') && moment.includes('processional'));
    if (weddingPartyProcessional) {
      return !['bride', 'father_of_bride'].includes(role);
    }
    return true;
  }

  if (activity.includes('portrait') || activity.includes('reception') || activity.includes('breakfast') || activity.includes('drink')) {
    if (role === 'officiant') return false;
    return [
      'bride', 'groom', 'guests', 'bridesmaids', 'groomsmen', 'best_man',
      'maid_of_honour', 'maid_of_honor', 'father_of_bride', 'mother_of_bride',
      'father_of_groom', 'mother_of_groom',
    ].includes(role);
  }

  return role === 'bride' || role === 'groom';
}

// ─── Template data ────────────────────────────────────────────────────────────

const STANDARD_UK_WEDDING: BlueprintTemplateDef = {
  key: 'standard-uk-wedding',
  display_name: 'Standard UK Wedding',
  event_category: 'Wedding',
  description: 'A full single-day UK wedding: prep, pre-ceremony guest seating, ceremony, portraits, drinks reception, wedding breakfast, and evening reception.',
  days: [
    {
      name: 'Wedding Day',
      default_start_time: '09:00',
      default_duration_hours: 12,
      activities: [
        {
          name: 'Bridal Prep',
          description: 'Bride and bridal party getting ready — hair, make-up, dress details.',
          default_start_time: '09:00',
          default_duration_minutes: 120,
          duration_min_minutes: 90,
          duration_max_minutes: 150,
          criticality: 'REQUIRED',
          location_label: 'Bridal Suite',
          moments: [
            { name: 'Hair & Make-Up Details', duration_seconds: 180, criticality: 'STANDARD' },
            { name: 'Dress Details Shot', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Bride Getting Into Dress', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'First Look with Father / Escort', duration_seconds: 120, criticality: 'RECOMMENDED' },
            { name: 'Bouquet & Accessories Detail', duration_seconds: 60, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Groom Prep',
          description: 'Groom and groomsmen suiting up, final details.',
          default_start_time: '09:00',
          default_duration_minutes: 60,
          duration_min_minutes: 45,
          duration_max_minutes: 90,
          criticality: 'REQUIRED',
          location_label: 'Groom Suite',
          moments: [
            { name: 'Suit & Buttonhole Details', duration_seconds: 90, criticality: 'STANDARD' },
            { name: 'Groom Getting Ready', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Groomsmen Ready Shot', duration_seconds: 90, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Pre-Ceremony & Guest Seating',
          description:
            'Doors open, guest flow, and seating — before the published ceremony start (not the legal/ritual start).',
          default_start_time: '12:30',
          default_duration_minutes: 30,
          duration_min_minutes: 20,
          duration_max_minutes: 45,
          criticality: 'RECOMMENDED',
          location_label: 'Ceremony Space',
          moments: [
            { name: 'Guest Arrival & Mingling', duration_seconds: 480, criticality: 'STANDARD' },
            { name: 'Family & VIP Seating', duration_seconds: 420, criticality: 'STANDARD' },
            { name: 'Groom & Groomsmen at Front', duration_seconds: 360, criticality: 'STANDARD' },
            { name: 'Final Seating & Room Quiet', duration_seconds: 540, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Ceremony',
          description:
            'Main wedding ceremony from wedding-party processional through recessional — guest ingress is in Pre-Ceremony. Moment durations sum to the 45-minute activity block (UK civil register style).',
          default_start_time: '13:00',
          default_duration_minutes: 45,
          duration_min_minutes: 30,
          duration_max_minutes: 60,
          criticality: 'REQUIRED',
          location_label: 'Ceremony Space',
          moments: [
            { name: 'Wedding Party Processional', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: "Bride's Processional", duration_seconds: 240, criticality: 'KEY', is_key_moment: true },
            { name: 'Opening Words', duration_seconds: 120, criticality: 'STANDARD' },
            { name: 'First Reading', duration_seconds: 210, criticality: 'OPTIONAL' },
            { name: 'Second Reading', duration_seconds: 210, criticality: 'OPTIONAL' },
            { name: 'Exchange of Vows', duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Exchange of Rings', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'First Kiss', duration_seconds: 60, criticality: 'KEY', is_key_moment: true },
            { name: 'Pronouncement', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Signing of Marriage Schedule', duration_seconds: 420, criticality: 'KEY', is_key_moment: true },
            { name: 'Photographs at the Table', duration_seconds: 180, criticality: 'STANDARD' },
            { name: 'Recessional', duration_seconds: 150, criticality: 'KEY', is_key_moment: true },
            { name: 'Confetti Exit', duration_seconds: 330, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Family & Group Portraits',
          description: 'Formal family groupings and wedding party portraits.',
          default_start_time: '14:00',
          default_duration_minutes: 45,
          duration_min_minutes: 30,
          duration_max_minutes: 60,
          criticality: 'REQUIRED',
          location_label: 'Portrait Area',
          moments: [
            { name: 'Immediate Family Groupings', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Wedding Party Group Shot', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Extended Family Groupings', duration_seconds: 180, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Couple Portrait Session',
          description: 'Intimate couples portraits with golden-hour window.',
          default_start_time: '15:00',
          default_duration_minutes: 30,
          duration_min_minutes: 20,
          duration_max_minutes: 45,
          criticality: 'REQUIRED',
          location_label: 'Grounds / Garden',
          moments: [
            { name: 'Intimate Couples Portraits', duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Walking Shot', duration_seconds: 120, criticality: 'STANDARD' },
            { name: 'Golden Hour Shot', duration_seconds: 120, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Drinks Reception',
          description: 'Guests mingling, canapés, and candid coverage.',
          default_start_time: '13:45',
          default_duration_minutes: 75,
          duration_min_minutes: 60,
          duration_max_minutes: 90,
          criticality: 'RECOMMENDED',
          location_label: 'Cocktail Area',
          moments: [
            { name: 'Guests Mingling', duration_seconds: 120, criticality: 'STANDARD' },
            { name: 'Canapé Details', duration_seconds: 60, criticality: 'OPTIONAL' },
            { name: 'Candid Guest Reactions', duration_seconds: 120, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Wedding Breakfast',
          description: 'Seated meal, speeches, and toasts.',
          default_start_time: '16:00',
          default_duration_minutes: 120,
          duration_min_minutes: 90,
          duration_max_minutes: 150,
          criticality: 'REQUIRED',
          location_label: 'Reception Space',
          moments: [
            { name: 'Grand Entrance', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'Venue & Table Details', duration_seconds: 90, criticality: 'STANDARD' },
            { name: "Father of Bride's Speech", duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: "Groom's Speech", duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: "Best Man's Speech", duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Cake Cutting', duration_seconds: 90, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Evening Reception',
          description: 'First dance, DJ set, and evening party coverage.',
          default_start_time: '19:30',
          default_duration_minutes: 90,
          duration_min_minutes: 60,
          duration_max_minutes: 120,
          criticality: 'REQUIRED',
          location_label: 'Dance Floor',
          moments: [
            { name: 'First Dance', duration_seconds: 240, criticality: 'KEY', is_key_moment: true },
            { name: 'Parent Dances', duration_seconds: 180, criticality: 'RECOMMENDED' },
            { name: 'Dance Floor Energy', duration_seconds: 180, criticality: 'STANDARD' },
            { name: 'Sparkler Exit', duration_seconds: 120, criticality: 'OPTIONAL' },
          ],
        },
      ],
    },
  ],
};

const PUNJABI_3DAY_WEDDING: BlueprintTemplateDef = {
  key: 'punjabi-3day-wedding',
  display_name: 'Punjabi Wedding',
  event_category: 'Wedding',
  description: 'Punjabi wedding structure: Mehndi night, main Anand Karaj ceremony day, and evening reception/reception day.',
  extra_subject_role_names: ['Priest / Granthi'],
  days: [
    {
      name: 'Mehndi Night',
      description: 'Pre-wedding celebration with mehndi application, music, and dancing.',
      default_start_time: '17:00',
      default_duration_hours: 5,
      activities: [
        {
          name: 'Mehndi Ceremony',
          description: 'Bride and guests receive mehndi; music and dancing throughout.',
          default_start_time: '17:00',
          default_duration_minutes: 120,
          criticality: 'REQUIRED',
          location_label: 'Mehndi Venue',
          moments: [
            { name: 'Mehndi Setup & Décor Details', duration_seconds: 90, criticality: 'STANDARD' },
            { name: 'Bride Receiving Mehndi', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Guests Receiving Mehndi', duration_seconds: 120, criticality: 'STANDARD' },
            { name: 'Dhol & Dancing', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Mehndi Reveal', duration_seconds: 90, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Sangeet / Giddha',
          description: 'Song and dance performances from both families.',
          default_start_time: '19:30',
          default_duration_minutes: 90,
          criticality: 'RECOMMENDED',
          location_label: 'Mehndi Venue',
          moments: [
            { name: 'Family Performances', duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Couple Entrance', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'Group Dance', duration_seconds: 180, criticality: 'STANDARD' },
          ],
        },
      ],
    },
    {
      name: 'Ceremony Day',
      description: 'Main Anand Karaj ceremony, family portraits, and daytime celebrations.',
      default_start_time: '08:00',
      default_duration_hours: 10,
      activities: [
        {
          name: 'Bridal Prep',
          description: 'Bride in bridal suite — sari/lehenga, jewellery, and family moments.',
          default_start_time: '08:00',
          default_duration_minutes: 120,
          criticality: 'REQUIRED',
          location_label: 'Bridal Suite',
          moments: [
            { name: 'Getting Ready Details', duration_seconds: 180, criticality: 'STANDARD' },
            { name: 'Bride in Full Attire', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Chooda Ceremony (if applicable)', duration_seconds: 120, criticality: 'OPTIONAL' },
            { name: 'Family First Look', duration_seconds: 90, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Baraat',
          description: "Groom's procession arriving at the venue.",
          default_start_time: '11:00',
          default_duration_minutes: 30,
          criticality: 'REQUIRED',
          location_label: 'Venue Entrance',
          moments: [
            { name: 'Groom on Horse / in Car', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Baraat Dance Procession', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Milni (Family Introductions)', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
          ],
        },
        {
          name: 'Anand Karaj Ceremony',
          description: 'Sikh wedding ceremony — four Laavan circling of the Guru Granth Sahib.',
          default_start_time: '12:00',
          default_duration_minutes: 60,
          duration_min_minutes: 45,
          duration_max_minutes: 90,
          criticality: 'REQUIRED',
          location_label: 'Gurdwara / Ceremony Hall',
          moments: [
            { name: 'Processional to Darbar Hall', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'Ardas (Opening Prayer)', duration_seconds: 60, criticality: 'KEY', is_key_moment: true },
            { name: 'Palla Rasam (Giving Away)', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'First Laav', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Second Laav', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Third Laav', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Fourth Laav', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Anand Sahib & Ardas (Closing)', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
          ],
        },
        {
          name: 'Family Portraits & Couple Session',
          description: 'Formal family groupings and intimate couples portraits.',
          default_start_time: '13:30',
          default_duration_minutes: 60,
          criticality: 'REQUIRED',
          location_label: 'Portrait Area',
          moments: [
            { name: 'Combined Family Group Shot', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Bride & Groom Family Groups', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Couples Portraits', duration_seconds: 240, criticality: 'KEY', is_key_moment: true },
          ],
        },
        {
          name: 'Daytime Celebration',
          description: 'Lunch, entertainment, and candid coverage.',
          default_start_time: '14:30',
          default_duration_minutes: 90,
          criticality: 'RECOMMENDED',
          location_label: 'Reception Space',
          moments: [
            { name: 'Venue & Food Details', duration_seconds: 90, criticality: 'STANDARD' },
            { name: 'Guest Candids', duration_seconds: 120, criticality: 'STANDARD' },
            { name: 'Dance Performances', duration_seconds: 180, criticality: 'RECOMMENDED' },
          ],
        },
      ],
    },
    {
      name: 'Evening Reception',
      description: 'Grand evening reception with speeches, dinner, and dancing.',
      default_start_time: '18:00',
      default_duration_hours: 5,
      activities: [
        {
          name: 'Grand Entrance & Speeches',
          description: "Couple's grand entrance, family speeches, and toasts.",
          default_start_time: '18:00',
          default_duration_minutes: 60,
          criticality: 'REQUIRED',
          location_label: 'Banquet Hall',
          moments: [
            { name: "Couple's Grand Entrance", duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Family Speeches', duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Venue & Décor Details', duration_seconds: 90, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Vidaai (Farewell)',
          description: "Emotional farewell as the bride leaves her family home.",
          default_start_time: '22:00',
          default_duration_minutes: 30,
          criticality: 'RECOMMENDED',
          location_label: 'Venue Entrance',
          moments: [
            { name: 'Bride Farewell with Family', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Couple Departs Together', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
          ],
        },
        {
          name: 'Evening Party',
          description: 'Dancing, DJ set, and evening celebrations.',
          default_start_time: '20:00',
          default_duration_minutes: 90,
          criticality: 'REQUIRED',
          location_label: 'Dance Floor',
          moments: [
            { name: 'First Dance', duration_seconds: 240, criticality: 'KEY', is_key_moment: true },
            { name: 'Bhangra & Dance Floor', duration_seconds: 240, criticality: 'KEY', is_key_moment: true },
            { name: 'Candid Guest Energy', duration_seconds: 120, criticality: 'STANDARD' },
          ],
        },
      ],
    },
  ],
};

/** Catholic ceremony moments are locked — the AI may not add or remove. */
const CATHOLIC_CEREMONY_MOMENTS: MomentDef[] = [
  { name: 'Processional — Wedding Party Entrance', duration_seconds: 90,  is_key_moment: true,  criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: "Processional — Bride's Entrance",        duration_seconds: 120, is_key_moment: true,  criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Opening Greeting by Priest',             duration_seconds: 60,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Opening Prayer (Collect)',               duration_seconds: 60,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Liturgy of the Word — First Reading',   duration_seconds: 120, is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Responsorial Psalm',                     duration_seconds: 90,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Second Reading',                         duration_seconds: 120, is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Gospel Reading',                         duration_seconds: 90,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Homily',                                 duration_seconds: 360, is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Declaration of Intent',                  duration_seconds: 90,  is_key_moment: true,  criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Exchange of Vows',                       duration_seconds: 180, is_key_moment: true,  criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Blessing & Exchange of Rings',           duration_seconds: 120, is_key_moment: true,  criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Prayer of the Faithful',                 duration_seconds: 90,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Liturgy of the Eucharist',               duration_seconds: 300, is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Our Father',                             duration_seconds: 60,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Sign of Peace',                          duration_seconds: 60,  is_key_moment: false, criticality: 'KEY',  lock_flags: { name: true, order: true } },
  { name: 'Recessional',                            duration_seconds: 90,  is_key_moment: true,  criticality: 'KEY',  lock_flags: { name: true, order: true } },
];

const CATHOLIC_CEREMONY: BlueprintTemplateDef = {
  key: 'catholic-ceremony-17',
  display_name: 'Catholic Ceremony',
  event_category: 'Wedding',
  description: 'Full Roman Catholic wedding ceremony with 17 canonical locked moments. Includes prep, portraits, and reception activities.',
  extra_subject_role_names: ['Priest / Officiant'],
  days: [
    {
      name: 'Wedding Day',
      default_start_time: '09:00',
      default_duration_hours: 11,
      activities: [
        {
          name: 'Bridal Prep',
          description: 'Bride getting ready with bridal party.',
          default_start_time: '09:00',
          default_duration_minutes: 120,
          criticality: 'REQUIRED',
          location_label: 'Bridal Suite',
          moments: [
            { name: 'Getting Ready Details', duration_seconds: 180, criticality: 'STANDARD' },
            { name: 'Bride in Full Dress', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Bridal Party Ready Shot', duration_seconds: 90, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Groom Prep',
          description: 'Groom and groomsmen getting ready.',
          default_start_time: '09:00',
          default_duration_minutes: 60,
          criticality: 'REQUIRED',
          location_label: 'Groom Suite',
          moments: [
            { name: 'Groom & Groomsmen Details', duration_seconds: 90, criticality: 'STANDARD' },
            { name: 'Groom Ready Shot', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
          ],
        },
        {
          name: 'Catholic Ceremony',
          description: 'Full Roman Catholic wedding Mass with 17 canonical liturgical moments.',
          default_start_time: '12:00',
          default_duration_minutes: 60,
          duration_min_minutes: 50,
          duration_max_minutes: 80,
          criticality: 'REQUIRED',
          location_label: 'Church',
          moments: CATHOLIC_CEREMONY_MOMENTS,
        },
        {
          name: 'Confetti & Church Steps',
          description: 'Confetti exit and church steps portraits.',
          default_start_time: '13:15',
          default_duration_minutes: 15,
          criticality: 'RECOMMENDED',
          location_label: 'Church Entrance',
          moments: [
            { name: 'Confetti Throw', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'Steps Group Shot', duration_seconds: 90, criticality: 'STANDARD' },
          ],
        },
        {
          name: 'Family & Group Portraits',
          description: 'Formal portraits at the reception venue.',
          default_start_time: '14:30',
          default_duration_minutes: 45,
          criticality: 'REQUIRED',
          location_label: 'Portrait Area',
          moments: [
            { name: 'Family Groupings', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Wedding Party Shot', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
          ],
        },
        {
          name: 'Couple Portrait Session',
          description: 'Intimate couples portraits in the grounds.',
          default_start_time: '15:30',
          default_duration_minutes: 30,
          criticality: 'REQUIRED',
          location_label: 'Grounds / Garden',
          moments: [
            { name: 'Intimate Couples Portraits', duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Golden Hour Shot', duration_seconds: 120, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Wedding Breakfast & Speeches',
          description: 'Seated meal and toasts.',
          default_start_time: '16:00',
          default_duration_minutes: 120,
          criticality: 'REQUIRED',
          location_label: 'Reception Space',
          moments: [
            { name: 'Grand Entrance', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'Venue & Table Details', duration_seconds: 90, criticality: 'STANDARD' },
            { name: "Father of Bride's Speech", duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: "Groom's Speech", duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: "Best Man's Speech", duration_seconds: 300, criticality: 'KEY', is_key_moment: true },
            { name: 'Cake Cutting', duration_seconds: 90, criticality: 'RECOMMENDED' },
          ],
        },
        {
          name: 'Evening Reception',
          description: 'First dance, party, and evening celebrations.',
          default_start_time: '19:30',
          default_duration_minutes: 90,
          criticality: 'REQUIRED',
          location_label: 'Dance Floor',
          moments: [
            { name: 'First Dance', duration_seconds: 240, criticality: 'KEY', is_key_moment: true },
            { name: 'Parent Dances', duration_seconds: 180, criticality: 'RECOMMENDED' },
            { name: 'Dance Floor Energy', duration_seconds: 180, criticality: 'STANDARD' },
          ],
        },
      ],
    },
  ],
};

const TEMPLATES: BlueprintTemplateDef[] = [
  STANDARD_UK_WEDDING,
  PUNJABI_3DAY_WEDDING,
  CATHOLIC_CEREMONY,
];

// ─── Seed function ────────────────────────────────────────────────────────────
//
// Existing DBs: this seed is idempotent per (brand, blueprint key) and skips when
// the blueprint already exists. To refresh moment actions/placements on old rows,
// use `scripts/backfill-wedding-template-moment-subjects.ts` (additive only) or
// edit the blueprint manually — backfill does not remove stale role rows.

export async function seedWeddingBlueprintTemplates(prisma: PrismaClient): Promise<SeedSummary> {
  console.log('[WeddingBlueprintTemplates] Seeding wedding blueprint templates...');

  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) throw new Error('[WeddingBlueprintTemplates] Moonrise Films brand not found');

  // Pre-load all subject roles for this brand so we can link them
  const subjectRoles = await prisma.subjectRole.findMany({ where: { brand_id: brand.id } });
  const roleByName = new Map(subjectRoles.map((r) => [r.role_name.toLowerCase(), r]));

  // Ensure sandbox location role exists (mirrors DayBlueprintDefaultsService)
  let sandboxRole = await prisma.dayBlueprintLocationRole.findFirst({
    where: { brand_id: brand.id, key: 'sandbox' },
  });
  if (!sandboxRole) {
    sandboxRole = await prisma.dayBlueprintLocationRole.create({
      data: {
        brand_id: brand.id,
        key: 'sandbox',
        display_name: 'Sandbox',
        description: 'Generic sandbox location for drafting placements before real venue mappings are added.',
        is_active: true,
      },
    });
  }

  let created = 0;
  let skipped = 0;

  for (const template of TEMPLATES) {
    // Idempotency check
    const existing = await prisma.dayBlueprint.findUnique({
      where: { brand_id_key: { brand_id: brand.id, key: template.key } },
      select: { id: true },
    });
    if (existing) {
      console.log(`[WeddingBlueprintTemplates] Skipped: "${template.display_name}" (already exists)`);
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Blueprint header
      const blueprint = await tx.dayBlueprint.create({
        data: {
          brand_id: brand.id,
          key: template.key,
          display_name: template.display_name,
          event_category: template.event_category,
          description: template.description ?? null,
          is_system_seeded: true,
          is_active: true,
          order_index: 0,
        },
      });

      // 2. Version 1 DRAFT
      const version = await tx.dayBlueprintVersion.create({
        data: {
          day_blueprint_id: blueprint.id,
          version_number: 1,
          status: 'DRAFT',
          change_summary: 'Initial template — system seeded',
        },
      });

      // 3. Standard wedding subject roles
      const weddingRoleNames = [
        'Bride', 'Groom', 'Best Man', 'Maid of Honour',
        'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom',
        'Bridesmaids', 'Groomsmen', 'Flower Girl', 'Ring Bearer', 'Guests', 'Officiant',
      ];
      const allRoleNames = [...weddingRoleNames, ...(template.extra_subject_role_names ?? [])];
      const primaryRoles = new Set(['bride', 'groom']);
      const typicalCounts: Record<string, number> = { bridesmaids: 4, groomsmen: 4, guests: 100 };
      const linkedRoleIdsByKey = new Map<string, number>();

      for (let i = 0; i < allRoleNames.length; i++) {
        const roleName = allRoleNames[i];
        const role = roleByName.get(roleName.toLowerCase());
        if (!role) continue; // role doesn't exist in this brand yet
        const key = roleName.toLowerCase();
        await tx.dayBlueprintSubjectRole.upsert({
          where: { day_blueprint_version_id_subject_role_id: { day_blueprint_version_id: version.id, subject_role_id: role.id } },
          update: {},
          create: {
            day_blueprint_version_id: version.id,
            subject_role_id: role.id,
            is_primary: primaryRoles.has(key),
            typical_count: typicalCounts[key] ?? 1,
            order_index: i,
          },
        });
        const normalized = normalizeSeedKey(roleName);
        linkedRoleIdsByKey.set(normalized, role.id);
        // Support both UK and US spellings.
        if (normalized === 'maid_of_honour') linkedRoleIdsByKey.set('maid_of_honor', role.id);
      }

      const typicalByRoleId = new Map<number, number>();
      const idToDisplayName = new Map<number, string>();
      for (const roleName of allRoleNames) {
        const role = roleByName.get(roleName.toLowerCase());
        if (!role) continue;
        const keyLo = roleName.toLowerCase();
        typicalByRoleId.set(role.id, Math.max(1, typicalCounts[keyLo] ?? 1));
        idToDisplayName.set(role.id, roleName);
      }

      // 4. Days → Activities → Moments
      for (let dayIdx = 0; dayIdx < template.days.length; dayIdx++) {
        const dayDef = template.days[dayIdx];
        const day = await tx.dayBlueprintDay.create({
          data: {
            day_blueprint_version_id: version.id,
            name: dayDef.name,
            description: dayDef.description ?? null,
            default_start_time: dayDef.default_start_time ?? null,
            default_duration_hours: dayDef.default_duration_hours ?? null,
            order_index: dayIdx,
          },
        });

        for (let actIdx = 0; actIdx < dayDef.activities.length; actIdx++) {
          const actDef = dayDef.activities[actIdx];

          // Ensure location role (named or sandbox fallback)
          let locationRole = sandboxRole!;
          if (actDef.location_label) {
            const key = actDef.location_label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
            const existing = await tx.dayBlueprintLocationRole.findFirst({
              where: { brand_id: brand.id, key },
            });
            locationRole = existing ?? await tx.dayBlueprintLocationRole.create({
              data: {
                brand_id: brand.id,
                key,
                display_name: actDef.location_label.trim(),
                is_active: true,
              },
            });
          }

          // Ensure space slot for this version + location role
          const slotKey = locationRole.key + '_slot';
          let spaceSlot = await tx.dayBlueprintSpaceSlot.findFirst({
            where: { day_blueprint_version_id: version.id, day_blueprint_location_role_id: locationRole.id },
          });
          if (!spaceSlot) {
            spaceSlot = await tx.dayBlueprintSpaceSlot.create({
              data: {
                day_blueprint_version_id: version.id,
                day_blueprint_location_role_id: locationRole.id,
                key: slotKey,
                label: locationRole.display_name,
                description: `Default canvas for ${locationRole.display_name}.`,
              },
            });
          }

          const activity = await tx.dayBlueprintActivity.create({
            data: {
              day_blueprint_day_id: day.id,
              name: actDef.name,
              description: actDef.description ?? null,
              default_start_time: actDef.default_start_time ?? null,
              default_duration_minutes: actDef.default_duration_minutes ?? null,
              duration_min_minutes: actDef.duration_min_minutes ?? null,
              duration_max_minutes: actDef.duration_max_minutes ?? null,
              criticality: actDef.criticality ?? 'REQUIRED',
              order_index: actIdx,
            },
          });

          // Link activity to location role
          await tx.dayBlueprintActivityLocation.create({
            data: {
              day_blueprint_activity_id: activity.id,
              day_blueprint_location_role_id: locationRole.id,
              is_primary: true,
            },
          });

          for (let momIdx = 0; momIdx < actDef.moments.length; momIdx++) {
            const momDef = actDef.moments[momIdx];
            const createdMoment = await tx.dayBlueprintMoment.create({
              data: {
                day_blueprint_activity_id: activity.id,
                name: momDef.name,
                description: momDef.description ?? null,
                duration_seconds: momDef.duration_seconds ?? 60,
                order_index: momIdx,
                is_key_moment: momDef.is_key_moment ?? false,
                criticality: (momDef.criticality === 'RECOMMENDED' ? 'OPTIONAL' : momDef.criticality) ?? 'STANDARD',
                lock_flags: momDef.lock_flags ?? undefined,
              },
            });

            const isFill = isCeremonyFamilyActivity(actDef.name);
            const useSeatGrid = usesMoonriseCeremonyChairSeatGrid(actDef.location_label);

            const baseRows = buildMomentSubjectSeeds(actDef.name, momDef.name)
              .map((assignment) => ({
                assignment,
                subjectRoleId: linkedRoleIdsByKey.get(normalizeSeedKey(assignment.roleKey)),
              }))
              .filter((row): row is { assignment: MomentSubjectSeed; subjectRoleId: number } => row.subjectRoleId != null);

            const seedKeys = new Set(baseRows.map((r) => normalizeSeedKey(r.assignment.roleKey)));

            const fillerRows: { assignment: MomentSubjectSeed; subjectRoleId: number }[] = [];
            if (isFill) {
              for (const roleName of allRoleNames) {
                const role = roleByName.get(roleName.toLowerCase());
                if (!role) continue;
                const rk = normalizeSeedKey(roleName);
                if (seedKeys.has(rk)) continue;
                if (!shouldIncludeFillerRole(actDef.name, momDef.name, rk)) continue;
                fillerRows.push({
                  assignment: {
                    roleKey: rk,
                    actionText: 'Present for this beat of the day.',
                    notes: undefined,
                  },
                  subjectRoleId: role.id,
                });
              }
            }

            const subjectAssignments = [...baseRows, ...fillerRows];
            const seatAllocator = useSeatGrid && isFill ? new MoonriseCeremonySeatAllocator() : null;

            for (let assignIdx = 0; assignIdx < subjectAssignments.length; assignIdx++) {
              const row = subjectAssignments[assignIdx];
              const roleLabel =
                idToDisplayName.get(row.subjectRoleId) ?? row.assignment.roleKey.replace(/_/g, ' ');

              await tx.dayBlueprintMomentAction.create({
                data: {
                  day_blueprint_moment_id: createdMoment.id,
                  subject_role_id: row.subjectRoleId,
                  action_text: row.assignment.actionText,
                  notes: row.assignment.notes,
                  order_index: assignIdx,
                },
              });

              if (spaceSlot) {
                const hints = isFill
                  ? deriveSpatialHints({
                      roleName: roleLabel,
                      activityName: actDef.name,
                      momentName: momDef.name,
                      actionText: row.assignment.actionText,
                      roleId: row.subjectRoleId,
                    })
                  : null;

                let placementNotes: string | null = null;
                if (seatAllocator) {
                  const tc = typicalByRoleId.get(row.subjectRoleId) ?? 1;
                  const raw = seatAllocator.take(roleLabel.toLowerCase(), tc);
                  placementNotes = raw.trim().length > 0 ? raw : null;
                }

                await tx.dayBlueprintMomentPlacement.create({
                  data: {
                    day_blueprint_moment_id: createdMoment.id,
                    day_blueprint_space_slot_id: spaceSlot.id,
                    subject_role_id: row.subjectRoleId,
                    order_index: assignIdx,
                    ...(hints ? { position_hint: hints.position, facing_hint: hints.facing } : {}),
                    ...(placementNotes ? { notes: placementNotes } : {}),
                  },
                });
              }
            }
          }
        }
      }

      // 5. Lock rule: Catholic ceremony moment count is fixed at 17
      if (template.key === 'catholic-ceremony-17') {
        const catholicActivity = await tx.dayBlueprintActivity.findFirst({
          where: { day: { day_blueprint_version_id: version.id }, name: 'Catholic Ceremony' },
          select: { id: true },
        });
        if (catholicActivity) {
          await tx.dayBlueprintLockRule.create({
            data: {
              day_blueprint_version_id: version.id,
              scope: 'ACTIVITY',
              target_id: catholicActivity.id,
              rule_key: 'moment_count',
              rule_value: { exact: 17 },
              notes: 'Roman Catholic ceremony has exactly 17 canonical liturgical moments.',
            },
          });
        }
      }
    });

    created++;
    console.log(`[WeddingBlueprintTemplates] Created: "${template.display_name}"`);
  }

  const total = created + skipped;
  console.log(`[WeddingBlueprintTemplates] Created: ${created}, Skipped: ${skipped}`);
  return { created, updated: 0, skipped, total };
}

export default seedWeddingBlueprintTemplates;
