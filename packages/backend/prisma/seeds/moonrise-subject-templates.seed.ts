import { PrismaClient, SubjectCategory } from '@prisma/client';
import { SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();

const subjectTemplates = [
    { name: 'Bride', category: SubjectCategory.PEOPLE },
    { name: 'Groom', category: SubjectCategory.PEOPLE },
    { name: 'Officiant', category: SubjectCategory.PEOPLE },
    { name: 'Maid of Honor', category: SubjectCategory.PEOPLE },
    { name: 'Best Man', category: SubjectCategory.PEOPLE },
    { name: 'Parents', category: SubjectCategory.PEOPLE },
    { name: 'Flower Girl', category: SubjectCategory.PEOPLE },
    { name: 'Ring Bearer', category: SubjectCategory.PEOPLE },
    { name: 'Grandparents', category: SubjectCategory.PEOPLE },
    { name: 'Bridesmaids', category: SubjectCategory.PEOPLE },
    { name: 'Groomsmen', category: SubjectCategory.PEOPLE },
    { name: 'Guests', category: SubjectCategory.PEOPLE },
    { name: 'Rings', category: SubjectCategory.OBJECTS },
    { name: 'Bouquet', category: SubjectCategory.OBJECTS },
    { name: 'Cake', category: SubjectCategory.OBJECTS },
    { name: 'Decorations', category: SubjectCategory.OBJECTS },
    { name: 'Dress Details', category: SubjectCategory.OBJECTS },
    { name: 'Shoes', category: SubjectCategory.OBJECTS },
    { name: 'Jewelry', category: SubjectCategory.OBJECTS },
    { name: 'Venue Exterior', category: SubjectCategory.LOCATIONS },
    { name: 'Ceremony Space', category: SubjectCategory.LOCATIONS },
    { name: 'Reception Hall', category: SubjectCategory.LOCATIONS },
    { name: 'Bridal Suite', category: SubjectCategory.LOCATIONS },
    { name: 'Getting Ready Room', category: SubjectCategory.LOCATIONS },
];

async function seedSubjectTemplates(): Promise<SeedSummary> {
    console.log('[MoonriseSubjectTemplates] Seeding subject templates');

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
                    category: subject.category,
                    is_system: true,
                    updated_at: new Date(),
                },
            });
            updated += 1;
        } else {
            await prisma.subjectTemplate.create({
                data: {
                    brand_id: brand.id,
                    name: subject.name,
                    category: subject.category,
                    is_system: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            created += 1;
        }
    }

    skipped = subjectTemplates.length - (created + updated);
    console.log(`[MoonriseSubjectTemplates] Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);

    return { created, updated, skipped, total: subjectTemplates.length };
}

export default seedSubjectTemplates;

if (require.main === module) {
    seedSubjectTemplates()
        .catch((error) => {
            console.error('[MoonriseSubjectTemplates] Seed failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
