/**
 * Moonrise Catalog – Event Templates
 *
 * Consolidated seed that creates the event scheduling foundation:
 *   1. Wedding subject roles (SubjectRole)
 *   2. Event day templates (EventDay)
 *   3. Activity presets with moments per event day (EventDayActivity + EventDayActivityMoment)
 *
 * Prerequisites: moonrise-platform-brand-setup (Moonrise Films brand)
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType, sumSummaries } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.MOONRISE);

// ═══════════════════════════════════════════════════════════════════════
// PART 1 — Wedding Subject Roles
// ═══════════════════════════════════════════════════════════════════════

const WEDDING_SUBJECT_ROLES = [
  { role_name: 'Bride',           description: 'The bride',                    never_group: true,  is_group: false, order_index: 0 },
  { role_name: 'Groom',           description: 'The groom',                    never_group: true,  is_group: false, order_index: 1 },
  { role_name: 'Best Man',        description: 'Best man in the wedding',      never_group: true,  is_group: false, order_index: 2 },
  { role_name: 'Maid of Honor',   description: 'Maid of honor in the wedding', never_group: true,  is_group: false, order_index: 3 },
  { role_name: 'Father of Bride', description: 'Father of the bride',          never_group: true,  is_group: false, order_index: 4 },
  { role_name: 'Mother of Bride', description: 'Mother of the bride',          never_group: true,  is_group: false, order_index: 5 },
  { role_name: 'Father of Groom', description: 'Father of the groom',          never_group: true,  is_group: false, order_index: 6 },
  { role_name: 'Mother of Groom', description: 'Mother of the groom',          never_group: true,  is_group: false, order_index: 7 },
  { role_name: 'Bridesmaids',     description: 'Bridesmaids group',            never_group: false, is_group: true,  order_index: 8 },
  { role_name: 'Groomsmen',       description: 'Groomsmen group',              never_group: false, is_group: true,  order_index: 9 },
  { role_name: 'Flower Girl',     description: 'Flower girl',                  never_group: true,  is_group: false, order_index: 10 },
  { role_name: 'Ring Bearer',     description: 'Ring bearer',                  never_group: true,  is_group: false, order_index: 11 },
  { role_name: 'Guests',          description: 'Wedding guests',               never_group: false, is_group: true,  order_index: 12 },
  { role_name: 'Officiant',       description: 'Officiant or registrar',       never_group: true,  is_group: false, order_index: 13 },
];

async function seedWeddingSubjects(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Wedding Subject Roles');

  const existingRole = await prisma.subjectRole.findFirst({
    where: { brand_id: brandId, role_name: 'Bride' },
  });

  if (existingRole) {
    logger.skipped('Wedding subject roles', 'already exist for this brand');
    return { created: 0, updated: 0, skipped: WEDDING_SUBJECT_ROLES.length, total: WEDDING_SUBJECT_ROLES.length };
  }

  let created = 0;
  for (const roleData of WEDDING_SUBJECT_ROLES) {
    await prisma.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
    created++;
  }

  logger.success(`Created ${created} wedding subject roles`);
  return { created, updated: 0, skipped: 0, total: created };
}

// ═══════════════════════════════════════════════════════════════════════
// PART 2 — Event Day Templates
// ═══════════════════════════════════════════════════════════════════════

const EVENT_DAY_TEMPLATES = [
  { name: 'Wedding Day', description: 'The main event day — ceremony, reception, first look, portraits, toasts, first dance, etc.', order_index: 0 },
];

async function seedEventDays(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Event Day Templates');

  let created = 0;
  let updated = 0;

  for (const tpl of EVENT_DAY_TEMPLATES) {
    const existing = await prisma.eventDay.findFirst({
      where: { brand_id: brandId, name: tpl.name },
    });

    if (existing) {
      await prisma.eventDay.update({
        where: { id: existing.id },
        data: { description: tpl.description, order_index: tpl.order_index },
      });
      updated++;
    } else {
      await prisma.eventDay.create({
        data: { brand_id: brandId, name: tpl.name, description: tpl.description, order_index: tpl.order_index },
      });
      created++;
    }
  }

  const total = created + updated;
  logger.summary('Event day templates', { created, updated, skipped: 0, total });
  return { created, updated, skipped: 0, total };
}

// ═══════════════════════════════════════════════════════════════════════
// PART 3 — Activity Presets per Event Day
// ═══════════════════════════════════════════════════════════════════════

type MomentDef = { name: string; duration_seconds: number; is_key_moment?: boolean; description?: string };
type PresetDef = { name: string; color: string; icon?: string; default_start_time?: string; default_duration_minutes?: number; description?: string; location_label?: string; moments: MomentDef[] };

const PRESETS_BY_DAY: Record<string, PresetDef[]> = {
    'Wedding Day': [
        { name: 'Bridal Prep', color: '#ec4899', default_start_time: '08:00', default_duration_minutes: 120, description: 'Bridal prep — {{location_label}}', location_label: 'Bridal Suite', moments: [
            { name: 'Hair & Makeup', duration_seconds: 3600, description: '{{bride}} and {{maid_of_honor}} having hair and makeup done' },
            { name: 'Getting Dressed', duration_seconds: 900, is_key_moment: true, description: '{{bride}} puts on her wedding dress' },
            { name: 'Final Touches & Veil', duration_seconds: 600, description: '{{bride}} adds final touches — veil, jewellery, perfume' },
            { name: 'Father of Bride Reaction', duration_seconds: 300, is_key_moment: true, description: '{{father_of_bride}} sees {{bride}} for the first time' },
            { name: 'Bridesmaids Preparation', duration_seconds: 600, description: 'Bridesmaids getting dressed and ready together' },
        ]},
        { name: 'Groom Prep', color: '#648CFF', default_start_time: '09:00', default_duration_minutes: 90, description: 'Groom prep — {{location_label}}', location_label: 'Groom\'s Room', moments: [
            { name: 'Getting Dressed', duration_seconds: 900, description: '{{groom}} getting dressed and ready' },
            { name: 'Suit-Up & Tie', duration_seconds: 600, is_key_moment: true, description: '{{groom}} suits up with help from {{best_man}}' },
            { name: 'Groomsmen Candids', duration_seconds: 1200, description: 'Candid moments with {{groom}} and the groomsmen' },
            { name: 'Gift / Letter Exchange', duration_seconds: 600, is_key_moment: true, description: '{{groom}} reads a letter or opens a gift from {{bride}}' },
        ]},
        { name: 'First Look', color: '#a855f7', default_start_time: '11:00', default_duration_minutes: 30, description: 'First look — {{location_label}}', location_label: 'Garden', moments: [
            { name: 'Setup & Anticipation', duration_seconds: 300, description: '{{groom}} waits while {{bride}} approaches from behind' },
            { name: 'The Reveal', duration_seconds: 180, is_key_moment: true, description: '{{bride}} and {{groom}} see each other for the first time' },
            { name: 'Couple\'s Reaction', duration_seconds: 300, is_key_moment: true, description: 'Emotional reactions as {{bride}} and {{groom}} take each other in' },
            { name: 'Quick Portraits', duration_seconds: 600, description: 'Quick couple portraits while the energy is fresh' },
        ]},
        { name: 'Ceremony', color: '#f59e0b', default_start_time: '13:00', default_duration_minutes: 60, description: 'Ceremony — {{location_label}}', location_label: 'Ceremony Space', moments: [
            { name: 'Guest Seating', duration_seconds: 600, description: 'Guests arrive and find their seats as the ceremony space fills' },
            { name: 'Bride Arrival', duration_seconds: 180, description: '{{bride}} arrives at the venue and waits out of sight' },
            { name: 'Officiant Welcome', duration_seconds: 120, description: 'The officiant welcomes everyone and sets the tone' },
            { name: 'Groom Takes Position', duration_seconds: 120, is_key_moment: true, description: '{{groom}} walks to the front and waits for {{bride}}' },
            { name: 'Bridal Party Processional', duration_seconds: 240, is_key_moment: true, description: 'Bridesmaids and groomsmen walk down the aisle' },
            { name: 'Bride Entrance', duration_seconds: 180, is_key_moment: true, description: '{{bride}} walks down the aisle' },
            { name: 'Giving Away', duration_seconds: 120, is_key_moment: true, description: '{{father_of_bride}} gives {{bride}} away' },
            { name: 'Opening Remarks', duration_seconds: 180, description: 'The officiant delivers opening words and welcomes the gathering' },
            { name: 'Readings', duration_seconds: 300, description: 'Selected readings from family or friends' },
            { name: 'Vows Exchange', duration_seconds: 420, is_key_moment: true, description: '{{bride}} and {{groom}} share their personal vows' },
            { name: 'Ring Exchange', duration_seconds: 180, is_key_moment: true, description: '{{bride}} and {{groom}} exchange rings' },
            { name: 'Unity Ceremony', duration_seconds: 240, description: 'A symbolic unity act — candle lighting, sand ceremony, or handfasting' },
            { name: 'Pronouncement', duration_seconds: 60, is_key_moment: true, description: 'The officiant pronounces {{bride}} and {{groom}} as married' },
            { name: 'First Kiss', duration_seconds: 60, is_key_moment: true, description: '{{bride}} and {{groom}} share their first kiss as a married couple' },
            { name: 'Recessional', duration_seconds: 180, is_key_moment: true, description: 'The newlyweds walk back up the aisle together' },
            { name: 'Confetti & Celebration', duration_seconds: 300, is_key_moment: true, description: 'Guests shower the couple with confetti or petals' },
            { name: 'Receiving Line', duration_seconds: 300, description: '{{bride}} and {{groom}} greet guests as they exit the ceremony' },
        ]},
        { name: 'Family Portraits', color: '#10b981', default_start_time: '14:00', default_duration_minutes: 30, description: 'Family portraits — {{location_label}}', location_label: 'Portrait Area', moments: [
            { name: 'Immediate Family', duration_seconds: 600, is_key_moment: true, description: 'Portraits with immediate family of {{bride}} and {{groom}}' },
            { name: 'Extended Family Groups', duration_seconds: 600, description: 'Group photos with extended family' },
            { name: 'Bridal Party', duration_seconds: 600, description: 'Portraits with the full bridal party' },
        ]},
        { name: 'Couple Portraits', color: '#0ea5e9', default_start_time: '14:30', default_duration_minutes: 45, description: 'Couple portraits — {{location_label}}', location_label: 'Grounds', moments: [
            { name: 'Location Walk', duration_seconds: 300, description: '{{bride}} and {{groom}} walk to the portrait location' },
            { name: 'Formal Portraits', duration_seconds: 900, is_key_moment: true, description: 'Classic posed portraits of {{bride}} and {{groom}}' },
            { name: 'Candid / Lifestyle', duration_seconds: 900, description: 'Natural, relaxed moments between {{bride}} and {{groom}}' },
            { name: 'Dramatic / Creative', duration_seconds: 600, is_key_moment: true, description: 'Creative or dramatic portraits of {{bride}} and {{groom}}' },
        ]},
        { name: 'Cocktail Hour', color: '#f97316', default_start_time: '15:15', default_duration_minutes: 60, description: 'Cocktail hour — {{location_label}}', location_label: 'Terrace', moments: [
            { name: 'Guest Mingling', duration_seconds: 1800, description: 'Guests mingle and enjoy the space' },
            { name: 'Canapés & Drinks', duration_seconds: 1200, description: 'Drinks and canapés are served' },
            { name: 'Candid Guest Moments', duration_seconds: 600, description: 'Candid reactions and conversations among guests' },
        ]},
        { name: 'Reception', color: '#14b8a6', default_start_time: '16:30', default_duration_minutes: 180, description: 'Reception — {{location_label}}', location_label: 'Ballroom', moments: [
            { name: 'Grand Entrance', duration_seconds: 300, is_key_moment: true, description: '{{bride}} and {{groom}} are announced and enter the reception' },
            { name: 'Welcome & Seating', duration_seconds: 600, description: 'Guests take their seats and the evening begins' },
            { name: 'Dinner Service', duration_seconds: 3600, description: 'Dinner is served to guests' },
            { name: 'Table Candids', duration_seconds: 1200, description: 'Candid moments at the tables during dinner' },
        ]},
        { name: 'First Dance', color: '#d946ef', default_start_time: '19:30', default_duration_minutes: 10, description: 'First dance — {{location_label}}', location_label: 'Dance Floor', moments: [
            { name: 'First Dance', duration_seconds: 240, is_key_moment: true, description: '{{bride}} and {{groom}} share their first dance as a married couple' },
            { name: 'Parent Dances', duration_seconds: 360, is_key_moment: true, description: '{{bride}} dances with {{father_of_bride}}, {{groom}} dances with {{mother_of_groom}}' },
        ]},
        { name: 'Speeches & Toasts', color: '#8b5cf6', default_start_time: '17:30', default_duration_minutes: 45, description: 'Speeches & toasts', moments: [
            { name: 'Best Man Speech', duration_seconds: 600, is_key_moment: true, description: '{{best_man}} delivers the best man speech' },
            { name: 'Father of Bride Speech', duration_seconds: 600, is_key_moment: true, description: '{{father_of_bride}} gives his speech' },
            { name: 'Groom / Couple Speech', duration_seconds: 600, is_key_moment: true, description: '{{groom}} and {{bride}} thank their guests' },
            { name: 'Maid of Honour Speech', duration_seconds: 480, description: '{{maid_of_honor}} delivers her speech' },
        ]},
        { name: 'Detail Shots', color: '#06b6d4', default_start_time: '10:30', default_duration_minutes: 30, description: 'Detail shots — {{location_label}}', location_label: 'Ceremony & Reception Spaces', moments: [
            { name: 'Rings & Jewellery', duration_seconds: 300, is_key_moment: true, description: 'Close-up shots of the wedding rings and jewellery' },
            { name: 'Flowers & Bouquet', duration_seconds: 300, description: 'Bouquet and floral arrangement details' },
            { name: 'Table Settings & Décor', duration_seconds: 600, description: 'Table settings, centrepieces, and venue décor' },
            { name: 'Stationery & Signage', duration_seconds: 300, description: 'Invitations, menus, place cards, and signage' },
        ]},
        { name: 'Send Off', color: '#ef4444', default_start_time: '21:00', default_duration_minutes: 15, description: 'Send off — {{location_label}}', location_label: 'Venue Entrance', moments: [
            { name: 'Sparkler / Confetti Line', duration_seconds: 300, is_key_moment: true, description: 'Guests line up with sparklers or confetti for the send-off' },
            { name: 'Couple Exit', duration_seconds: 300, is_key_moment: true, description: '{{bride}} and {{groom}} walk through the send-off line' },
            { name: 'Getaway Car', duration_seconds: 180, description: '{{bride}} and {{groom}} depart in their getaway car' },
        ]},
    ],
};

async function seedActivityPresets(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Activity Presets');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const templates = await prisma.eventDay.findMany({ where: { brand_id: brandId } });

  if (templates.length === 0) {
    logger.warning('No event day templates found.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  await prisma.eventDayActivityMoment.deleteMany({
    where: {
      activity_preset: {
        event_day_template: { brand_id: brandId },
      },
    },
  });

  for (const tpl of templates) {
    const presets = PRESETS_BY_DAY[tpl.name];
    if (!presets) {
      skipped++;
      continue;
    }

    for (let i = 0; i < presets.length; i++) {
      const p = presets[i];
      const existing = await prisma.eventDayActivity.findUnique({
        where: { event_day_template_id_name: { event_day_template_id: tpl.id, name: p.name } },
      });

      let presetId: number;

      if (existing) {
        await prisma.eventDayActivity.update({
          where: { id: existing.id },
          data: {
            color: p.color, icon: p.icon ?? null,
            default_start_time: p.default_start_time ?? null,
            default_duration_minutes: p.default_duration_minutes ?? null,
            description: p.description ?? null,
            location_label: p.location_label ?? null,
            order_index: i, is_active: true,
          },
        });
        presetId = existing.id;
        updated++;
      } else {
        const newPreset = await prisma.eventDayActivity.create({
          data: {
            event_day_template_id: tpl.id,
            name: p.name, color: p.color, icon: p.icon ?? null,
            default_start_time: p.default_start_time ?? null,
            default_duration_minutes: p.default_duration_minutes ?? null,
            description: p.description ?? null,
            location_label: p.location_label ?? null,
            order_index: i, is_active: true,
          },
        });
        presetId = newPreset.id;
        created++;
      }

      // Legacy preset moments are intentionally no longer seeded here.
      // The AI planner now creates activity moments from the knowledge base on demand.
    }
  }

  const total = created + updated + skipped;
  logger.summary('Activity presets', { created, updated, skipped, total });
  return { created, updated, skipped, total };
}

// ═══════════════════════════════════════════════════════════════════════
// Main — runs all three parts in sequence
// ═══════════════════════════════════════════════════════════════════════

async function seedEventTemplates(db: PrismaClient): Promise<SeedSummary> {
  prisma = db;
  logger.sectionHeader('Catalog: Event Templates', 'Subject roles + event days + activity presets');
  logger.startTimer('event-templates');

  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) {
    logger.warning('Moonrise Films brand not found, skipping event templates.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  const subjectsSummary = await seedWeddingSubjects(brand.id);
  const daysSummary = await seedEventDays(brand.id);
  const presetsSummary = await seedActivityPresets(brand.id);

  const aggregate = sumSummaries(sumSummaries(subjectsSummary, daysSummary), presetsSummary);
  logger.summary('Event templates (total)', aggregate);
  logger.endTimer('event-templates', 'Event templates seeding');
  return aggregate;
}

export default seedEventTemplates;
