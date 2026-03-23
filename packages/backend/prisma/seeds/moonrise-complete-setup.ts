// Moonrise Films Complete Setup - Orchestrates all seed modules
// Runs all moonrise seed modules in the correct order
import { createMoonriseBrand } from './moonrise-brand-setup';
import { createMoonriseTeam } from './moonrise-team-setup';
import { createMoonriseTaskLibrary } from './moonrise-task-library';
import { createMoonriseProjects } from './moonrise-projects-setup';
import { seedMoonriseLocationsLibrary } from './moonrise-locations-library';
import { seedEquipment } from './moonrise-equipment-setup';
import seedSubjectTemplates from './moonrise-subject-templates.seed';
import seedSceneTemplates from './moonrise-scene-templates.seed';
import seedDemoFilmStructure from './moonrise-02-demo-film-structure.seed';
import seedDemoSubjects from './moonrise-03-demo-subjects.seed';
import seedDemoRecordingSetups from './moonrise-04-demo-recording-setups.seed';
import seedDemoMusic from './moonrise-05-demo-music.seed';
import seedWeddingSubjects from './moonrise-06-wedding-subjects.seed';
import seedEventDayTemplates from './moonrise-07-event-day-templates.seed';
import seedActivityPresets from './moonrise-07a-activity-presets.seed';
import seedActivityMoments from './moonrise-08-activity-moments.seed';
import seedWeddingTypes from './moonrise-09-wedding-types.seed';
import seedSamplePackages from './moonrise-10-sample-packages.seed';
import seedEventTypes from './moonrise-11-event-types.seed';
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

        // Associate admin user with Moonrise brand
        logger.processing('Linking global admin to Moonrise Films...');
        const adminContact = await prisma.contacts.findUnique({
            where: { email: 'info@dhutchinson.co.uk' },
            include: { contributor: true }
        });
        if (adminContact?.contributor) {
            // Ensure admin contact is associated with this brand for contributor queries
            if (!adminContact.brand_id) {
                await prisma.contacts.update({ where: { id: adminContact.id }, data: { brand_id: brand.id } });
            }
            await prisma.user_brands.upsert({
                where: {
                    user_id_brand_id: {
                        user_id: adminContact.contributor.id,
                        brand_id: brand.id,
                    },
                },
                update: {
                    role: 'Admin',
                    is_active: true,
                },
                create: {
                    user_id: adminContact.contributor.id,
                    brand_id: brand.id,
                    role: 'Admin',
                    is_active: true,
                },
            });
            logger.success('Admin linked to Moonrise Films');

            // Assign Daniel as Director (primary, lead) + Producer (executive) crew roles
            const [directorRole, producerRole] = await Promise.all([
                prisma.job_roles.findUnique({ where: { name: 'director' } }),
                prisma.job_roles.findUnique({ where: { name: 'producer' } }),
            ]);
            if (directorRole) {
                const bracket = await prisma.payment_brackets.findUnique({
                    where: { job_role_id_name: { job_role_id: directorRole.id, name: 'lead' } },
                });
                await prisma.contributor_job_roles.upsert({
                    where: { contributor_id_job_role_id: { contributor_id: adminContact.contributor.id, job_role_id: directorRole.id } },
                    update: { is_primary: true, payment_bracket_id: bracket?.id ?? null },
                    create: { contributor_id: adminContact.contributor.id, job_role_id: directorRole.id, is_primary: true, payment_bracket_id: bracket?.id ?? null },
                });
                logger.created('Daniel → Director (Lead)', undefined, 'verbose');
            }
            if (producerRole) {
                const bracket = await prisma.payment_brackets.findUnique({
                    where: { job_role_id_name: { job_role_id: producerRole.id, name: 'executive' } },
                });
                await prisma.contributor_job_roles.upsert({
                    where: { contributor_id_job_role_id: { contributor_id: adminContact.contributor.id, job_role_id: producerRole.id } },
                    update: { is_primary: false, payment_bracket_id: bracket?.id ?? null },
                    create: { contributor_id: adminContact.contributor.id, job_role_id: producerRole.id, is_primary: false, payment_bracket_id: bracket?.id ?? null },
                });
                logger.created('Daniel → Producer (Executive)', undefined, 'verbose');
            }
        }

        // 2. Create Team
        logger.sectionDivider('STEP 2: Team Setup (2 managers total)');
        const team = await createMoonriseTeam(brand.id);

        // 3. Seed Moonrise subject templates
        logger.sectionDivider('STEP 3: Subject Templates (Moonrise)');
        const subjectSummary = await seedSubjectTemplates();
        aggregate = sumSummaries(aggregate, subjectSummary);

        // 4. Seed Moonrise scene templates
        logger.sectionDivider('STEP 4: Scene Templates (Moonrise)');
        const sceneSummary = await seedSceneTemplates();
        aggregate = sumSummaries(aggregate, sceneSummary);

        if (process.env.SEED_DEMO_DATA === 'true') {
            logger.sectionDivider('STEP 4b: Demo Data');
            const demoFilmSummary = await seedDemoFilmStructure();
            aggregate = sumSummaries(aggregate, demoFilmSummary);

            const demoSubjectsSummary = await seedDemoSubjects();
            aggregate = sumSummaries(aggregate, demoSubjectsSummary);

            const demoRecordingSummary = await seedDemoRecordingSetups();
            aggregate = sumSummaries(aggregate, demoRecordingSummary);

            const demoMusicSummary = await seedDemoMusic();
            aggregate = sumSummaries(aggregate, demoMusicSummary);
        }

        // 5. Seed Moonrise wedding subject roles
        logger.sectionDivider('STEP 5: Wedding Subject Roles');
        const weddingSubjectsSummary = await seedWeddingSubjects();
        aggregate = sumSummaries(aggregate, weddingSubjectsSummary);

        // 6. Seed event day templates
        logger.sectionDivider('STEP 6: Event Day Templates');
        const eventDaySummary = await seedEventDayTemplates();
        aggregate = sumSummaries(aggregate, eventDaySummary);

        // 7. Seed activity presets
        logger.sectionDivider('STEP 7: Activity Presets');
        const activityPresetsSummary = await seedActivityPresets();
        aggregate = sumSummaries(aggregate, activityPresetsSummary);

        // 8. Seed activity moments
        logger.sectionDivider('STEP 8: Activity Moments');
        const activityMomentsSummary = await seedActivityMoments();
        aggregate = sumSummaries(aggregate, activityMomentsSummary);

        // 9. Seed event types
        logger.sectionDivider('STEP 9: Event Types');
        const eventTypesSummary = await seedEventTypes();
        aggregate = sumSummaries(aggregate, eventTypesSummary);

        // 10. Seed wedding type templates
        logger.sectionDivider('STEP 10: Wedding Type Templates');
        const weddingTypesSummary = await seedWeddingTypes();
        aggregate = sumSummaries(aggregate, weddingTypesSummary);

        // 11. Seed sample packages
        logger.sectionDivider('STEP 11: Sample Packages');
        const samplePackagesSummary = await seedSamplePackages();
        aggregate = sumSummaries(aggregate, samplePackagesSummary);

        // 12. Create Task Library
        logger.sectionDivider('STEP 12: Task Library Setup (43 tasks total)');
        const taskCount = await createMoonriseTaskLibrary(brand.id);

        // 13. Create Sample Projects
        logger.sectionDivider('STEP 13: Sample Projects Setup');
        const projectsResult = await createMoonriseProjects();
        aggregate = sumSummaries(aggregate, projectsResult.summary);

        // 14. Create Locations Library
        logger.sectionDivider('STEP 14: Locations Library Setup (5 venues total)');
        await seedMoonriseLocationsLibrary();

        // 15. Create Equipment (Music library removed - now using SceneMusic/MomentMusic in refactor v2)
        logger.sectionDivider('STEP 15: Equipment Setup (16 items total)');
        const equipmentSummary = await seedEquipment();
        if (equipmentSummary) aggregate = sumSummaries(aggregate, equipmentSummary);

        // 15. (Optional) Specialized Coverage Library
        // Skipped rerun to avoid clearing scene assignments. If needed, add a non-destructive adder.

        // Final Summary
        logger.sectionDivider('Summary');
        logger.success('Moonrise Films Complete Setup Finished!');
        logger.info(`• 1 brand (${brand.name})`);
        logger.info(`• ${team.teamMembers.length} team members (Managers)`);
        logger.info(`• Subject templates seeded: ${subjectSummary.created + subjectSummary.updated}`);
        logger.info(`• Scene templates seeded: ${sceneSummary.created + sceneSummary.updated}`);
        logger.info(`• Wedding subject roles seeded: ${weddingSubjectsSummary.created + weddingSubjectsSummary.updated}`);
        logger.info(`• Event day templates seeded: ${eventDaySummary.created + eventDaySummary.updated}`);
        logger.info(`• Activity presets seeded: ${activityPresetsSummary.created + activityPresetsSummary.updated}`);
        logger.info(`• Activity moments seeded: ${activityMomentsSummary.created + activityMomentsSummary.updated}`);
        logger.info(`• Event types seeded: ${eventTypesSummary.created + eventTypesSummary.updated}`);
        logger.info(`• Wedding type templates seeded: ${weddingTypesSummary.created + weddingTypesSummary.updated}`);
        logger.info(`• Sample packages seeded: ${samplePackagesSummary.created + samplePackagesSummary.updated}`);
        logger.info(`• ${taskCount} task library items`);
        logger.info(`• ${projectsResult.projects.length} sample wedding projects`);
        logger.info(`• 5 Shropshire wedding venues with spaces`);
        logger.info(`• Equipment seeded for Moonrise Films`);
        logger.info(`• Music library skipped (legacy model removed - use SceneMusic/MomentMusic in refactor v2)`);
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
