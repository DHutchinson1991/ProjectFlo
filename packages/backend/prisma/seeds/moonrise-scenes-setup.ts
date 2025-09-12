// Moonrise Films Scenes Setup - Wedding Scenes and Media Components
// Creates: Scene library items with video, audio, and music components
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseScenes(brandId: number) {
    logger.sectionHeader('Scenes Setup', 'Wedding Scenes + Media Components');

    // Create First Dance Scene
    let firstDanceScene = await prisma.scenesLibrary.findFirst({
        where: {
            name: "First Dance",
            brand_id: brandId
        },
    });

    if (!firstDanceScene) {
        firstDanceScene = await prisma.scenesLibrary.create({
            data: {
                name: "First Dance",
                description: "Cinematic capture of the couple's first dance with multiple angles and audio",
                type: $Enums.MediaType.VIDEO, // Primary type
                complexity_score: 7,
                estimated_duration: 240, // 4 minutes in seconds
                base_task_hours: 4.5,
                brand_id: brandId,
            },
        });
    }

    // Add media components for First Dance
    const firstDanceComponents = [
        {
            scene_id: firstDanceScene.id,
            media_type: 'VIDEO' as const,
            duration_seconds: 240,
            is_primary: true,
            notes: 'Primary video footage with multiple camera angles',
        },
        {
            scene_id: firstDanceScene.id,
            media_type: 'AUDIO' as const,
            duration_seconds: 240,
            is_primary: false,
            notes: 'Enhanced audio capture with ambient sound',
        },
        {
            scene_id: firstDanceScene.id,
            media_type: 'MUSIC' as const,
            duration_seconds: 240,
            is_primary: false,
            music_type: 'MODERN',
            notes: 'Background scoring to enhance the romantic moment',
        },
    ];

    for (const component of firstDanceComponents) {
        const existing = await prisma.sceneMediaComponent.findFirst({
            where: {
                scene_id: component.scene_id,
                media_type: component.media_type,
            },
        });

        if (!existing) {
            await prisma.sceneMediaComponent.create({
                data: component,
            });
        }
    }

    // Create Ceremony Scene
    let ceremonyScene = await prisma.scenesLibrary.findFirst({
        where: {
            name: "Ceremony",
            brand_id: brandId
        },
    });

    if (!ceremonyScene) {
        ceremonyScene = await prisma.scenesLibrary.create({
            data: {
                name: "Ceremony",
                description: "Complete wedding ceremony coverage including processional, vows, and recessional",
                type: $Enums.MediaType.VIDEO, // Primary type
                complexity_score: 8,
                estimated_duration: 1800, // 30 minutes in seconds
                base_task_hours: 6.0,
                brand_id: brandId,
            },
        });
    }

    // Add media components for Ceremony
    const ceremonyComponents = [
        {
            scene_id: ceremonyScene.id,
            media_type: 'VIDEO' as const,
            duration_seconds: 1800,
            is_primary: true,
            notes: 'Multi-camera ceremony coverage with processional, vows, and recessional',
        },
        {
            scene_id: ceremonyScene.id,
            media_type: 'AUDIO' as const,
            duration_seconds: 1800,
            is_primary: false,
            notes: 'High-quality ceremony audio including vows and readings',
        },
        {
            scene_id: ceremonyScene.id,
            media_type: 'MUSIC' as const,
            duration_seconds: 1800,
            is_primary: false,
            music_type: 'ORCHESTRAL',
            notes: 'Subtle orchestral background to enhance emotional moments',
        },
    ];

    for (const component of ceremonyComponents) {
        const existing = await prisma.sceneMediaComponent.findFirst({
            where: {
                scene_id: component.scene_id,
                media_type: component.media_type,
            },
        });

        if (!existing) {
            await prisma.sceneMediaComponent.create({
                data: component,
            });
        }
    }

    logger.success('Created 2 wedding scenes:');
    logger.info('• First Dance (4 min) - Video + Audio + Music');
    logger.info('• Ceremony (30 min) - Video + Audio + Music');

    return { firstDanceScene, ceremonyScene };
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Scenes');

    try {
        // Find the Moonrise Films brand
        const brand = await prisma.brands.findUnique({
            where: { name: "Moonrise Films" }
        });

        if (!brand) {
            throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
        }

        await createMoonriseScenes(brand.id);
        logger.success('Scenes setup complete! Created 2 wedding scenes');
    } catch (error) {
        console.error("❌ Scenes setup failed:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Scenes setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
