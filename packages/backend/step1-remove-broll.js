// Step 1: Remove B-Roll layer
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function removeBRoll() {
  try {
    console.log("🎬 Step 1: Removing B-Roll layer...\n");

    // Check for components using B-Roll layer
    console.log("📦 Checking for timeline components using B-Roll layer...");
    const brollTimelineComponents = await prisma.timelineComponent.findMany({
      where: { layer_id: 5 },
      include: {
        component: true,
      },
    });

    if (brollTimelineComponents.length > 0) {
      console.log(
        `⚠️  Found ${brollTimelineComponents.length} timeline components using B-Roll layer:`,
      );
      brollTimelineComponents.forEach((comp) => {
        console.log(`   - ${comp.component.name} (${comp.component.type})`);
      });

      console.log("Moving them to Video layer...");
      await prisma.timelineComponent.updateMany({
        where: { layer_id: 5 },
        data: { layer_id: 1 },
      });
      console.log("✅ Timeline components moved to Video layer");
    } else {
      console.log("✅ No timeline components using B-Roll layer");
    }

    // Delete the B-Roll layer
    console.log("\n🗑️  Removing B-Roll layer...");
    await prisma.timelineLayer.delete({
      where: { id: 5 },
    });
    console.log("✅ B-Roll layer removed");

    // Show remaining layers
    console.log("\n📋 Remaining layers:");
    const layers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    layers.forEach((layer) => {
      console.log(`  ${layer.order_index}: ${layer.name} (ID: ${layer.id})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

removeBRoll();
