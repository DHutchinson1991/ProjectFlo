// System Catalog Seed — Equipment Owners + Camera Limits
// Requires brand seeds and team seeds to have run first (looks up contributors by name).
// Silently skips if contributors or brands don't exist yet.
import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary, sumSummaries } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.SYSTEM);

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPMENT OWNERS  (alternates Andy Galloway / Daniel Hutchinson)
// ─────────────────────────────────────────────────────────────────────────────
async function seedEquipmentOwners(): Promise<SeedSummary> {
    logger.startTimer('equipment-owners');
    logger.processing('Assigning equipment owners...');

    const andy = await prisma.contributors.findFirst({
        where: { contact: { first_name: { equals: 'Andy', mode: 'insensitive' }, last_name: { equals: 'Galloway', mode: 'insensitive' } } },
        select: { id: true },
    });
    const daniel = await prisma.contributors.findFirst({
        where: { contact: { first_name: { equals: 'Daniel', mode: 'insensitive' }, last_name: { equals: 'Hutchinson', mode: 'insensitive' } } },
        select: { id: true },
    });

    if (!andy || !daniel) {
        logger.info('Andy Galloway or Daniel Hutchinson not found — skipping equipment owner assignment (run team seeds first)', 'normal');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const allEquipment = await prisma.equipment.findMany({ select: { id: true, item_name: true }, orderBy: { id: 'asc' } });
    if (allEquipment.length === 0) {
        logger.info('No equipment found — skipping (run equipment library seed first)', 'normal');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    let updated = 0;
    for (let i = 0; i < allEquipment.length; i++) {
        const ownerId = i % 2 === 0 ? andy.id : daniel.id;
        await prisma.equipment.update({ where: { id: allEquipment[i].id }, data: { owner_id: ownerId } });
        updated++;
        logger.created(`"${allEquipment[i].item_name}" → ${i % 2 === 0 ? 'Andy Galloway' : 'Daniel Hutchinson'}`, undefined, 'verbose');
    }

    logger.smartSummary('Equipment owner assignments', 0, updated, allEquipment.length);
    logger.endTimer('equipment-owners', 'Equipment owners');
    return { created: 0, updated, skipped: 0, total: allEquipment.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA LIMITS  (brand setting: max_cameras_per_operator = 3)
// ─────────────────────────────────────────────────────────────────────────────
async function seedCameraLimits(): Promise<SeedSummary> {
    logger.startTimer('camera-limits');
    logger.processing('Seeding max_cameras_per_operator brand setting...');

    const brands = await prisma.brands.findMany({ where: { is_active: true }, select: { id: true, name: true } });
    if (brands.length === 0) {
        logger.info('No active brands found — skipping camera limits (run brand seeds first)', 'normal');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    let created = 0;
    let skipped = 0;
    const SETTING_KEY = 'max_cameras_per_operator';

    for (const brand of brands) {
        const existing = await prisma.brand_settings.findUnique({ where: { brand_id_key: { brand_id: brand.id, key: SETTING_KEY } } });
        if (existing) {
            logger.skipped(`"${brand.name}" ${SETTING_KEY}`, 'already set', 'verbose');
            skipped++;
            continue;
        }
        await prisma.brand_settings.create({
            data: { brand_id: brand.id, key: SETTING_KEY, value: '3', data_type: 'number', category: 'crew', description: 'Maximum number of cameras a single videographer/operator can manage during real-time coverage', is_active: true },
        });
        created++;
        logger.created(`"${brand.name}" — ${SETTING_KEY} = 3`, undefined, 'verbose');
    }

    logger.smartSummary('Camera limit settings', created, 0, brands.length);
    logger.endTimer('camera-limits', 'Camera limits');
    return { created, updated: 0, skipped, total: brands.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
async function main(db: PrismaClient): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('System Catalog');
    logger.startTimer('system-catalog');

    const s1 = await seedEquipmentOwners();
    logger.sectionDivider('Camera Limits');
    const s2 = await seedCameraLimits();

    const total = sumSummaries(s1, s2);
    logger.success(`System Catalog done — Created: ${total.created}, Updated: ${total.updated}`);
    logger.endTimer('system-catalog', 'System Catalog');
    return total;
}

export default main;
