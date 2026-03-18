import { PrismaClient, SubjectCategory } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.SUBJECTS);

const subjectTemplates = [
    // PEOPLE (12)
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

    // OBJECTS (7)
    { name: 'Rings', category: SubjectCategory.OBJECTS },
    { name: 'Bouquet', category: SubjectCategory.OBJECTS },
    { name: 'Cake', category: SubjectCategory.OBJECTS },
    { name: 'Decorations', category: SubjectCategory.OBJECTS },
    { name: 'Dress Details', category: SubjectCategory.OBJECTS },
    { name: 'Shoes', category: SubjectCategory.OBJECTS },
    { name: 'Jewelry', category: SubjectCategory.OBJECTS },

    // LOCATIONS (5)
    { name: 'Venue Exterior', category: SubjectCategory.LOCATIONS },
    { name: 'Ceremony Space', category: SubjectCategory.LOCATIONS },
    { name: 'Reception Hall', category: SubjectCategory.LOCATIONS },
    { name: 'Bridal Suite', category: SubjectCategory.LOCATIONS },
    { name: 'Getting Ready Room', category: SubjectCategory.LOCATIONS }
];

async function seedSubjectTemplates(): Promise<SeedSummary> {
    logger.sectionHeader('Subject Templates', 'STEP 1/2: Global Templates');
    logger.startTimer('subject-templates-seed');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const subject of subjectTemplates) {
        const existing = await prisma.subjectTemplate.findUnique({
            where: { name: subject.name }
        });

        if (existing) {
            await prisma.subjectTemplate.update({
                where: { name: subject.name },
                data: {
                    category: subject.category,
                    is_system: true,
                    updated_at: new Date()
                }
            });
            updated += 1;
            logger.skipped(`Subject template "${subject.name}"`, 'already exists, updated', 'verbose');
        } else {
            await prisma.subjectTemplate.create({
                data: {
                    ...subject,
                    is_system: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            created += 1;
            logger.created(`Subject template "${subject.name}"`, undefined, 'verbose');
        }
    }

    skipped = subjectTemplates.length - (created + updated);
    logger.summary('Subject templates', { created, updated, skipped, total: subjectTemplates.length });
    logger.endTimer('subject-templates-seed', 'Subject templates seeding');

    return { created, updated, skipped, total: subjectTemplates.length };
}

export default seedSubjectTemplates;

if (require.main === module) {
    seedSubjectTemplates()
        .catch((error) => {
            console.error('❌ Error seeding subject templates:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
