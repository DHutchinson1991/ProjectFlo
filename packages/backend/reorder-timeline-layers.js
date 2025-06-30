// Reorder Timeline Layers and Remove B-Roll
// This script will:
// 1. Remove the B-Roll layer (ID: 5)
// 2. Reorder remaining layers to match frontend: Graphics (1), Video (2), Audio (3), Music (4)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function reorderTimelineLayers() {
  try {
    console.log("🎬 Reordering Timeline Layers...\n");

    // First, check if any components reference the B-Roll layer
    console.log("📦 Checking for components using B-Roll layer...");
    const brollComponents = await prisma.mediaComponent.findMany({
      where: { timeline_layer_id: 5 },
    });

    if (brollComponents.length > 0) {
      console.log(
        `⚠️  Found ${brollComponents.length} components using B-Roll layer. Moving them to Video layer...`,
      );
      // Move B-Roll components to Video layer
      await prisma.mediaComponent.updateMany({
        where: { timeline_layer_id: 5 },
        data: { timeline_layer_id: 1 }, // Video layer
      });
    } else {
      console.log("✅ No components using B-Roll layer");
    }

    // Delete the B-Roll layer
    console.log("🗑️  Removing B-Roll layer...");
    await prisma.timelineLayer.delete({
      where: { id: 5 },
    });

    // Now reorder the remaining layers to match frontend expectations:
    // Frontend expects: Graphics (1), Video (2), Audio (3), Music (4)
    // Current backend has: Video (1), Audio (2), Music (3), Graphics (4)

    console.log("🔄 Reordering timeline layers...");

    // Update in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Set temporary order_index values to avoid conflicts
      await tx.timelineLayer.update({
        where: { id: 1 }, // Video
        data: { order_index: 102 },
      });

      await tx.timelineLayer.update({
        where: { id: 2 }, // Audio
        data: { order_index: 103 },
      });

      await tx.timelineLayer.update({
        where: { id: 3 }, // Music
        data: { order_index: 104 },
      });

      await tx.timelineLayer.update({
        where: { id: 4 }, // Graphics
        data: { order_index: 101 },
      });

      // Now set the final order_index values
      await tx.timelineLayer.update({
        where: { id: 4 }, // Graphics -> position 1
        data: { order_index: 1 },
      });

      await tx.timelineLayer.update({
        where: { id: 1 }, // Video -> position 2
        data: { order_index: 2 },
      });

      await tx.timelineLayer.update({
        where: { id: 2 }, // Audio -> position 3
        data: { order_index: 3 },
      });

      await tx.timelineLayer.update({
        where: { id: 3 }, // Music -> position 4
        data: { order_index: 4 },
      });
    });

    // Verify the new order
    console.log("\n📋 New Timeline Layer Order:");
    const layers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    layers.forEach((layer) => {
      console.log(
        `  ${layer.order_index}: ${layer.name} (ID: ${layer.id}) - ${layer.color_hex}`,
      );
    });

    console.log("\n✅ Timeline layers reordered successfully!");
    console.log("Frontend and backend layer order now match:");
    console.log("  1: Graphics");
    console.log("  2: Video");
    console.log("  3: Audio");
    console.log("  4: Music");
  } catch (error) {
    console.error("❌ Error reordering timeline layers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reorderTimelineLayers();
