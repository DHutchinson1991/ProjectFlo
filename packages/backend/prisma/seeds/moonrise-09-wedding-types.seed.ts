/**
 * Moonrise 09 - Wedding Type Templates Seed
 *
 * Creates system-seeded EventSubtype templates with:
 *  - Locations per wedding type
 *  - Subjects per wedding type
 *  - Activities with moments
 *  - Activity ↔ Location links (EventSubtypeActivityLocation)
 *  - Activity ↔ Subject links (EventSubtypeActivitySubject)
 *
 * These templates are the source of truth used by createPackageFromTemplate().
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// ─── Locations by wedding type key ───────────────────────────────────
interface LocationDef {
  name: string;
  location_type: string;
  order_index: number;
  is_primary: boolean;
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

// ─── Subjects by wedding type key ────────────────────────────────────
interface SubjectDef {
  name: string;
  subject_type: string;
  typical_count: number;
  order_index: number;
  is_primary: boolean;
}

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

// ─── Activity templates per wedding type ─────────────────────────────
interface MomentDef {
  name: string;
  duration_seconds: number;
  order_index: number;
  is_key_moment: boolean;
}

interface ActivityDef {
  name: string;
  icon: string;
  color: string;
  duration_minutes: number;
  start_time_offset_minutes: number;
  order_index: number;
  /** Location names that must match LOCATIONS_BY_TYPE entries */
  locations: string[];
  /** Subject names that must match SUBJECTS_BY_TYPE entries */
  subjects: string[];
  moments: MomentDef[];
}

interface EventSubtypeDef {
  name: string;
  description: string;
  total_duration_hours: number;
  event_start_time: string;
  typical_guest_count: number;
  key: string;
}

