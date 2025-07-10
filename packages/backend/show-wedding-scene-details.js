#!/usr/bin/env node

/**
 * Wedding Scene Details Viewer
 * Shows detailed information about wedding scenes and their media components
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showWeddingSceneDetails() {
    console.log('💒 Wedding Film Scene Details\n');

    try {
        // Get all scenes with their media components
        const scenes = await prisma.scenesLibrary.findMany({
            include: {
                media_components: true
            },
            orderBy: { name: 'asc' }
        });

        console.log(`📊 Total scenes: ${scenes.length}\n`);

        for (const scene of scenes) {
            const durationMin = Math.floor(scene.estimated_duration / 60);
            const durationSec = scene.estimated_duration % 60;
            const durationStr = durationSec > 0 ? `${durationMin}m ${durationSec}s` : `${durationMin}m`;

            console.log(`🎬 Scene: "${scene.name}" (${scene.type})`);
            console.log(`   Duration: ${durationStr} | Complexity: ${scene.complexity_score}/10 | Task Hours: ${scene.base_task_hours}h`);
            console.log(`   Description: ${scene.description}`);

            if (scene.media_components.length > 0) {
                console.log(`   📱 Media Components (${scene.media_components.length}):`);
                scene.media_components.forEach((comp, index) => {
                    const compDuration = Math.floor(comp.duration_seconds / 60);
                    const compSec = comp.duration_seconds % 60;
                    const compDurationStr = compSec > 0 ? `${compDuration}m ${compSec}s` : `${compDuration}m`;

                    let details = `${comp.media_type} (${compDurationStr})`;
                    if (comp.is_primary) details += ' [PRIMARY]';
                    if (comp.volume_level) details += ` Vol:${comp.volume_level}`;
                    if (comp.music_type) details += ` Type:${comp.music_type}`;
                    if (comp.music_weight) details += ` Weight:${comp.music_weight}`;

                    console.log(`     ${index + 1}. ${details}`);
                    if (comp.notes) console.log(`        "${comp.notes}"`);
                });
            } else {
                console.log(`   📱 No media components`);
            }
            console.log('');
        }

        // Summary statistics
        const totalComponents = scenes.reduce((sum, scene) => sum + scene.media_components.length, 0);
        const videoComponents = scenes.reduce((sum, scene) =>
            sum + scene.media_components.filter(c => c.media_type === 'VIDEO').length, 0);
        const audioComponents = scenes.reduce((sum, scene) =>
            sum + scene.media_components.filter(c => c.media_type === 'AUDIO').length, 0);
        const musicComponents = scenes.reduce((sum, scene) =>
            sum + scene.media_components.filter(c => c.media_type === 'MUSIC').length, 0);

        const totalDuration = scenes.reduce((sum, scene) => sum + (scene.estimated_duration || 0), 0);
        const totalHours = scenes.reduce((sum, scene) => sum + parseFloat(scene.base_task_hours || 0), 0);

        console.log('📈 Summary Statistics:');
        console.log(`   Total Media Components: ${totalComponents}`);
        console.log(`   - Video: ${videoComponents}`);
        console.log(`   - Audio: ${audioComponents}  `);
        console.log(`   - Music: ${musicComponents}`);
        console.log(`   Total Film Duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`);
        console.log(`   Total Task Hours: ${totalHours}h`);

        // Show music types breakdown
        const musicTypes = {};
        scenes.forEach(scene => {
            scene.media_components.forEach(comp => {
                if (comp.music_type) {
                    musicTypes[comp.music_type] = (musicTypes[comp.music_type] || 0) + 1;
                }
            });
        });

        if (Object.keys(musicTypes).length > 0) {
            console.log('\n🎵 Music Types Used:');
            Object.entries(musicTypes).forEach(([type, count]) => {
                console.log(`   - ${type}: ${count} components`);
            });
        }

    } catch (error) {
        console.error('❌ Failed to show scene details:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the viewer
if (require.main === module) {
    showWeddingSceneDetails()
        .catch((error) => {
            console.error('Viewer failed:', error);
            process.exit(1);
        });
}

module.exports = { showWeddingSceneDetails };
