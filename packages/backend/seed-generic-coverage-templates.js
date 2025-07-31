/**
 * Seed Generic Coverage Templates
 * This script replaces existing coverage items with generic templates
 * that can be customized when added to scenes.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generic Video Coverage Templates
const videoTemplates = [
    // Wide Shots
    {
        name: 'Wide Shot - Static',
        description: 'General wide shot with static camera',
        coverage_type: 'VIDEO',
        shot_type: 'WIDE_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Wide Shot - Pan',
        description: 'Wide shot with panning movement',
        coverage_type: 'VIDEO',
        shot_type: 'WIDE_SHOT',
        camera_movement: 'PAN'
    },
    {
        name: 'Wide Shot - Handheld',
        description: 'Handheld wide shot for dynamic feel',
        coverage_type: 'VIDEO',
        shot_type: 'WIDE_SHOT',
        camera_movement: 'HANDHELD'
    },

    // Medium Shots
    {
        name: 'Medium Shot - Static',
        description: 'Standard medium shot with static camera',
        coverage_type: 'VIDEO',
        shot_type: 'MEDIUM_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Medium Shot - Tracking',
        description: 'Medium shot with tracking movement',
        coverage_type: 'VIDEO',
        shot_type: 'MEDIUM_SHOT',
        camera_movement: 'TRACKING'
    },
    {
        name: 'Medium Shot - Gimbal',
        description: 'Stabilized medium shot using gimbal',
        coverage_type: 'VIDEO',
        shot_type: 'MEDIUM_SHOT',
        camera_movement: 'GIMBAL_STABILIZED'
    },

    // Close Ups
    {
        name: 'Close Up - Static',
        description: 'Standard close up shot',
        coverage_type: 'VIDEO',
        shot_type: 'CLOSE_UP',
        camera_movement: 'STATIC'
    },
    {
        name: 'Close Up - Handheld',
        description: 'Intimate handheld close up',
        coverage_type: 'VIDEO',
        shot_type: 'CLOSE_UP',
        camera_movement: 'HANDHELD'
    },
    {
        name: 'Close Up - Zoom',
        description: 'Close up with zoom movement',
        coverage_type: 'VIDEO',
        shot_type: 'CLOSE_UP',
        camera_movement: 'ZOOM'
    },

    // Extreme Close Ups
    {
        name: 'Extreme Close Up - Static',
        description: 'Detail shot of specific elements',
        coverage_type: 'VIDEO',
        shot_type: 'EXTREME_CLOSE_UP',
        camera_movement: 'STATIC'
    },
    {
        name: 'Extreme Close Up - Handheld',
        description: 'Intimate detail shot with movement',
        coverage_type: 'VIDEO',
        shot_type: 'EXTREME_CLOSE_UP',
        camera_movement: 'HANDHELD'
    },

    // Two Shots
    {
        name: 'Two Shot - Static',
        description: 'Standard two person shot',
        coverage_type: 'VIDEO',
        shot_type: 'TWO_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Two Shot - Pan',
        description: 'Two shot with panning movement',
        coverage_type: 'VIDEO',
        shot_type: 'TWO_SHOT',
        camera_movement: 'PAN'
    },

    // Over Shoulder
    {
        name: 'Over Shoulder - Static',
        description: 'Standard over shoulder shot',
        coverage_type: 'VIDEO',
        shot_type: 'OVER_SHOULDER',
        camera_movement: 'STATIC'
    },
    {
        name: 'Over Shoulder - Handheld',
        description: 'Dynamic over shoulder shot',
        coverage_type: 'VIDEO',
        shot_type: 'OVER_SHOULDER',
        camera_movement: 'HANDHELD'
    },

    // Establishing Shots
    {
        name: 'Establishing Shot - Static',
        description: 'Wide establishing shot of location',
        coverage_type: 'VIDEO',
        shot_type: 'ESTABLISHING_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Establishing Shot - Drone',
        description: 'Aerial establishing shot',
        coverage_type: 'VIDEO',
        shot_type: 'ESTABLISHING_SHOT',
        camera_movement: 'DRONE'
    },
    {
        name: 'Establishing Shot - Crane',
        description: 'High angle establishing shot',
        coverage_type: 'VIDEO',
        shot_type: 'ESTABLISHING_SHOT',
        camera_movement: 'CRANE'
    },

    // Detail Shots
    {
        name: 'Detail Shot - Static',
        description: 'Static detail shot of objects',
        coverage_type: 'VIDEO',
        shot_type: 'DETAIL_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Detail Shot - Dolly',
        description: 'Detail shot with dolly movement',
        coverage_type: 'VIDEO',
        shot_type: 'DETAIL_SHOT',
        camera_movement: 'DOLLY'
    },

    // Reaction Shots
    {
        name: 'Reaction Shot - Static',
        description: 'Static reaction shot',
        coverage_type: 'VIDEO',
        shot_type: 'REACTION_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Reaction Shot - Handheld',
        description: 'Dynamic reaction shot',
        coverage_type: 'VIDEO',
        shot_type: 'REACTION_SHOT',
        camera_movement: 'HANDHELD'
    },

    // Cutaways
    {
        name: 'Cutaway - Static',
        description: 'Standard cutaway shot',
        coverage_type: 'VIDEO',
        shot_type: 'CUTAWAY',
        camera_movement: 'STATIC'
    },
    {
        name: 'Cutaway - Pan',
        description: 'Cutaway with panning movement',
        coverage_type: 'VIDEO',
        shot_type: 'CUTAWAY',
        camera_movement: 'PAN'
    },

    // Insert Shots
    {
        name: 'Insert Shot - Static',
        description: 'Static insert shot for details',
        coverage_type: 'VIDEO',
        shot_type: 'INSERT_SHOT',
        camera_movement: 'STATIC'
    },

    // Master Shots
    {
        name: 'Master Shot - Static',
        description: 'Wide master shot of entire scene',
        coverage_type: 'VIDEO',
        shot_type: 'MASTER_SHOT',
        camera_movement: 'STATIC'
    },
    {
        name: 'Master Shot - Steadicam',
        description: 'Flowing master shot with steadicam',
        coverage_type: 'VIDEO',
        shot_type: 'MASTER_SHOT',
        camera_movement: 'STEADICAM'
    }
];

// Generic Audio Coverage Templates
const audioTemplates = [
    {
        name: 'Ambient Audio - Location',
        description: 'General ambient sound recording',
        coverage_type: 'AUDIO',
        audio_equipment: 'AMBIENT_MIC'
    },
    {
        name: 'Direct Audio - Lapel',
        description: 'Direct recording using lapel microphone',
        coverage_type: 'AUDIO',
        audio_equipment: 'LAPEL_MIC'
    },
    {
        name: 'Direct Audio - Handheld',
        description: 'Direct recording using handheld microphone',
        coverage_type: 'AUDIO',
        audio_equipment: 'HANDHELD_MIC'
    },
    {
        name: 'Direct Audio - Boom',
        description: 'Direct recording using boom microphone',
        coverage_type: 'AUDIO',
        audio_equipment: 'BOOM_MIC'
    },
    {
        name: 'Direct Audio - Shotgun',
        description: 'Directional recording using shotgun microphone',
        coverage_type: 'AUDIO',
        audio_equipment: 'SHOTGUN_MIC'
    },
    {
        name: 'Direct Audio - Wireless',
        description: 'Wireless audio recording',
        coverage_type: 'AUDIO',
        audio_equipment: 'WIRELESS_MIC'
    },
    {
        name: 'Mixed Audio - Board',
        description: 'Mixed audio using mixing board',
        coverage_type: 'AUDIO',
        audio_equipment: 'MIXING_BOARD'
    },
    {
        name: 'Recorded Audio - Device',
        description: 'Audio recorded to external device',
        coverage_type: 'AUDIO',
        audio_equipment: 'RECORDER'
    }
];

async function seedGenericCoverageTemplates() {
    console.log('🚀 Starting Generic Coverage Templates Seeding...');

    try {
        // Step 1: Delete all existing coverage items
        console.log('🗑️ Removing existing coverage items...');

        // First, remove all scene-coverage relationships
        const deletedRelationships = await prisma.sceneCoverage.deleteMany({});
        console.log(`   ✅ Deleted ${deletedRelationships.count} scene-coverage relationships`);

        // Then delete all coverage items
        const deletedCoverage = await prisma.coverage.deleteMany({});
        console.log(`   ✅ Deleted ${deletedCoverage.count} existing coverage items`);

        // Step 2: Create Video Templates
        console.log('📹 Creating video coverage templates...');
        const createdVideoTemplates = [];

        for (const template of videoTemplates) {
            const created = await prisma.coverage.create({
                data: template
            });
            createdVideoTemplates.push(created);
        }

        console.log(`   ✅ Created ${createdVideoTemplates.length} video templates`);

        // Step 3: Create Audio Templates
        console.log('🎤 Creating audio coverage templates...');
        const createdAudioTemplates = [];

        for (const template of audioTemplates) {
            const created = await prisma.coverage.create({
                data: template
            });
            createdAudioTemplates.push(created);
        }

        console.log(`   ✅ Created ${createdAudioTemplates.length} audio templates`);

        // Step 4: Summary
        const totalTemplates = createdVideoTemplates.length + createdAudioTemplates.length;
        console.log('\n🎉 Generic Coverage Templates Seeding Complete!');
        console.log(`📊 Summary:`);
        console.log(`   📹 Video Templates: ${createdVideoTemplates.length}`);
        console.log(`   🎤 Audio Templates: ${createdAudioTemplates.length}`);
        console.log(`   📝 Total Templates: ${totalTemplates}`);

        // Step 5: Display some examples
        console.log('\n📋 Sample Templates Created:');
        console.log('   Video:');
        createdVideoTemplates.slice(0, 5).forEach(template => {
            console.log(`     • ${template.name} (${template.shot_type} - ${template.camera_movement})`);
        });
        console.log('   Audio:');
        createdAudioTemplates.slice(0, 3).forEach(template => {
            console.log(`     • ${template.name} (${template.audio_equipment})`);
        });

        console.log('\n✨ Ready to use! Templates are now available in the coverage library.');

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
            console.log('🏁 Seeding process completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding process failed:', error);
            process.exit(1);
        });
}

module.exports = { seedGenericCoverageTemplates };
