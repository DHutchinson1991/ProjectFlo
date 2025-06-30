// Test Backend Integration with Media Component Types
// Run this with: node test-media-timeline-integration.js

// Use Node.js built-in fetch (Node 18+) or require the polyfill
const fetch = globalThis.fetch || require("node-fetch");

const BASE_URL = "http://localhost:3002";

async function testMediaTimelineIntegration() {
  console.log("🎬 Testing Media Timeline Integration...\n");

  try {
    // Test 1: Check timeline layers
    console.log("📋 1. Testing Timeline Layers...");
    const layersResponse = await fetch(`${BASE_URL}/timeline/layers`);
    if (layersResponse.ok) {
      const layers = await layersResponse.json();
      console.log(`✅ Found ${layers.length} timeline layers:`);
      layers.forEach((layer) => {
        console.log(
          `   - ${layer.name} (${layer.color_hex}) - Order: ${layer.order_index}`,
        );
      });
    } else {
      console.log("❌ Failed to fetch timeline layers");
    }

    // Test 2: Check media components
    console.log("\n🎯 2. Testing Media Components...");
    const componentsResponse = await fetch(`${BASE_URL}/components`);
    if (componentsResponse.ok) {
      const components = await componentsResponse.json();
      const mediaComponents = components.filter((c) =>
        ["GRAPHICS", "VIDEO", "AUDIO", "MUSIC"].includes(c.type),
      );

      console.log(`✅ Found ${mediaComponents.length} media components:`);

      // Group by type
      const byType = mediaComponents.reduce((acc, comp) => {
        acc[comp.type] = acc[comp.type] || [];
        acc[comp.type].push(comp);
        return acc;
      }, {});

      ["GRAPHICS", "VIDEO", "AUDIO", "MUSIC"].forEach((type) => {
        if (byType[type]) {
          console.log(`   ${type}: ${byType[type].length} components`);
          byType[type].slice(0, 2).forEach((comp) => {
            const duration = comp.estimated_duration
              ? `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, "0")}`
              : "N/A";
            console.log(`     - ${comp.name} (${duration})`);
          });
        }
      });
    } else {
      console.log("❌ Failed to fetch components");
    }

    // Test 3: Create sample timeline for testing
    console.log("\n🎪 3. Testing Timeline Component Creation...");

    // First, get a deliverable to test with
    const deliverablesResponse = await fetch(`${BASE_URL}/deliverables`);
    if (!deliverablesResponse.ok) {
      console.log("❌ Failed to fetch deliverables");
      return;
    }

    const deliverables = await deliverablesResponse.json();
    if (deliverables.length === 0) {
      console.log("⚠️  No deliverables found to test with");
      return;
    }

    const testDeliverable = deliverables[0];
    console.log(
      `✅ Using deliverable: ${testDeliverable.name} (ID: ${testDeliverable.id})`,
    );

    // Get sample media components
    const graphicsComp = mediaComponents.find((c) => c.type === "GRAPHICS");
    const videoComp = mediaComponents.find((c) => c.type === "VIDEO");
    const audioComp = mediaComponents.find((c) => c.type === "AUDIO");
    const musicComp = mediaComponents.find((c) => c.type === "MUSIC");

    if (!graphicsComp || !videoComp || !audioComp || !musicComp) {
      console.log("⚠️  Missing some media component types for testing");
      return;
    }

    // Get timeline layers
    const layersForTest = await fetch(`${BASE_URL}/timeline/layers`).then((r) =>
      r.json(),
    );
    const graphicsLayer = layersForTest.find((l) => l.name === "Graphics");
    const videoLayer = layersForTest.find((l) => l.name === "Video");
    const audioLayer = layersForTest.find((l) => l.name === "Audio");
    const musicLayer = layersForTest.find((l) => l.name === "Music");

    // Test creating timeline components
    const testTimelineComponents = [
      {
        deliverable_id: testDeliverable.id,
        component_id: graphicsComp.id,
        layer_id: graphicsLayer.id,
        start_time_seconds: 0,
        duration_seconds: 5,
        notes: "Test graphics component",
      },
      {
        deliverable_id: testDeliverable.id,
        component_id: videoComp.id,
        layer_id: videoLayer.id,
        start_time_seconds: 0,
        duration_seconds: 30,
        notes: "Test video component",
      },
      {
        deliverable_id: testDeliverable.id,
        component_id: audioComp.id,
        layer_id: audioLayer.id,
        start_time_seconds: 0,
        duration_seconds: 30,
        notes: "Test audio component",
      },
      {
        deliverable_id: testDeliverable.id,
        component_id: musicComp.id,
        layer_id: musicLayer.id,
        start_time_seconds: 30,
        duration_seconds: 60,
        notes: "Test music component",
      },
    ];

    console.log("🔨 Creating test timeline components...");
    for (const timelineComp of testTimelineComponents) {
      try {
        const createResponse = await fetch(`${BASE_URL}/timeline/components`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(timelineComp),
        });

        if (createResponse.ok) {
          const created = await createResponse.json();
          console.log(
            `✅ Created timeline component: ${created.component.name} on ${layersForTest.find((l) => l.id === created.layer_id).name} layer`,
          );
        } else {
          const error = await createResponse.text();
          console.log(`❌ Failed to create timeline component: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating timeline component: ${error.message}`);
      }
    }

    // Test 4: Retrieve timeline for deliverable
    console.log("\n📺 4. Testing Timeline Retrieval...");
    const timelineResponse = await fetch(
      `${BASE_URL}/timeline/deliverables/${testDeliverable.id}/components`,
    );
    if (timelineResponse.ok) {
      const timelineComponents = await timelineResponse.json();
      console.log(
        `✅ Retrieved ${timelineComponents.length} timeline components:`,
      );

      timelineComponents.forEach((tc) => {
        const layerName =
          layersForTest.find((l) => l.id === tc.layer_id)?.name || "Unknown";
        const duration = `${Math.floor(tc.duration_seconds / 60)}:${(tc.duration_seconds % 60).toString().padStart(2, "0")}`;
        console.log(
          `   - ${tc.component.name} (${tc.component.type}) on ${layerName} layer - ${duration} @ ${tc.start_time_seconds}s`,
        );
      });
    } else {
      console.log("❌ Failed to retrieve timeline components");
    }

    console.log("\n🎉 Media Timeline Integration Test Complete!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testMediaTimelineIntegration();
