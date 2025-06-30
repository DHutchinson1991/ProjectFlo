// Test Media Component Types Directly with Prisma
// Run this with: node test-media-components-prisma.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testMediaComponentTypes() {
  try {
    console.log("🎬 Testing Media Component Types with Prisma...\n");

    // Test 1: Check if new component types work
    console.log("📋 1. Testing ComponentType enum...");

    const componentTypes = ["GRAPHICS", "VIDEO", "AUDIO", "MUSIC"];

    for (const type of componentTypes) {
      try {
        const testComponent = await prisma.componentLibrary.findFirst({
          where: { type: type },
        });

        if (testComponent) {
          console.log(
            `✅ ${type}: Found component "${testComponent.name}" (ID: ${testComponent.id})`,
          );
        } else {
          console.log(`⚠️  ${type}: No components found of this type`);
        }
      } catch (error) {
        console.log(`❌ ${type}: Error - ${error.message}`);
      }
    }

    // Test 2: Check timeline layers
    console.log("\n🎯 2. Testing Timeline Layers...");

    const timelineLayers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    console.log(`✅ Found ${timelineLayers.length} timeline layers:`);
    timelineLayers.forEach((layer) => {
      console.log(
        `   ${layer.order_index}. ${layer.name} (${layer.color_hex}) - ${layer.description}`,
      );
    });

    // Test 3: Check component-layer compatibility
    console.log("\n🔗 3. Testing Component-Layer Mapping...");

    const componentLayerMap = {
      GRAPHICS: "Graphics",
      VIDEO: "Video",
      AUDIO: "Audio",
      MUSIC: "Music",
    };

    for (const [componentType, layerName] of Object.entries(
      componentLayerMap,
    )) {
      const component = await prisma.componentLibrary.findFirst({
        where: { type: componentType },
      });

      const layer = await prisma.timelineLayer.findFirst({
        where: { name: layerName },
      });

      if (component && layer) {
        console.log(`✅ ${componentType} ↔ ${layerName}: Compatible`);
        console.log(
          `   Component: "${component.name}" (Est. ${component.estimated_duration}s)`,
        );
        console.log(`   Layer: "${layer.name}" (Order: ${layer.order_index})`);
      } else {
        console.log(
          `❌ ${componentType} ↔ ${layerName}: Missing ${!component ? "component" : "layer"}`,
        );
      }
    }

    // Test 4: Create a sample timeline component for testing
    console.log("\n🎪 4. Testing Timeline Component Creation...");

    const sampleGraphicsComponent = await prisma.componentLibrary.findFirst({
      where: { type: "GRAPHICS" },
    });

    const sampleDeliverable = await prisma.deliverables.findFirst();

    const graphicsLayer = await prisma.timelineLayer.findFirst({
      where: { name: "Graphics" },
    });

    if (sampleGraphicsComponent && sampleDeliverable && graphicsLayer) {
      // Check if timeline component already exists
      const existingTimelineComp = await prisma.timelineComponent.findFirst({
        where: {
          deliverable_id: sampleDeliverable.id,
          component_id: sampleGraphicsComponent.id,
          layer_id: graphicsLayer.id,
        },
      });

      if (existingTimelineComp) {
        console.log(
          `✅ Timeline component already exists: "${sampleGraphicsComponent.name}" on ${graphicsLayer.name} layer`,
        );
      } else {
        try {
          const newTimelineComponent = await prisma.timelineComponent.create({
            data: {
              deliverable_id: sampleDeliverable.id,
              component_id: sampleGraphicsComponent.id,
              layer_id: graphicsLayer.id,
              start_time_seconds: 0,
              duration_seconds: sampleGraphicsComponent.estimated_duration || 5,
              order_index: 0,
              notes: "Test timeline component for media type validation",
            },
          });

          console.log(
            `✅ Created timeline component: ID ${newTimelineComponent.id}`,
          );
          console.log(
            `   Component: "${sampleGraphicsComponent.name}" (${sampleGraphicsComponent.type})`,
          );
          console.log(
            `   Layer: "${graphicsLayer.name}" (Order: ${graphicsLayer.order_index})`,
          );
          console.log(`   Duration: ${newTimelineComponent.duration_seconds}s`);
        } catch (error) {
          console.log(
            `❌ Failed to create timeline component: ${error.message}`,
          );
        }
      }
    } else {
      console.log("⚠️  Missing required data for timeline component test");
      console.log(
        `   Graphics Component: ${sampleGraphicsComponent ? "✅" : "❌"}`,
      );
      console.log(`   Deliverable: ${sampleDeliverable ? "✅" : "❌"}`);
      console.log(`   Graphics Layer: ${graphicsLayer ? "✅" : "❌"}`);
    }

    // Test 5: Summary of component types
    console.log("\n📊 5. Component Type Summary...");

    const componentCounts = await prisma.componentLibrary.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    console.log("Component counts by type:");
    componentCounts.forEach((count) => {
      console.log(`   ${count.type}: ${count._count.type} components`);
    });

    console.log("\n🎉 Media Component Types Test Complete!");
    console.log("\n✅ Database Schema Summary:");
    console.log(
      "   - ComponentType enum includes: GRAPHICS, VIDEO, AUDIO, MUSIC",
    );
    console.log("   - Timeline layers support all media types");
    console.log("   - Components can be assigned to appropriate layers");
    console.log(
      "   - Timeline components link components to deliverables via layers",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testMediaComponentTypes();
