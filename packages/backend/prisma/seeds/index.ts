import { PrismaClient } from '@prisma/client';
import { logger, SeedSummary, createSeedLogger, SeedType, sumSummaries } from '../utils/seed-logger';
import { printFinalMetrics, getGlobalCounts, getBrandCounts, type BrandCountSnapshot, type GlobalCountSnapshot } from '../utils/seed-metrics';
import type { PerBrandRun } from '../utils/seed-metrics';

// ── Moonrise sub-seeds ────────────────────────────────────────────────────────
import { createMoonriseBrand, createMoonriseTeam } from './moonrise-platform.seed';
import seedSubjectTemplates from './moonrise-content.seed';
import seedEventTemplates from './moonrise-catalog-event-templates.seed';
import seedServices from './moonrise-catalog-services.seed';
import seedPackages from './moonrise-catalog-packages.seed';
import { createMoonriseTaskLibrary, backfillPipelineSkills, seedTaskCrewAssignments } from './moonrise-workflow.seed';
import { seedMoonriseLocationsLibrary } from './moonrise-catalog-locations-library.seed';
import { seedEquipment } from './moonrise-catalog-equipment-library.seed';

// ── Layer5 sub-seeds ──────────────────────────────────────────────────────────
import { createLayer5Brand } from './layer5-platform.seed';

const prisma = new PrismaClient();
const moonriseLogger = createSeedLogger(SeedType.MOONRISE);
const layer5Logger = createSeedLogger(SeedType.LAYER5);

