import { PrismaClient } from '@prisma/client';
import { logger, SeedSummary } from '../utils/seed-logger';
import { printFinalMetrics, getGlobalCounts, getBrandCounts, type BrandCountSnapshot, type GlobalCountSnapshot } from '../utils/final-metrics';
import type { PerBrandRun } from '../utils/final-metrics';

const prisma = new PrismaClient();

async function main() {
    logger.sectionHeader('Starting Comprehensive Database Seeding');

    // Initialize summary tracking
    const finalSummary: SeedSummary = {
        created: 0,
        updated: 0,
        skipped: 0,
        total: 0
    };

    try {
        // Capture before-run global and brand snapshots for delta reporting
        const beforeGlobal: GlobalCountSnapshot = await getGlobalCounts(prisma);
        const beforeBrand: Record<string, BrandCountSnapshot> = {};
        const [beforeMoonrise, beforeLayer5] = await Promise.all([
            prisma.brands.findFirst({ where: { name: 'Moonrise Films' } }),
            prisma.brands.findFirst({ where: { name: 'Layer5' } })
        ]);
        if (beforeMoonrise) beforeBrand['Moonrise Films'] = await getBrandCounts(prisma, beforeMoonrise.id);
        if (beforeLayer5) beforeBrand['Layer5'] = await getBrandCounts(prisma, beforeLayer5.id);

        // Core system infrastructure first
        logger.info('1️⃣ Running admin-system-seed...');
        const adminSeed = await import('./admin-system-seed');
        const adminSummary = await adminSeed.default();
        finalSummary.created += adminSummary.created;
        finalSummary.updated += adminSummary.updated;
        finalSummary.skipped += adminSummary.skipped;
        finalSummary.total += adminSummary.total;

        logger.info('2️⃣ Running system-infrastructure-seed...');
        const infraSeed = await import('./system-infrastructure-seed');
        const infraSummary = await infraSeed.default();
        finalSummary.created += infraSummary.created;
        finalSummary.updated += infraSummary.updated;
        finalSummary.skipped += infraSummary.skipped;
        finalSummary.total += infraSummary.total;

        logger.info('3️⃣ Running global-job-roles...');
        const globalJobRoles = await import('./global-job-roles');
        const jobRolesSummary = await globalJobRoles.default();
        finalSummary.created += jobRolesSummary.created;
        finalSummary.updated += jobRolesSummary.updated;
        finalSummary.skipped += jobRolesSummary.skipped;
        finalSummary.total += jobRolesSummary.total;

        logger.info('4️⃣ Running Moonrise subject-templates seed...');
        const subjectTemplatesSeed = await import('./moonrise-00-subject-templates.seed');
        const subjectTemplatesSummary = await subjectTemplatesSeed.default();
        finalSummary.created += subjectTemplatesSummary.created;
        finalSummary.updated += subjectTemplatesSummary.updated;
        finalSummary.skipped += subjectTemplatesSummary.skipped;
        finalSummary.total += subjectTemplatesSummary.total;

        logger.info('5️⃣ Running Moonrise scene-templates seed...');
        const sceneTemplatesSeed = await import('./moonrise-01-scene-templates.seed');
        const sceneTemplatesSummary = await sceneTemplatesSeed.default();
        finalSummary.created += sceneTemplatesSummary.created;
        finalSummary.updated += sceneTemplatesSummary.updated;
        finalSummary.skipped += sceneTemplatesSummary.skipped;
        finalSummary.total += sceneTemplatesSummary.total;

        if (process.env.SEED_DEMO_DATA === 'true') {
            logger.info('5.1️⃣ Running Moonrise demo film structure seed...');
            const demoFilmSeed = await import('./moonrise-02-demo-film-structure.seed');
            const demoFilmSummary = await demoFilmSeed.default();
            finalSummary.created += demoFilmSummary.created;
            finalSummary.updated += demoFilmSummary.updated;
            finalSummary.skipped += demoFilmSummary.skipped;
            finalSummary.total += demoFilmSummary.total;

            logger.info('5.2️⃣ Running Moonrise demo subjects seed...');
            const demoSubjectsSeed = await import('./moonrise-03-demo-subjects.seed');
            const demoSubjectsSummary = await demoSubjectsSeed.default();
            finalSummary.created += demoSubjectsSummary.created;
            finalSummary.updated += demoSubjectsSummary.updated;
            finalSummary.skipped += demoSubjectsSummary.skipped;
            finalSummary.total += demoSubjectsSummary.total;

            logger.info('5.3️⃣ Running Moonrise demo recording setups seed...');
            const demoRecordingSeed = await import('./moonrise-04-demo-recording-setups.seed');
            const demoRecordingSummary = await demoRecordingSeed.default();
            finalSummary.created += demoRecordingSummary.created;
            finalSummary.updated += demoRecordingSummary.updated;
            finalSummary.skipped += demoRecordingSummary.skipped;
            finalSummary.total += demoRecordingSummary.total;

            logger.info('5.4️⃣ Running Moonrise demo music seed...');
            const demoMusicSeed = await import('./moonrise-05-demo-music.seed');
            const demoMusicSummary = await demoMusicSeed.default();
            finalSummary.created += demoMusicSummary.created;
            finalSummary.updated += demoMusicSummary.updated;
            finalSummary.skipped += demoMusicSummary.skipped;
            finalSummary.total += demoMusicSummary.total;
        }

        // Brand setups (complete modular setups)
        logger.info('6️⃣ Running moonrise-complete-setup (Wedding Videography)...');
        const moonriseSetup = await import('./moonrise-complete-setup');
        const moonriseSummary = await moonriseSetup.default();
        const perBrandRun: PerBrandRun = {};
        finalSummary.created += moonriseSummary.created;
        finalSummary.updated += moonriseSummary.updated;
        finalSummary.skipped += moonriseSummary.skipped;
        finalSummary.total += moonriseSummary.total;

        logger.info('7️⃣ Running layer5-complete-setup (Corporate Videography)...');
        const layer5Setup = await import('./layer5-complete-setup');
        const layer5Summary = await layer5Setup.default();
        finalSummary.created += layer5Summary.created;
        finalSummary.updated += layer5Summary.updated;
        finalSummary.skipped += layer5Summary.skipped;
        finalSummary.total += layer5Summary.total;

        // Event day templates for schedule system
        logger.info('7.5️⃣ Running moonrise-07-event-day-templates seed...');
        const eventDaySeed = await import('./moonrise-07-event-day-templates.seed');
        const eventDaySummary = await eventDaySeed.default();
        finalSummary.created += eventDaySummary.created;
        finalSummary.updated += eventDaySummary.updated;
        finalSummary.skipped += eventDaySummary.skipped;
        finalSummary.total += eventDaySummary.total;

        // Activity moments (default wedding moments per activity)
        logger.info('7.6️⃣ Running moonrise-08-activity-moments seed...');
        const activityMomentsSeed = await import('./moonrise-08-activity-moments.seed');
        const activityMomentsSummary = await activityMomentsSeed.default();
        finalSummary.created += activityMomentsSummary.created;
        finalSummary.updated += activityMomentsSummary.updated;
        finalSummary.skipped += activityMomentsSummary.skipped;
        finalSummary.total += activityMomentsSummary.total;

        // Global calendar events and task library
        logger.info('8️⃣ Running global-calendar-seed...');
        const calendarSeed = await import('./global-calendar-seed');
        const calendarSummary = await calendarSeed.seedCalendar();
        finalSummary.created += calendarSummary.created;
        finalSummary.updated += calendarSummary.updated;
        finalSummary.skipped += calendarSummary.skipped;
        finalSummary.total += calendarSummary.total;

        // Print authoritative metrics at the very end, including deltas and brand splits
        await printFinalMetrics(prisma, finalSummary, beforeGlobal, beforeBrand, perBrandRun);
        logger.success('Your database is now ready for development and testing!');

    } catch (error) {
        console.error('❌ Error during foundational seeding:', error);
        throw error;
    }


}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
