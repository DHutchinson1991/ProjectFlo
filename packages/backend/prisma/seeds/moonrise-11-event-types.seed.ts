/**
 * Seed: Event Types for Moonrise Films
 *
 * Creates the "Wedding" event type and links existing EventDays
 * and SubjectTypes to it via junction tables.
 *
 * Prerequisites:
 *   - moonrise-07-event-day-templates (event day templates)
 *   - moonrise-06-wedding-subjects     (subject type templates)
 *
 * Run standalone:
 *   npx ts-node prisma/seeds/moonrise-11-event-types.seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// ─── Event type definitions ─────────────────────────────────────────

interface EventTypeDef {
  name: string;
  description: string;
  icon: string;
  color: string;
  default_duration_hours?: number;
  default_start_time?: string;
  typical_guest_count?: number;
  order_index: number;
  /** Names of existing EventDays to link (in display order) */
  eventDays: string[];
  /** Names of existing SubjectTypes to link (in display order) */
  subjectTypes: string[];
}

const EVENT_TYPES: EventTypeDef[] = [
  {
    name: 'Wedding',
    description:
      'Full wedding coverage — ceremony, reception, getting ready, and optional extras like rehearsal dinner and day-after sessions.',
    icon: '💒',
    color: '#ec4899',
    default_duration_hours: 10,
    default_start_time: '08:00',
    typical_guest_count: 150,
    order_index: 0,
    eventDays: [
      'Pre-Wedding Day',
      'Getting Ready',
      'Wedding Day',
      'Day After Session',
      'Engagement Session',
      'Rehearsal Dinner',
      'Welcome Party',
    ],
    subjectTypes: ['Moonrise Wedding'],
  },
];

// ─── Seeder ─────────────────────────────────────────────────────────

async function seedEventTypes(): Promise<SeedSummary> {
  logger.sectionHeader('Event Types', 'Linking event days + subject types to event types');
  logger.startTimer('event-types');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const brand = await prisma.brands.findFirst({
    where: { name: 'Moonrise Films' },
  });

  if (!brand) {
    logger.warning('Moonrise Films brand not found, skipping event types.');
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  for (const def of EVENT_TYPES) {
    // ── Upsert the event type ──────────────────────────────────────
    let eventType = await prisma.eventType.findFirst({
      where: { brand_id: brand.id, name: def.name },
    });

    if (eventType) {
      eventType = await prisma.eventType.update({
        where: { id: eventType.id },
        data: {
          description: def.description,
          icon: def.icon,
          color: def.color,
          default_duration_hours: def.default_duration_hours,
          default_start_time: def.default_start_time,
          typical_guest_count: def.typical_guest_count,
          order_index: def.order_index,
        },
      });
      updated += 1;
      logger.skipped(`Event type "${def.name}"`, 'already exists, updated', 'verbose');
    } else {
      eventType = await prisma.eventType.create({
        data: {
          brand_id: brand.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          color: def.color,
          default_duration_hours: def.default_duration_hours,
          default_start_time: def.default_start_time,
          typical_guest_count: def.typical_guest_count,
          order_index: def.order_index,
        },
      });
      created += 1;
      logger.created(`Event type "${def.name}"`, undefined, 'verbose');
    }

    // ── Link event day templates ──────────────────────────────────
    for (let i = 0; i < def.eventDays.length; i++) {
      const dayName = def.eventDays[i];
      const dayTemplate = await prisma.eventDay.findFirst({
        where: { brand_id: brand.id, name: dayName },
      });

      if (!dayTemplate) {
        logger.warning(`Event day template "${dayName}" not found — skipping link`);
        continue;
      }

      const existingLink = await prisma.eventTypeDay.findFirst({
        where: {
          event_type_id: eventType.id,
          event_day_template_id: dayTemplate.id,
        },
      });

      if (!existingLink) {
        await prisma.eventTypeDay.create({
          data: {
            event_type_id: eventType.id,
            event_day_template_id: dayTemplate.id,
            order_index: i,
            is_default: i <= 2, // First 3 days are default
          },
        });
        logger.created(`  → Linked day "${dayName}" (order ${i})`, undefined, 'verbose');
      } else {
        await prisma.eventTypeDay.update({
          where: { id: existingLink.id },
          data: { order_index: i, is_default: i <= 2 },
        });
        logger.skipped(`  → Day "${dayName}"`, 'already linked, updated order', 'verbose');
      }
    }

    // ── Link subject roles ─────────────────────────────────────────
    if (def.subjectTypes.length > 0) {
      const brandRoles = await prisma.subjectRole.findMany({
        where: { brand_id: brand.id },
        orderBy: { order_index: 'asc' },
      });

      for (let i = 0; i < brandRoles.length; i++) {
        const role = brandRoles[i];
        const existingLink = await prisma.eventTypeSubject.findFirst({
          where: {
            event_type_id: eventType.id,
            subject_role_id: role.id,
          },
        });

        if (!existingLink) {
          await prisma.eventTypeSubject.create({
            data: {
              event_type_id: eventType.id,
              subject_role_id: role.id,
              order_index: i,
              is_default: role.is_core,
            },
          });
          logger.created(`  → Linked subject role "${role.role_name}" (order ${i})`, undefined, 'verbose');
        } else {
          logger.skipped(`  → Subject role "${role.role_name}"`, 'already linked', 'verbose');
        }
      }
    }
  }

  const total = created + updated + skipped;
  logger.summary('Event types', { created, updated, skipped, total });
  logger.endTimer('event-types', 'Event types seeding');
  return { created, updated, skipped, total };
}

export default seedEventTypes;

if (require.main === module) {
  seedEventTypes()
    .catch((error) => {
      console.error('❌ Error seeding event types:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
