// Moonrise Films Coverage Library Setup - Wedding Video and Audio Coverage
// Creates: Comprehensive video shot types and audio techniques for wedding production
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseCoverageLibrary(): Promise<{ totalCoverage: number; videoCoverageCount: number; audioCoverageCount: number; summary: SeedSummary }> {
    logger.sectionHeader('Coverage Library');

    // Clear existing coverage data
    await prisma.sceneCoverage.deleteMany();
    await prisma.coverage.deleteMany();

    // Video Coverage - Wedding Shots
    const videoCoverage = [
        // Establishing and Wide Shots
        {
            name: 'Venue Establishing Shot',
            description: 'Wide shot showing the overall venue and setting',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.ESTABLISHING_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '24-35mm',
            aperture: 'f/8',
            subject: 'Venue',
            notes: 'Set the scene and show the grandeur of the location'
        },
        {
            name: 'Ceremony Wide Shot',
            description: 'Wide shot capturing the entire ceremony space',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.WIDE_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '24-70mm',
            aperture: 'f/5.6',
            subject: 'All',
            notes: 'Master shot for ceremony - shows officiant, couple, and key guests'
        },
        {
            name: 'Reception Wide Shot',
            description: 'Wide shot of the reception space and guests',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.WIDE_SHOT,
            camera_movement: $Enums.CameraMovement.PAN,
            lens_focal_length: '24-70mm',
            aperture: 'f/4',
            subject: 'All Guests',
            notes: 'Capture the energy and scale of the celebration'
        },

        // Medium and Two Shots
        {
            name: 'Couple Medium Shot',
            description: 'Medium shot of bride and groom together',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.MEDIUM_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '50-85mm',
            aperture: 'f/2.8',
            subject: 'Both',
            notes: 'Classic couple shot showing emotion and connection'
        },
        {
            name: 'Officiant Medium Shot',
            description: 'Medium shot of the officiant during ceremony',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.MEDIUM_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Officiant',
            notes: 'Capture the officiant during key moments of the ceremony'
        },
        {
            name: 'Parents Two Shot',
            description: 'Two shot of parents watching the ceremony',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.TWO_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Parents',
            notes: 'Emotional reactions from family members'
        },

        // Close-ups and Details
        {
            name: 'Bride Close-up',
            description: 'Close-up shot of the bride',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.CLOSE_UP,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85-135mm',
            aperture: 'f/1.8',
            subject: 'Bride',
            notes: 'Capture intimate emotions and reactions'
        },
        {
            name: 'Groom Close-up',
            description: 'Close-up shot of the groom',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.CLOSE_UP,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85-135mm',
            aperture: 'f/1.8',
            subject: 'Groom',
            notes: 'Capture intimate emotions and reactions'
        },
        {
            name: 'Ring Detail Shot',
            description: 'Extreme close-up of wedding rings',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.EXTREME_CLOSE_UP,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '100mm Macro',
            aperture: 'f/5.6',
            subject: 'Rings',
            notes: 'Detailed shots of rings during exchange'
        },
        {
            name: 'Hand Detail Shot',
            description: 'Close-up of hands during ring exchange',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.DETAIL_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Both',
            notes: 'Focus on the physical act of ring placement'
        },

        // Reaction and Over Shoulder Shots
        {
            name: 'Guest Reaction Shot',
            description: 'Reaction shots of guests during key moments',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.REACTION_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Guests',
            notes: 'Capture authentic emotional responses'
        },
        {
            name: 'Over Shoulder - Bride POV',
            description: 'Over shoulder shot from bride\'s perspective',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.OVER_SHOULDER,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '50mm',
            aperture: 'f/2.8',
            subject: 'Groom',
            notes: 'Show groom from bride\'s viewpoint'
        },
        {
            name: 'Over Shoulder - Groom POV',
            description: 'Over shoulder shot from groom\'s perspective',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.OVER_SHOULDER,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '50mm',
            aperture: 'f/2.8',
            subject: 'Bride',
            notes: 'Show bride from groom\'s viewpoint'
        },

        // Movement and Dynamic Shots
        {
            name: 'Processional Tracking',
            description: 'Tracking shot following the processional',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.MEDIUM_SHOT,
            camera_movement: $Enums.CameraMovement.TRACKING,
            lens_focal_length: '24-70mm',
            aperture: 'f/4',
            subject: 'Bridal Party',
            notes: 'Follow the movement down the aisle'
        },
        {
            name: 'First Dance Gimbal',
            description: 'Stabilized shot of couple\'s first dance',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.MEDIUM_SHOT,
            camera_movement: $Enums.CameraMovement.GIMBAL_STABILIZED,
            lens_focal_length: '50mm',
            aperture: 'f/2.8',
            subject: 'Both',
            notes: 'Smooth movement around dancing couple'
        },
        {
            name: 'Reception Handheld',
            description: 'Handheld shots for documentary style coverage',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.MEDIUM_SHOT,
            camera_movement: $Enums.CameraMovement.HANDHELD,
            lens_focal_length: '35mm',
            aperture: 'f/2.8',
            subject: 'All Guests',
            notes: 'Natural, documentary-style movement through reception'
        },

        // Cutaways and Inserts
        {
            name: 'Flower Cutaway',
            description: 'Cutaway shots of floral arrangements',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.CUTAWAY,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Decor',
            notes: 'Beautiful detail shots to enhance story'
        },
        {
            name: 'Program Insert',
            description: 'Insert shot of wedding program or vows',
            coverage_type: $Enums.CoverageType.VIDEO,
            shot_type: $Enums.ShotType.INSERT_SHOT,
            camera_movement: $Enums.CameraMovement.STATIC,
            lens_focal_length: '50mm',
            aperture: 'f/4',
            subject: 'Program',
            notes: 'Document important written elements'
        }
    ];

    // Audio Coverage - Wedding Audio Techniques
    const audioCoverage = [
        {
            name: 'Groom Lapel Mic',
            description: 'Wireless lapel microphone on groom',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.LAPEL_MIC,
            audio_pattern: 'Omnidirectional',
            frequency_response: '50Hz-15kHz',
            subject: 'Groom',
            notes: 'Primary audio source for vows and ceremony dialogue'
        },
        {
            name: 'Officiant Lapel Mic',
            description: 'Wireless lapel microphone on officiant',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.LAPEL_MIC,
            audio_pattern: 'Omnidirectional',
            frequency_response: '50Hz-15kHz',
            subject: 'Officiant',
            notes: 'Capture clear ceremony instructions and readings'
        },
        {
            name: 'Bride Wireless Mic',
            description: 'Discrete wireless microphone for bride',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.WIRELESS_MIC,
            audio_pattern: 'Cardioid',
            frequency_response: '40Hz-18kHz',
            subject: 'Bride',
            notes: 'Backup audio for bride\'s vows if needed'
        },
        {
            name: 'Ceremony Ambient',
            description: 'Ambient microphone for ceremony atmosphere',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.AMBIENT_MIC,
            audio_pattern: 'Shotgun',
            frequency_response: '20Hz-20kHz',
            subject: 'All',
            notes: 'Capture natural ambiance and guest reactions'
        },
        {
            name: 'Music System Feed',
            description: 'Direct feed from sound system',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.RECORDER,
            audio_pattern: 'Line Input',
            frequency_response: '20Hz-20kHz',
            subject: 'Music',
            notes: 'Clean recording of processional and recessional music'
        },
        {
            name: 'Reception Boom',
            description: 'Boom microphone for speeches',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.BOOM_MIC,
            audio_pattern: 'Supercardioid',
            frequency_response: '40Hz-18kHz',
            subject: 'Speakers',
            notes: 'Directional pickup for speeches and toasts'
        },
        {
            name: 'Dance Floor Ambient',
            description: 'Ambient recording of reception dance floor',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.AMBIENT_MIC,
            audio_pattern: 'Omnidirectional',
            frequency_response: '20Hz-20kHz',
            subject: 'All Guests',
            notes: 'Capture energy and atmosphere of reception'
        },
        {
            name: 'DJ Booth Feed',
            description: 'Direct audio feed from DJ equipment',
            coverage_type: $Enums.CoverageType.AUDIO,
            audio_equipment: $Enums.AudioEquipment.MIXING_BOARD,
            audio_pattern: 'Line Input',
            frequency_response: '20Hz-20kHz',
            subject: 'Music',
            notes: 'Clean recording of reception music and announcements'
        }
    ];

    // Create all coverage items with duplicate checking
    const allCoverage = [...videoCoverage, ...audioCoverage];
    let coverageCreated = 0;
    let coverageSkipped = 0;

    for (const coverage of allCoverage) {
        try {
            // Check if coverage item already exists by name
            const existing = await prisma.coverage.findFirst({
                where: { name: coverage.name }
            });

            if (existing) {
                coverageSkipped++;
                logger.skipped(`Coverage exists: ${coverage.name}`, undefined, 'verbose');
            } else {
                await prisma.coverage.create({
                    data: coverage
                });
                coverageCreated++;
                logger.created(`Coverage created: ${coverage.name}`, 'verbose');
            }
        } catch (error) {
            logger.error(`Failed to process coverage ${coverage.name}: ${String(error)}`);
        }
    }

    const totalCoverage = await prisma.coverage.count();
    const summary: SeedSummary = { created: coverageCreated, updated: 0, skipped: coverageSkipped, total: coverageCreated + coverageSkipped };
    logger.summary('Coverage items', summary);

    return {
        totalCoverage,
        videoCoverageCount: videoCoverage.length,
        audioCoverageCount: audioCoverage.length,
        summary
    };
}

