// Moonrise Films Coverage Library Setup - Wedding Video and Audio Coverage
// Creates: Comprehensive video shot types and audio techniques for wedding production
import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

export async function createMoonriseCoverageLibrary() {
    console.log('🎬 Creating Wedding Coverage Library...');

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

    // Create all coverage items
    const allCoverage = [...videoCoverage, ...audioCoverage];

    for (const coverage of allCoverage) {
        try {
            await prisma.coverage.create({
                data: coverage
            });
            console.log(`✅ Created coverage: ${coverage.name}`);
        } catch (error) {
            console.error(`❌ Failed to create coverage ${coverage.name}:`, error.message);
        }
    }

    const totalCoverage = await prisma.coverage.count();
    console.log(`🎬 Created ${totalCoverage} coverage items`);

    return {
        totalCoverage,
        videoCoverageCount: videoCoverage.length,
        audioCoverageCount: audioCoverage.length
    };
}

export async function assignCoverageToScenes() {
    console.log('🎯 Creating scene coverage assignments...');

    // Get created coverage for scene assignments
    const createdCoverage = await prisma.coverage.findMany();

    // Find the ceremony and first dance scenes
    const ceremonyScene = await prisma.scenesLibrary.findFirst({
        where: { name: "Ceremony" }
    });

    const firstDanceScene = await prisma.scenesLibrary.findFirst({
        where: { name: "First Dance" }
    });

    let assignmentCount = 0;

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
                    await prisma.sceneCoverage.create({
                        data: {
                            scene_id: ceremonyScene.id,
                            coverage_id: coverageItem.id,
                            priority_order: i + 1
                        }
                    });
                    console.log(`✅ Assigned "${coverageItem.name}" to Ceremony`);
                    assignmentCount++;
                } catch (error) {
                    console.error(`❌ Failed to assign coverage:`, error.message);
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
                    await prisma.sceneCoverage.create({
                        data: {
                            scene_id: firstDanceScene.id,
                            coverage_id: coverageItem.id,
                            priority_order: i + 1
                        }
                    });
                    console.log(`✅ Assigned "${coverageItem.name}" to First Dance`);
                    assignmentCount++;
                } catch (error) {
                    console.error(`❌ Failed to assign coverage:`, error.message);
                }
            }
        }
    }

    console.log(`🔗 Created ${assignmentCount} scene coverage assignments`);
    return assignmentCount;
}

async function main() {
    console.log("🎬 Seeding Moonrise Films Coverage Library...");

    try {
        const coverageStats = await createMoonriseCoverageLibrary();
        const assignmentCount = await assignCoverageToScenes();

        console.log(`\n✅ Coverage library setup complete!`);
        console.log(`   📹 Created ${coverageStats.videoCoverageCount} video shots`);
        console.log(`   🎤 Created ${coverageStats.audioCoverageCount} audio techniques`);
        console.log(`   🔗 Created ${assignmentCount} scene assignments`);
        console.log(`   🎬 Total coverage items: ${coverageStats.totalCoverage}`);
    } catch (error) {
        console.error("❌ Coverage library setup failed:", error);
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
