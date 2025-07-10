// ⚠️  DEMO SCRIPT ONLY - DO NOT RUN AUTOMATICALLY
// 
// This script creates timeline scenes for demonstration purposes.
// It should NOT be run as part of seeding or automatic processes.
// Run manually only when testing timeline functionality.
//
// Demo: Timeline Scene Placement with Media Components
// Tests placing scenes on timeline and tracking media component timecodes

const { PrismaClient } = require('@prisma/client');

// Add warning check to prevent accidental execution
const isDemoMode = process.argv.includes('--demo') || process.argv.includes('--force');
if (!isDemoMode) {
    console.log('⚠️  This is a demo script that creates timeline scenes.');
    console.log('   To run this demo, use: node demo-timeline-scene-placement.js --demo');
    console.log('   To clean up timeline scenes, run: node cleanup-timeline-scenes.js');
    process.exit(0);
}

const prisma = new PrismaClient();

async function demoTimelineScenePlacement() {
    console.log("🎬 Demo: Timeline Scene Placement with Media Components...");
    console.log("");

    try {
        // Get test data
        const firstDanceScene = await prisma.scenesLibrary.findFirst({
            where: { name: "First Dance" },
            include: {
                media_components: {
                    orderBy: [
                        { is_primary: 'desc' },
                        { media_type: 'asc' }
                    ]
                }
            }
        });

        const ceremonyScene = await prisma.scenesLibrary.findFirst({
            where: { name: "Ceremony" },
            include: {
                media_components: {
                    orderBy: [
                        { is_primary: 'desc' },
                        { media_type: 'asc' }
                    ]
                }
            }
        });

        const film = await prisma.filmLibrary.findFirst({
            where: { name: "First Dance Film" }
        });

        const videoLayer = await prisma.timelineLayer.findFirst({
            where: { name: "Video" }
        });

        if (!firstDanceScene || !ceremonyScene || !film || !videoLayer) {
            console.log("❌ Required test data missing. Please run the seed script first.");
            return;
        }

        console.log("📋 Available Scenes for Timeline:");
        console.log(`  🎬 ${firstDanceScene.name} (${firstDanceScene.estimated_duration}s)`);
        console.log(`     Media Components: ${firstDanceScene.media_components.length}`);
        firstDanceScene.media_components.forEach(component => {
            const primaryTag = component.is_primary ? " [PRIMARY]" : "";
            console.log(`       - ${component.media_type}${primaryTag}: ${component.duration_seconds}s`);
        });
        console.log("");

        console.log(`  💒 ${ceremonyScene.name} (${ceremonyScene.estimated_duration}s)`);
        console.log(`     Media Components: ${ceremonyScene.media_components.length}`);
        ceremonyScene.media_components.forEach(component => {
            const primaryTag = component.is_primary ? " [PRIMARY]" : "";
            console.log(`       - ${component.media_type}${primaryTag}: ${component.duration_seconds}s`);
        });
        console.log("");

        // Clear existing timeline scenes for clean demo
        await prisma.timelineScene.deleteMany({
            where: { film_id: film.id }
        });

        console.log("🎯 Placing Scenes on Timeline...");
        console.log("");

        // Place First Dance scene at 00:00:30 (30 seconds)
        console.log("1. Placing 'First Dance' scene at 00:00:30...");
        const timelineScene1 = await prisma.timelineScene.create({
            data: {
                film_id: film.id,
                scene_id: firstDanceScene.id,
                layer_id: videoLayer.id,
                start_time_seconds: 30,
                duration_seconds: firstDanceScene.estimated_duration,
                order_index: 1
            }
        });

        console.log(`   ✓ Scene placed: Start ${formatTimecode(30)}, Duration ${formatTimecode(firstDanceScene.estimated_duration)}`);
        console.log(`   📦 Media components will span:`);
        firstDanceScene.media_components.forEach(component => {
            const componentEnd = 30 + Math.min(component.duration_seconds, firstDanceScene.estimated_duration);
            console.log(`     - ${component.media_type}: ${formatTimecode(30)} → ${formatTimecode(componentEnd)}`);
        });
        console.log("");

        // Place Ceremony scene at 00:05:00 (300 seconds)
        console.log("2. Placing 'Ceremony' scene at 00:05:00...");
        const timelineScene2 = await prisma.timelineScene.create({
            data: {
                film_id: film.id,
                scene_id: ceremonyScene.id,
                layer_id: videoLayer.id,
                start_time_seconds: 300,
                duration_seconds: ceremonyScene.estimated_duration,
                order_index: 2
            }
        });

        console.log(`   ✓ Scene placed: Start ${formatTimecode(300)}, Duration ${formatTimecode(ceremonyScene.estimated_duration)}`);
        console.log(`   📦 Media components will span:`);
        ceremonyScene.media_components.forEach(component => {
            const componentEnd = 300 + Math.min(component.duration_seconds, ceremonyScene.estimated_duration);
            console.log(`     - ${component.media_type}: ${formatTimecode(300)} → ${formatTimecode(componentEnd)}`);
        });
        console.log("");

        // Query full timeline with media components
        console.log("📺 Complete Timeline View:");
        console.log("");

        const timeline = await prisma.timelineScene.findMany({
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

        timeline.forEach((timelineScene, index) => {
            const endTime = timelineScene.start_time_seconds + timelineScene.duration_seconds;
            console.log(`${index + 1}. ${timelineScene.scene.name}`);
            console.log(`   Layer: ${timelineScene.layer.name}`);
            console.log(`   Timeline: ${formatTimecode(timelineScene.start_time_seconds)} → ${formatTimecode(endTime)} (${formatTimecode(timelineScene.duration_seconds)})`);
            console.log(`   Media Components on Timeline:`);

            timelineScene.scene.media_components.forEach(component => {
                const componentStart = timelineScene.start_time_seconds;
                const componentEnd = componentStart + Math.min(component.duration_seconds, timelineScene.duration_seconds);
                const primaryTag = component.is_primary ? " [PRIMARY]" : "";

                console.log(`     ${component.media_type}${primaryTag}:`);
                console.log(`       Timeline Position: ${formatTimecode(componentStart)} → ${formatTimecode(componentEnd)}`);
                console.log(`       Component Duration: ${formatTimecode(component.duration_seconds)}`);
                if (component.music_type) {
                    console.log(`       Music Type: ${component.music_type}`);
                }
                if (component.notes) {
                    console.log(`       Notes: ${component.notes}`);
                }
            });
            console.log("");
        });

        // Calculate total timeline duration
        const totalDuration = Math.max(...timeline.map(ts => ts.start_time_seconds + ts.duration_seconds));
        console.log(`⏱️  Total Timeline Duration: ${formatTimecode(totalDuration)}`);
        console.log(`📊 Total Scenes on Timeline: ${timeline.length}`);

        // Show timeline gaps
        console.log("");
        console.log("🔍 Timeline Analysis:");

        if (timeline.length > 1) {
            for (let i = 0; i < timeline.length - 1; i++) {
                const currentEnd = timeline[i].start_time_seconds + timeline[i].duration_seconds;
                const nextStart = timeline[i + 1].start_time_seconds;

                if (nextStart > currentEnd) {
                    const gapDuration = nextStart - currentEnd;
                    console.log(`   📭 Gap: ${formatTimecode(currentEnd)} → ${formatTimecode(nextStart)} (${formatTimecode(gapDuration)})`);
                } else if (nextStart < currentEnd) {
                    const overlapDuration = currentEnd - nextStart;
                    console.log(`   ⚠️  Overlap: ${formatTimecode(nextStart)} → ${formatTimecode(currentEnd)} (${formatTimecode(overlapDuration)})`);
                }
            }
        }

        console.log("");
        console.log("✅ Timeline Demo Complete!");
        console.log("   This shows how scenes bring their media components to the timeline");
        console.log("   and how timecode positions are tracked for each component.");

    } catch (error) {
        console.error("❌ Demo failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

function formatTimecode(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

demoTimelineScenePlacement();