const WEDDING_TYPE_TEMPLATES: (EventSubtypeDef & { activities: ActivityDef[] })[] = [
  {
    name: '🇬🇧 Traditional British Wedding',
    description: 'Classic British wedding with ceremony and reception',
    total_duration_hours: 10,
    event_start_time: '14:00',
    typical_guest_count: 100,
    key: 'traditional_british',
    activities: [
      {
        name: 'Getting Ready',
        icon: 'glam',
        color: '#ec4899',
        duration_minutes: 75,
        start_time_offset_minutes: 0,
        order_index: 0,
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
        name: 'Ceremony',
        icon: 'heart',
        color: '#f59e0b',
        duration_minutes: 45,
        start_time_offset_minutes: 75,
        order_index: 1,
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
        name: 'Confetti & Photos',
        icon: 'sparkles',
        color: '#10b981',
        duration_minutes: 30,
        start_time_offset_minutes: 120,
        order_index: 2,
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
        name: 'Reception Entry',
        icon: 'door',
        color: '#6366f1',
        duration_minutes: 30,
        start_time_offset_minutes: 150,
        order_index: 3,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Grand Entrance', duration_seconds: 300, order_index: 0, is_key_moment: true },
          { name: 'Welcome Drinks', duration_seconds: 900, order_index: 1, is_key_moment: false },
          { name: 'Table Seating', duration_seconds: 600, order_index: 2, is_key_moment: false },
        ],
      },
      {
        name: 'Formal Dinner',
        icon: 'utensils',
        color: '#0ea5e9',
        duration_minutes: 120,
        start_time_offset_minutes: 180,
        order_index: 4,
        locations: ['Reception Venue/Marquee'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Starters Served', duration_seconds: 900, order_index: 0, is_key_moment: false },
          { name: 'Main Course', duration_seconds: 1200, order_index: 1, is_key_moment: false },
          { name: 'Dessert Service', duration_seconds: 600, order_index: 2, is_key_moment: false },
        ],
      },
      {
        name: 'Cake Cut & Speeches',
        icon: 'cake',
        color: '#8b5cf6',
        duration_minutes: 45,
        start_time_offset_minutes: 300,
        order_index: 5,
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
        name: 'First Dance & Evening',
        icon: 'music',
        color: '#ec4899',
        duration_minutes: 90,
        start_time_offset_minutes: 345,
        order_index: 6,
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
    total_duration_hours: 14,
    event_start_time: '12:00',
    typical_guest_count: 150,
    key: 'indian_wedding',
    activities: [
      {
        name: 'Mehendi (Henna)',
        icon: 'sparkles',
        color: '#06b6d4',
        duration_minutes: 180,
        start_time_offset_minutes: 0,
        order_index: 0,
        locations: ["Bride's Home (Mehendi/Henna)"],
        subjects: ['Bride', 'Bridesmaids', 'Family'],
        moments: [
          { name: 'Henna Application Start', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Extended Henna", duration_seconds: 3600, order_index: 1, is_key_moment: true },
          { name: 'Guest Henna Application', duration_seconds: 3600, order_index: 2, is_key_moment: false },
          { name: 'Dancing & Celebration', duration_seconds: 1200, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'Wedding Ceremony (Mandap)',
        icon: 'heart',
        color: '#f59e0b',
        duration_minutes: 120,
        start_time_offset_minutes: 360,
        order_index: 1,
        locations: ['Temple/Ceremony Venue'],
        subjects: ['Bride', 'Groom', 'Family', 'Guests'],
        moments: [
          { name: 'Baraat Procession', duration_seconds: 900, order_index: 0, is_key_moment: true },
          { name: 'Bride & Groom Meet', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Rituals & Vows', duration_seconds: 3000, order_index: 2, is_key_moment: true },
          { name: 'First Circumambulation', duration_seconds: 1200, order_index: 3, is_key_moment: true },
          { name: 'Final Blessings', duration_seconds: 600, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Reception & Dinner',
        icon: 'cake',
        color: '#8b5cf6',
        duration_minutes: 240,
        start_time_offset_minutes: 600,
        order_index: 2,
        locations: ['Reception Venue'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
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
    total_duration_hours: 12,
    event_start_time: '16:00',
    typical_guest_count: 120,
    key: 'pakistani_wedding',
    activities: [
      {
        name: 'Mehndi (Henna Celebration)',
        icon: 'sparkles',
        color: '#ec4899',
        duration_minutes: 180,
        start_time_offset_minutes: 0,
        order_index: 0,
        locations: ["Bride's Home (Mehndi)"],
        subjects: ['Bride', 'Bridesmaids', 'Family'],
        moments: [
          { name: 'Henna Artists Begin', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Henna Session", duration_seconds: 3600, order_index: 1, is_key_moment: true },
          { name: 'Guests Getting Henna', duration_seconds: 3000, order_index: 2, is_key_moment: false },
          { name: 'Music & Dancing', duration_seconds: 1200, order_index: 3, is_key_moment: true },
        ],
      },
      {
        name: 'Baraat & Bride Meet Groom',
        icon: 'heart',
        color: '#f59e0b',
        duration_minutes: 90,
        start_time_offset_minutes: 360,
        order_index: 1,
        locations: ["Groom's Home", "Bride's Home (Mehndi)"],
        subjects: ['Bride', 'Groom', 'Groomsmen', 'Family'],
        moments: [
          { name: 'Baraat Procession Arrival', duration_seconds: 900, order_index: 0, is_key_moment: true },
          { name: 'Traditional Welcome', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Bride First Appearance', duration_seconds: 300, order_index: 2, is_key_moment: true },
          { name: 'Family Rituals', duration_seconds: 1200, order_index: 3, is_key_moment: false },
          { name: "Couple's Reaction", duration_seconds: 300, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Walima (Reception Dinner)',
        icon: 'cake',
        color: '#8b5cf6',
        duration_minutes: 240,
        start_time_offset_minutes: 570,
        order_index: 2,
        locations: ['Venue (Walima/Reception)'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
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
    total_duration_hours: 8,
    event_start_time: '16:00',
    typical_guest_count: 70,
    key: 'registry_celebration',
    activities: [
      {
        name: 'Registry Ceremony',
        icon: 'heart',
        color: '#f59e0b',
        duration_minutes: 60,
        start_time_offset_minutes: 0,
        order_index: 0,
        locations: ['Registry Venue'],
        subjects: ['Bride', 'Groom', 'Family'],
        moments: [
          { name: 'Guest Arrival & Seating', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: 'Couple Arrival', duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Official Ceremony', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'Signing Documents', duration_seconds: 600, order_index: 3, is_key_moment: true },
          { name: 'Photos & Celebratory Moment', duration_seconds: 600, order_index: 4, is_key_moment: true },
        ],
      },
      {
        name: 'Celebration & Reception',
        icon: 'cake',
        color: '#8b5cf6',
        duration_minutes: 240,
        start_time_offset_minutes: 120,
        order_index: 1,
        locations: ['Celebration Venue'],
        subjects: ['Bride', 'Groom', 'Family', 'Guests'],
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
    total_duration_hours: 8,
    event_start_time: '15:00',
    typical_guest_count: 40,
    key: 'garden_intimate',
    activities: [
      {
        name: 'Getting Ready',
        icon: 'glam',
        color: '#ec4899',
        duration_minutes: 60,
        start_time_offset_minutes: 0,
        order_index: 0,
        locations: ['Getting Ready Space'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen'],
        moments: [
          { name: 'Hair & Makeup', duration_seconds: 1200, order_index: 0, is_key_moment: false },
          { name: 'Bride Getting Dressed', duration_seconds: 600, order_index: 1, is_key_moment: false },
          { name: 'Groom Preparation', duration_seconds: 600, order_index: 2, is_key_moment: false },
          { name: 'Final Preparations', duration_seconds: 600, order_index: 3, is_key_moment: false },
        ],
      },
      {
        name: 'Intimate Ceremony',
        icon: 'heart',
        color: '#f59e0b',
        duration_minutes: 45,
        start_time_offset_minutes: 90,
        order_index: 1,
        locations: ['Garden Ceremony Area'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
        moments: [
          { name: 'Guest Arrival in Garden', duration_seconds: 600, order_index: 0, is_key_moment: false },
          { name: "Bride's Walk Down Aisle", duration_seconds: 300, order_index: 1, is_key_moment: true },
          { name: 'Vows & Rings', duration_seconds: 900, order_index: 2, is_key_moment: true },
          { name: 'First Kiss', duration_seconds: 180, order_index: 3, is_key_moment: true },
          { name: 'Recessional', duration_seconds: 300, order_index: 4, is_key_moment: false },
        ],
      },
      {
        name: 'Reception & Celebration',
        icon: 'cake',
        color: '#8b5cf6',
        duration_minutes: 180,
        start_time_offset_minutes: 195,
        order_index: 2,
        locations: ['Reception Area/Marquee'],
        subjects: ['Bride', 'Groom', 'Bridesmaids', 'Groomsmen', 'Family', 'Guests'],
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

// ─── Main seed function ──────────────────────────────────────────────
async function seedEventSubtypes(): Promise<SeedSummary> {
  logger.sectionHeader('Wedding Type Templates', 'System-seeded wedding type templates with activity-subject-location links');
  logger.startTimer('wedding-types');

  let created = 0;
  const updated = 0;
  let skipped = 0;

  for (const template of WEDDING_TYPE_TEMPLATES) {
    // Check if this wedding type already exists (system-seeded, brand_id = null)
    const existing = await prisma.eventSubtype.findFirst({
      where: { name: template.name, is_system_seeded: true },
    });

    if (existing) {
      skipped++;
      logger.skipped(`Wedding type "${template.name}"`, 'already exists');
      continue;
    }

    // Create the wedding type
    const eventSubtype = await prisma.eventSubtype.create({
      data: {
        name: template.name,
        description: template.description,
        total_duration_hours: template.total_duration_hours,
        event_start_time: template.event_start_time,
        typical_guest_count: template.typical_guest_count,
        is_system_seeded: true,
        is_active: true,
        order_index: WEDDING_TYPE_TEMPLATES.indexOf(template),
      },
    });

    // Create locations
    const locationMap: Record<string, number> = {};
    const locations = LOCATIONS_BY_TYPE[template.key] ?? [];
    for (const loc of locations) {
      const row = await prisma.eventSubtypeLocation.create({
        data: {
          wedding_type_id: eventSubtype.id,
          name: loc.name,
          location_type: loc.location_type,
          order_index: loc.order_index,
          is_primary: loc.is_primary,
        },
      });
      locationMap[loc.name] = row.id;
    }

    // Create subjects
    const subjectMap: Record<string, number> = {};
    const subjects = SUBJECTS_BY_TYPE[template.key] ?? [];
    for (const subj of subjects) {
      const row = await prisma.eventSubtypeSubject.create({
        data: {
          wedding_type_id: eventSubtype.id,
          name: subj.name,
          subject_type: subj.subject_type,
          typical_count: subj.typical_count,
          order_index: subj.order_index,
          is_primary: subj.is_primary,
        },
      });
      subjectMap[subj.name] = row.id;
    }

    // Create activities with moments + junction links
    for (const activity of template.activities) {
      const createdActivity = await prisma.eventSubtypeActivity.create({
        data: {
          wedding_type_id: eventSubtype.id,
          name: activity.name,
          icon: activity.icon,
          color: activity.color,
          duration_minutes: activity.duration_minutes,
          start_time_offset_minutes: activity.start_time_offset_minutes,
          order_index: activity.order_index,
          description: `${activity.name} – ${activity.duration_minutes} minutes`,
        },
      });

      // Moments
      for (const moment of activity.moments) {
        await prisma.eventSubtypeActivityMoment.create({
          data: {
            wedding_type_activity_id: createdActivity.id,
            name: moment.name,
            duration_seconds: moment.duration_seconds,
            order_index: moment.order_index,
            is_key_moment: moment.is_key_moment,
            description: moment.name,
          },
        });
      }

      // Activity → Location junction
      for (let li = 0; li < activity.locations.length; li++) {
        const locName = activity.locations[li];
        if (locationMap[locName]) {
          await prisma.eventSubtypeActivityLocation.create({
            data: {
              wedding_type_activity_id: createdActivity.id,
              wedding_type_location_id: locationMap[locName],
            },
          });
        }
      }

      // Activity → Subject junction
      for (let si = 0; si < activity.subjects.length; si++) {
        const subjName = activity.subjects[si];
        if (subjectMap[subjName]) {
          await prisma.eventSubtypeActivitySubject.create({
            data: {
              wedding_type_activity_id: createdActivity.id,
              wedding_type_subject_id: subjectMap[subjName],
              presence_percentage: 80,
              is_primary_focus: si < 2,
            },
          });
        }
      }
    }

    created++;
    const actCount = template.activities.length;
    const momCount = template.activities.reduce((s, a) => s + a.moments.length, 0);
    logger.created(`"${template.name}" (${actCount} activities, ${momCount} moments, ${locations.length} locations, ${subjects.length} subjects)`);
  }

  const total = created + updated + skipped;
  logger.summary('Wedding type templates', { created, updated, skipped, total });
  logger.endTimer('wedding-types', 'Wedding type templates seeding');
  return { created, updated, skipped, total };
}

// Export activity/subject/location definitions for reuse by sample-packages seed
export { WEDDING_TYPE_TEMPLATES, LOCATIONS_BY_TYPE, SUBJECTS_BY_TYPE };

export default seedEventSubtypes;

if (require.main === module) {
  seedEventSubtypes()
    .catch((error) => {
      console.error('❌ Error seeding wedding types:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
