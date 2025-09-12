// Layer5 Corporate Complete Setup - Orchestrates all Layer5 seed modules
// Runs all Layer5 seed modules in the correct order
import { createLayer5Brand } from './layer5-brand-setup';
import { createLayer5Team } from './layer5-team-setup';
import { createLayer5Clients } from './layer5-clients-setup';
import { PrismaClient } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.LAYER5);

async function main(): Promise<SeedSummary> {
    logger.sectionHeader('Layer5 Corporate Videography - Complete Setup');

    try {
        const aggregate: SeedSummary = { created: 0, updated: 0, skipped: 0, total: 0 };
        // 1. Create Brand
        logger.sectionDivider('STEP 1: Brand Setup');
        const brand = await createLayer5Brand();

        // 2. Create Team
        logger.sectionDivider('STEP 2: Team Setup');
        const team = await createLayer5Team(brand.id);

        // 3. Create Sample Clients
        logger.sectionDivider('STEP 3: Sample Clients Setup');
        const clients = await createLayer5Clients();

        // Final Summary
        logger.sectionDivider('Summary');
        logger.success('Layer5 Corporate Videography Complete Setup Finished!');
        logger.info(`• 1 brand (${brand.name})`);
        logger.info(`• ${team.teamMembers.length} team members`);
        logger.info(`• ${clients.clients.length} sample corporate clients`);
        logger.info(`• Aggregate changes this run — Created: ${aggregate.created}, Updated: ${aggregate.updated}, Skipped: ${aggregate.skipped}, Total: ${aggregate.total}`);

        // Neutral summary; rely on detailed sub-seed logging
        return aggregate;
    } catch (error) {
        console.error("❌ Layer5 setup failed:", error);
        throw error;
    }
}

// Export the main function for use in other modules
export default main;

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Layer5 setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
