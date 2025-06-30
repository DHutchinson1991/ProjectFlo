// Seed Timeline Layers for Component Types
// Run this with: node seed-timeline-layers.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedTimelineLayers() {
  try {
    console.log("🎬 Seeding Timeline Layers...\n");

    // Define timeline layers that match our component types
    const timelineLayers = [
      {
        name: "Graphics",
        order_index: 0,
        color_hex: "#f57c00", // Orange
        description: "Graphics overlays, titles, and visual elements",
        is_active: true,
      },
      {
        name: "Video",
        order_index: 1,
        color_hex: "#1976d2", // Blue
        description: "Main video footage and edits",
        is_active: true,
      },
      {
        name: "Audio",
        order_index: 2,
        color_hex: "#388e3c", // Green
        description: "Dialogue, narration, and ambient audio",
        is_active: true,
      },
      {
        name: "Music",
        order_index: 3,
        color_hex: "#7b1fa2", // Purple
        description: "Background music and sound tracks",
        is_active: true,
      },
    ];

    // Insert timeline layers
    for (const layer of timelineLayers) {
      const existingLayer = await prisma.timelineLayer.findUnique({
        where: { name: layer.name },
      });

      if (existingLayer) {
        console.log(`✓ Timeline layer "${layer.name}" already exists`);
        continue;
      }

      const createdLayer = await prisma.timelineLayer.create({
        data: layer,
      });

      console.log(
        `✅ Created timeline layer: ${createdLayer.name} (ID: ${createdLayer.id})`,
      );
    }

    console.log("\n🎯 Timeline layers seeded successfully!\n");

    // Show current layers
    const allLayers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    console.log("Current Timeline Layers:");
    allLayers.forEach((layer) => {
      console.log(
        `  ${layer.order_index + 1}. ${layer.name} (${layer.color_hex}) - ${layer.description}`,
      );
    });
  } catch (error) {
    console.error("❌ Error seeding timeline layers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTimelineLayers();
