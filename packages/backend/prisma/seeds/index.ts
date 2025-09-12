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

        // Brand setups (complete modular setups)
        logger.info('4️⃣ Running moonrise-complete-setup (Wedding Videography)...');
        const moonriseSetup = await import('./moonrise-complete-setup');
        const moonriseSummary = await moonriseSetup.default();
        const perBrandRun: PerBrandRun = {};
        finalSummary.created += moonriseSummary.created;
        finalSummary.updated += moonriseSummary.updated;
        finalSummary.skipped += moonriseSummary.skipped;
        finalSummary.total += moonriseSummary.total;

        logger.info('5️⃣ Running layer5-complete-setup (Corporate Videography)...');
        const layer5Setup = await import('./layer5-complete-setup');
        const layer5Summary = await layer5Setup.default();
        finalSummary.created += layer5Summary.created;
        finalSummary.updated += layer5Summary.updated;
        finalSummary.skipped += layer5Summary.skipped;
        finalSummary.total += layer5Summary.total;

        // Global calendar events and task library
        logger.info('6️⃣ Running global-calendar-seed...');
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
