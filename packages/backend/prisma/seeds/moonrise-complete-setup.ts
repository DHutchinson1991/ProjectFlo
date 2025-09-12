// Moonrise Films Complete Setup - Orchestrates all seed modules
// Runs all moonrise seed modules in the correct order
import { createMoonriseBrand } from './moonrise-brand-setup';
import { createMoonriseTeam } from './moonrise-team-setup';
import { createMoonriseScenes } from './moonrise-scenes-setup';
import { createMoonriseFilmLibrary } from './moonrise-film-library';
import { createMoonriseTaskLibrary } from './moonrise-task-library';
import { createMoonriseCoverageLibrary, assignCoverageToScenes } from './moonrise-coverage-library';
import { createMoonriseProjects } from './moonrise-projects-setup';
import { createMoonriseInquiries } from './moonrise-inquiries-setup';
import { seedMoonriseLocationsLibrary } from './moonrise-locations-library';
import { createMoonriseSubjectsLibrary } from './moonrise-subjects-library';
import { createMoonriseMusicLibrary } from './moonrise-music-library';
import { seedMomentTemplates } from './moonrise-moment-templates';
import { seedEquipment } from './moonrise-equipment-setup';
import { PrismaClient } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary, sumSummaries } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

async function main(): Promise<SeedSummary> {
    logger.sectionHeader('Moonrise Films - Complete Setup');

    // Detailed counts are handled within each sub-seed and surfaced in their own logs
    let aggregate: SeedSummary = { created: 0, updated: 0, skipped: 0, total: 0 };

    try {
        // 1. Create Brand
        logger.sectionDivider('STEP 1: Brand Setup');
        const brand = await createMoonriseBrand();

        // 2. Create Team
        logger.sectionDivider('STEP 2: Team Setup (2 managers total)');
        const team = await createMoonriseTeam(brand.id);

        // 3. Create Scenes
        logger.sectionDivider('STEP 3: Scenes Setup (2 scenes total)');
        await createMoonriseScenes(brand.id);

        // 4. Create Film Library
        logger.sectionDivider('STEP 4: Film Library Setup (2 films total)');
        const filmCount = await createMoonriseFilmLibrary(brand.id);

        // 5. Create Task Library
        logger.sectionDivider('STEP 5: Task Library Setup (43 tasks total)');
        const taskCount = await createMoonriseTaskLibrary(brand.id);

        // 6. Create Coverage Library
        logger.sectionDivider('STEP 6: Coverage Library Setup (26 items total)');
        const coverageStats = await createMoonriseCoverageLibrary();
        aggregate = sumSummaries(aggregate, coverageStats.summary);

        // 7. Assign Coverage to Scenes
        logger.sectionDivider('STEP 7: Scene Coverage Assignments (21 assignments total)');
        const assignmentSummary = await assignCoverageToScenes();
        aggregate = sumSummaries(aggregate, assignmentSummary);

        // 8. Create Sample Projects
        logger.sectionDivider('STEP 8: Sample Projects Setup (2 projects total)');
        const projectsResult = await createMoonriseProjects();
        aggregate = sumSummaries(aggregate, projectsResult.summary);

        // 9. Create Sample Inquiries
        logger.sectionDivider('STEP 9: Sample Inquiries Setup (5 inquiries total)');
        const inquiriesResult = await createMoonriseInquiries();
        aggregate = sumSummaries(aggregate, inquiriesResult.summary);

        // 10. Create Locations Library
        logger.sectionDivider('STEP 10: Locations Library Setup (5 venues total)');
        await seedMoonriseLocationsLibrary();

        // 11. Create Subjects Library
        logger.sectionDivider('STEP 11: Subjects Library Setup (20 subjects total)');
        const subjectsResult = await createMoonriseSubjectsLibrary();

        // 12. Create Music Library
        logger.sectionDivider('STEP 12: Music Library Setup (15 templates total)');
        const musicResult = await createMoonriseMusicLibrary();

        // 13. Create Moment Templates
        logger.sectionDivider('STEP 13: Moment Templates Setup (13 templates total)');
        const momentsResult = await seedMomentTemplates();

        // 14. Create Equipment
        logger.sectionDivider('STEP 14: Equipment Setup (16 items total)');
        const equipmentSummary = await seedEquipment();
        if (equipmentSummary) aggregate = sumSummaries(aggregate, equipmentSummary);

        // 15. (Optional) Specialized Coverage Library
        // Skipped rerun to avoid clearing scene assignments. If needed, add a non-destructive adder.

        // Final Summary
        logger.sectionDivider('Summary');
        logger.success('Moonrise Films Complete Setup Finished!');
        logger.info(`• 1 brand (${brand.name})`);
        logger.info(`• ${team.teamMembers.length} team members (Managers)`);
        logger.info(`• 2 wedding scenes (First Dance + Ceremony)`);
        logger.info(`• ${filmCount} film library items`);
        logger.info(`• ${taskCount} task library items`);
        logger.info(`• ${coverageStats.totalCoverage} coverage items (${coverageStats.videoCoverageCount} video + ${coverageStats.audioCoverageCount} audio)`);
        logger.info(`• ${assignmentSummary.created} scene coverage assignments`);
        logger.info(`• ${projectsResult.projects.length} sample wedding projects`);
        logger.info(`• ${inquiriesResult.inquiries.length} sample wedding inquiries`);
        logger.info(`• 5 Shropshire wedding venues with spaces`);
        logger.info(`• ${subjectsResult.total} wedding subjects (${subjectsResult.primary.length} primary, ${subjectsResult.bridalParty.length} bridal party, ${subjectsResult.family.length} family)`);
        logger.info(`• ${musicResult.total} music templates (${musicResult.ceremony.length} ceremony, ${musicResult.reception.length} reception, ${musicResult.dances.length} dances)`);
        logger.info(`• ${momentsResult.total} moment templates (${momentsResult.ceremonyCount} ceremony + ${momentsResult.firstDanceCount} first dance)`);
        logger.info(`• Equipment & specialized coverage library ready`);
        logger.info(`• Aggregate changes this run — Created: ${aggregate.created}, Updated: ${aggregate.updated}, Skipped: ${aggregate.skipped}, Total: ${aggregate.total}`);

        // Provide neutral summary as sub-seeds handle detailed counts
        return aggregate;
    } catch (error) {
        console.error("❌ Moonrise Films setup failed:", error);
        throw error;
    }
}

// Export the main function for use in other modules
export default main;

// Allow running this file directly
if (require.main === module) {
    main()
        .then((summary) => {
            console.log('Moonrise setup completed:', summary);
        })
        .catch((e) => {
            console.error("❌ Moonrise Films setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Moonrise Films setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
