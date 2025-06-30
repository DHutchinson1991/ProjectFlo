// Step 2: Reorder remaining layers to match frontend
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function reorderLayers() {
  try {
    console.log("🎬 Step 2: Reordering timeline layers...\n");

    console.log("📋 Current layer order:");
    const currentLayers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    currentLayers.forEach((layer) => {
      console.log(`  ${layer.order_index}: ${layer.name} (ID: ${layer.id})`);
    });

    // Target order: Graphics (1), Video (2), Audio (3), Music (4)
    // Current order: Video (1), Audio (2), Music (3), Graphics (4)
    // Need to rearrange to: Graphics (4->1), Video (1->2), Audio (2->3), Music (3->4)

    console.log("\n🔄 Reordering to match frontend expectations...");
    console.log("Target order: Graphics (1), Video (2), Audio (3), Music (4)");

    // Update in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // First, set temporary order_index values to avoid conflicts
      console.log("Setting temporary order values...");

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

      console.log("Setting final order values...");

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
    const newLayers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    newLayers.forEach((layer) => {
      console.log(
        `  ${layer.order_index}: ${layer.name} (ID: ${layer.id}) - ${layer.color_hex}`,
      );
    });

    console.log("\n✅ Timeline layers reordered successfully!");
    console.log("📍 Frontend and backend layer order now match:");
    console.log("  1: Graphics (ID: 4)");
    console.log("  2: Video (ID: 1)");
    console.log("  3: Audio (ID: 2)");
    console.log("  4: Music (ID: 3)");
  } catch (error) {
    console.error("❌ Error reordering layers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reorderLayers();
