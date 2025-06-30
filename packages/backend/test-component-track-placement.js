// Test Component Track Placement
// Run this with: node test-component-track-placement.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testComponentTrackPlacement() {
  try {
    console.log("🎯 Testing Component Track Placement Logic...\n");

    // Test 1: Verify track-component type mapping
    console.log("📋 1. Testing Track-Component Type Mapping...");

    const expectedMappings = {
      GRAPHICS: "Graphics",
      VIDEO: "Video",
      AUDIO: "Audio",
      MUSIC: "Music",
    };

    let allMappingsCorrect = true;

    for (const [componentType, expectedLayerName] of Object.entries(
      expectedMappings,
    )) {
      const component = await prisma.componentLibrary.findFirst({
        where: { type: componentType },
      });

      const layer = await prisma.timelineLayer.findFirst({
        where: { name: expectedLayerName },
      });

      if (component && layer) {
        console.log(
          `✅ ${componentType} → ${expectedLayerName} layer: Mapping valid`,
        );
      } else {
        console.log(
          `❌ ${componentType} → ${expectedLayerName} layer: Missing ${!component ? "component" : "layer"}`,
        );
        allMappingsCorrect = false;
      }
    }

    // Test 2: Check existing timeline components for correct placement
    console.log("\n🔍 2. Checking Existing Timeline Component Placements...");

    const timelineComponents = await prisma.timelineComponent.findMany({
      include: {
        component: true,
        layer: true,
      },
    });

    if (timelineComponents.length === 0) {
      console.log("⚠️  No timeline components found to test");
    } else {
      let correctPlacements = 0;
      let totalComponents = timelineComponents.length;

      for (const tc of timelineComponents) {
        const expectedLayerName = expectedMappings[tc.component.type];
        const actualLayerName = tc.layer.name;
        const isCorrect = expectedLayerName === actualLayerName;

        console.log(
          `${isCorrect ? "✅" : "❌"} ${tc.component.name} (${tc.component.type}): ${actualLayerName} layer ${isCorrect ? "✓" : `should be ${expectedLayerName}`}`,
        );

        if (isCorrect) correctPlacements++;
      }

      console.log(
        `\n📊 Placement Summary: ${correctPlacements}/${totalComponents} components correctly placed`,
      );
    }

    // Test 3: Create test timeline components for each type
    console.log("\n🎪 3. Testing Component Placement Creation...");

    const deliverable = await prisma.deliverables.findFirst();
    if (!deliverable) {
      console.log("❌ No deliverable found for testing");
      return;
    }

    const testPlacements = [];

    for (const [componentType, layerName] of Object.entries(expectedMappings)) {
      const component = await prisma.componentLibrary.findFirst({
        where: { type: componentType },
      });

      const layer = await prisma.timelineLayer.findFirst({
        where: { name: layerName },
      });

      if (component && layer) {
        // Check if test component already exists
        const existingTest = await prisma.timelineComponent.findFirst({
          where: {
            deliverable_id: deliverable.id,
            component_id: component.id,
            layer_id: layer.id,
            notes: "Test placement validation",
          },
        });

        if (existingTest) {
          console.log(
            `✅ Test ${componentType} component already exists on ${layerName} layer`,
          );
          testPlacements.push({
            type: componentType,
            layer: layerName,
            status: "existing",
            correct: true,
          });
        } else {
          try {
            const testComponent = await prisma.timelineComponent.create({
              data: {
                deliverable_id: deliverable.id,
                component_id: component.id,
                layer_id: layer.id,
                start_time_seconds: Math.floor(Math.random() * 100), // Random start time
                duration_seconds: component.estimated_duration || 10,
                order_index: 0,
                notes: "Test placement validation",
              },
            });

            console.log(
              `✅ Created test ${componentType} component on ${layerName} layer`,
            );
            testPlacements.push({
              type: componentType,
              layer: layerName,
              status: "created",
              correct: true,
              id: testComponent.id,
            });
          } catch (error) {
            console.log(
              `❌ Failed to create test ${componentType} component: ${error.message}`,
            );
            testPlacements.push({
              type: componentType,
              layer: layerName,
              status: "failed",
              correct: false,
            });
          }
        }
      }
    }

    // Test 4: Validate frontend track assignment logic
    console.log("\n🎨 4. Frontend Track Assignment Logic...");

    const frontendTrackMapping = {
      graphics: 1,
      video: 2,
      audio: 3,
      music: 4,
    };

    console.log("Frontend track ID mapping:");
    Object.entries(frontendTrackMapping).forEach(([type, trackId]) => {
      console.log(`  ${type} → Track ID ${trackId}`);
    });

    // Verify this matches database layer order
    const layers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    console.log("\nDatabase layer order:");
    layers.forEach((layer, index) => {
      const frontendType = layer.name.toLowerCase();
      const expectedTrackId = frontendTrackMapping[frontendType];
      const matches = expectedTrackId === index + 1;
      console.log(
        `  ${layer.order_index}. ${layer.name} → ${matches ? "✅" : "❌"} Frontend expects track ${expectedTrackId || "N/A"}`,
      );
    });

    console.log("\n🎯 Component Track Placement Test Complete!");

    // Summary
    const summary = {
      trackMappingValid: allMappingsCorrect,
      testPlacementsCreated: testPlacements.filter(
        (p) => p.status === "created",
      ).length,
      testPlacementsExisting: testPlacements.filter(
        (p) => p.status === "existing",
      ).length,
      testPlacementsFailed: testPlacements.filter((p) => p.status === "failed")
        .length,
    };

    console.log("\n📊 Final Summary:");
    console.log(
      `   Track Mappings: ${summary.trackMappingValid ? "✅ Valid" : "❌ Invalid"}`,
    );
    console.log(`   Test Placements Created: ${summary.testPlacementsCreated}`);
    console.log(
      `   Test Placements Existing: ${summary.testPlacementsExisting}`,
    );
    console.log(`   Test Placements Failed: ${summary.testPlacementsFailed}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testComponentTrackPlacement();
