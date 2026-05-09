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
 */

import { PrismaClient } from '@prisma/client';
import { SeedSummary } from '../utils/seed-logger';

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

export function buildMomentSubjectSeeds(activityName: string, momentName: string): MomentSubjectSeed[] {
  const activity = normalizeSeedKey(activityName);
  const moment = normalizeSeedKey(momentName);
  const seeds = new Map<string, MomentSubjectSeed>();

  const add = (roleKey: string, actionText: string, details?: Omit<MomentSubjectSeed, 'roleKey' | 'actionText'>) => {
    const key = normalizeSeedKey(roleKey);
    if (!key || seeds.has(key)) return;
    seeds.set(key, { roleKey: key, actionText, ...(details ?? {}) });
  };

  // Ceremony and liturgy moments
  if (moment.includes('vows')) {
    add('bride', 'Exchanges vows during the ceremony.');
    add('groom', 'Exchanges vows during the ceremony.');
    add('officiant', 'Leads the vows section of the ceremony.');
  }
  if (moment.includes('rings')) {
    add('bride', 'Places ring on partner.');
    add('groom', 'Places ring on partner.');
    add('best_man', 'Presents the rings when prompted.');
    add('maid_of_honour', 'Presents the rings when prompted.');
  }
  if (moment.includes('first_kiss')) {
    add('bride', 'Shares the first kiss.');
    add('groom', 'Shares the first kiss.');
  }
  if (moment.includes('processional')) {
    add('bride', 'Walks the processional aisle.');
    add('groom', 'Waits at the ceremony front for processional.');
    add('officiant', 'Welcomes processional arrivals.');
  }
  if (moment.includes('recessional') || moment.includes('confetti') || moment.includes('exit')) {
    add('bride', 'Leads the recessional exit.');
    add('groom', 'Leads the recessional exit.');
    add('guests', 'Celebrates and follows the couple exit.');
  }

  // Prep / portrait / reception moments
  if (moment.includes('hair') || moment.includes('dress') || moment.includes('make_up') || moment.includes('bouquet')) {
    add('bride', 'Completes bridal prep details.');
    add('bridesmaids', 'Supports bride during prep.');
  }
  if (moment.includes('groom')) {
    add('groom', 'Completes groom prep details.');
    add('groomsmen', 'Supports groom during prep.');
  }
  if (moment.includes('first_look') && moment.includes('father')) {
    add('bride', 'Greets father for first look moment.');
    add('father_of_bride', 'Sees bride for first look moment.');
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
  if (moment.includes('speeches') || moment.includes('toasts')) {
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
    } else if (activity.includes('ceremony')) {
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

  return Array.from(seeds.values());
}

// ─── Template data ────────────────────────────────────────────────────────────

const STANDARD_UK_WEDDING: BlueprintTemplateDef = {
  key: 'standard-uk-wedding',
  display_name: 'Standard UK Wedding',
  event_category: 'Wedding',
  description: 'A full single-day UK wedding: bridal prep, ceremony, portraits, drinks reception, wedding breakfast, and evening reception.',
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
          name: 'Ceremony',
          description: 'Main wedding ceremony — processional through to recessional.',
          default_start_time: '13:00',
          default_duration_minutes: 45,
          duration_min_minutes: 30,
          duration_max_minutes: 60,
          criticality: 'REQUIRED',
          location_label: 'Ceremony Space',
          moments: [
            { name: 'Guests Arriving', duration_seconds: 120, criticality: 'STANDARD' },
            { name: 'Wedding Party Processional', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: "Bride's Processional", duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'Opening Words', duration_seconds: 60, criticality: 'STANDARD' },
            { name: 'Readings', duration_seconds: 180, criticality: 'OPTIONAL' },
            { name: 'Exchange of Vows', duration_seconds: 180, criticality: 'KEY', is_key_moment: true },
            { name: 'Exchange of Rings', duration_seconds: 120, criticality: 'KEY', is_key_moment: true },
            { name: 'First Kiss', duration_seconds: 60, criticality: 'KEY', is_key_moment: true },
            { name: 'Recessional', duration_seconds: 90, criticality: 'KEY', is_key_moment: true },
            { name: 'Confetti Exit', duration_seconds: 120, criticality: 'RECOMMENDED' },
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

            const subjectAssignments = buildMomentSubjectSeeds(actDef.name, momDef.name)
              .map((assignment) => ({
                assignment,
                subjectRoleId: linkedRoleIdsByKey.get(assignment.roleKey),
              }))
              .filter((row): row is { assignment: MomentSubjectSeed; subjectRoleId: number } => row.subjectRoleId != null);

            for (let assignIdx = 0; assignIdx < subjectAssignments.length; assignIdx++) {
              const row = subjectAssignments[assignIdx];
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
                await tx.dayBlueprintMomentPlacement.create({
                  data: {
                    day_blueprint_moment_id: createdMoment.id,
                    day_blueprint_space_slot_id: spaceSlot.id,
                    subject_role_id: row.subjectRoleId,
                    order_index: assignIdx,
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
