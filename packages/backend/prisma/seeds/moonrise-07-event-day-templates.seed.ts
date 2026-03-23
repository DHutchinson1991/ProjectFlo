import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

/**
 * Event Day Templates - Shared scheduling templates for wedding event days.
 *
 * These templates are brand-level and can be assigned to scenes across
 * multiple films (e.g., both Highlights and Ceremony films share "Wedding Day").
 */
async function seedEventDays(): Promise<SeedSummary> {
    logger.sectionHeader('Event Day Templates', 'Schedule: Event day templates for films');
    logger.startTimer('event-day-templates');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        logger.warning('Moonrise Films brand not found, skipping event day templates.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const templates = [
        {
            name: 'Pre-Wedding Day',
            description: 'Activities before the main event — rehearsal dinner, welcome party, bridal prep shopping, etc.',
            order_index: 0,
        },
        {
            name: 'Wedding Day',
            description: 'The main event day — ceremony, reception, first look, portraits, toasts, first dance, etc.',
            order_index: 1,
        },
        {
            name: 'Day After Session',
            description: 'Post-wedding creative session — trash the dress, couples portraits, drone shots, etc.',
            order_index: 2,
        },
        {
            name: 'Engagement Session',
            description: 'Pre-wedding engagement shoot — location portraits, lifestyle footage, interview.',
            order_index: 3,
        },
        {
            name: 'Rehearsal Dinner',
            description: 'Evening before the wedding — rehearsal, dinner, toasts, candid moments.',
            order_index: 4,
        },
        {
            name: 'Getting Ready',
            description: 'Morning-of preparations — hair, makeup, suit-up, detail shots, letters, gifts.',
            order_index: 5,
        },
        {
            name: 'Welcome Party',
            description: 'Welcome event for destination weddings — cocktails, meet-and-greet, casual footage.',
            order_index: 6,
        },
    ];

    for (const tpl of templates) {
        const existing = await prisma.eventDay.findFirst({
            where: { brand_id: brand.id, name: tpl.name },
        });

        if (existing) {
            await prisma.eventDay.update({
                where: { id: existing.id },
                data: {
                    description: tpl.description,
                    order_index: tpl.order_index,
                },
            });
            updated += 1;
            logger.skipped(`Event day "${tpl.name}"`, 'already exists, updated', 'verbose');
        } else {
            await prisma.eventDay.create({
                data: {
                    brand_id: brand.id,
                    name: tpl.name,
                    description: tpl.description,
                    order_index: tpl.order_index,
                },
            });
            created += 1;
            logger.created(`Event day "${tpl.name}"`, undefined, 'verbose');
        }
    }

    const total = created + updated + skipped;
    logger.summary('Event day templates', { created, updated, skipped, total });
    logger.endTimer('event-day-templates', 'Event day templates seeding');
    return { created, updated, skipped, total };
}

export default seedEventDays;

if (require.main === module) {
    seedEventDays()
        .catch((error) => {
            console.error('❌ Error seeding event day templates:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
