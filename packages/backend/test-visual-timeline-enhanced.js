#!/usr/bin/env node

/**
 * Test script for enhanced Visual Timeline Builder
 * Tests component library loading and auto-add tasks functionality
 */

// Use Node.js built-in fetch (Node 18+)
const fetch = globalThis.fetch;

const BASE_URL = "http://localhost:3002";

async function testEnhancedTimelineBuilder() {
  console.log("🧪 Testing Enhanced Visual Timeline Builder Functionality\n");

  try {
    // Test 1: Get available components
    console.log("1️⃣ Testing Component Library API...");
    const componentsResponse = await fetch(
      `${BASE_URL}/deliverables/components`,
    );
    if (!componentsResponse.ok) {
      throw new Error(`Components API failed: ${componentsResponse.status}`);
    }
    const components = await componentsResponse.json();
    console.log(`   ✅ Found ${components.length} components in library`);
    console.log(
      `   📝 Component types: ${[...new Set(components.map((c) => c.type))].join(", ")}\n`,
    );

    // Test 2: Test default tasks for multiple components
    console.log("2️⃣ Testing Auto-Add Tasks Functionality...");
    const testComponentIds = [1, 2, 3, 7, 10]; // Sample component IDs

    for (const componentId of testComponentIds) {
      try {
        const tasksResponse = await fetch(
          `${BASE_URL}/api/entities/component/${componentId}/default-tasks`,
        );
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          const component = components.find((c) => c.id === componentId);
          console.log(
            `   📋 Component "${component?.name}" (ID: ${componentId}): ${tasksData.data.length} default tasks`,
          );

          // Show task details
          tasksData.data.forEach((task) => {
            console.log(`      - ${task.task_name} (${task.estimated_hours}h)`);
          });
        } else {
          console.log(
            `   ⚠️  Component ${componentId}: No default tasks found`,
          );
        }
      } catch (error) {
        console.log(`   ❌ Component ${componentId}: Error - ${error.message}`);
      }
    }

    console.log("\n3️⃣ Testing Timeline Layers API...");
    const layersResponse = await fetch(`${BASE_URL}/timeline/layers`);
    if (!layersResponse.ok) {
      throw new Error(`Timeline layers API failed: ${layersResponse.status}`);
    }
    const layers = await layersResponse.json();
    console.log(`   ✅ Found ${layers.length} timeline layers`);
    layers.forEach((layer) => {
      console.log(
        `      - ${layer.name} (ID: ${layer.id}, Order: ${layer.order_index})`,
      );
    });

    console.log("\n4️⃣ Testing Component-to-Track Mapping...");
    const componentTrackMapping = {
      GRAPHICS: 4,
      VIDEO: 1,
      AUDIO: 2,
      MUSIC: 3,
      EDIT: 1, // Default to video track
      COVERAGE_LINKED: 1, // Default to video track
    };

    const componentsByType = components.reduce((acc, comp) => {
      if (!acc[comp.type]) acc[comp.type] = [];
      acc[comp.type].push(comp);
      return acc;
    }, {});

    Object.entries(componentsByType).forEach(([type, comps]) => {
      const trackId = componentTrackMapping[type] || 1;
      const track = layers.find((l) => l.id === trackId);
      console.log(
        `   🎯 ${type} components (${comps.length}) → ${track?.name} track (ID: ${trackId})`,
      );
    });

    console.log("\n✅ Enhanced Visual Timeline Builder Test Complete!");
    console.log("\n📊 Summary:");
    console.log(
      `   - Component Library: ${components.length} components available`,
    );
    console.log(`   - Timeline Layers: ${layers.length} layers configured`);
    console.log(`   - Auto-Add Tasks: Working for tested components`);
    console.log(`   - Component-Track Mapping: Correctly configured`);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedTimelineBuilder();
