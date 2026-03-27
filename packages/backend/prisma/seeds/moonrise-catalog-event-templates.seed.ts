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
  { role_name: 'Bride',           description: 'The bride',                    is_core: true,  never_group: true,  is_group: false, order_index: 0 },
  { role_name: 'Groom',           description: 'The groom',                    is_core: true,  never_group: true,  is_group: false, order_index: 1 },
  { role_name: 'Best Man',        description: 'Best man in the wedding',      is_core: true,  never_group: true,  is_group: false, order_index: 2 },
  { role_name: 'Maid of Honor',   description: 'Maid of honor in the wedding', is_core: true,  never_group: true,  is_group: false, order_index: 3 },
  { role_name: 'Father of Bride', description: 'Father of the bride',          is_core: false, never_group: true,  is_group: false, order_index: 4 },
  { role_name: 'Mother of Bride', description: 'Mother of the bride',          is_core: false, never_group: true,  is_group: false, order_index: 5 },
  { role_name: 'Father of Groom', description: 'Father of the groom',          is_core: false, never_group: true,  is_group: false, order_index: 6 },
  { role_name: 'Mother of Groom', description: 'Mother of the groom',          is_core: false, never_group: true,  is_group: false, order_index: 7 },
  { role_name: 'Bridesmaids',     description: 'Bridesmaids group',            is_core: false, never_group: false, is_group: true,  order_index: 8 },
  { role_name: 'Groomsmen',       description: 'Groomsmen group',              is_core: false, never_group: false, is_group: true,  order_index: 9 },
  { role_name: 'Flower Girl',     description: 'Flower girl',                  is_core: false, never_group: true,  is_group: false, order_index: 10 },
  { role_name: 'Ring Bearer',     description: 'Ring bearer',                  is_core: false, never_group: true,  is_group: false, order_index: 11 },
  { role_name: 'Guests',          description: 'Wedding guests',               is_core: false, never_group: false, is_group: true,  order_index: 12 },
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
  { name: 'Pre-Wedding Day',   description: 'Activities before the main event — rehearsal dinner, welcome party, bridal prep shopping, etc.', order_index: 0 },
  { name: 'Wedding Day',       description: 'The main event day — ceremony, reception, first look, portraits, toasts, first dance, etc.',       order_index: 1 },
  { name: 'Day After Session', description: 'Post-wedding creative session — trash the dress, couples portraits, drone shots, etc.',             order_index: 2 },
  { name: 'Engagement Session',description: 'Pre-wedding engagement shoot — location portraits, lifestyle footage, interview.',                  order_index: 3 },
  { name: 'Rehearsal Dinner',  description: 'Evening before the wedding — rehearsal, dinner, toasts, candid moments.',                           order_index: 4 },
  { name: 'Getting Ready',     description: 'Morning-of preparations — hair, makeup, suit-up, detail shots, letters, gifts.',                    order_index: 5 },
  { name: 'Welcome Party',     description: 'Welcome event for destination weddings — cocktails, meet-and-greet, casual footage.',                order_index: 6 },
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
type PresetDef = { name: string; color: string; icon?: string; default_start_time?: string; default_duration_minutes?: number; description?: string; moments: MomentDef[] };

