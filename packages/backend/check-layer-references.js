const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkComponentReferences() {
  try {
    console.log("📦 Checking Media Components by Layer...\n");

    const components = await prisma.mediaComponent.findMany({
      include: {
        timeline_layer: true,
      },
    });

    console.log("Current Media Components by Layer:");
    const layerGroups = {};
    components.forEach((comp) => {
      const layerName = comp.timeline_layer
        ? comp.timeline_layer.name
        : "Unknown";
      if (!layerGroups[layerName]) layerGroups[layerName] = [];
      layerGroups[layerName].push(comp);
    });

    Object.entries(layerGroups).forEach(([layerName, comps]) => {
      console.log(`  ${layerName}: ${comps.length} components`);
      comps.forEach((comp) => {
        console.log(`    - ${comp.name} (${comp.type})`);
      });
    });

    console.log("\n✅ Check completed successfully");
  } catch (error) {
    console.error("❌ Error checking components:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkComponentReferences();
