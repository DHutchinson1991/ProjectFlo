/**
 * Moonrise Content – Subject Templates (people-only)
 *
 * Seeds brand-scoped subject templates for the film editor.
 * Trimmed to people roles only — object/venue subjects removed.
 */

import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.MOONRISE);

const subjectTemplates = [
    { name: 'Bride' },
    { name: 'Groom' },
    { name: 'Officiant' },
    { name: 'Maid of Honor' },
    { name: 'Best Man' },
    { name: 'Parents' },
    { name: 'Flower Girl' },
    { name: 'Ring Bearer' },
    { name: 'Grandparents' },
    { name: 'Bridesmaids' },
    { name: 'Groomsmen' },
    { name: 'Guests' },
];

async function seedSubjectTemplates(db: PrismaClient): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('Content', 'Subject Templates');
    logger.processing('Seeding subject templates (people-only)');

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        throw new Error('Moonrise Films brand not found');
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const subject of subjectTemplates) {
        const existing = await prisma.subjectTemplate.findFirst({
            where: { brand_id: brand.id, name: subject.name },
        });

        if (existing) {
            await prisma.subjectTemplate.update({
                where: { id: existing.id },
                data: {
                    brand_id: brand.id,
                    is_system: true,
                    updated_at: new Date(),
                },
            });
            updated += 1;
            logger.skipped(subject.name, 'already exists', 'verbose');
        } else {
            await prisma.subjectTemplate.create({
                data: {
                    brand_id: brand.id,
                    name: subject.name,
                    is_system: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            created += 1;
            logger.created(subject.name, undefined, 'verbose');
        }
    }

    skipped = subjectTemplates.length - (created + updated);
    logger.summary('Subject templates', { created, updated, skipped, total: subjectTemplates.length });

    return { created, updated, skipped, total: subjectTemplates.length };
}

export default seedSubjectTemplates;