const PRESETS_BY_DAY: Record<string, PresetDef[]> = {
    'Pre-Wedding Day': [
        { name: 'Rehearsal', color: '#8b5cf6', default_start_time: '15:00', default_duration_minutes: 60, description: 'Run-through of ceremony logistics at the venue', moments: [
            { name: 'Arrival & Setup', duration_seconds: 600 },
            { name: 'Walk-Through', duration_seconds: 1200, is_key_moment: true },
            { name: 'Practice Run', duration_seconds: 1200 },
            { name: 'Notes & Adjustments', duration_seconds: 600 },
        ]},
        { name: 'Welcome Party', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 120, description: 'Casual welcome gathering for guests the eve before', moments: [
            { name: 'Guest Arrival', duration_seconds: 900 },
            { name: 'Welcome Drinks', duration_seconds: 1800 },
            { name: 'Mingling & Candids', duration_seconds: 2400 },
            { name: 'Short Speeches', duration_seconds: 600, is_key_moment: true },
        ]},
        { name: 'Bridal Prep Shopping', color: '#ec4899', default_start_time: '10:00', default_duration_minutes: 90, description: 'Last-minute shopping or final fitting trip', moments: [
            { name: 'Store Arrival', duration_seconds: 300 },
            { name: 'Browsing & Trying On', duration_seconds: 3600 },
            { name: 'Decision Moment', duration_seconds: 600, is_key_moment: true },
        ]},
        { name: 'Mehndi / Henna', color: '#d946ef', default_start_time: '12:00', default_duration_minutes: 120, description: 'Traditional henna ceremony for cultural weddings', moments: [
            { name: 'Henna Artist Begins', duration_seconds: 600 },
            { name: 'Bride\'s Henna Application', duration_seconds: 3600, is_key_moment: true },
            { name: 'Guest Henna', duration_seconds: 2400 },
            { name: 'Dancing & Celebration', duration_seconds: 1200, is_key_moment: true },
        ]},
        { name: 'Rehearsal Dinner', color: '#14b8a6', default_start_time: '18:00', default_duration_minutes: 120, description: 'Formal dinner after the ceremony rehearsal', moments: [
            { name: 'Guest Arrival & Drinks', duration_seconds: 900 },
            { name: 'Dinner Service', duration_seconds: 3600 },
            { name: 'Toasts & Speeches', duration_seconds: 1200, is_key_moment: true },
            { name: 'Candid Moments', duration_seconds: 900 },
        ]},
        { name: 'Vendor Walk-Through', color: '#06b6d4', default_start_time: '11:00', default_duration_minutes: 60, description: 'Final venue tour and setup review with vendors', moments: [
            { name: 'Venue Tour', duration_seconds: 1200 },
            { name: 'Lighting & Setup Review', duration_seconds: 900 },
            { name: 'Final Decisions', duration_seconds: 600 },
        ]},
    ],
    'Wedding Day': [
        { name: 'Bridal Prep', color: '#ec4899', default_start_time: '08:00', default_duration_minutes: 120, description: 'Bride getting ready — hair, makeup, dressing', moments: [
            { name: 'Hair & Makeup', duration_seconds: 3600 },
            { name: 'Getting Dressed', duration_seconds: 900, is_key_moment: true },
            { name: 'Final Touches & Veil', duration_seconds: 600 },
            { name: 'Father of Bride Reaction', duration_seconds: 300, is_key_moment: true },
            { name: 'Bridesmaids Preparation', duration_seconds: 600 },
        ]},
        { name: 'Groom Prep', color: '#648CFF', default_start_time: '09:00', default_duration_minutes: 90, description: 'Groom getting ready with groomsmen', moments: [
            { name: 'Getting Dressed', duration_seconds: 900 },
            { name: 'Suit-Up & Tie', duration_seconds: 600, is_key_moment: true },
            { name: 'Groomsmen Candids', duration_seconds: 1200 },
            { name: 'Gift / Letter Exchange', duration_seconds: 600, is_key_moment: true },
        ]},
        { name: 'First Look', color: '#a855f7', default_start_time: '11:00', default_duration_minutes: 30, description: 'Intimate first reveal moment between couple', moments: [
            { name: 'Setup & Anticipation', duration_seconds: 300 },
            { name: 'The Reveal', duration_seconds: 180, is_key_moment: true },
            { name: 'Couple\'s Reaction', duration_seconds: 300, is_key_moment: true },
            { name: 'Quick Portraits', duration_seconds: 600 },
        ]},
        { name: 'Ceremony', color: '#f59e0b', default_start_time: '13:00', default_duration_minutes: 60, description: 'The main ceremony — vows, rings, first kiss', moments: [
            { name: 'Guest Seating', duration_seconds: 600 },
            { name: 'Processional & Entry', duration_seconds: 300, is_key_moment: true },
            { name: 'Vows Exchange', duration_seconds: 600, is_key_moment: true },
            { name: 'Ring Exchange', duration_seconds: 180, is_key_moment: true },
            { name: 'First Kiss', duration_seconds: 120, is_key_moment: true },
            { name: 'Recessional & Confetti', duration_seconds: 300, is_key_moment: true },
        ]},
        { name: 'Family Portraits', color: '#10b981', default_start_time: '14:00', default_duration_minutes: 30, description: 'Formal group photos with family and bridal party', moments: [
            { name: 'Immediate Family', duration_seconds: 600, is_key_moment: true },
            { name: 'Extended Family Groups', duration_seconds: 600 },
            { name: 'Bridal Party', duration_seconds: 600 },
        ]},
        { name: 'Couple Portraits', color: '#0ea5e9', default_start_time: '14:30', default_duration_minutes: 45, description: 'Dedicated couples portrait session', moments: [
            { name: 'Location Walk', duration_seconds: 300 },
            { name: 'Formal Portraits', duration_seconds: 900, is_key_moment: true },
            { name: 'Candid / Lifestyle', duration_seconds: 900 },
            { name: 'Dramatic / Creative', duration_seconds: 600, is_key_moment: true },
        ]},
        { name: 'Cocktail Hour', color: '#f97316', default_start_time: '15:15', default_duration_minutes: 60, description: 'Drinks and canapés while venue turns around', moments: [
            { name: 'Guest Mingling', duration_seconds: 1800 },
            { name: 'Canapés & Drinks', duration_seconds: 1200 },
            { name: 'Candid Guest Moments', duration_seconds: 600 },
        ]},
        { name: 'Reception', color: '#14b8a6', default_start_time: '16:30', default_duration_minutes: 180, description: 'The main reception — dinner, dancing, celebration', moments: [
            { name: 'Grand Entrance', duration_seconds: 300, is_key_moment: true },
            { name: 'Welcome & Seating', duration_seconds: 600 },
            { name: 'Dinner Service', duration_seconds: 3600 },
            { name: 'Table Candids', duration_seconds: 1200 },
        ]},
        { name: 'First Dance', color: '#d946ef', default_start_time: '19:30', default_duration_minutes: 10, description: 'First dance and parent dances', moments: [
            { name: 'First Dance', duration_seconds: 240, is_key_moment: true },
            { name: 'Parent Dances', duration_seconds: 360, is_key_moment: true },
        ]},
        { name: 'Speeches & Toasts', color: '#8b5cf6', default_start_time: '17:30', default_duration_minutes: 45, description: 'Wedding speeches and toasts from the party', moments: [
            { name: 'Best Man Speech', duration_seconds: 600, is_key_moment: true },
            { name: 'Father of Bride Speech', duration_seconds: 600, is_key_moment: true },
            { name: 'Groom / Couple Speech', duration_seconds: 600, is_key_moment: true },
            { name: 'Maid of Honour Speech', duration_seconds: 480 },
        ]},
        { name: 'Detail Shots', color: '#06b6d4', default_start_time: '10:30', default_duration_minutes: 30, description: 'Close-up shots of rings, flowers, décor, stationery', moments: [
            { name: 'Rings & Jewellery', duration_seconds: 300, is_key_moment: true },
            { name: 'Flowers & Bouquet', duration_seconds: 300 },
            { name: 'Table Settings & Décor', duration_seconds: 600 },
            { name: 'Stationery & Signage', duration_seconds: 300 },
        ]},
        { name: 'Send Off', color: '#ef4444', default_start_time: '21:00', default_duration_minutes: 15, description: 'Sparkler exit, confetti line, or getaway car departure', moments: [
            { name: 'Sparkler / Confetti Line', duration_seconds: 300, is_key_moment: true },
            { name: 'Couple Exit', duration_seconds: 300, is_key_moment: true },
            { name: 'Getaway Car', duration_seconds: 180 },
        ]},
    ],
    'Day After Session': [
        { name: 'Trash the Dress', color: '#ec4899', default_start_time: '10:00', default_duration_minutes: 60, description: 'Creative post-wedding dress session', moments: [
            { name: 'Location Arrival', duration_seconds: 300 },
            { name: 'Creative Shots', duration_seconds: 1800, is_key_moment: true },
            { name: 'Water / Nature Sequence', duration_seconds: 1200, is_key_moment: true },
        ]},
        { name: 'Couples Portraits', color: '#0ea5e9', default_start_time: '11:00', default_duration_minutes: 60, description: 'Relaxed next-day couples portrait session', moments: [
            { name: 'Scenic Walk', duration_seconds: 600 },
            { name: 'Candid & Lifestyle', duration_seconds: 1200, is_key_moment: true },
            { name: 'Formal Portraits', duration_seconds: 900 },
        ]},
        { name: 'Drone Aerials', color: '#648CFF', default_start_time: '12:00', default_duration_minutes: 45, description: 'Aerial drone footage of couple and landscape', moments: [
            { name: 'Equipment Setup', duration_seconds: 300 },
            { name: 'Wide Landscape Shots', duration_seconds: 900, is_key_moment: true },
            { name: 'Couple in Landscape', duration_seconds: 900, is_key_moment: true },
            { name: 'Cinematic Fly-Overs', duration_seconds: 600 },
        ]},
        { name: 'Beach / Nature Walk', color: '#10b981', default_start_time: '14:00', default_duration_minutes: 60, description: 'Scenic walk footage along the coast or countryside', moments: [
            { name: 'Walking Shots', duration_seconds: 900 },
            { name: 'Seaside / Nature Poses', duration_seconds: 1200, is_key_moment: true },
            { name: 'Playful Candids', duration_seconds: 900 },
        ]},
        { name: 'Golden Hour Session', color: '#f59e0b', default_start_time: '17:30', default_duration_minutes: 45, description: 'Warm golden-light portraits at sunset', moments: [
            { name: 'Warm Light Portraits', duration_seconds: 1200, is_key_moment: true },
            { name: 'Silhouette Shots', duration_seconds: 600, is_key_moment: true },
            { name: 'Final Embrace', duration_seconds: 300, is_key_moment: true },
        ]},
    ],
    'Engagement Session': [
        { name: 'Location Portraits', color: '#0ea5e9', default_start_time: '15:00', default_duration_minutes: 60, description: 'On-location portrait session at chosen spot', moments: [
            { name: 'Arrival & Settling In', duration_seconds: 300 },
            { name: 'Formal Poses', duration_seconds: 900 },
            { name: 'Walking Together', duration_seconds: 600, is_key_moment: true },
            { name: 'Close-Up Portraits', duration_seconds: 900, is_key_moment: true },
        ]},
        { name: 'Lifestyle Footage', color: '#10b981', default_start_time: '16:00', default_duration_minutes: 45, description: 'Natural candid-style footage of the couple together', moments: [
            { name: 'Casual Candids', duration_seconds: 900 },
            { name: 'Activity Together', duration_seconds: 900, is_key_moment: true },
            { name: 'Laughter & Playful Moments', duration_seconds: 600, is_key_moment: true },
        ]},
        { name: 'Interview / Vows Read', color: '#8b5cf6', default_start_time: '16:45', default_duration_minutes: 30, description: 'Sit-down interview or private vow reading', moments: [
            { name: 'How We Met Story', duration_seconds: 600, is_key_moment: true },
            { name: 'Proposal Story', duration_seconds: 600, is_key_moment: true },
            { name: 'Vow Reading', duration_seconds: 480, is_key_moment: true },
        ]},
        { name: 'Outfit Change', color: '#ec4899', default_start_time: '17:15', default_duration_minutes: 15, description: 'Quick wardrobe change between locations/looks', moments: [
            { name: 'Quick Change', duration_seconds: 600 },
            { name: 'Fresh Look Reveal', duration_seconds: 300, is_key_moment: true },
        ]},
        { name: 'Golden Hour', color: '#f59e0b', default_start_time: '17:30', default_duration_minutes: 45, description: 'Warm sunset portraits to close the session', moments: [
            { name: 'Warm Light Portraits', duration_seconds: 1200, is_key_moment: true },
            { name: 'Silhouette Shots', duration_seconds: 600, is_key_moment: true },
            { name: 'Final Moments', duration_seconds: 600 },
        ]},
        { name: 'Detail Shots', color: '#06b6d4', default_start_time: '15:30', default_duration_minutes: 20, description: 'Close-ups of ring, outfits, personal items', moments: [
            { name: 'Ring Close-Ups', duration_seconds: 300, is_key_moment: true },
            { name: 'Outfit Details', duration_seconds: 300 },
            { name: 'Personal Items', duration_seconds: 300 },
        ]},
    ],
    'Rehearsal Dinner': [
        { name: 'Welcome Drinks', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 45, description: 'Pre-dinner drinks and guest mingling', moments: [
            { name: 'Guest Arrival', duration_seconds: 600 },
            { name: 'Drinks & Mingling', duration_seconds: 1800 },
            { name: 'Candid Group Moments', duration_seconds: 600 },
        ]},
        { name: 'Rehearsal Walk-Through', color: '#8b5cf6', default_start_time: '15:30', default_duration_minutes: 30, description: 'Practice run of ceremony order and positions', moments: [
            { name: 'Venue Walk-Through', duration_seconds: 900, is_key_moment: true },
            { name: 'Practice Processional', duration_seconds: 600 },
            { name: 'Final Notes', duration_seconds: 300 },
        ]},
        { name: 'Dinner', color: '#14b8a6', default_start_time: '18:00', default_duration_minutes: 90, description: 'Seated dinner with family and wedding party', moments: [
            { name: 'Table Seating', duration_seconds: 600 },
            { name: 'Dinner Service', duration_seconds: 3600 },
            { name: 'Table Candids', duration_seconds: 900 },
        ]},
        { name: 'Toasts & Speeches', color: '#a855f7', default_start_time: '19:30', default_duration_minutes: 30, description: 'Informal toasts from family and close friends', moments: [
            { name: 'Welcome Toast', duration_seconds: 300, is_key_moment: true },
            { name: 'Family Speeches', duration_seconds: 900, is_key_moment: true },
            { name: 'Emotional Moments', duration_seconds: 300, is_key_moment: true },
        ]},
        { name: 'Candid Moments', color: '#0ea5e9', default_start_time: '20:00', default_duration_minutes: 30, description: 'Informal candid coverage of guests socialising', moments: [
            { name: 'Friends Catching Up', duration_seconds: 600 },
            { name: 'Laughter & Stories', duration_seconds: 600, is_key_moment: true },
            { name: 'End of Night Hugs', duration_seconds: 300 },
        ]},
    ],
    'Getting Ready': [
        { name: 'Hair & Makeup', color: '#ec4899', default_start_time: '07:00', default_duration_minutes: 90, description: 'Professional hair and makeup application', moments: [
            { name: 'Makeup Application', duration_seconds: 2400 },
            { name: 'Hair Styling', duration_seconds: 2400 },
            { name: 'Final Look Reveal', duration_seconds: 300, is_key_moment: true },
        ]},
        { name: 'Suit-Up / Dressing', color: '#648CFF', default_start_time: '09:00', default_duration_minutes: 30, description: 'Getting dressed in the wedding outfit', moments: [
            { name: 'Shirt & Tie', duration_seconds: 600 },
            { name: 'Jacket On', duration_seconds: 300, is_key_moment: true },
            { name: 'Final Check', duration_seconds: 300 },
        ]},
        { name: 'Detail Shots', color: '#06b6d4', default_start_time: '08:30', default_duration_minutes: 30, description: 'Flat-lay and close-up shots of dress, shoes, accessories', moments: [
            { name: 'Dress on Hanger', duration_seconds: 300, is_key_moment: true },
            { name: 'Shoes & Accessories', duration_seconds: 300 },
            { name: 'Rings & Jewellery', duration_seconds: 300, is_key_moment: true },
            { name: 'Perfume / Cologne', duration_seconds: 180 },
            { name: 'Invitation & Stationery', duration_seconds: 300 },
        ]},
        { name: 'Letters & Gifts', color: '#a855f7', default_start_time: '09:30', default_duration_minutes: 20, description: 'Reading love letters and opening wedding day gifts', moments: [
            { name: 'Reading Letters', duration_seconds: 600, is_key_moment: true },
            { name: 'Gift Opening', duration_seconds: 600, is_key_moment: true },
        ]},
        { name: 'First Reveal (Family)', color: '#10b981', default_start_time: '10:00', default_duration_minutes: 15, description: 'Revealing the finished look to parents and family', moments: [
            { name: 'Parent Reveal Reaction', duration_seconds: 300, is_key_moment: true },
            { name: 'Family Embrace', duration_seconds: 300, is_key_moment: true },
            { name: 'Quick Family Photo', duration_seconds: 300 },
        ]},
        { name: 'Candid Prep Moments', color: '#f97316', default_start_time: '10:15', default_duration_minutes: 30, description: 'Natural behind-the-scenes footage of prep', moments: [
            { name: 'Friends Laughing', duration_seconds: 600, is_key_moment: true },
            { name: 'Champagne Toast', duration_seconds: 300, is_key_moment: true },
            { name: 'Nervous Excitement', duration_seconds: 600 },
        ]},
    ],
    'Welcome Party': [
        { name: 'Cocktail Reception', color: '#f97316', default_start_time: '17:00', default_duration_minutes: 60, description: 'Welcome cocktails and finger food', moments: [
            { name: 'First Guests Arrive', duration_seconds: 600 },
            { name: 'Drinks & Canapés', duration_seconds: 1800 },
            { name: 'Mingling Wide Shots', duration_seconds: 900 },
        ]},
        { name: 'Meet & Greet', color: '#10b981', default_start_time: '18:00', default_duration_minutes: 45, description: 'Couple welcoming guests in person', moments: [
            { name: 'Couple Greeting Guests', duration_seconds: 1200, is_key_moment: true },
            { name: 'First-Time Meetings', duration_seconds: 900 },
            { name: 'Group Candids', duration_seconds: 600 },
        ]},
        { name: 'Live Entertainment', color: '#d946ef', default_start_time: '19:00', default_duration_minutes: 60, description: 'Live music, DJ or other entertainment', moments: [
            { name: 'Performance Start', duration_seconds: 300, is_key_moment: true },
            { name: 'Crowd Reactions', duration_seconds: 1200 },
            { name: 'Dancing', duration_seconds: 1800, is_key_moment: true },
        ]},
        { name: 'Guest Interviews', color: '#8b5cf6', default_start_time: '18:45', default_duration_minutes: 30, description: 'Quick video messages from guests for the couple', moments: [
            { name: 'Best Wishes Messages', duration_seconds: 900, is_key_moment: true },
            { name: 'Funny Stories', duration_seconds: 600, is_key_moment: true },
            { name: 'Advice for Couple', duration_seconds: 300 },
        ]},
        { name: 'Casual Group Photos', color: '#0ea5e9', default_start_time: '20:00', default_duration_minutes: 30, description: 'Relaxed group shots with friends and family', moments: [
            { name: 'Friend Group Shots', duration_seconds: 600 },
            { name: 'Family Groups', duration_seconds: 600, is_key_moment: true },
            { name: 'Full Party Photo', duration_seconds: 300, is_key_moment: true },
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
            order_index: i, is_active: true,
          },
        });
        presetId = newPreset.id;
        created++;
      }

      // Seed moments for this preset
      if (p.moments && p.moments.length > 0) {
        for (let j = 0; j < p.moments.length; j++) {
          const m = p.moments[j];
          const existingMoment = await prisma.eventDayActivityMoment.findUnique({
            where: { event_day_activity_preset_id_order_index: { event_day_activity_preset_id: presetId, order_index: j } },
          });
          if (existingMoment) {
            await prisma.eventDayActivityMoment.update({
              where: { id: existingMoment.id },
              data: { name: m.name, duration_seconds: m.duration_seconds, is_key_moment: m.is_key_moment ?? false, description: m.description ?? null },
            });
          } else {
            await prisma.eventDayActivityMoment.create({
              data: {
                event_day_activity_preset_id: presetId,
                name: m.name, duration_seconds: m.duration_seconds,
                order_index: j, is_key_moment: m.is_key_moment ?? false, description: m.description ?? null,
              },
            });
          }
        }
      }
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
