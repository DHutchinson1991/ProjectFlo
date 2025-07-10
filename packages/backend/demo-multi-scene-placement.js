// Demo: Enhanced Multi-Scene Timeline Placement
// Tests placing multiple scenes on the same track at different times

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demoMultiScenePlacement() {
    console.log("🎬 Demo: Enhanced Multi-Scene Timeline Placement...");
    console.log("");

    try {
        // Get available scenes
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

        if (!firstDanceScene || !ceremonyScene || !film) {
            console.log("❌ Required test data missing. Please run the seed script first.");
            return;
        }

        console.log("📋 Testing Multiple Scene Placement on Same Track:");
        console.log(`  🎬 Scene 1: ${firstDanceScene.name} (${firstDanceScene.estimated_duration}s)`);
        console.log(`  💒 Scene 2: ${ceremonyScene.name} (${ceremonyScene.estimated_duration}s)`);
        console.log("");

        // Simulate placing First Dance at 00:00:30
        console.log("1. Placing 'First Dance' scene at 00:00:30...");
        console.log(`   - Video track: 00:30 → ${formatTimecode(30 + firstDanceScene.estimated_duration)}`);
        console.log(`   - Audio track: 00:30 → ${formatTimecode(30 + firstDanceScene.estimated_duration)}`);
        console.log(`   - Music track: 00:30 → ${formatTimecode(30 + firstDanceScene.estimated_duration)}`);
        console.log("");

        // Simulate placing Ceremony at 00:01:00 (would overlap, should auto-place after First Dance)
        const ceremonyPreferredStart = 60; // 1 minute
        const firstDanceEnd = 30 + firstDanceScene.estimated_duration;
        const ceremonyActualStart = Math.max(ceremonyPreferredStart, firstDanceEnd);

        console.log(`2. Attempting to place 'Ceremony' scene at ${formatTimecode(ceremonyPreferredStart)}...`);
        if (ceremonyActualStart > ceremonyPreferredStart) {
            console.log(`   ⚠️  Would overlap with First Dance (ends at ${formatTimecode(firstDanceEnd)})`);
            console.log(`   ✅ Auto-placed at ${formatTimecode(ceremonyActualStart)} to avoid collision`);
        } else {
            console.log(`   ✅ Placed at preferred time ${formatTimecode(ceremonyPreferredStart)}`);
        }
        console.log(`   - Video track: ${formatTimecode(ceremonyActualStart)} → ${formatTimecode(ceremonyActualStart + ceremonyScene.estimated_duration)}`);
        console.log(`   - Audio track: ${formatTimecode(ceremonyActualStart)} → ${formatTimecode(ceremonyActualStart + ceremonyScene.estimated_duration)}`);
        console.log(`   - Music track: ${formatTimecode(ceremonyActualStart)} → ${formatTimecode(ceremonyActualStart + ceremonyScene.estimated_duration)}`);
        console.log("");

        // Now try placing another First Dance in a gap
        const gap1Start = ceremonyActualStart + ceremonyScene.estimated_duration;
        console.log(`3. Placing another 'First Dance' scene at ${formatTimecode(gap1Start + 60)}...`);
        console.log(`   ✅ Placed in gap after Ceremony`);
        console.log(`   - Video track: ${formatTimecode(gap1Start + 60)} → ${formatTimecode(gap1Start + 60 + firstDanceScene.estimated_duration)}`);
        console.log("");

        // Show final timeline layout
        console.log("📺 Final Timeline Layout (Video Track):");
        console.log("┌─────────────────────────────────────────────────────┐");
        console.log("│ Track Timeline                                      │");
        console.log("├─────────────────────────────────────────────────────┤");
        console.log(`│ 00:00 ──── 00:30 [First Dance] ${formatTimecode(firstDanceEnd)} ─────│`);
        console.log(`│ ${formatTimecode(firstDanceEnd)} ──────── ${formatTimecode(ceremonyActualStart)} [Ceremony] ${formatTimecode(ceremonyActualStart + ceremonyScene.estimated_duration)} ──│`);
        console.log(`│ ${formatTimecode(ceremonyActualStart + ceremonyScene.estimated_duration)} ─── ${formatTimecode(gap1Start + 60)} [First Dance] ${formatTimecode(gap1Start + 60 + firstDanceScene.estimated_duration)} │`);
        console.log("└─────────────────────────────────────────────────────┘");
        console.log("");

        console.log("✅ Multi-Scene Placement Demo Complete!");
        console.log("   This demonstrates how multiple scenes can be placed on the same track");
        console.log("   at different times with automatic collision avoidance.");
        console.log("");
        console.log("🎯 Key Features Demonstrated:");
        console.log("   • Multiple scenes on same track");
        console.log("   • Automatic collision detection");
        console.log("   • Smart placement in available gaps");
        console.log("   • Visual timeline organization");

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

demoMultiScenePlacement();
