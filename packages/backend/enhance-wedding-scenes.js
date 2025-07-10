#!/usr/bin/env node

/**
 * Enhanced Wedding Film Scene Seeder
 * Updates existing wedding scenes with realistic durations and media components
 * Compatible with the new consolidated SceneMediaComponent schema
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceWeddingScenes() {
    console.log('💒 Enhancing Wedding Film Scenes with Media Components...\n');

    try {
        // Get Moonrise Films brand
        const moonriseBrand = await prisma.brands.findFirst({
            where: { name: 'Moonrise Films' }
        });

        if (!moonriseBrand) {
            console.log('❌ Moonrise Films brand not found. Please run the main seed first.');
            return;
        }

        console.log(`📊 Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

        // Enhanced scene definitions with realistic wedding durations
        const enhancedScenes = [
            {
                name: "Ceremony Processional",
                description: "Bridal party and bride entrance footage with processional music",
                type: "VIDEO",
                complexity_score: 4,
                estimated_duration: 300, // 5 minutes - realistic processional time
                base_task_hours: 3.5,
                media_components: [
                    {
                        media_type: "VIDEO",
                        duration_seconds: 300,
                        is_primary: true,
                        notes: "Primary ceremonial entrance footage"
                    },
                    {
                        media_type: "AUDIO",
                        duration_seconds: 300,
                        is_primary: false,
                        volume_level: 0.85,
                        notes: "Enhanced processional audio"
                    },
                    {
                        media_type: "MUSIC",
                        duration_seconds: 300,
                        is_primary: false,
                        music_type: "ORCHESTRAL",
                        music_weight: 8,
                        volume_level: 0.70,
                        notes: "Traditional processional music"
                    }
                ]
            },
            {
                name: "Vows Exchange",
                description: "Personal vows and ring exchange with enhanced audio capture",
                type: "VIDEO",
                complexity_score: 7,
                estimated_duration: 600, // 10 minutes - vows can be lengthy
                base_task_hours: 4.5,
                media_components: [
                    {
                        media_type: "VIDEO",
                        duration_seconds: 600,
                        is_primary: true,
                        notes: "Close-up vow exchange footage"
                    },
                    {
                        media_type: "AUDIO",
                        duration_seconds: 600,
                        is_primary: false,
                        volume_level: 0.95,
                        notes: "Crystal clear vow audio capture"
                    },
                    {
                        media_type: "MUSIC",
                        duration_seconds: 180,
                        is_primary: false,
                        music_type: "PIANO",
                        music_weight: 6,
                        volume_level: 0.40,
                        notes: "Subtle piano underscoring"
                    }
                ]
            },
            {
                name: "Ceremony Recessional",
                description: "Joyful exit and celebration after ceremony",
                type: "VIDEO",
                complexity_score: 3,
                estimated_duration: 180, // 3 minutes - quick celebration exit
                base_task_hours: 2.5,
                media_components: [
                    {
                        media_type: "VIDEO",
                        duration_seconds: 180,
                        is_primary: true,
                        notes: "Celebratory exit footage"
                    },
                    {
                        media_type: "AUDIO",
                        duration_seconds: 180,
                        is_primary: false,
                        volume_level: 0.90,
                        notes: "Celebration and cheering audio"
                    },
                    {
                        media_type: "MUSIC",
                        duration_seconds: 180,
                        is_primary: false,
                        music_type: "MODERN",
                        music_weight: 7,
                        volume_level: 0.75,
                        notes: "Upbeat celebration music"
                    }
                ]
            },
            {
                name: "First Dance Sequence",
                description: "Romantic first dance with multiple camera angles and lighting",
                type: "VIDEO",
                complexity_score: 6,
                estimated_duration: 240, // 4 minutes - typical song length
                base_task_hours: 4.0,
                media_components: [
                    {
                        media_type: "VIDEO",
                        duration_seconds: 240,
                        is_primary: true,
                        notes: "Multi-angle first dance cinematography"
                    },
                    {
                        media_type: "AUDIO",
                        duration_seconds: 240,
                        is_primary: false,
                        volume_level: 0.85,
                        notes: "High-quality dance music audio"
                    },
                    {
                        media_type: "MUSIC",
                        duration_seconds: 240,
                        is_primary: false,
                        music_type: "SCENE_MATCHED",
                        music_weight: 9,
                        volume_level: 0.80,
                        notes: "Couple's chosen first dance song"
                    }
                ]
            },
            // Audio-focused scenes
            {
                name: "Ceremony Audio",
                description: "Enhanced ceremony audio with vows and music",
                type: "AUDIO",
                complexity_score: 5,
                estimated_duration: 120, // 2 minutes - audio enhancement duration
                base_task_hours: 3.0,
                media_components: [
                    {
                        media_type: "AUDIO",
                        duration_seconds: 1200, // Full ceremony audio
                        is_primary: true,
                        volume_level: 0.90,
                        notes: "Professional ceremony audio capture and enhancement"
                    }
                ]
            },
            {
                name: "Ambient Sound",
                description: "Natural ambient sounds and venue acoustics",
                type: "AUDIO",
                complexity_score: 3,
                estimated_duration: 60, // 1 minute - ambient sound processing
                base_task_hours: 2.0,
                media_components: [
                    {
                        media_type: "AUDIO",
                        duration_seconds: 300, // 5 minutes of ambient capture
                        is_primary: true,
                        volume_level: 0.60,
                        notes: "Natural venue ambiance and atmosphere"
                    }
                ]
            },
            {
                name: "First Dance Audio",
                description: "Music and ambient sound for first dance",
                type: "AUDIO",
                complexity_score: 4,
                estimated_duration: 90, // 1.5 minutes - audio processing
                base_task_hours: 2.5,
                media_components: [
                    {
                        media_type: "AUDIO",
                        duration_seconds: 240,
                        is_primary: true,
                        volume_level: 0.85,
                        notes: "First dance audio with ambient mixing"
                    }
                ]
            },
            {
                name: "Background Music",
                description: "Cinematic background scoring throughout film",
                type: "MUSIC",
                complexity_score: 4,
                estimated_duration: 60, // 1 minute - music composition/selection
                base_task_hours: 2.0,
                media_components: [
                    {
                        media_type: "MUSIC",
                        duration_seconds: 180,
                        is_primary: true,
                        music_type: "ORCHESTRAL",
                        music_weight: 7,
                        volume_level: 0.65,
                        notes: "Cinematic orchestral underscore"
                    },
                    {
                        media_type: "MUSIC",
                        duration_seconds: 120,
                        is_primary: false,
                        music_type: "PIANO",
                        music_weight: 6,
                        volume_level: 0.50,
                        notes: "Intimate piano moments"
                    }
                ]
            }
        ];

        // Update scenes and add media components
        let updatedScenesCount = 0;
        let addedComponentsCount = 0;

        for (const sceneData of enhancedScenes) {
            console.log(`🎬 Processing scene: "${sceneData.name}"`);

            // Find existing scene
            const existingScene = await prisma.scenesLibrary.findFirst({
                where: {
                    name: sceneData.name,
                    brand_id: moonriseBrand.id
                }
            });

            if (existingScene) {
                // Update scene with new duration
                await prisma.scenesLibrary.update({
                    where: { id: existingScene.id },
                    data: {
                        estimated_duration: sceneData.estimated_duration,
                        base_task_hours: sceneData.base_task_hours,
                        complexity_score: sceneData.complexity_score,
                        description: sceneData.description
                    }
                });

                // Remove existing media components for clean slate
                await prisma.sceneMediaComponent.deleteMany({
                    where: { scene_id: existingScene.id }
                });

                // Add new media components
                for (const component of sceneData.media_components) {
                    await prisma.sceneMediaComponent.create({
                        data: {
                            scene_id: existingScene.id,
                            ...component
                        }
                    });
                    addedComponentsCount++;
                }

                updatedScenesCount++;
                console.log(`  ✓ Updated with ${sceneData.media_components.length} media components`);
            } else {
                // Create new scene if it doesn't exist
                const newScene = await prisma.scenesLibrary.create({
                    data: {
                        name: sceneData.name,
                        description: sceneData.description,
                        type: sceneData.type,
                        complexity_score: sceneData.complexity_score,
                        estimated_duration: sceneData.estimated_duration,
                        base_task_hours: sceneData.base_task_hours,
                        brand_id: moonriseBrand.id
                    }
                });

                // Add media components
                for (const component of sceneData.media_components) {
                    await prisma.sceneMediaComponent.create({
                        data: {
                            scene_id: newScene.id,
                            ...component
                        }
                    });
                    addedComponentsCount++;
                }

                updatedScenesCount++;
                console.log(`  ✓ Created new scene with ${sceneData.media_components.length} media components`);
            }
        }

        console.log('\n🎉 Wedding scene enhancement complete!');
        console.log(`📊 Updated ${updatedScenesCount} scenes`);
        console.log(`🎵 Added ${addedComponentsCount} media components`);

        // Show summary of enhanced scenes
        console.log('\n📋 Enhanced Wedding Scene Summary:');
        for (const scene of enhancedScenes) {
            const duration = Math.floor(scene.estimated_duration / 60);
            const seconds = scene.estimated_duration % 60;
            const durationStr = seconds > 0 ? `${duration}m ${seconds}s` : `${duration}m`;
            console.log(`  - ${scene.name}: ${durationStr} (${scene.media_components.length} components)`);
        }

        console.log('\n💡 Realistic Wedding Film Durations:');
        console.log('  - Processional: 5 minutes (includes full bridal party)');
        console.log('  - Vows Exchange: 10 minutes (personal vows + rings)');
        console.log('  - Recessional: 3 minutes (celebration exit)');
        console.log('  - First Dance: 4 minutes (typical song length)');
        console.log('  - Audio processing: 1-2 minutes each');

    } catch (error) {
        console.error('❌ Wedding scene enhancement failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the enhancement
if (require.main === module) {
    enhanceWeddingScenes()
        .catch((error) => {
            console.error('Enhancement failed:', error);
            process.exit(1);
        });
}

module.exports = { enhanceWeddingScenes };
