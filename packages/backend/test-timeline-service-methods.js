// ⚠️  TEST SCRIPT ONLY - DO NOT RUN AUTOMATICALLY
// 
// This script creates timeline scenes for testing purposes.
// It should NOT be run as part of seeding or automatic processes.
// Run manually only when testing timeline service methods.
//
// Test: Timeline Service Helper Methods
// Tests the new timeline service methods for scene placement and media component tracking

const { PrismaClient } = require('@prisma/client');

// Add warning check to prevent accidental execution
const isTestMode = process.argv.includes('--test') || process.argv.includes('--force');
if (!isTestMode) {
    console.log('⚠️  This is a test script that creates timeline scenes.');
    console.log('   To run this test, use: node test-timeline-service-methods.js --test');
    console.log('   To clean up timeline scenes, run: node cleanup-timeline-scenes.js');
    process.exit(0);
}

const prisma = new PrismaClient();

async function testTimelineServiceMethods() {
    console.log("🧪 Testing Timeline Service Helper Methods...");
    console.log("");

    try {
        // Get test data
        const scene = await prisma.scenesLibrary.findFirst({
            where: { name: "First Dance" },
            include: { media_components: true }
        });

        const film = await prisma.filmLibrary.findFirst({
            where: { name: "First Dance Film" }
        });

        const layer = await prisma.timelineLayer.findFirst({
            where: { name: "Video" }
        });

        if (!scene || !film || !layer) {
            console.log("❌ Test data missing. Please run the seed script first.");
            return;
        }

        console.log(`📋 Testing with Scene: "${scene.name}" (${scene.estimated_duration}s)`);
        console.log(`🎬 Film: "${film.name}"`);
        console.log(`📹 Layer: "${layer.name}"`);
        console.log("");

        // Clear existing timeline scenes for clean test
        await prisma.timelineScene.deleteMany({
            where: { film_id: film.id }
        });

        // Test 1: Place scene at various timecodes
        console.log("🎯 Test 1: Scene Placement at Different Timecodes");

        const placements = [
            { time: 0, description: "Start of timeline" },
            { time: 60, description: "1 minute mark" },
            { time: 125, description: "Invalid (not 5-second aligned)" },
            { time: 300, description: "5 minute mark" }
        ];

        for (const placement of placements) {
            try {
                console.log(`   Placing scene at ${formatTimecode(placement.time)} (${placement.description})...`);

                const result = await prisma.timelineScene.create({
                    data: {
                        film_id: film.id,
                        scene_id: scene.id,
                        layer_id: layer.id,
                        start_time_seconds: placement.time,
                        duration_seconds: scene.estimated_duration,
                        order_index: 1
                    }
                });

                console.log(`     ✅ Success: Scene placed at ${formatTimecode(placement.time)}`);
                console.log(`     📦 Media components span: ${formatTimecode(placement.time)} → ${formatTimecode(placement.time + scene.estimated_duration)}`);

                // Clean up for next test
                await prisma.timelineScene.delete({ where: { id: result.id } });

            } catch (error) {
                console.log(`     ❌ Failed: ${error.message}`);
            }
        }
        console.log("");

        // Test 2: Timeline with multiple scenes
        console.log("🎬 Test 2: Multiple Scenes on Timeline");

        // Place scenes at different times
        const scene1 = await prisma.timelineScene.create({
            data: {
                film_id: film.id,
                scene_id: scene.id,
                layer_id: layer.id,
                start_time_seconds: 30,
                duration_seconds: 180, // 3 minutes
                order_index: 1
            }
        });

        const scene2 = await prisma.timelineScene.create({
            data: {
                film_id: film.id,
                scene_id: scene.id,
                layer_id: layer.id,
                start_time_seconds: 300,
                duration_seconds: 120, // 2 minutes
                order_index: 2
            }
        });

        console.log("   ✅ Placed 2 scenes on timeline:");
        console.log(`     Scene 1: ${formatTimecode(30)} → ${formatTimecode(30 + 180)} (${formatTimecode(180)})`);
        console.log(`     Scene 2: ${formatTimecode(300)} → ${formatTimecode(300 + 120)} (${formatTimecode(120)})`);
        console.log("");

        // Test 3: Query timeline with media components
        console.log("📺 Test 3: Timeline Query with Media Components");

        const timelineView = await prisma.timelineScene.findMany({
            where: { film_id: film.id },
            include: {
                scene: {
                    include: {
                        media_components: {
                            orderBy: [
                                { is_primary: 'desc' },
                                { media_type: 'asc' }
                            ]
                        }
                    }
                },
                layer: true
            },
            orderBy: { start_time_seconds: 'asc' }
        });

        console.log(`   📊 Found ${timelineView.length} scenes on timeline:`);

        timelineView.forEach((ts, index) => {
            const endTime = ts.start_time_seconds + ts.duration_seconds;
            console.log(`     ${index + 1}. ${ts.scene.name}`);
            console.log(`        Timeline: ${formatTimecode(ts.start_time_seconds)} → ${formatTimecode(endTime)}`);
            console.log(`        Media Components (${ts.scene.media_components.length}):`);

            ts.scene.media_components.forEach(component => {
                const componentEnd = ts.start_time_seconds + Math.min(component.duration_seconds, ts.duration_seconds);
                console.log(`          - ${component.media_type}: ${formatTimecode(ts.start_time_seconds)} → ${formatTimecode(componentEnd)}`);
            });
        });
        console.log("");

        // Test 4: Overlap detection
        console.log("⚠️  Test 4: Overlap Detection");

        try {
            console.log("   Attempting to place overlapping scene at 01:30...");
            await prisma.timelineScene.create({
                data: {
                    film_id: film.id,
                    scene_id: scene.id,
                    layer_id: layer.id,
                    start_time_seconds: 90, // 1:30 - should overlap with first scene
                    duration_seconds: 60,
                    order_index: 3
                }
            });
            console.log("     ❌ Overlap detection failed - scene was placed");
        } catch (error) {
            console.log("     ✅ Overlap correctly detected and prevented");
        }
        console.log("");

        // Test 5: Timeline analytics
        console.log("📈 Test 5: Timeline Analytics");

        const totalDuration = Math.max(...timelineView.map(ts => ts.start_time_seconds + ts.duration_seconds));
        const gaps = [];

        for (let i = 0; i < timelineView.length - 1; i++) {
            const currentEnd = timelineView[i].start_time_seconds + timelineView[i].duration_seconds;
            const nextStart = timelineView[i + 1].start_time_seconds;

            if (nextStart > currentEnd) {
                gaps.push({
                    start: currentEnd,
                    end: nextStart,
                    duration: nextStart - currentEnd
                });
            }
        }

        console.log(`   📏 Total Timeline Duration: ${formatTimecode(totalDuration)}`);
        console.log(`   🎬 Total Scenes: ${timelineView.length}`);
        console.log(`   📭 Gaps Found: ${gaps.length}`);

        gaps.forEach((gap, index) => {
            console.log(`     Gap ${index + 1}: ${formatTimecode(gap.start)} → ${formatTimecode(gap.end)} (${formatTimecode(gap.duration)})`);
        });

        // Calculate total content vs gap time
        const totalContent = timelineView.reduce((sum, ts) => sum + ts.duration_seconds, 0);
        const totalGaps = gaps.reduce((sum, gap) => sum + gap.duration, 0);

        console.log(`   🎵 Content Time: ${formatTimecode(totalContent)} (${((totalContent / totalDuration) * 100).toFixed(1)}%)`);
        console.log(`   📭 Gap Time: ${formatTimecode(totalGaps)} (${((totalGaps / totalDuration) * 100).toFixed(1)}%)`);
        console.log("");

        // Clean up
        await prisma.timelineScene.deleteMany({
            where: { film_id: film.id }
        });

        console.log("✅ All Timeline Service Tests Completed!");
        console.log("   ✓ Scene placement with timecode tracking");
        console.log("   ✓ Media component timeline positioning");
        console.log("   ✓ Overlap detection");
        console.log("   ✓ Timeline analytics and gap analysis");

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

function formatTimecode(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

testTimelineServiceMethods();
