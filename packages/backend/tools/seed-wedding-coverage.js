/**
 * Seed Wedding Coverage Library
 * 
 * This seed file creates a comprehensive library of video shots and audio techniques
 * that can be used across different wedding scenes (ceremony, first dance, etc.)
 * with customizable subjects.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🎬 Seeding Wedding Coverage Library...');

    // Clear existing coverage data
    await prisma.sceneCoverage.deleteMany();
    await prisma.coverage.deleteMany();

    // Video Coverage - Wedding Shots
    const videoCoverage = [
        // Establishing and Wide Shots
        {
            name: 'Venue Establishing Shot',
            description: 'Wide shot showing the overall venue and setting',
            coverage_type: 'VIDEO',
            shot_type: 'ESTABLISHING_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '24-35mm',
            aperture: 'f/8',
            subject: 'Venue',
            notes: 'Set the scene and show the grandeur of the location'
        },
        {
            name: 'Ceremony Wide Shot',
            description: 'Wide shot capturing the entire ceremony space',
            coverage_type: 'VIDEO',
            shot_type: 'WIDE_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '24-70mm',
            aperture: 'f/5.6',
            subject: 'All',
            notes: 'Master shot for ceremony - shows officiant, couple, and key guests'
        },
        {
            name: 'Reception Wide Shot',
            description: 'Wide shot of the reception space and guests',
            coverage_type: 'VIDEO',
            shot_type: 'WIDE_SHOT',
            camera_movement: 'PAN',
            lens_focal_length: '24-70mm',
            aperture: 'f/4',
            subject: 'All Guests',
            notes: 'Capture the energy and scale of the celebration'
        },

        // Medium and Two Shots
        {
            name: 'Couple Medium Shot',
            description: 'Medium shot of bride and groom together',
            coverage_type: 'VIDEO',
            shot_type: 'MEDIUM_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '50-85mm',
            aperture: 'f/2.8',
            subject: 'Both',
            notes: 'Classic couple shot showing emotion and connection'
        },
        {
            name: 'Officiant Medium Shot',
            description: 'Medium shot of the officiant during ceremony',
            coverage_type: 'VIDEO',
            shot_type: 'MEDIUM_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Officiant',
            notes: 'Capture the officiant during key moments of the ceremony'
        },
        {
            name: 'Parents Two Shot',
            description: 'Two shot of parents watching the ceremony',
            coverage_type: 'VIDEO',
            shot_type: 'TWO_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Parents',
            notes: 'Emotional reactions from family members'
        },

        // Close-ups and Details
        {
            name: 'Bride Close-up',
            description: 'Close-up shot of the bride',
            coverage_type: 'VIDEO',
            shot_type: 'CLOSE_UP',
            camera_movement: 'STATIC',
            lens_focal_length: '85-135mm',
            aperture: 'f/1.8',
            subject: 'Bride',
            notes: 'Capture intimate emotions and reactions'
        },
        {
            name: 'Groom Close-up',
            description: 'Close-up shot of the groom',
            coverage_type: 'VIDEO',
            shot_type: 'CLOSE_UP',
            camera_movement: 'STATIC',
            lens_focal_length: '85-135mm',
            aperture: 'f/1.8',
            subject: 'Groom',
            notes: 'Capture intimate emotions and reactions'
        },
        {
            name: 'Ring Detail Shot',
            description: 'Extreme close-up of wedding rings',
            coverage_type: 'VIDEO',
            shot_type: 'EXTREME_CLOSE_UP',
            camera_movement: 'STATIC',
            lens_focal_length: '100mm Macro',
            aperture: 'f/5.6',
            subject: 'Rings',
            notes: 'Detailed shots of rings during exchange'
        },
        {
            name: 'Hand Detail Shot',
            description: 'Close-up of hands during ring exchange',
            coverage_type: 'VIDEO',
            shot_type: 'DETAIL_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Both',
            notes: 'Focus on the physical act of ring placement'
        },

        // Reaction and Over Shoulder Shots
        {
            name: 'Guest Reaction Shot',
            description: 'Reaction shots of guests during key moments',
            coverage_type: 'VIDEO',
            shot_type: 'REACTION_SHOT',
            camera_movement: 'STATIC',
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Guests',
            notes: 'Capture authentic emotional responses'
        },
        {
            name: 'Over Shoulder - Bride POV',
            description: 'Over shoulder shot from bride\'s perspective',
            coverage_type: 'VIDEO',
            shot_type: 'OVER_SHOULDER',
            camera_movement: 'STATIC',
            lens_focal_length: '50mm',
            aperture: 'f/2.8',
            subject: 'Groom',
            notes: 'Show groom from bride\'s viewpoint'
        },
        {
            name: 'Over Shoulder - Groom POV',
            description: 'Over shoulder shot from groom\'s perspective',
            coverage_type: 'VIDEO',
            shot_type: 'OVER_SHOULDER',
            camera_movement: 'STATIC',
            lens_focal_length: '50mm',
            aperture: 'f/2.8',
            subject: 'Bride',
            notes: 'Show bride from groom\'s viewpoint'
        },

        // Movement and Dynamic Shots
        {
            name: 'Processional Tracking',
            description: 'Tracking shot following the processional',
            coverage_type: 'VIDEO',
            shot_type: 'MEDIUM_SHOT',
            camera_movement: 'TRACKING',
            lens_focal_length: '24-70mm',
            aperture: 'f/4',
            subject: 'Bridal Party',
            notes: 'Follow the movement down the aisle'
        },
        {
            name: 'First Dance Gimbal',
            description: 'Stabilized shot of couple\'s first dance',
            coverage_type: 'VIDEO',
            shot_type: 'MEDIUM_SHOT',
            camera_movement: 'GIMBAL_STABILIZED',
            lens_focal_length: '50mm',
            aperture: 'f/2.8',
            subject: 'Both',
            notes: 'Smooth movement around dancing couple'
        },
        {
            name: 'Reception Handheld',
            description: 'Handheld shots for documentary style coverage',
            coverage_type: 'VIDEO',
            shot_type: 'MEDIUM_SHOT',
            camera_movement: 'HANDHELD',
            lens_focal_length: '35mm',
            aperture: 'f/2.8',
            subject: 'All Guests',
            notes: 'Natural, documentary-style movement through reception'
        },

        // Cutaways and Inserts
        {
            name: 'Flower Cutaway',
            description: 'Cutaway shots of floral arrangements',
            coverage_type: 'VIDEO',
            shot_type: 'CUTAWAY',
            camera_movement: 'STATIC',
            lens_focal_length: '85mm',
            aperture: 'f/2.8',
            subject: 'Decor',
            notes: 'Beautiful detail shots to enhance story'
        },
        {
            name: 'Program Insert',
            description: 'Insert shot of wedding program or vows',
            coverage_type: 'VIDEO',
            shot_type: 'INSERT_SHOT',
            camera_movement: 'STATIC',
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
            coverage_type: 'AUDIO',
            audio_equipment: 'LAPEL_MIC',
            audio_pattern: 'Omnidirectional',
            frequency_response: '50Hz-15kHz',
            subject: 'Groom',
            notes: 'Primary audio source for vows and ceremony dialogue'
        },
        {
            name: 'Officiant Lapel Mic',
            description: 'Wireless lapel microphone on officiant',
            coverage_type: 'AUDIO',
            audio_equipment: 'LAPEL_MIC',
            audio_pattern: 'Omnidirectional',
            frequency_response: '50Hz-15kHz',
            subject: 'Officiant',
            notes: 'Capture clear ceremony instructions and readings'
        },
        {
            name: 'Bride Wireless Mic',
            description: 'Discrete wireless microphone for bride',
            coverage_type: 'AUDIO',
            audio_equipment: 'WIRELESS_MIC',
            audio_pattern: 'Cardioid',
            frequency_response: '40Hz-18kHz',
            subject: 'Bride',
            notes: 'Backup audio for bride\'s vows if needed'
        },
        {
            name: 'Ceremony Ambient',
            description: 'Ambient microphone for ceremony atmosphere',
            coverage_type: 'AUDIO',
            audio_equipment: 'AMBIENT_MIC',
            audio_pattern: 'Shotgun',
            frequency_response: '20Hz-20kHz',
            subject: 'All',
            notes: 'Capture natural ambiance and guest reactions'
        },
        {
            name: 'Music System Feed',
            description: 'Direct feed from sound system',
            coverage_type: 'AUDIO',
            audio_equipment: 'RECORDER',
            audio_pattern: 'Line Input',
            frequency_response: '20Hz-20kHz',
            subject: 'Music',
            notes: 'Clean recording of processional and recessional music'
        },
        {
            name: 'Reception Boom',
            description: 'Boom microphone for speeches',
            coverage_type: 'AUDIO',
            audio_equipment: 'BOOM_MIC',
            audio_pattern: 'Supercardioid',
            frequency_response: '40Hz-18kHz',
            subject: 'Speakers',
            notes: 'Directional pickup for speeches and toasts'
        },
        {
            name: 'Dance Floor Ambient',
            description: 'Ambient recording of reception dance floor',
            coverage_type: 'AUDIO',
            audio_equipment: 'AMBIENT_MIC',
            audio_pattern: 'Omnidirectional',
            frequency_response: '20Hz-20kHz',
            subject: 'All Guests',
            notes: 'Capture energy and atmosphere of reception'
        },
        {
            name: 'DJ Booth Feed',
            description: 'Direct audio feed from DJ equipment',
            coverage_type: 'AUDIO',
            audio_equipment: 'MIXING_BOARD',
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

    // Get created coverage for scene assignments
    const createdCoverage = await prisma.coverage.findMany();

    // Create some example scene coverage assignments
    // First, let's get some scenes to work with
    const scenes = await prisma.scenesLibrary.findMany({
        where: {
            name: {
                in: ['Wedding Ceremony', 'First Dance', 'Reception']
            }
        },
        take: 3
    });

    if (scenes.length > 0) {
        console.log('\\n🎯 Creating scene coverage assignments...');

        // Ceremony Scene Coverage
        const ceremonyScene = scenes.find(s => s.name.includes('Ceremony'));
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
                                priority_order: i + 1,
                                custom_notes: `Priority ${i + 1} for ceremony coverage`
                            }
                        });
                        console.log(`✅ Assigned "${coverageItem.name}" to Ceremony`);
                    } catch (error) {
                        console.error(`❌ Failed to assign coverage:`, error.message);
                    }
                }
            }
        }

        // First Dance Scene Coverage
        const firstDanceScene = scenes.find(s => s.name.includes('Dance'));
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
                                priority_order: i + 1,
                                custom_subject: 'Bride & Groom', // Override default subject for first dance
                                custom_notes: `First dance specific - Priority ${i + 1}`
                            }
                        });
                        console.log(`✅ Assigned "${coverageItem.name}" to First Dance`);
                    } catch (error) {
                        console.error(`❌ Failed to assign coverage:`, error.message);
                    }
                }
            }
        }

        // Reception Scene Coverage
        const receptionScene = scenes.find(s => s.name.includes('Reception'));
        if (receptionScene) {
            const receptionCoverage = [
                'Reception Wide Shot',
                'Reception Handheld',
                'Guest Reaction Shot',
                'Reception Boom',
                'DJ Booth Feed',
                'Dance Floor Ambient'
            ];

            for (let i = 0; i < receptionCoverage.length; i++) {
                const coverageItem = createdCoverage.find(c => c.name === receptionCoverage[i]);
                if (coverageItem) {
                    try {
                        await prisma.sceneCoverage.create({
                            data: {
                                scene_id: receptionScene.id,
                                coverage_id: coverageItem.id,
                                priority_order: i + 1,
                                custom_subject: 'All Guests', // Override for reception focus
                                custom_notes: `Reception specific - Priority ${i + 1}`
                            }
                        });
                        console.log(`✅ Assigned "${coverageItem.name}" to Reception`);
                    } catch (error) {
                        console.error(`❌ Failed to assign coverage:`, error.message);
                    }
                }
            }
        }
    }

    const totalCoverage = await prisma.coverage.count();
    const totalAssignments = await prisma.sceneCoverage.count();

    console.log('\\n🎉 Wedding Coverage Library Seeding Complete!');
    console.log(`📹 Created ${totalCoverage} coverage items`);
    console.log(`🔗 Created ${totalAssignments} scene assignments`);
    console.log('\\n📋 Coverage Types Created:');
    console.log('   • Video Shots: Establishing, Wide, Medium, Close-up, Detail, Reaction');
    console.log('   • Camera Movements: Static, Tracking, Gimbal, Handheld, Pan');
    console.log('   • Audio Techniques: Lapel mics, Ambient, Boom, Wireless, System feeds');
    console.log('   • Subjects: Bride, Groom, Both, Officiant, Guests, Parents, Decor');
    console.log('\\n🎬 Ready for production planning!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
