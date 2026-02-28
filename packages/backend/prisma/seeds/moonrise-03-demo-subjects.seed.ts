import { PrismaClient, SubjectCategory } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

async function seedDemoSubjects(): Promise<SeedSummary> {
    logger.sectionHeader('Demo Film Subjects', 'DEMO: Film Subjects');
    logger.startTimer('demo-film-subjects');

    let created = 0;
    let updated = 0;
    const skipped = 0;

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        logger.warning('Moonrise Films brand not found, skipping demo subjects.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const film = await prisma.film.findFirst({
        where: { name: 'Smith Wedding', brand_id: brand.id }
    });

    if (!film) {
        logger.warning('Demo film not found, skipping demo subjects.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const subjectTemplateNames = ['Bride', 'Groom', 'Officiant', 'Rings'];
    const templates = await prisma.subjectTemplate.findMany({
        where: { name: { in: subjectTemplateNames } }
    });

    for (const template of templates) {
        const existing = await prisma.filmSubject.findFirst({
            where: { film_id: film.id, name: template.name }
        });

        if (existing) {
            await prisma.filmSubject.update({
                where: { id: existing.id },
                data: {
                    category: template.category,
                    is_custom: false,
                    updated_at: new Date()
                }
            });
            updated += 1;
        } else {
            await prisma.filmSubject.create({
                data: {
                    film_id: film.id,
                    name: template.name,
                    category: template.category,
                    is_custom: false,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            created += 1;
        }
    }

    const customSubjectName = "Max";
    const existingCustom = await prisma.filmSubject.findFirst({
        where: { film_id: film.id, name: customSubjectName }
    });

    if (existingCustom) {
        await prisma.filmSubject.update({
            where: { id: existingCustom.id },
            data: {
                category: SubjectCategory.PEOPLE,
                is_custom: true,
                updated_at: new Date()
            }
        });
        updated += 1;
    } else {
        await prisma.filmSubject.create({
            data: {
                film_id: film.id,
                name: customSubjectName,
                category: SubjectCategory.PEOPLE,
                is_custom: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        created += 1;
    }

    logger.summary('Demo film subjects', {
        created,
        updated,
        skipped,
        total: created + updated + skipped
    });
    logger.endTimer('demo-film-subjects', 'Demo film subjects seeding');

    return { created, updated, skipped, total: created + updated + skipped };
}

export default seedDemoSubjects;

if (require.main === module) {
    seedDemoSubjects()
        .catch((error) => {
            console.error('❌ Error seeding demo subjects:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
