// System Infrastructure Seed - Timeline Layers Only
import { PrismaClient } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.INFRASTRUCTURE);

async function main(): Promise<SeedSummary> {
    logger.sectionHeader('System Infrastructure', 'STEP 2/6: Infrastructure');
    logger.startTimer('infrastructure-seed');

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    try {
        // --- 1. Create Timeline Layers ---
        logger.processing('Seeding timeline layers...');

        const timelineLayers = [
            {
                name: "Video",
                order_index: 1,
                color_hex: "#3B82F6", // Blue
                description: "Primary video track for main footage",
                is_active: true,
            },
            {
                name: "Audio",
                order_index: 2,
                color_hex: "#10B981", // Green
                description: "Audio track for ceremonies, vows, and ambient sound",
                is_active: true,
            },
            {
                name: "Music",
                order_index: 3,
                color_hex: "#8B5CF6", // Purple
                description: "Background music and soundtrack",
                is_active: true,
            },
            {
                name: "Graphics",
                order_index: 4,
                color_hex: "#F59E0B", // Amber
                description: "Titles, overlays, and graphic elements",
                is_active: true,
            },
        ];

        let layersCreated = 0;
        let layersUpdated = 0;

        for (const layer of timelineLayers) {
            const existing = await prisma.timelineLayer.findUnique({ where: { name: layer.name } });
            if (existing) {
                await prisma.timelineLayer.update({
                    where: { name: layer.name },
                    data: {
                        order_index: layer.order_index,
                        color_hex: layer.color_hex,
                        description: layer.description,
                        is_active: layer.is_active,
                    }
                });
                layersUpdated++;
                logger.skipped(`Timeline layer "${layer.name}"`, 'already exists, updated', 'verbose');
            } else {
                await prisma.timelineLayer.create({ data: layer });
                layersCreated++;
                logger.created(`Timeline layer "${layer.name}"`, undefined, 'verbose');
            }
        }

        logger.smartSummary('Timeline layers', layersCreated, layersUpdated, timelineLayers.length);
        totalCreated += layersCreated;
        totalUpdated += layersUpdated;
        totalSkipped += (timelineLayers.length - layersCreated - layersUpdated);

        logger.success('System Infrastructure seeding completed successfully!');
        logger.endTimer('infrastructure-seed', 'Infrastructure seeding');
        logger.info('System ready for project-specific films!');

        return {
            created: totalCreated,
            updated: totalUpdated,
            skipped: totalSkipped,
            total: totalCreated + totalUpdated + totalSkipped
        };
    } catch (error) {
        console.error("❌ Error during system infrastructure seeding:", error);
        throw error;
    }
}

export default main;

// Allow running this file directly
if (require.main === module) {
    main()
        .then((summary) => {
            console.log('System infrastructure seed completed:', summary);
        })
        .catch((e) => {
            console.error("❌ System infrastructure seed process failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