// ─────────────────────────────────────────────────────────────────────────────
// MOONRISE FILMS
// ─────────────────────────────────────────────────────────────────────────────
async function seedMoonrise(): Promise<SeedSummary> {
    moonriseLogger.sectionHeader('Moonrise Films');
    let aggregate: SeedSummary = { created: 0, updated: 0, skipped: 0, total: 0 };

    const brand = await createMoonriseBrand(prisma);

    moonriseLogger.processing('Linking global admin to Moonrise Films...');
    const adminContact = await prisma.contacts.findUnique({
        where: { email: 'info@dhutchinson.co.uk' },
        include: { crew: true }
    });
    if (adminContact?.crew) {
        if (!adminContact.brand_id) {
            await prisma.contacts.update({ where: { id: adminContact.id }, data: { brand_id: brand.id } });
        }
        await prisma.brandMember.upsert({
            where: { crew_id_brand_id: { crew_id: adminContact.crew.id, brand_id: brand.id } },
            update: { is_active: true },
            create: { crew_id: adminContact.crew.id, brand_id: brand.id, is_active: true },
        });
        moonriseLogger.success('Admin linked to Moonrise Films');

        const [directorRole, producerRole, videographerRole, editorRole, soundEngineerRole] = await Promise.all([
            prisma.job_roles.findUnique({ where: { name: 'director' } }),
            prisma.job_roles.findUnique({ where: { name: 'producer' } }),
            prisma.job_roles.findUnique({ where: { name: 'videographer' } }),
            prisma.job_roles.findUnique({ where: { name: 'editor' } }),
            prisma.job_roles.findUnique({ where: { name: 'sound_engineer' } }),
        ]);
        const danielRoles: Array<{ role: typeof directorRole; tier: string; primary: boolean; label: string }> = [
            { role: directorRole,      tier: 'lead',      primary: true,  label: 'Director (Lead)' },
            { role: producerRole,      tier: 'executive', primary: false, label: 'Producer (Executive)' },
            { role: videographerRole,  tier: 'lead',      primary: false, label: 'Videographer (Lead)' },
            { role: editorRole,        tier: 'lead',      primary: false, label: 'Editor (Lead)' },
            { role: soundEngineerRole, tier: 'lead',      primary: false, label: 'Sound Engineer (Lead)' },
        ];
        for (const { role, tier, primary, label } of danielRoles) {
            if (!role) continue;
            const bracket = await prisma.payment_brackets.findUnique({
                where: { job_role_id_name: { job_role_id: role.id, name: tier } },
            });
            await prisma.crewJobRole.upsert({
                where: { crew_id_job_role_id: { crew_id: adminContact.crew.id, job_role_id: role.id } },
                update: { is_primary: primary, payment_bracket_id: bracket?.id ?? null },
                create: { crew_id: adminContact.crew.id, job_role_id: role.id, is_primary: primary, payment_bracket_id: bracket?.id ?? null },
            });
            moonriseLogger.created(`Daniel → ${label}`, undefined, 'verbose');
        }
    }

    moonriseLogger.sectionDivider('Platform: Team');
    const team = await createMoonriseTeam(prisma, brand.id);

    moonriseLogger.sectionDivider('Content: Subject Templates');
    aggregate = sumSummaries(aggregate, await seedSubjectTemplates(prisma));

    moonriseLogger.sectionDivider('Catalog: Event Templates');
    aggregate = sumSummaries(aggregate, await seedEventTemplates(prisma));

    moonriseLogger.sectionDivider('Catalog: Services');
    aggregate = sumSummaries(aggregate, await seedServices(prisma));

    moonriseLogger.sectionDivider('Catalog: Packages');
    aggregate = sumSummaries(aggregate, await seedPackages());

    moonriseLogger.sectionDivider('Workflow: Task Library');
    const taskCount = await createMoonriseTaskLibrary(prisma, brand.id);

    moonriseLogger.sectionDivider('Workflow: Task Crew Assignments');
    await backfillPipelineSkills(prisma, brand.id);
    const crewSummary = await seedTaskCrewAssignments(prisma, brand.id);
    aggregate = sumSummaries(aggregate, crewSummary);

    moonriseLogger.sectionDivider('Catalog: Locations Library');
    await seedMoonriseLocationsLibrary();

    moonriseLogger.sectionDivider('Catalog: Equipment Library');
    const equipmentSummary = await seedEquipment();
    if (equipmentSummary) aggregate = sumSummaries(aggregate, equipmentSummary);

    moonriseLogger.success(`Moonrise Films done — ${team.teamMembers.length} team, ${taskCount} tasks, Created: ${aggregate.created}, Skipped: ${aggregate.skipped}`);
    return aggregate;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER5
// ─────────────────────────────────────────────────────────────────────────────
async function seedLayer5(): Promise<SeedSummary> {
    layer5Logger.sectionHeader('Layer5 Corporate Videography');
    const aggregate: SeedSummary = { created: 0, updated: 0, skipped: 0, total: 0 };

    const brand = await createLayer5Brand();

    layer5Logger.processing('Linking global admin to Layer5...');
    const adminContact = await prisma.contacts.findUnique({
        where: { email: 'info@dhutchinson.co.uk' },
        include: { crew: true }
    });
    if (adminContact?.crew) {
        await prisma.brandMember.upsert({
            where: { crew_id_brand_id: { crew_id: adminContact.crew.id, brand_id: brand.id } },
            update: { is_active: true },
            create: { crew_id: adminContact.crew.id, brand_id: brand.id, is_active: true },
        });
        layer5Logger.success('Admin linked to Layer5');
    }

    layer5Logger.success(`Layer5 done — Created: ${aggregate.created}, Skipped: ${aggregate.skipped}`);
    return aggregate;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    logger.sectionHeader('Starting Comprehensive Database Seeding');

    const finalSummary: SeedSummary = { created: 0, updated: 0, skipped: 0, total: 0 };

    try {
        const beforeGlobal: GlobalCountSnapshot = await getGlobalCounts(prisma);
        const beforeBrand: Record<string, BrandCountSnapshot> = {};
        const [beforeMoonrise, beforeLayer5] = await Promise.all([
            prisma.brands.findFirst({ where: { name: 'Moonrise Films' } }),
            prisma.brands.findFirst({ where: { name: 'Layer5' } })
        ]);
        if (beforeMoonrise) beforeBrand['Moonrise Films'] = await getBrandCounts(prisma, beforeMoonrise.id);
        if (beforeLayer5) beforeBrand['Layer5'] = await getBrandCounts(prisma, beforeLayer5.id);

        // ── System seeds ────────────────────────────────────────────────────
        logger.info('1️⃣  system-admin');
        const adminSeed = await import('./system-platform-admin.seed');
        const s1 = await adminSeed.default(prisma);

        logger.info('2️⃣  system-platform');
        const platformSeed = await import('./system-platform.seed');
        const s2 = await platformSeed.default(prisma);

        logger.info('3️⃣  system-finance');
        const financeSeed = await import('./system-finance.seed');
        const s3 = await financeSeed.default(prisma);

        logger.info('4️⃣  system-content');
        const contentSeed = await import('./system-content.seed');
        const s4 = await contentSeed.default(prisma);

        logger.info('5️⃣  system-catalog');
        const catalogSeed = await import('./system-catalog.seed');
        const s5 = await catalogSeed.default(prisma);

        for (const s of [s1, s2, s3, s4, s5]) {
            finalSummary.created += s.created;
            finalSummary.updated += s.updated;
            finalSummary.skipped += s.skipped;
            finalSummary.total   += s.total;
        }

        // ── Brand seeds ──────────────────────────────────────────────────────
        logger.info('6️⃣  Moonrise Films');
        const moonriseSummary = await seedMoonrise();
        finalSummary.created += moonriseSummary.created;
        finalSummary.updated += moonriseSummary.updated;
        finalSummary.skipped += moonriseSummary.skipped;
        finalSummary.total   += moonriseSummary.total;

        logger.info('7️⃣  Layer5');
        const layer5Summary = await seedLayer5();
        finalSummary.created += layer5Summary.created;
        finalSummary.updated += layer5Summary.updated;
        finalSummary.skipped += layer5Summary.skipped;
        finalSummary.total   += layer5Summary.total;

        // ── Post-brand: contract clauses + templates (need brands to exist)
        logger.info('8️⃣  Contract clauses & templates');
        const { seedContractsForBrands } = await import('./system-finance.seed');
        const contractsSummary = await seedContractsForBrands(prisma);
        finalSummary.created += contractsSummary.created;
        finalSummary.updated += contractsSummary.updated;
        finalSummary.skipped += contractsSummary.skipped;
        finalSummary.total   += contractsSummary.total;

        const perBrandRun: PerBrandRun = {};
        await printFinalMetrics(prisma, finalSummary, beforeGlobal, beforeBrand, perBrandRun);
        logger.success('Your database is now ready for development and testing!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
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
