// Demo: Assign scenes to films and show how media components come together
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demoSceneAssignment() {
    console.log("🎬 Demo: Assigning Scenes to Films with Media Components...");
    console.log("");

    try {
        // Get the scenes and films
        const firstDanceScene = await prisma.scenesLibrary.findFirst({
            where: { name: "First Dance" }
        });

        const ceremonyScene = await prisma.scenesLibrary.findFirst({
            where: { name: "Ceremony" }
        });

        const firstDanceFilm = await prisma.filmLibrary.findFirst({
            where: { name: "First Dance Film" }
        });

        const ceremonyFilm = await prisma.filmLibrary.findFirst({
            where: { name: "Ceremony Film" }
        });

        // Assign scenes to films
        console.log("🔗 Assigning scenes to films...");

        await prisma.filmAssignedScenes.upsert({
            where: {
                film_id_scene_id: {
                    film_id: firstDanceFilm.id,
                    scene_id: firstDanceScene.id
                }
            },
            update: {
                order_index: 1,
                editing_style: "Cinematic"
            },
            create: {
                film_id: firstDanceFilm.id,
                scene_id: firstDanceScene.id,
                order_index: 1,
                editing_style: "Cinematic"
            }
        });

        await prisma.filmAssignedScenes.upsert({
            where: {
                film_id_scene_id: {
                    film_id: ceremonyFilm.id,
                    scene_id: ceremonyScene.id
                }
            },
            update: {
                order_index: 1,
                editing_style: "Documentary"
            },
            create: {
                film_id: ceremonyFilm.id,
                scene_id: ceremonyScene.id,
                order_index: 1,
                editing_style: "Documentary"
            }
        });

        console.log("✓ Scene assignments created");
        console.log("");

        // Now query films with their scenes and media components
        console.log("📋 Film Content with Media Components:");
        console.log("");

        const filmsWithContent = await prisma.filmLibrary.findMany({
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
                                media_components: {
                                    orderBy: [
                                        { is_primary: 'desc' },
                                        { media_type: 'asc' }
                                    ]
                                }
                            }
                        }
                    },
                    orderBy: {
                        order_index: 'asc'
                    }
                }
            }
        });

        for (const film of filmsWithContent) {
            console.log(`🎥 ${film.name}`);
            console.log(`   Description: ${film.description}`);
            console.log(`   Type: ${film.type}`);
            console.log(`   Includes Music: ${film.includes_music ? 'Yes' : 'No'}`);
            console.log(`   Delivery Timeline: ${film.delivery_timeline} days`);
            console.log("");

            console.log(`   📦 Assigned Scenes (${film.assigned_scenes.length}):`);

            for (const assignment of film.assigned_scenes) {
                const scene = assignment.scene;
                console.log(`     • Scene: ${scene.name} (${assignment.editing_style} style)`);
                console.log(`       Duration: ${scene.estimated_duration}s | Complexity: ${scene.complexity_score}/10`);
                console.log(`       Media Components (${scene.media_components.length}):`);

                for (const component of scene.media_components) {
                    const primaryTag = component.is_primary ? " [PRIMARY]" : "";
                    console.log(`         - ${component.media_type}${primaryTag}: ${component.duration_seconds}s`);

                    if (component.volume_level) {
                        console.log(`           Volume: ${(component.volume_level * 100).toFixed(0)}%`);
                    }
                    if (component.music_type) {
                        console.log(`           Music: ${component.music_type} (Weight: ${component.music_weight})`);
                    }
                    if (component.notes) {
                        console.log(`           Notes: ${component.notes}`);
                    }
                }
                console.log("");
            }
        }

        console.log("✅ Demo completed! This shows how dragging a scene into a film");
        console.log("   brings all its media components (video, audio, music) together as a unit.");

    } catch (error) {
        console.error("❌ Demo failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

demoSceneAssignment();