export async function assignCoverageToScenes(): Promise<SeedSummary> {
    logger.sectionHeader('Scene Coverage Assignments');

    // Get created coverage for scene assignments
    const createdCoverage = await prisma.coverage.findMany();

    // Find the ceremony and first dance scenes
    const ceremonyScene = await prisma.scenesLibrary.findFirst({
        where: { name: "Ceremony" }
    });

    const firstDanceScene = await prisma.scenesLibrary.findFirst({
        where: { name: "First Dance" }
    });

    let created = 0;
    let skipped = 0;

    // Ceremony Scene Coverage
    if (ceremonyScene) {
        const ceremonyCoverage = [
            'Venue Establishing Shot',
            'Ceremony Wide Shot',
            'Couple Medium Shot',
            'Officiant Medium Shot',
            'Bride Close-up',
            'Groom Close-up',
            'Ring Detail Shot',
            'Guest Reaction Shot',
            'Processional Tracking',
            'Groom Lapel Mic',
            'Officiant Lapel Mic',
            'Ceremony Ambient',
            'Music System Feed'
        ];

        for (let i = 0; i < ceremonyCoverage.length; i++) {
            const coverageItem = createdCoverage.find(c => c.name === ceremonyCoverage[i]);
            if (coverageItem) {
                try {
                    // Check if assignment already exists
                    const existing = await prisma.sceneCoverage.findUnique({
                        where: {
                            scene_id_coverage_id: {
                                scene_id: ceremonyScene.id,
                                coverage_id: coverageItem.id
                            }
                        }
                    });

                    if (!existing) {
                        await prisma.sceneCoverage.create({
                            data: {
                                scene_id: ceremonyScene.id,
                                coverage_id: coverageItem.id,
                                priority_order: i + 1
                            }
                        });
                        created++;
                        logger.created(`Assigned to Ceremony: ${coverageItem.name}`, 'verbose');
                    } else {
                        skipped++;
                        logger.skipped(`Already assigned (Ceremony): ${coverageItem.name}`, undefined, 'verbose');
                    }
                } catch (error) {
                    logger.error(`Failed to assign coverage: ${String(error)}`);
                }
            }
        }
    }

    // First Dance Scene Coverage
    if (firstDanceScene) {
        const danceCoverage = [
            'Couple Medium Shot',
            'Bride Close-up',
            'Groom Close-up',
            'First Dance Gimbal',
            'Guest Reaction Shot',
            'Parents Two Shot',
            'Dance Floor Ambient',
            'Music System Feed'
        ];

        for (let i = 0; i < danceCoverage.length; i++) {
            const coverageItem = createdCoverage.find(c => c.name === danceCoverage[i]);
            if (coverageItem) {
                try {
                    // Check if assignment already exists
                    const existing = await prisma.sceneCoverage.findUnique({
                        where: {
                            scene_id_coverage_id: {
                                scene_id: firstDanceScene.id,
                                coverage_id: coverageItem.id
                            }
                        }
                    });

                    if (!existing) {
                        await prisma.sceneCoverage.create({
                            data: {
                                scene_id: firstDanceScene.id,
                                coverage_id: coverageItem.id,
                                priority_order: i + 1
                            }
                        });
                        created++;
                        logger.created(`Assigned to First Dance: ${coverageItem.name}`, 'verbose');
                    } else {
                        skipped++;
                        logger.skipped(`Already assigned (First Dance): ${coverageItem.name}`, undefined, 'verbose');
                    }
                } catch (error) {
                    logger.error(`Failed to assign coverage: ${String(error)}`);
                }
            }
        }
    }

    const summary: SeedSummary = { created, updated: 0, skipped, total: created + skipped };
    logger.summary('Scene coverage assignments', summary);
    return summary;
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Coverage Library');

    try {
        const coverageStats = await createMoonriseCoverageLibrary();
        const assignmentSummary = await assignCoverageToScenes();

        logger.sectionDivider('Summary');
        logger.success('Coverage library setup complete!');
        logger.info(`Video shots: ${coverageStats.videoCoverageCount}`);
        logger.info(`Audio techniques: ${coverageStats.audioCoverageCount}`);
        logger.info(`Scene assignments created: ${assignmentSummary.created}`);
        logger.info(`Total coverage items: ${coverageStats.totalCoverage}`);
    } catch (error) {
        logger.error(`Coverage library setup failed: ${String(error)}`);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Coverage library setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
