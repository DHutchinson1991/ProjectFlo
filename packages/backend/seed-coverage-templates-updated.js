const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedGenericCoverageTemplates() {
    try {
        console.log('🧹 Clearing existing coverage items...');

        // First, clear existing scene coverage relationships
        await prisma.sceneCoverage.deleteMany({});

        // Then clear existing coverage items
        await prisma.coverage.deleteMany({});

        console.log('📝 Creating generic coverage templates...');

        // Generic VIDEO Coverage Templates
        const videoTemplates = [
            // Shot Type + Camera Movement combinations
            {
                name: 'Close Up - Static',
                description: 'Generic close-up shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'CLOSE_UP',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Close Up - Pan',
                description: 'Generic close-up shot with panning camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'CLOSE_UP',
                camera_movement: 'PAN',
                is_template: true
            },
            {
                name: 'Medium Shot - Static',
                description: 'Generic medium shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'MEDIUM_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Medium Shot - Tracking',
                description: 'Generic medium shot with tracking camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'MEDIUM_SHOT',
                camera_movement: 'TRACKING',
                is_template: true
            },
            {
                name: 'Wide Shot - Static',
                description: 'Generic wide shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'WIDE_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Wide Shot - Pan',
                description: 'Generic wide shot with panning camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'WIDE_SHOT',
                camera_movement: 'PAN',
                is_template: true
            },
            {
                name: 'Establishing Shot - Static',
                description: 'Generic establishing shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'ESTABLISHING_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Establishing Shot - Drone',
                description: 'Generic establishing shot with drone camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'ESTABLISHING_SHOT',
                camera_movement: 'DRONE',
                is_template: true
            },
            {
                name: 'Two Shot - Static',
                description: 'Generic two shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'TWO_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Two Shot - Dolly',
                description: 'Generic two shot with dolly camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'TWO_SHOT',
                camera_movement: 'DOLLY',
                is_template: true
            },
            {
                name: 'Over Shoulder - Static',
                description: 'Generic over shoulder shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'OVER_SHOULDER',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Over Shoulder - Handheld',
                description: 'Generic over shoulder shot with handheld camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'OVER_SHOULDER',
                camera_movement: 'HANDHELD',
                is_template: true
            },
            {
                name: 'Extreme Close Up - Static',
                description: 'Generic extreme close-up shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'EXTREME_CLOSE_UP',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Detail Shot - Static',
                description: 'Generic detail shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'DETAIL_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Detail Shot - Zoom',
                description: 'Generic detail shot with zoom camera movement',
                coverage_type: 'VIDEO',
                shot_type: 'DETAIL_SHOT',
                camera_movement: 'ZOOM',
                is_template: true
            },
            {
                name: 'Reaction Shot - Static',
                description: 'Generic reaction shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'REACTION_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Master Shot - Static',
                description: 'Generic master shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'MASTER_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Master Shot - Steadicam',
                description: 'Generic master shot with steadicam movement',
                coverage_type: 'VIDEO',
                shot_type: 'MASTER_SHOT',
                camera_movement: 'STEADICAM',
                is_template: true
            },
            {
                name: 'Cutaway - Static',
                description: 'Generic cutaway shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'CUTAWAY',
                camera_movement: 'STATIC',
                is_template: true
            },
            {
                name: 'Insert Shot - Static',
                description: 'Generic insert shot with static camera',
                coverage_type: 'VIDEO',
                shot_type: 'INSERT_SHOT',
                camera_movement: 'STATIC',
                is_template: true
            },
            // Special movement shots
            {
                name: 'Tracking Shot',
                description: 'Generic tracking shot following subject movement',
                coverage_type: 'VIDEO',
                shot_type: 'MEDIUM_SHOT',
                camera_movement: 'TRACKING',
                is_template: true
            },
            {
                name: 'Crane Shot',
                description: 'Generic crane shot with elevated perspective',
                coverage_type: 'VIDEO',
                shot_type: 'WIDE_SHOT',
                camera_movement: 'CRANE',
                is_template: true
            },
            {
                name: 'Gimbal Stabilized Shot',
                description: 'Generic gimbal stabilized shot for smooth movement',
                coverage_type: 'VIDEO',
                shot_type: 'MEDIUM_SHOT',
                camera_movement: 'GIMBAL_STABILIZED',
                is_template: true
            },
            {
                name: 'Tilt Shot',
                description: 'Generic shot with vertical camera tilt movement',
                coverage_type: 'VIDEO',
                shot_type: 'WIDE_SHOT',
                camera_movement: 'TILT',
                is_template: true
            }
        ];

        // Generic AUDIO Coverage Templates
        const audioTemplates = [
            {
                name: 'Lapel Mic Recording',
                description: 'Generic lapel microphone audio capture',
                coverage_type: 'AUDIO',
                audio_equipment: 'LAPEL_MIC',
                audio_pattern: 'Cardioid',
                frequency_response: '20Hz-20kHz',
                is_template: true
            },
            {
                name: 'Handheld Mic Recording',
                description: 'Generic handheld microphone audio capture',
                coverage_type: 'AUDIO',
                audio_equipment: 'HANDHELD_MIC',
                audio_pattern: 'Cardioid',
                frequency_response: '50Hz-15kHz',
                is_template: true
            },
            {
                name: 'Boom Mic Recording',
                description: 'Generic boom microphone audio capture',
                coverage_type: 'AUDIO',
                audio_equipment: 'BOOM_MIC',
                audio_pattern: 'Super-cardioid',
                frequency_response: '40Hz-20kHz',
                is_template: true
            },
            {
                name: 'Shotgun Mic Recording',
                description: 'Generic shotgun microphone audio capture',
                coverage_type: 'AUDIO',
                audio_equipment: 'SHOTGUN_MIC',
                audio_pattern: 'Super-cardioid',
                frequency_response: '20Hz-20kHz',
                is_template: true
            },
            {
                name: 'Wireless Mic Recording',
                description: 'Generic wireless microphone audio capture',
                coverage_type: 'AUDIO',
                audio_equipment: 'WIRELESS_MIC',
                audio_pattern: 'Omnidirectional',
                frequency_response: '20Hz-20kHz',
                is_template: true
            },
            {
                name: 'Ambient Audio Recording',
                description: 'Generic ambient audio capture',
                coverage_type: 'AUDIO',
                audio_equipment: 'AMBIENT_MIC',
                audio_pattern: 'Omnidirectional',
                frequency_response: '10Hz-25kHz',
                is_template: true
            },
            {
                name: 'Direct Recording',
                description: 'Generic direct audio recording',
                coverage_type: 'AUDIO',
                audio_equipment: 'RECORDER',
                frequency_response: '20Hz-20kHz',
                is_template: true
            },
            {
                name: 'Mixed Audio Recording',
                description: 'Generic mixed audio from mixing board',
                coverage_type: 'AUDIO',
                audio_equipment: 'MIXING_BOARD',
                frequency_response: '20Hz-20kHz',
                is_template: true
            }
        ];

        // Insert all templates
        console.log(`📹 Creating ${videoTemplates.length} video templates...`);
        for (const template of videoTemplates) {
            await prisma.coverage.create({
                data: template
            });
        }

        console.log(`🎵 Creating ${audioTemplates.length} audio templates...`);
        for (const template of audioTemplates) {
            await prisma.coverage.create({
                data: template
            });
        }

        const totalCreated = videoTemplates.length + audioTemplates.length;
        console.log(`✅ Successfully created ${totalCreated} generic coverage templates!`);
        console.log(`   - ${videoTemplates.length} video templates`);
        console.log(`   - ${audioTemplates.length} audio templates`);

    } catch (error) {
        console.error('❌ Error seeding generic coverage templates:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
if (require.main === module) {
    seedGenericCoverageTemplates()
        .then(() => {
            console.log('🎉 Generic coverage template seeding completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Failed to seed generic coverage templates:', error);
            process.exit(1);
        });
}

module.exports = { seedGenericCoverageTemplates };
