import { PrismaClient, MusicType } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

async function seedDemoMusic(): Promise<SeedSummary> {
    logger.sectionHeader('Demo Music Assignments', 'DEMO: Scene + Moment Music');
    logger.startTimer('demo-music');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        logger.warning('Moonrise Films brand not found, skipping demo music.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const film = await prisma.film.findFirst({
        where: { name: 'Smith Wedding', brand_id: brand.id }
    });

    if (!film) {
        logger.warning('Demo film not found, skipping demo music.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const filmScene = await prisma.filmScene.findFirst({
        where: { film_id: film.id, name: 'Ceremony' },
        include: { moments: true }
    });

    if (!filmScene) {
        logger.warning('Demo scene not found, skipping demo music.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const sceneMusic = await prisma.sceneMusic.findUnique({
        where: { film_scene_id: filmScene.id }
    });

    if (sceneMusic) {
        await prisma.sceneMusic.update({
            where: { id: sceneMusic.id },
            data: {
                music_name: 'Classical Ceremony Background',
                artist: 'Various Artists',
                duration: 240,
                music_type: MusicType.CLASSICAL,
                updated_at: new Date()
            }
        });
        updated += 1;
    } else {
        await prisma.sceneMusic.create({
            data: {
                film_scene_id: filmScene.id,
                music_name: 'Classical Ceremony Background',
                artist: 'Various Artists',
                duration: 240,
                music_type: MusicType.CLASSICAL,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        created += 1;
    }

    const momentsByName = new Map(filmScene.moments.map((moment) => [moment.name, moment]));
    const overrides = [
        {
            name: 'Vows',
            musicName: 'Emotional Piano',
            artist: 'Piano Collective',
            duration: 90,
            musicType: MusicType.PIANO
        },
        {
            name: 'Ring Exchange',
            musicName: 'Soft Strings',
            artist: 'String Quartet',
            duration: 60,
            musicType: MusicType.ORCHESTRAL
        },
        {
            name: 'First Kiss',
            musicName: 'Romantic Orchestral',
            artist: 'Ceremony Ensemble',
            duration: 45,
            musicType: MusicType.ORCHESTRAL
        }
    ];

    for (const override of overrides) {
        const moment = momentsByName.get(override.name);
        if (!moment) {
            skipped += 1;
            continue;
        }

        const existing = await prisma.momentMusic.findUnique({
            where: { moment_id: moment.id }
        });

        if (existing) {
            await prisma.momentMusic.update({
                where: { id: existing.id },
                data: {
                    music_name: override.musicName,
                    artist: override.artist,
                    duration: override.duration,
                    music_type: override.musicType,
                    overrides_scene_music: true,
                    updated_at: new Date()
                }
            });
            updated += 1;
        } else {
            await prisma.momentMusic.create({
                data: {
                    moment_id: moment.id,
                    music_name: override.musicName,
                    artist: override.artist,
                    duration: override.duration,
                    music_type: override.musicType,
                    overrides_scene_music: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            created += 1;
        }
    }

    logger.summary('Demo music', {
        created,
        updated,
        skipped,
        total: created + updated + skipped
    });
    logger.endTimer('demo-music', 'Demo music seeding');

    return { created, updated, skipped, total: created + updated + skipped };
}

export default seedDemoMusic;

if (require.main === module) {
    seedDemoMusic()
        .catch((error) => {
            console.error('❌ Error seeding demo music:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
