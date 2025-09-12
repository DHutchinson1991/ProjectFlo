import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

async function seedMomentTemplates() {
    logger.sectionHeader('Moment Templates');

    try {
        // Wedding Ceremony moments
        const ceremonyMoments = [
            { name: 'Pre-Ceremony Setup', description: 'Venue preparation and guest arrival', order_index: 1, default_duration: 300 },
            { name: 'Processional', description: 'Wedding party and bride entrance', order_index: 2, default_duration: 180 },
            { name: 'Opening Remarks', description: 'Officiant opening words and welcome', order_index: 3, default_duration: 120 },
            { name: 'Vows Exchange', description: 'Couple exchanging personal vows', order_index: 4, default_duration: 300 },
            { name: 'Ring Exchange', description: 'Wedding ring ceremony', order_index: 5, default_duration: 90 },
            { name: 'Pronouncement', description: 'Official pronouncement and first kiss', order_index: 6, default_duration: 60 },
            { name: 'Recessional', description: 'Couple and wedding party exit', order_index: 7, default_duration: 120 },
            { name: 'Post-Ceremony', description: 'Immediate family congratulations', order_index: 8, default_duration: 180 }
        ];

        // First Dance scene moments
        const firstDanceMoments = [
            { name: 'Music Setup', description: 'Audio setup and sound check for first dance', order_index: 1, default_duration: 120 },
            { name: 'Dance Introduction', description: 'MC announces the first dance', order_index: 2, default_duration: 60 },
            { name: 'First Dance', description: "Couple's first dance as married", order_index: 3, default_duration: 240 },
            { name: 'Guest Reaction', description: 'Capturing guest emotions and reactions', order_index: 4, default_duration: 90 },
            { name: 'Dance Conclusion', description: 'End of song and applause', order_index: 5, default_duration: 60 }
        ];

        let createdCount = 0;
        let skippedCount = 0;

        // Create moment templates for ceremony with duplicate checking
        const ceremonyTemplates: Awaited<ReturnType<typeof prisma.momentTemplates.create>>[] = [];
        for (const moment of ceremonyMoments) {
            const existing = await prisma.momentTemplates.findFirst({
                where: {
                    scene_type: 'CEREMONY',
                    order_index: moment.order_index
                }
            });

            if (existing) {
                logger.skipped(`Ceremony moment "${moment.name}" already exists (ID: ${existing.id})`, undefined, 'verbose');
                ceremonyTemplates.push(existing);
                skippedCount++;
            } else {
                const created = await prisma.momentTemplates.create({
                    data: {
                        ...moment,
                        scene_type: 'CEREMONY'
                    }
                });
                logger.created(`Ceremony moment: ${moment.name}`, 'verbose');
                ceremonyTemplates.push(created);
                createdCount++;
            }
        }

        // Create moment templates for first dance with duplicate checking
        const firstDanceTemplates: Awaited<ReturnType<typeof prisma.momentTemplates.create>>[] = [];
        for (const moment of firstDanceMoments) {
            const existing = await prisma.momentTemplates.findFirst({
                where: {
                    scene_type: 'FIRST_DANCE',
                    order_index: moment.order_index
                }
            });

            if (existing) {
                logger.skipped(`First dance moment "${moment.name}" already exists (ID: ${existing.id})`, undefined, 'verbose');
                firstDanceTemplates.push(existing);
                skippedCount++;
            } else {
                const created = await prisma.momentTemplates.create({
                    data: {
                        ...moment,
                        scene_type: 'FIRST_DANCE'
                    }
                });
                logger.created(`First dance moment: ${moment.name}`, 'verbose');
                firstDanceTemplates.push(created);
                createdCount++;
            }
        }

        // Summary
        const total = ceremonyTemplates.length + firstDanceTemplates.length;
        logger.summary('Moment templates', { created: createdCount, updated: 0, skipped: skippedCount, total });
        logger.info(`Ceremony moments: ${ceremonyTemplates.length}`);
        logger.info(`First Dance moments: ${firstDanceTemplates.length}`);

        return {
            ceremonyCount: ceremonyTemplates.length,
            firstDanceCount: firstDanceTemplates.length,
            total
        };

    } catch (error) {
        logger.error(`Error seeding moment templates: ${String(error)}`);
        throw error;
    }
}

// Main execution function
async function main() {
    try {
        const results = await seedMomentTemplates();
        logger.success('Moment template seeding completed successfully!');
        logger.info(`Final summary: ${results.total} moment templates created`);
    } catch (error) {
        logger.error(`Seeding failed: ${String(error)}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

export { seedMomentTemplates, main as seedMomentTemplatesMain };
