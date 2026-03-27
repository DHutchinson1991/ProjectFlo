/**
 * Moonrise Catalog – Services
 *
 * Consolidated seed that defines all service types available to the brand:
 *   1. Wedding type templates (EventSubtype) with activities, locations, subjects
 *   2. Event types (EventType) with event day + subject role links
 *   3. Birthday EventType provisioning (subject roles, day template, category, set)
 *
 * Prerequisites:
 *   - moonrise-platform-brand-setup
 *   - moonrise-catalog-event-templates (event days + subject roles)
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType, sumSummaries } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.MOONRISE);

// ═══════════════════════════════════════════════════════════════════════
// PART 1 — Wedding Type Templates (EventSubtype)
// ═══════════════════════════════════════════════════════════════════════

interface LocationDef { name: string; location_type: string; order_index: number; is_primary: boolean }
interface SubjectDef { name: string; subject_type: string; typical_count: number; order_index: number; is_primary: boolean }
interface MomentDef { name: string; duration_seconds: number; order_index: number; is_key_moment: boolean }
interface ActivityDef {
  name: string; icon: string; color: string; duration_minutes: number;
  start_time_offset_minutes: number; order_index: number;
  locations: string[]; subjects: string[]; moments: MomentDef[];
}
interface EventSubtypeDef {
  name: string; description: string; total_duration_hours: number;
  event_start_time: string; typical_guest_count: number; key: string;
}

const LOCATIONS_BY_TYPE: Record<string, LocationDef[]> = {
  traditional_british: [
    { name: "Bride's Getting Ready Location", location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: "Groom's Getting Ready Location", location_type: 'getting_ready', order_index: 1, is_primary: false },
    { name: 'Ceremony Venue', location_type: 'ceremony', order_index: 2, is_primary: false },
    { name: 'Reception Venue/Marquee', location_type: 'reception', order_index: 3, is_primary: false },
    { name: 'Photo Locations (Garden/Grounds)', location_type: 'photo', order_index: 4, is_primary: false },
  ],
  indian_wedding: [
    { name: "Bride's Home (Mehendi/Henna)", location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Temple/Ceremony Venue', location_type: 'ceremony', order_index: 1, is_primary: false },
    { name: "Groom's Home (Baraat)", location_type: 'ceremony', order_index: 2, is_primary: false },
    { name: 'Reception Venue', location_type: 'reception', order_index: 3, is_primary: false },
    { name: 'Photo Locations', location_type: 'photo', order_index: 4, is_primary: false },
  ],
  pakistani_wedding: [
    { name: "Bride's Home (Mehndi)", location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Venue (Walima/Reception)', location_type: 'reception', order_index: 1, is_primary: false },
    { name: "Groom's Home", location_type: 'getting_ready', order_index: 2, is_primary: false },
    { name: 'Photo Locations', location_type: 'photo', order_index: 3, is_primary: false },
  ],
  registry_celebration: [
    { name: 'Registry Venue', location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Celebration Venue', location_type: 'reception', order_index: 1, is_primary: false },
    { name: 'Photo Locations', location_type: 'photo', order_index: 2, is_primary: false },
  ],
  garden_intimate: [
    { name: 'Getting Ready Space', location_type: 'getting_ready', order_index: 0, is_primary: true },
    { name: 'Garden Ceremony Area', location_type: 'ceremony', order_index: 1, is_primary: false },
    { name: 'Reception Area/Marquee', location_type: 'reception', order_index: 2, is_primary: false },
    { name: 'Photo Spots (Garden/Grounds)', location_type: 'photo', order_index: 3, is_primary: false },
  ],
};

const SUBJECTS_BY_TYPE: Record<string, SubjectDef[]> = {
  traditional_british: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 4, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 4, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 10, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 100, order_index: 5, is_primary: false },
  ],
  indian_wedding: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 4, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 4, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 15, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 150, order_index: 5, is_primary: false },
  ],
  pakistani_wedding: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 4, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 4, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 10, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 100, order_index: 5, is_primary: false },
  ],
  registry_celebration: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Family', subject_type: 'family', typical_count: 6, order_index: 2, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 70, order_index: 3, is_primary: false },
  ],
  garden_intimate: [
    { name: 'Bride', subject_type: 'couple', typical_count: 1, order_index: 0, is_primary: true },
    { name: 'Groom', subject_type: 'couple', typical_count: 1, order_index: 1, is_primary: true },
    { name: 'Bridesmaids', subject_type: 'wedding_party', typical_count: 2, order_index: 2, is_primary: false },
    { name: 'Groomsmen', subject_type: 'wedding_party', typical_count: 2, order_index: 3, is_primary: false },
    { name: 'Family', subject_type: 'family', typical_count: 8, order_index: 4, is_primary: false },
    { name: 'Guests', subject_type: 'guests', typical_count: 40, order_index: 5, is_primary: false },
  ],
};

const WEDDING_TYPE_TEMPLATES: (EventSubtypeDef & { activities: ActivityDef[] })[] = [
  {
    name: '🇬🇧 Traditional British Wedding',
    description: 'Classic British wedding with ceremony and reception',
    total_duration_hours: 10, event_start_time: '14:00', typical_guest_count: 100, key: 'traditional_british',
    activities: [
      {
        name: 'Getting Ready', icon: 'glam', color: '#ec4899', duration_minutes: 75, start_time_offset_minutes: 0, order_index: 0,
        locations: ["Bride's Getting Ready Location", "Groom's Getting Ready Location"],
        subjects: ['Bride', 'Groom', 'Bridesmaids'],
        moments: [
          { name: "Bride's Hair & Makeup", duration_seconds: 1200, order_index: 0, is_key_moment: false },
          { name: 'Bride Getting Dressed', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Groom Getting Ready', duration_seconds: 900, order_index: 2, is_key_moment: false },
          { name: 'Final Touches & Veil', duration_seconds: 300, order_index: 3, is_key_moment: false },
          { name: 'Bridesmaids Preparation', duration_seconds: 600, order_index: 4, is_key_moment: false },
          { name: 'Father of Bride Reaction', duration_seconds: 300, order_index: 5, is_key_moment: true },
        ],
      },
      {
        name: 'Ceremony', icon: 'heart', color: '#f59e0b', duration_minutes: 45, start_time_offset_minutes: 75, order_index: 1,
        locations: ['Ceremony Venue'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Processional & Entry', duration_seconds: 300, order_index: 0, is_key_moment: true },
          { name: 'Vows Exchange', duration_seconds: 600, order_index: 1, is_key_moment: true },
          { name: 'Ring Exchange', duration_seconds: 180, order_index: 2, is_key_moment: true },
          { name: 'First Kiss', duration_seconds: 120, order_index: 3, is_key_moment: true },
          { name: 'Recessional & Confetti', duration_seconds: 300, order_index: 4, is_key_moment: true },
          { name: 'Guests Filing Out', duration_seconds: 600, order_index: 5, is_key_moment: false },
        ],
      },
      {
        name: 'Confetti & Photos', icon: 'sparkles', color: '#10b981', duration_minutes: 30, start_time_offset_minutes: 120, order_index: 2,
        locations: ['Ceremony Venue', 'Photo Locations (Garden/Grounds)'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Confetti Moment', duration_seconds: 300, order_index: 0, is_key_moment: true },
          { name: 'Couple Portraits', duration_seconds: 900, order_index: 1, is_key_moment: true },
          { name: 'Bridal Party Portraits', duration_seconds: 900, order_index: 2, is_key_moment: false },
          { name: 'Family Portraits', duration_seconds: 900, order_index: 3, is_key_moment: false },
        ],
      },
      {
        name: 'Reception Entry', icon: 'door', color: '#6366f1', duration_minutes: 30, start_time_offset_minutes: 150, order_index: 3,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Grand Entrance', duration_seconds: 300, order_index: 0, is_key_moment: true },
          { name: 'Welcome Drinks', duration_seconds: 900, order_index: 1, is_key_moment: false },
          { name: 'Table Seating', duration_seconds: 600, order_index: 2, is_key_moment: false },
        ],
      },
      {
        name: 'Formal Dinner', icon: 'utensils', color: '#0ea5e9', duration_minutes: 120, start_time_offset_minutes: 180, order_index: 4,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Starters Served', duration_seconds: 900, order_index: 0, is_key_moment: false },
          { name: 'Main Course', duration_seconds: 1200, order_index: 1, is_key_moment: false },
          { name: 'Dessert Service', duration_seconds: 600, order_index: 2, is_key_moment: false },
        ],
      },
      {
        name: 'Cake Cut & Speeches', icon: 'cake', color: '#8b5cf6', duration_minutes: 45, start_time_offset_minutes: 300, order_index: 5,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Cake Cutting', duration_seconds: 300, order_index: 0, is_key_moment: true },
          { name: 'Best Man Speech', duration_seconds: 600, order_index: 1, is_key_moment: true },
          { name: 'Father of Bride Speech', duration_seconds: 600, order_index: 2, is_key_moment: true },
          { name: 'Groom Speech', duration_seconds: 600, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'First Dance & Evening', icon: 'music', color: '#ec4899', duration_minutes: 90, start_time_offset_minutes: 345, order_index: 6,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'First Dance', duration_seconds: 240, order_index: 0, is_key_moment: true },
          { name: 'Parent Dances', duration_seconds: 360, order_index: 1, is_key_moment: true },
          { name: 'Open Dancing', duration_seconds: 3600, order_index: 2, is_key_moment: false },
          { name: 'Sparkler Exit', duration_seconds: 300, order_index: 3, is_key_moment: true },
        ],
      },
    ],
  },
  {
    name: '🇮🇳 Indian Wedding',
    description: 'Multi-day Indian wedding celebration',
    total_duration_hours: 14, event_start_time: '12:00', typical_guest_count: 150, key: 'indian_wedding',
    activities: [
      {
        name: 'Mehendi (Henna)', icon: 'sparkles', color: '#06b6d4', duration_minutes: 180, start_time_offset_minutes: 0, order_index: 0,
        locations: ["Bride's Home (Mehendi/Henna)"], subjects: ['Bride', 'Bridesmaids', 'Family'],
        moments: [
          { name: 'Henna Application Start', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Extended Henna", duration_seconds: 3600, order_index: 1, is_key_moment: true },
          { name: 'Guest Henna Application', duration_seconds: 3600, order_index: 2, is_key_moment: false },
          { name: 'Dancing & Celebration', duration_seconds: 1200, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'Wedding Ceremony (Mandap)', icon: 'heart', color: '#f59e0b', duration_minutes: 120, start_time_offset_minutes: 360, order_index: 1,
        locations: ['Temple/Ceremony Venue'], subjects: ['Bride', 'Groom', 'Family', 'Guests'],
        moments: [
          { name: 'Baraat Procession', duration_seconds: 900, order_index: 0, is_key_moment: true },
          { name: 'Bride & Groom Meet', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Rituals & Vows', duration_seconds: 3000, order_index: 2, is_key_moment: true },
          { name: 'First Circumambulation', duration_seconds: 1200, order_index: 3, is_key_moment: true },
          { name: 'Final Blessings', duration_seconds: 600, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Reception & Dinner', icon: 'cake', color: '#8b5cf6', duration_minutes: 240, start_time_offset_minutes: 600, order_index: 2,
        locations: ['Reception Venue'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival & Seating', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Couple's Entry", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Blessings from Elders', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Dinner Service', duration_seconds: 3600, order_index: 3, is_key_moment: false },
          { name: 'First Dance Variation', duration_seconds: 600, order_index: 4, is_key_moment: true },
          { name: 'Dancing & Celebration', duration_seconds: 3600, order_index: 5, is_key_moment: false },
        ],
      },
    ],
  },
  {
    name: '🇵🇰 Pakistani Wedding',
    description: 'Traditional Pakistani wedding with Mehndi',
    total_duration_hours: 12, event_start_time: '16:00', typical_guest_count: 120, key: 'pakistani_wedding',
    activities: [
      {
        name: 'Mehndi (Henna Celebration)', icon: 'sparkles', color: '#ec4899', duration_minutes: 180, start_time_offset_minutes: 0, order_index: 0,
        locations: ["Bride's Home (Mehndi)"], subjects: ['Bride', 'Bridesmaids', 'Family'],
        moments: [
          { name: 'Henna Artists Begin', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Henna Session", duration_seconds: 3600, order_index: 1, is_key_moment: true },
          { name: 'Guests Getting Henna', duration_seconds: 3000, order_index: 2, is_key_moment: false },
          { name: 'Music & Dancing', duration_seconds: 1200, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'Baraat & Bride Meet Groom', icon: 'heart', color: '#f59e0b', duration_minutes: 90, start_time_offset_minutes: 360, order_index: 1,
        locations: ["Groom's Home", "Bride's Home (Mehndi)"], subjects: ['Bride', 'Groom', 'Groomsmen', 'Family'],
        moments: [
          { name: 'Baraat Procession Arrival', duration_seconds: 900, order_index: 0, is_key_moment: true },
          { name: 'Traditional Welcome', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Bride First Appearance', duration_seconds: 300, order_index: 2, is_key_moment: true },
          { name: 'Family Rituals', duration_seconds: 1200, order_index: 3, is_key_moment: false },
          { name: "Couple's Reaction", duration_seconds: 300, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Walima (Reception Dinner)', icon: 'cake', color: '#8b5cf6', duration_minutes: 240, start_time_offset_minutes: 570, order_index: 2,
        locations: ['Venue (Walima/Reception)'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Couple's Entry & Sitting", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Formal Blessings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Dinner Service', duration_seconds: 4200, order_index: 3, is_key_moment: false },
          { name: 'Dancing & Celebration', duration_seconds: 3600, order_index: 4, is_key_moment: true },
          { name: 'Farewell Toast', duration_seconds: 600, order_index: 5, is_key_moment: true },
        ],
      },
    ],
  },
  {
    name: '📋 Registry + Celebration',
    description: 'Registry ceremony and celebration',
    total_duration_hours: 8, event_start_time: '16:00', typical_guest_count: 70, key: 'registry_celebration',
    activities: [
      {
        name: 'Registry Ceremony', icon: 'heart', color: '#f59e0b', duration_minutes: 60, start_time_offset_minutes: 0, order_index: 0,
        locations: ['Registry Venue'], subjects: ['Bride', 'Groom', 'Family'],
        moments: [
          { name: 'Guest Arrival & Seating', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: 'Couple Arrival', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Official Ceremony', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Signing Documents', duration_seconds: 600, order_index: 3, is_key_moment: true },
          { name: 'Photos & Celebratory Moment', duration_seconds: 600, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Celebration & Reception', icon: 'cake', color: '#8b5cf6', duration_minutes: 240, start_time_offset_minutes: 120, order_index: 1,
        locations: ['Celebration Venue'], subjects: ['Bride', 'Groom', 'Family', 'Guests'],
        moments: [
          { name: 'Welcome Drinks & Canapés', duration_seconds: 900, order_index: 0, is_key_moment: false },
          { name: 'First Dance', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Toasts & Speeches', duration_seconds: 1200, order_index: 2, is_key_moment: true },
          { name: 'Dinner Service', duration_seconds: 2400, order_index: 3, is_key_moment: false },
          { name: 'Cake Cutting', duration_seconds: 300, order_index: 4, is_key_moment: true },
          { name: 'Dancing & Entertainment', duration_seconds: 3600, order_index: 5, is_key_moment: false },
        ],
      },
    ],
  },
  {
    name: '🌳 Garden/Intimate Wedding',
    description: 'Intimate garden ceremony and celebration',
    total_duration_hours: 8, event_start_time: '15:00', typical_guest_count: 40, key: 'garden_intimate',
    activities: [
      {
        name: 'Getting Ready', icon: 'glam', color: '#ec4899', duration_minutes: 60, start_time_offset_minutes: 0, order_index: 0,
        locations: ['Getting Ready Space'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen'],
        moments: [
          { name: 'Hair & Makeup', duration_seconds: 1200, order_index: 0, is_key_moment: false },
          { name: 'Bride Getting Dressed', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Groom Preparation', duration_seconds: 600, order_index: 2, is_key_moment: false },
          { name: 'Final Preparations', duration_seconds: 600, order_index: 3, is_key_moment: false },
        ],
      },
      {
        name: 'Intimate Ceremony', icon: 'heart', color: '#f59e0b', duration_minutes: 45, start_time_offset_minutes: 90, order_index: 1,
        locations: ['Garden Ceremony Area'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival in Garden', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Walk Down Aisle", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Vows & Rings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'First Kiss', duration_seconds: 180, order_index: 3, is_key_moment: true },
          { name: 'Recessional', duration_seconds: 300, order_index: 4, is_key_moment: false },
        ],
      },
      {
        name: 'Reception & Celebration', icon: 'cake', color: '#8b5cf6', duration_minutes: 180, start_time_offset_minutes: 195, order_index: 2,
        locations: ['Reception Area/Marquee'], subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Cocktails & Mingling', duration_seconds: 900, order_index: 0, is_key_moment: false },
          { name: 'First Dance', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Toasts & Blessings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Intimate Dinner', duration_seconds: 2400, order_index: 3, is_key_moment: false },
          { name: 'Cake Cutting', duration_seconds: 300, order_index: 4, is_key_moment: true },
          { name: 'Dancing Celebration', duration_seconds: 1800, order_index: 5, is_key_moment: false },
        ],
      },
    ],
  },
];

async function seedWeddingTypes(): Promise<SeedSummary> {
  logger.sectionHeader('Wedding Type Templates');

  let created = 0;
  let skipped = 0;

  for (const template of WEDDING_TYPE_TEMPLATES) {
    const existing = await prisma.eventSubtype.findFirst({
      where: { name: template.name, is_system_seeded: true },
    });

    if (existing) {
      skipped++;
      logger.skipped(`Wedding type "${template.name}"`, 'already exists');
      continue;
    }

    const eventSubtype = await prisma.eventSubtype.create({
      data: {
        name: template.name, description: template.description,
        total_duration_hours: template.total_duration_hours,
        event_start_time: template.event_start_time,
        typical_guest_count: template.typical_guest_count,
        is_system_seeded: true, is_active: true,
        order_index: WEDDING_TYPE_TEMPLATES.indexOf(template),
      },
    });

    // Locations
    const locationMap: Record<string, number> = {};
    for (const loc of (LOCATIONS_BY_TYPE[template.key] ?? [])) {
      const row = await prisma.eventSubtypeLocation.create({
        data: { wedding_type_id: eventSubtype.id, name: loc.name, location_type: loc.location_type, order_index: loc.order_index, is_primary: loc.is_primary },
      });
      locationMap[loc.name] = row.id;
    }

    // Subjects
    const subjectMap: Record<string, number> = {};
    for (const subj of (SUBJECTS_BY_TYPE[template.key] ?? [])) {
      const row = await prisma.eventSubtypeSubject.create({
        data: { wedding_type_id: eventSubtype.id, name: subj.name, subject_type: subj.subject_type, typical_count: subj.typical_count, order_index: subj.order_index, is_primary: subj.is_primary },
      });
      subjectMap[subj.name] = row.id;
    }

    // Activities with moments + junction links
    for (const activity of template.activities) {
      const createdActivity = await prisma.eventSubtypeActivity.create({
        data: {
          wedding_type_id: eventSubtype.id, name: activity.name, icon: activity.icon, color: activity.color,
          duration_minutes: activity.duration_minutes, start_time_offset_minutes: activity.start_time_offset_minutes,
          order_index: activity.order_index, description: `${activity.name} – ${activity.duration_minutes} minutes`,
        },
      });

      for (const moment of activity.moments) {
        await prisma.eventSubtypeActivityMoment.create({
          data: {
            wedding_type_activity_id: createdActivity.id, name: moment.name,
            duration_seconds: moment.duration_seconds, order_index: moment.order_index,
            is_key_moment: moment.is_key_moment, description: moment.name,
          },
        });
      }

      for (const locName of activity.locations) {
        if (locationMap[locName]) {
          await prisma.eventSubtypeActivityLocation.create({
            data: { wedding_type_activity_id: createdActivity.id, wedding_type_location_id: locationMap[locName] },
          });
        }
      }

      for (let si = 0; si < activity.subjects.length; si++) {
        const subjName = activity.subjects[si];
        if (subjectMap[subjName]) {
          await prisma.eventSubtypeActivitySubject.create({
            data: {
              wedding_type_activity_id: createdActivity.id, wedding_type_subject_id: subjectMap[subjName],
              presence_percentage: 80, is_primary_focus: si < 2,
            },
          });
        }
      }
    }

    created++;
    const locations = LOCATIONS_BY_TYPE[template.key] ?? [];
    const subjects = SUBJECTS_BY_TYPE[template.key] ?? [];
    logger.created(`"${template.name}" (${template.activities.length} activities, ${locations.length} locations, ${subjects.length} subjects)`);
  }

  const total = created + skipped;
  logger.summary('Wedding type templates', { created, updated: 0, skipped, total });
  return { created, updated: 0, skipped, total };
}

// ═══════════════════════════════════════════════════════════════════════
// PART 2 — Event Types (Wedding)
// ═══════════════════════════════════════════════════════════════════════

interface EventTypeDef {
  name: string; description: string; icon: string; color: string;
  default_duration_hours?: number; default_start_time?: string;
  typical_guest_count?: number; order_index: number;
  eventDays: string[]; subjectTypes: string[];
}

const EVENT_TYPES: EventTypeDef[] = [
  {
    name: 'Wedding',
    description: 'Full wedding coverage — ceremony, reception, getting ready, and optional extras like rehearsal dinner and day-after sessions.',
    icon: '💒', color: '#ec4899',
    default_duration_hours: 10, default_start_time: '08:00', typical_guest_count: 150, order_index: 0,
    eventDays: ['Pre-Wedding Day', 'Getting Ready', 'Wedding Day', 'Day After Session', 'Engagement Session', 'Rehearsal Dinner', 'Welcome Party'],
    subjectTypes: ['Moonrise Wedding'],
  },
];

async function seedEventTypes(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Event Types');

  let created = 0;
  let updated = 0;

  for (const def of EVENT_TYPES) {
    let eventType = await prisma.eventType.findFirst({ where: { brand_id: brandId, name: def.name } });

    if (eventType) {
      eventType = await prisma.eventType.update({
        where: { id: eventType.id },
        data: {
          description: def.description, icon: def.icon, color: def.color,
          default_duration_hours: def.default_duration_hours, default_start_time: def.default_start_time,
          typical_guest_count: def.typical_guest_count, order_index: def.order_index,
        },
      });
      updated++;
    } else {
      eventType = await prisma.eventType.create({
        data: {
          brand_id: brandId, name: def.name, description: def.description, icon: def.icon, color: def.color,
          default_duration_hours: def.default_duration_hours, default_start_time: def.default_start_time,
          typical_guest_count: def.typical_guest_count, order_index: def.order_index,
        },
      });
      created++;
    }

    // Link event day templates
    for (let i = 0; i < def.eventDays.length; i++) {
      const dayTemplate = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: def.eventDays[i] } });
      if (!dayTemplate) continue;

      const existingLink = await prisma.eventTypeDay.findFirst({
        where: { event_type_id: eventType.id, event_day_template_id: dayTemplate.id },
      });
      if (!existingLink) {
        await prisma.eventTypeDay.create({
          data: { event_type_id: eventType.id, event_day_template_id: dayTemplate.id, order_index: i, is_default: i <= 2 },
        });
      } else {
        await prisma.eventTypeDay.update({ where: { id: existingLink.id }, data: { order_index: i, is_default: i <= 2 } });
      }
    }

    // Link subject roles
    const brandRoles = await prisma.subjectRole.findMany({ where: { brand_id: brandId }, orderBy: { order_index: 'asc' } });
    for (let i = 0; i < brandRoles.length; i++) {
      const role = brandRoles[i];
      const existingLink = await prisma.eventTypeSubject.findFirst({
        where: { event_type_id: eventType.id, subject_role_id: role.id },
      });
      if (!existingLink) {
        await prisma.eventTypeSubject.create({
          data: { event_type_id: eventType.id, subject_role_id: role.id, order_index: i, is_default: role.is_core },
        });
      }
    }
  }

  const total = created + updated;
  logger.summary('Event types', { created, updated, skipped: 0, total });
  return { created, updated, skipped: 0, total };
}

// ═══════════════════════════════════════════════════════════════════════
// PART 3 — Birthday EventType Provisioning
// ═══════════════════════════════════════════════════════════════════════

const BIRTHDAY_ROLES = [
  { role_name: 'Birthday Person', order_index: 0, is_core: true, never_group: true, is_group: false },
  { role_name: 'Partner', order_index: 1, is_core: true, never_group: true, is_group: false },
  { role_name: 'Parents', order_index: 2, is_core: false, never_group: false, is_group: true },
  { role_name: 'Close Friends', order_index: 3, is_core: false, never_group: false, is_group: true },
  { role_name: 'Guests', order_index: 4, is_core: false, never_group: false, is_group: true },
];

const DEFAULT_SLOT_TIERS = ['Budget', 'Basic', 'Standard', 'Premium'] as const;

async function seedBirthdayService(brandId: number): Promise<SeedSummary> {
  logger.sectionHeader('Birthday Service');

  let created = 0;
  let skipped = 0;

  // Check if already provisioned
  let eventType = await prisma.eventType.findFirst({ where: { brand_id: brandId, name: 'Birthday' } });
  if (eventType) {
    logger.skipped('Birthday EventType', 'already exists (provisioned)');
    skipped++;
    return { created: 0, updated: 0, skipped: 1, total: 1 };
  }

  // 1. Subject roles
  const subjectRoleIds: Array<{ id: number; is_core: boolean }> = [];
  for (const roleData of BIRTHDAY_ROLES) {
    const existing = await prisma.subjectRole.findFirst({ where: { brand_id: brandId, role_name: roleData.role_name } });
    if (existing) {
      subjectRoleIds.push({ id: existing.id, is_core: roleData.is_core });
    } else {
      const role = await prisma.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
      subjectRoleIds.push({ id: role.id, is_core: roleData.is_core });
      created++;
    }
  }

  // 2. Birthday Day template
  let birthdayDay = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: 'Birthday Day' } });
  if (!birthdayDay) {
    birthdayDay = await prisma.eventDay.create({
      data: { brand_id: brandId, name: 'Birthday Day', description: 'The main birthday party — arrival, cake, speeches, dancing', order_index: 10, is_active: true },
    });
    created++;
  }

  // 3. EventType
  eventType = await prisma.eventType.create({
    data: {
      brand_id: brandId, name: 'Birthday', description: 'Birthday party and celebration coverage',
      icon: '🎂', color: '#f59e0b', default_duration_hours: 5, default_start_time: '16:00',
      typical_guest_count: 50, is_system: false, is_active: true, order_index: 1,
    },
  });
  created++;

  // 4. Link day template
  await prisma.eventTypeDay.create({
    data: { event_type_id: eventType.id, event_day_template_id: birthdayDay.id, order_index: 0, is_default: true },
  });

  // 5. Link subject roles
  for (let i = 0; i < subjectRoleIds.length; i++) {
    await prisma.eventTypeSubject.create({
      data: { event_type_id: eventType.id, subject_role_id: subjectRoleIds[i].id, order_index: i, is_default: subjectRoleIds[i].is_core },
    });
  }

  // 6. Package category
  await prisma.service_package_categories.upsert({
    where: { brand_id_name: { brand_id: brandId, name: 'Birthday' } },
    update: { event_type_id: eventType.id },
    create: { brand_id: brandId, name: 'Birthday', description: 'Birthday videography packages', order_index: 1, is_active: true, event_type_id: eventType.id },
  });

  // 7. Package set with slots
  const existingSet = await prisma.package_sets.findFirst({ where: { brand_id: brandId, name: 'Birthday Packages' } });
  if (!existingSet) {
    const category = await prisma.service_package_categories.findFirst({ where: { brand_id: brandId, name: 'Birthday' } });
    const birthdaySet = await prisma.package_sets.create({
      data: {
        brand_id: brandId, name: 'Birthday Packages', description: 'Our birthday celebration packages',
        emoji: '🎂', category_id: category?.id ?? null, event_type_id: eventType.id, is_active: true, order_index: 1,
      },
    });
    for (let i = 0; i < DEFAULT_SLOT_TIERS.length; i++) {
      await prisma.package_set_slots.create({
        data: { package_set_id: birthdaySet.id, slot_label: DEFAULT_SLOT_TIERS[i], order_index: i },
      });
    }
    created++;
  }

  logger.success(`Birthday service created (${created} records)`);
  return { created, updated: 0, skipped, total: created + skipped };
}

// ═══════════════════════════════════════════════════════════════════════
// Main — runs all three parts in sequence
// ═══════════════════════════════════════════════════════════════════════

async function seedServices(db: PrismaClient): Promise<SeedSummary> {
  prisma = db;
  logger.sectionHeader('Catalog: Services', 'Wedding types + event types + birthday service');
  logger.startTimer('services');

  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) {
    logger.warning('Moonrise Films brand not found, skipping services.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  const weddingTypesSummary = await seedWeddingTypes();
  const eventTypesSummary = await seedEventTypes(brand.id);
  const birthdaySummary = await seedBirthdayService(brand.id);

  const aggregate = sumSummaries(sumSummaries(weddingTypesSummary, eventTypesSummary), birthdaySummary);
  logger.summary('Services (total)', aggregate);
  logger.endTimer('services', 'Services seeding');
  return aggregate;
}

// Export data constants for potential reuse
export { WEDDING_TYPE_TEMPLATES, LOCATIONS_BY_TYPE, SUBJECTS_BY_TYPE, BIRTHDAY_ROLES };

export default seedServices;
