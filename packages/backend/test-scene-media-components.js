// Test script to verify scene media components relationship
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSceneMediaComponents() {
    console.log("🔍 Testing Scene Media Components Relationship...");
    console.log("");

    try {
        // Find scenes with their media components
        const scenes = await prisma.scenesLibrary.findMany({
            where: {
                name: {
                    in: ["First Dance", "Ceremony"]
                }
            },
            include: {
                media_components: true,
                brand: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log(`Found ${scenes.length} scenes:`);
        console.log("");

        for (const scene of scenes) {
            console.log(`📋 Scene: ${scene.name}`);
            console.log(`   Brand: ${scene.brand?.name || 'No brand'}`);
            console.log(`   Type: ${scene.type}`);
            console.log(`   Duration: ${scene.estimated_duration} seconds`);
            console.log(`   Complexity: ${scene.complexity_score}/10`);
            console.log(`   Media Components (${scene.media_components.length}):`);

            for (const component of scene.media_components) {
                console.log(`     • ${component.media_type}: ${component.duration_seconds}s`);
                console.log(`       - Primary: ${component.is_primary ? 'Yes' : 'No'}`);
                if (component.music_type) {
                    console.log(`       - Music Type: ${component.music_type}`);
                }
                if (component.notes) {
                    console.log(`       - Notes: ${component.notes}`);
                }
            }
            console.log("");
        }

        // Test film assignment query
        console.log("🎬 Testing Film Assignment with Media Components...");

        const filmsWithScenes = await prisma.filmLibrary.findMany({
            where: {
                name: {
                    in: ["First Dance Film", "Ceremony Film"]
                }
            },
            include: {
                assigned_scenes: {
                    include: {
                        scene: {
                            include: {
                                media_components: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`Found ${filmsWithScenes.length} films:`);
        for (const film of filmsWithScenes) {
            console.log(`🎥 Film: ${film.name}`);
            console.log(`   Assigned Scenes: ${film.assigned_scenes.length}`);

            for (const assignment of film.assigned_scenes) {
                const scene = assignment.scene;
                console.log(`     • Scene: ${scene.name} (${scene.media_components.length} media components)`);
                for (const component of scene.media_components) {
                    console.log(`       - ${component.media_type}: ${component.duration_seconds}s`);
                }
            }
            console.log("");
        }

        console.log("✅ Scene media components relationship test completed!");

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testSceneMediaComponents();
