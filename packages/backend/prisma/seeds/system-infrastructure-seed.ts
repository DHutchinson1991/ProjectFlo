// System Infrastructure Seed - Timeline Layers Only
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🏗️ Seeding System Infrastructure...");

    try {
        // --- 1. Create Timeline Layers ---
        console.log("🎬 Seeding Timeline Layers...");

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

        for (const layer of timelineLayers) {
            await prisma.timelineLayer.upsert({
                where: { name: layer.name },
                update: {
                    order_index: layer.order_index,
                    color_hex: layer.color_hex,
                    description: layer.description,
                    is_active: layer.is_active,
                },
                create: layer,
            });
        }
        console.log(`✅ Created ${timelineLayers.length} timeline layers`);

        console.log("");
        console.log("🎉 System Infrastructure seeding completed successfully!");
        console.log("");
        console.log("📊 Summary:");
        console.log(`   • ${timelineLayers.length} timeline layers`);
        console.log("");
        console.log("✨ System ready for project-specific content!");

    } catch (error) {
        console.error("❌ Error during system infrastructure seeding:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error("❌ System infrastructure seed process failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
