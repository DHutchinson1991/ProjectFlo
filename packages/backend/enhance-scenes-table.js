const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceScenesTable() {
    console.log('🚀 Starting scenes table enhancement...');

    try {
        // First, let's see the current structure
        console.log('\n📊 Current scenes in database:');
        const currentScenes = await prisma.scenesLibrary.findMany();
        console.log(`Found ${currentScenes.length} existing scenes`);

        currentScenes.forEach(scene => {
            console.log(`- ${scene.name}: ${scene.type}, ${scene.estimated_duration}s`);
        });

        // Create enhanced scenes with multi-media support
        console.log('\n✨ Creating enhanced scenes with multi-media support...');

        // Example: Wedding ceremony scene with both video and audio
        const ceremonyScene = await prisma.scenesLibrary.create({
            data: {
                name: "Complete Ceremony Sequence",
                description: "Full ceremony with synchronized video and audio",
                type: "VIDEO", // Primary type
                estimated_duration: 300, // 5 minutes
                complexity_score: 8,
                base_task_hours: 5.5,
                brand_id: 1,
                // We'll add media components separately
            }
        });

        // Example: Reception scene with video, audio, and music
        const receptionScene = await prisma.scenesLibrary.create({
            data: {
                name: "Reception Highlights",
                description: "Reception with multiple audio layers and music",
                type: "VIDEO", // Primary type
                estimated_duration: 180, // 3 minutes
                complexity_score: 6,
                base_task_hours: 3.0,
                brand_id: 1,
            }
        });

        // Example: Pure audio scene
        const voiceoverScene = await prisma.scenesLibrary.create({
            data: {
                name: "Voiceover Narration",
                description: "Professional voiceover for storytelling",
                type: "AUDIO",
                estimated_duration: 45,
                complexity_score: 3,
                base_task_hours: 1.5,
                brand_id: 1,
            }
        });

        console.log('✅ Enhanced scenes created successfully!');
        console.log(`- Ceremony Scene ID: ${ceremonyScene.id}`);
        console.log(`- Reception Scene ID: ${receptionScene.id}`);
        console.log(`- Voiceover Scene ID: ${voiceoverScene.id}`);

        // Display all scenes with their properties
        console.log('\n📋 All scenes in database:');
        const allScenes = await prisma.scenesLibrary.findMany({
            orderBy: { created_at: 'desc' }
        });

        allScenes.forEach(scene => {
            console.log(`\n🎬 ${scene.name}`);
            console.log(`   Type: ${scene.type}`);
            console.log(`   Duration: ${scene.estimated_duration} seconds`);
            console.log(`   Complexity: ${scene.complexity_score}/10`);
            console.log(`   Task Hours: ${scene.base_task_hours}`);
            console.log(`   Description: ${scene.description || 'No description'}`);
        });

        // Show statistics
        const stats = {
            total: allScenes.length,
            video: allScenes.filter(s => s.type === 'VIDEO').length,
            audio: allScenes.filter(s => s.type === 'AUDIO').length,
            music: allScenes.filter(s => s.type === 'MUSIC').length,
            totalDuration: allScenes.reduce((sum, s) => sum + (s.estimated_duration || 0), 0),
            totalHours: allScenes.reduce((sum, s) => sum + parseFloat(s.base_task_hours || 0), 0),
        };

        console.log('\n📊 Scene Library Statistics:');
        console.log(`📈 Total Scenes: ${stats.total}`);
        console.log(`🎥 Video Scenes: ${stats.video}`);
        console.log(`🔊 Audio Scenes: ${stats.audio}`);
        console.log(`🎵 Music Scenes: ${stats.music}`);
        console.log(`⏱️  Total Duration: ${Math.floor(stats.totalDuration / 60)}m ${stats.totalDuration % 60}s`);
        console.log(`💼 Total Task Hours: ${stats.totalHours.toFixed(1)} hours`);

    } catch (error) {
        console.error('❌ Error enhancing scenes table:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    enhanceScenesTable()
        .then(() => {
            console.log('\n🎉 Scenes table enhancement completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Enhancement failed:', error);
            process.exit(1);
        });
}

module.exports = { enhanceScenesTable };
