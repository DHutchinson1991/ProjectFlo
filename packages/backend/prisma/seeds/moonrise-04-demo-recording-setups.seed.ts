import { PrismaClient, TrackType } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

async function seedDemoRecordingSetups(): Promise<SeedSummary> {
    logger.sectionHeader('Demo Recording Setups', 'DEMO: Recording Assignments');
    logger.startTimer('demo-recording-setups');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
        logger.warning('Moonrise Films brand not found, skipping demo recording setups.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const film = await prisma.film.findFirst({
        where: { name: 'Smith Wedding', brand_id: brand.id }
    });

    if (!film) {
        logger.warning('Demo film not found, skipping demo recording setups.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const filmScene = await prisma.filmScene.findFirst({
        where: { film_id: film.id, name: 'Ceremony' },
        include: { moments: true }
    });

    if (!filmScene) {
        logger.warning('Demo scene not found, skipping demo recording setups.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const tracks = await prisma.filmTimelineTrack.findMany({
        where: { film_id: film.id },
        orderBy: { order_index: 'asc' }
    });

    const videoTracks = tracks.filter((track) => track.type === TrackType.VIDEO);
    const audioTracks = tracks.filter((track) => track.type === TrackType.AUDIO);

    const subjects = await prisma.filmSubject.findMany({ where: { film_id: film.id } });
    const subjectByName = new Map(subjects.map((subject) => [subject.name, subject]));

    const momentsByName = new Map(filmScene.moments.map((moment) => [moment.name, moment]));

    const vows = momentsByName.get('Vows');
    const ringExchange = momentsByName.get('Ring Exchange');
    const firstKiss = momentsByName.get('First Kiss');

    const camera1 = videoTracks.find((track) => track.name === 'Camera 1');
    const camera2 = videoTracks.find((track) => track.name === 'Camera 2');
    const camera3 = videoTracks.find((track) => track.name === 'Camera 3');
    const audio1 = audioTracks.find((track) => track.name === 'Audio 1');
    const audio2 = audioTracks.find((track) => track.name === 'Audio 2');

    const bride = subjectByName.get('Bride');
    const groom = subjectByName.get('Groom');
    const rings = subjectByName.get('Rings');

    if (!camera1 || !camera2 || !camera3 || !audio1 || !audio2 || !bride || !groom || !rings) {
        logger.warning('Missing demo tracks or subjects, skipping recording setups.');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const setupSeeds = [
        {
            moment: vows,
            audioTrackIds: [audio1.id],
            graphicsEnabled: false,
            assignments: [
                { trackId: camera1.id, subjectIds: [bride.id] },
                { trackId: camera2.id, subjectIds: [groom.id] }
            ]
        },
        {
            moment: ringExchange,
            audioTrackIds: [audio2.id],
            graphicsEnabled: false,
            assignments: [
                { trackId: camera3.id, subjectIds: [bride.id, groom.id] },
                { trackId: camera1.id, subjectIds: [rings.id] }
            ]
        },
        {
            moment: firstKiss,
            audioTrackIds: [audio1.id, audio2.id],
            graphicsEnabled: true,
            assignments: [
                { trackId: camera2.id, subjectIds: [bride.id, groom.id] },
                { trackId: camera3.id, subjectIds: [bride.id, groom.id] }
            ]
        }
    ];

    for (const seed of setupSeeds) {
        if (!seed.moment) {
            skipped += 1;
            continue;
        }

        const existingSetup = await prisma.momentRecordingSetup.findUnique({
            where: { moment_id: seed.moment.id }
        });

        const setup = existingSetup
            ? await prisma.momentRecordingSetup.update({
                where: { id: existingSetup.id },
                data: {
                    audio_track_ids: seed.audioTrackIds,
                    graphics_enabled: seed.graphicsEnabled,
                    updated_at: new Date()
                }
            })
            : await prisma.momentRecordingSetup.create({
                data: {
                    moment_id: seed.moment.id,
                    audio_track_ids: seed.audioTrackIds,
                    graphics_enabled: seed.graphicsEnabled,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

        if (existingSetup) {
            updated += 1;
        } else {
            created += 1;
        }

        await prisma.cameraSubjectAssignment.deleteMany({
            where: { recording_setup_id: setup.id }
        });

        await prisma.cameraSubjectAssignment.createMany({
            data: seed.assignments.map((assignment) => ({
                recording_setup_id: setup.id,
                track_id: assignment.trackId,
                subject_ids: assignment.subjectIds
            }))
        });
    }

    logger.summary('Demo recording setups', {
        created,
        updated,
        skipped,
        total: created + updated + skipped
    });
    logger.endTimer('demo-recording-setups', 'Demo recording setups seeding');

    return { created, updated, skipped, total: created + updated + skipped };
}

export default seedDemoRecordingSetups;

if (require.main === module) {
    seedDemoRecordingSetups()
        .catch((error) => {
            console.error('❌ Error seeding demo recording setups:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
