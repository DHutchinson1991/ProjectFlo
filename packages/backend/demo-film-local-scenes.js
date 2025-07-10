// Demo: Film Local Scene Copies - Shows how scene assignments create local copies
// that can be edited independently from the original scene library

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demoFilmLocalScenes() {
    console.log("🎬 Demo: Film Local Scene Copies with Independent Editing...");
    console.log("");

    try {
        // Step 1: Get available films and scenes
        console.log("📋 Getting available films and scenes...");

        const films = await prisma.filmLibrary.findMany({
            where: {
                name: {
                    in: ["First Dance Film", "Ceremony Film"]
                }
            }
        });

        const scenes = await prisma.scenesLibrary.findMany({
            where: {
                name: {
                    in: ["First Dance", "Ceremony"]
                }
            },
            include: {
                media_components: true
            }
        });

        console.log(`  ✓ Found ${films.length} films and ${scenes.length} scenes`);
        console.log("");

        // Step 2: Clear any existing assignments
        console.log("🧹 Clearing existing local scene assignments...");
        await prisma.filmLocalScenes.deleteMany({});
        console.log("  ✓ Cleared existing assignments");
        console.log("");

        // Step 3: Assign scenes to films (creates local copies)
        console.log("🔗 Assigning scenes to films (creating local copies)...");

        const firstDanceFilm = films.find(f => f.name === "First Dance Film");
        const ceremonyFilm = films.find(f => f.name === "Ceremony Film");
        const firstDanceScene = scenes.find(s => s.name === "First Dance");
        const ceremonyScene = scenes.find(s => s.name === "Ceremony");

        // Assign First Dance scene to First Dance film
        const localFirstDance = await prisma.filmLocalScenes.create({
            data: {
                film_id: firstDanceFilm.id,
                original_scene_id: firstDanceScene.id,
                name: firstDanceScene.name,
                type: firstDanceScene.type,
                description: firstDanceScene.description,
                complexity_score: firstDanceScene.complexity_score,
                estimated_duration: firstDanceScene.estimated_duration,
                default_editing_style: firstDanceScene.default_editing_style,
                base_task_hours: firstDanceScene.base_task_hours,
                order_index: 1,
                editing_style: "Cinematic"
            },
        });

        // Copy media components for First Dance
        await Promise.all(
            firstDanceScene.media_components.map(component =>
                prisma.filmLocalSceneMediaComponent.create({
                    data: {
                        film_local_scene_id: localFirstDance.id,
                        original_component_id: component.id,
                        media_type: component.media_type,
                        duration_seconds: component.duration_seconds,
                        is_primary: component.is_primary,
                        music_type: component.music_type,
                        notes: component.notes,
                    },
                })
            )
        );

        // Assign Ceremony scene to Ceremony film
        const localCeremony = await prisma.filmLocalScenes.create({
            data: {
                film_id: ceremonyFilm.id,
                original_scene_id: ceremonyScene.id,
                name: ceremonyScene.name,
                type: ceremonyScene.type,
                description: ceremonyScene.description,
                complexity_score: ceremonyScene.complexity_score,
                estimated_duration: ceremonyScene.estimated_duration,
                default_editing_style: ceremonyScene.default_editing_style,
                base_task_hours: ceremonyScene.base_task_hours,
                order_index: 1,
                editing_style: "Documentary"
            },
        });

        // Copy media components for Ceremony
        await Promise.all(
            ceremonyScene.media_components.map(component =>
                prisma.filmLocalSceneMediaComponent.create({
                    data: {
                        film_local_scene_id: localCeremony.id,
                        original_component_id: component.id,
                        media_type: component.media_type,
                        duration_seconds: component.duration_seconds,
                        is_primary: component.is_primary,
                        music_type: component.music_type,
                        notes: component.notes,
                    },
                })
            )
        );

        console.log("  ✓ Created local scene copies for both films");
        console.log("");

        // Step 4: Show original vs local scene states
        console.log("📊 Original Scene Library State:");
        for (const scene of scenes) {
            console.log(`  🎬 ${scene.name}:`);
            console.log(`     Description: ${scene.description}`);
            console.log(`     Duration: ${scene.estimated_duration}s`);
            console.log(`     Media Components (${scene.media_components.length}):`);
            for (const component of scene.media_components) {
                console.log(`       - ${component.media_type}: ${component.duration_seconds}s ${component.is_primary ? '[PRIMARY]' : ''}`);
                if (component.music_type) {
                    console.log(`         Music: ${component.music_type}`);
                }
            }
            console.log("");
        }

        // Step 5: Edit local scenes (this should NOT affect the original library)
        console.log("✏️ Editing film-specific scenes (local copies only)...");

        // Edit First Dance film's local scene
        await prisma.filmLocalScenes.update({
            where: { id: localFirstDance.id },
            data: {
                name: "First Dance - Extended Version",
                description: "Extended cinematic capture with additional angles",
                editing_style: "Ultra Cinematic",
                duration_override: 300, // 5 minutes instead of 4
            },
        });

        // Edit a media component in the First Dance film
        const firstDanceLocalComponents = await prisma.filmLocalSceneMediaComponent.findMany({
            where: { film_local_scene_id: localFirstDance.id }
        });

        const musicComponent = firstDanceLocalComponents.find(c => c.media_type === 'MUSIC');
        if (musicComponent) {
            await prisma.filmLocalSceneMediaComponent.update({
                where: { id: musicComponent.id },
                data: {
                    duration_seconds: 300,
                    notes: "Extended music track for longer film version",
                },
            });
        }

        console.log("  ✓ Modified First Dance film's local scene");
        console.log("");

        // Step 6: Show the results - original should be unchanged, local should be modified
        console.log("🔍 Comparison: Original vs Film Local Scenes");
        console.log("");

        // Show original scenes (unchanged)
        const originalScenesAfter = await prisma.scenesLibrary.findMany({
            where: {
                name: {
                    in: ["First Dance", "Ceremony"]
                }
            },
            include: {
                media_components: true
            }
        });

        console.log("📚 Original Scene Library (UNCHANGED):");
        for (const scene of originalScenesAfter) {
            console.log(`  🎬 ${scene.name}:`);
            console.log(`     Description: ${scene.description}`);
            console.log(`     Duration: ${scene.estimated_duration}s`);
            console.log(`     Media Components:`);
            for (const component of scene.media_components) {
                console.log(`       - ${component.media_type}: ${component.duration_seconds}s`);
                if (component.notes) {
                    console.log(`         Notes: ${component.notes}`);
                }
            }
            console.log("");
        }

        // Show film local scenes (modified)
        const filmsWithLocalScenes = await prisma.filmLibrary.findMany({
            where: {
                name: {
                    in: ["First Dance Film", "Ceremony Film"]
                }
            },
            include: {
                local_scenes: {
                    include: {
                        media_components: true
                    },
                    orderBy: {
                        order_index: 'asc'
                    }
                }
            }
        });

        console.log("🎭 Film Local Scenes (MODIFIED):");
        for (const film of filmsWithLocalScenes) {
            console.log(`  🎥 ${film.name}:`);
            if (film.local_scenes.length === 0) {
                console.log(`     No local scenes assigned`);
            } else {
                for (const localScene of film.local_scenes) {
                    console.log(`     🎬 ${localScene.name}:`);
                    console.log(`        Description: ${localScene.description}`);
                    console.log(`        Original Duration: ${localScene.estimated_duration}s`);
                    if (localScene.duration_override) {
                        console.log(`        Overridden Duration: ${localScene.duration_override}s ⭐`);
                    }
                    console.log(`        Editing Style: ${localScene.editing_style}`);
                    console.log(`        Media Components:`);
                    for (const component of localScene.media_components) {
                        console.log(`          - ${component.media_type}: ${component.duration_seconds}s`);
                        if (component.notes) {
                            console.log(`            Notes: ${component.notes} ⭐`);
                        }
                    }
                }
            }
            console.log("");
        }

        console.log("✅ Demo completed successfully!");
        console.log("");
        console.log("🎯 Key Points Demonstrated:");
        console.log("   • When scenes are assigned to films, local copies are created");
        console.log("   • Edits to film scenes only affect that specific film");
        console.log("   • Original scene library remains completely unchanged");
        console.log("   • Each film can have its own customized version of any scene");
        console.log("   • Media components are also copied locally for independent editing");

    } catch (error) {
        console.error("❌ Demo failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Export for potential reuse
module.exports = { demoFilmLocalScenes };

// Run if called directly
if (require.main === module) {
    demoFilmLocalScenes();
}
