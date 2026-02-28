import { PrismaClient, TrackType } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

async function seedDemoFilmStructure(): Promise<SeedSummary> {
    logger.sectionHeader('Demo Film Structure', 'DEMO: Film + Equipment + Scene');
    logger.startTimer('demo-film-structure');

    let created = 0;
    let updated = 0;
    const skipped = 0;

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        logger.warning('Moonrise Films brand not found, skipping demo film structure.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const existingFilm = await prisma.film.findFirst({
        where: { name: 'Smith Wedding', brand_id: brand.id }
    });

    const film = existingFilm
        ? await prisma.film.update({
            where: { id: existingFilm.id },
            data: { updated_at: new Date() }
        })
        : await prisma.film.create({
            data: {
                name: 'Smith Wedding',
                brand_id: brand.id,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

    if (existingFilm) {
        updated += 1;
        logger.skipped('Demo film "Smith Wedding"', 'already exists, updated', 'verbose');
    } else {
        created += 1;
        logger.created('Demo film "Smith Wedding"', undefined, 'verbose');
    }

    const trackSeeds = [
        { name: 'Graphics', type: TrackType.GRAPHICS, order_index: 1 },
        { name: 'Camera 3', type: TrackType.VIDEO, order_index: 2 },
        { name: 'Camera 2', type: TrackType.VIDEO, order_index: 3 },
        { name: 'Camera 1', type: TrackType.VIDEO, order_index: 4 },
        { name: 'Audio 1', type: TrackType.AUDIO, order_index: 5 },
        { name: 'Audio 2', type: TrackType.AUDIO, order_index: 6 },
        { name: 'Music', type: TrackType.MUSIC, order_index: 7 }
    ];

    for (const track of trackSeeds) {
        const existingTrack = await prisma.filmTimelineTrack.findFirst({
            where: { film_id: film.id, name: track.name }
        });

        if (existingTrack) {
            await prisma.filmTimelineTrack.update({
                where: { id: existingTrack.id },
                data: {
                    type: track.type,
                    order_index: track.order_index,
                    is_active: true,
                    updated_at: new Date()
                }
            });
            updated += 1;
        } else {
            await prisma.filmTimelineTrack.create({
                data: {
                    film_id: film.id,
                    name: track.name,
                    type: track.type,
                    order_index: track.order_index,
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            created += 1;
        }
    }

    logger.info(`Track order set: ${trackSeeds.map((track) => `${track.order_index}:${track.name}`).join(', ')}`);

    const ceremonyTemplate = await prisma.sceneTemplate.findUnique({
        where: { name: 'Ceremony' },
        include: { moments: true }
    });

    if (!ceremonyTemplate) {
        logger.warning('Ceremony template not found, skipping demo scene/moments.');
        return { created, updated, skipped, total: created + updated + skipped };
    }

    const existingScene = await prisma.filmScene.findFirst({
        where: { film_id: film.id, name: 'Ceremony' }
    });

    const filmScene = existingScene
        ? await prisma.filmScene.update({
            where: { id: existingScene.id },
            data: { updated_at: new Date() }
        })
        : await prisma.filmScene.create({
            data: {
                film_id: film.id,
                scene_template_id: ceremonyTemplate.id,
                name: 'Ceremony',
                order_index: 1,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

    if (existingScene) {
        updated += 1;
    } else {
        created += 1;
    }

    await prisma.sceneMoment.deleteMany({ where: { film_scene_id: filmScene.id } });

    if (ceremonyTemplate.moments.length > 0) {
        await prisma.sceneMoment.createMany({
            data: ceremonyTemplate.moments.map((moment) => ({
                film_scene_id: filmScene.id,
                name: moment.name,
                order_index: moment.order_index,
                duration: moment.estimated_duration ?? 60,
                created_at: new Date(),
                updated_at: new Date()
            }))
        });
    }

    logger.summary('Demo film structure', {
        created,
        updated,
        skipped,
        total: created + updated + skipped
    });
    logger.endTimer('demo-film-structure', 'Demo film structure seeding');

    return { created, updated, skipped, total: created + updated + skipped };
}

export default seedDemoFilmStructure;

if (require.main === module) {
    seedDemoFilmStructure()
        .catch((error) => {
            console.error('❌ Error seeding demo film structure:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
