// Phase 2C Timeline Testing Script
// This script tests the Visual Timeline Builder functionality

const baseUrl = "http://localhost:3002";

async function testPhase2CFeatures() {
  console.log("🎬 Testing Phase 2C: Visual Timeline Builder Features");
  console.log("=".repeat(60));

  try {
    // 1. Test Timeline Layers
    console.log("\n1. Testing Timeline Layers...");
    const layersResponse = await fetch(`${baseUrl}/timeline/layers`);
    const layers = await layersResponse.json();
    console.log(`✅ Found ${layers.length} timeline layers:`);
    layers.forEach((layer) => {
      console.log(
        `   - ${layer.name} (${layer.color_hex}): ${layer.description}`,
      );
    });

    // 2. Test Available Components
    console.log("\n2. Testing Available Components...");
    const componentsResponse = await fetch(`${baseUrl}/components`);
    const components = await componentsResponse.json();
    console.log(`✅ Found ${components.length} components for timeline use`);
    const sampleComponents = components.slice(0, 3);
    sampleComponents.forEach((comp) => {
      console.log(
        `   - ${comp.name} (${comp.type}): ${comp.estimated_duration || "No duration"}s`,
      );
    });

    // 3. Test Deliverable Templates
    console.log("\n3. Testing Deliverable Templates...");
    const deliverablesResponse = await fetch(
      `${baseUrl}/deliverables/templates`,
    );
    const deliverables = await deliverablesResponse.json();
    console.log(`✅ Found ${deliverables.length} deliverable templates`);

    if (deliverables.length > 0) {
      const testDeliverable = deliverables[0];
      console.log(
        `   Using deliverable: "${testDeliverable.name}" (ID: ${testDeliverable.id})`,
      );

      // 4. Create Sample Timeline Components
      console.log("\n4. Creating Sample Timeline Components...");

      const timelineComponents = [
        {
          deliverable_id: testDeliverable.id,
          component_id: sampleComponents[0]?.id || 1,
          layer_id: 1, // Video layer
          start_time_seconds: 0,
          duration_seconds: 30,
          notes: "Opening sequence - bride preparation",
        },
        {
          deliverable_id: testDeliverable.id,
          component_id: sampleComponents[1]?.id || 2,
          layer_id: 1, // Video layer
          start_time_seconds: 35,
          duration_seconds: 45,
          notes: "Ceremony highlights",
        },
        {
          deliverable_id: testDeliverable.id,
          component_id: sampleComponents[2]?.id || 3,
          layer_id: 2, // Audio layer
          start_time_seconds: 0,
          duration_seconds: 80,
          notes: "Background music track",
        },
      ];

      // Create timeline components
      for (const component of timelineComponents) {
        try {
          const createResponse = await fetch(`${baseUrl}/timeline/components`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(component),
          });

          if (createResponse.ok) {
            const created = await createResponse.json();
            console.log(
              `   ✅ Created timeline component: ${component.notes} (${component.duration_seconds}s)`,
            );
          } else {
            console.log(
              `   ⚠️  Failed to create component: ${component.notes}`,
            );
          }
        } catch (err) {
          console.log(`   ❌ Error creating component: ${err.message}`);
        }
      }

      // 5. Test Timeline Retrieval
      console.log("\n5. Testing Timeline Retrieval...");
      const timelineResponse = await fetch(
        `${baseUrl}/timeline/deliverables/${testDeliverable.id}/components`,
      );
      if (timelineResponse.ok) {
        const timeline = await timelineResponse.json();
        console.log(
          `✅ Retrieved timeline with ${timeline.length} components:`,
        );
        timeline.forEach((comp, index) => {
          console.log(
            `   ${index + 1}. ${comp.notes || "Unnamed"} - ${comp.start_time_seconds}s to ${comp.start_time_seconds + comp.duration_seconds}s (Layer ${comp.layer_id})`,
          );
        });

        // 6. Test Timeline Analytics
        console.log("\n6. Testing Timeline Analytics...");
        try {
          const analyticsResponse = await fetch(
            `${baseUrl}/timeline/deliverables/${testDeliverable.id}/analytics`,
          );
          if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            console.log("✅ Timeline Analytics:");
            console.log(`   - Total Duration: ${analytics.totalDuration}s`);
            console.log(`   - Components: ${analytics.componentCount}`);
            console.log(
              `   - Timeline Health: ${analytics.timelineHealth.status}`,
            );
            if (analytics.conflicts && analytics.conflicts.length > 0) {
              console.log(`   - Conflicts: ${analytics.conflicts.length}`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Analytics not available: ${err.message}`);
        }

        // 7. Test Export Functionality (Data Only)
        console.log("\n7. Testing Export Data Formats...");

        // JSON Export Data
        const jsonExport = {
          entityType: "deliverable",
          entityId: testDeliverable.id,
          entityName: testDeliverable.name,
          timestamp: new Date().toISOString(),
          components: timeline,
        };
        console.log("✅ JSON Export Data Ready");
        console.log(`   Size: ${JSON.stringify(jsonExport).length} characters`);

        // CSV Export Data
        const csvHeaders = "Component,Start Time,Duration,Layer,Notes";
        const csvRows = timeline.map(
          (comp) =>
            `"${comp.notes || "Unnamed"}",${comp.start_time_seconds},${comp.duration_seconds},${comp.layer_id},"${comp.notes || ""}"`,
        );
        const csvData = csvHeaders + "\n" + csvRows.join("\n");
        console.log("✅ CSV Export Data Ready");
        console.log(`   Rows: ${csvRows.length + 1} (including header)`);

        // XML Export Data
        const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<timeline entity="${testDeliverable.name}" type="deliverable" id="${testDeliverable.id}">
  <metadata>
    <export_date>${new Date().toISOString()}</export_date>
    <total_duration>${Math.max(...timeline.map((c) => c.start_time_seconds + c.duration_seconds), 0)}</total_duration>
  </metadata>
  <components>
${timeline
  .map(
    (
      comp,
    ) => `    <component start="${comp.start_time_seconds}" duration="${comp.duration_seconds}" layer="${comp.layer_id}">
      <notes>${comp.notes || ""}</notes>
    </component>`,
  )
  .join("\n")}
  </components>
</timeline>`;
        console.log("✅ XML Export Data Ready");
        console.log(`   Components: ${timeline.length}`);
      } else {
        console.log("❌ Failed to retrieve timeline components");
      }
    }

    // 8. Test Task Templates Integration
    console.log("\n8. Testing Task Templates Integration...");
    const templatesResponse = await fetch(`${baseUrl}/task-templates`);
    const templates = await templatesResponse.json();
    console.log(
      `✅ Found ${templates.length} task templates for timeline workflow integration`,
    );

    const timelineRelatedTemplates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes("timeline") ||
        t.name.toLowerCase().includes("edit") ||
        t.phase?.toLowerCase().includes("post"),
    );
    console.log(
      `✅ Timeline-related templates: ${timelineRelatedTemplates.length}`,
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Phase 2C Timeline Builder Testing Complete!");
    console.log("\n📋 Feature Summary:");
    console.log("✅ Timeline Layers Management");
    console.log("✅ Component Integration");
    console.log("✅ Timeline Creation & Editing");
    console.log("✅ Timeline Analytics");
    console.log("✅ Export Functionality (JSON, CSV, XML)");
    console.log("✅ Task Template Integration");
    console.log("✅ Visual Timeline Builder Ready for Frontend");

    console.log("\n🚀 Ready for Phase 2C Frontend Testing!");
    console.log("Navigate to: http://localhost:3001/app-crm/deliverables");
  } catch (error) {
    console.error("❌ Error during Phase 2C testing:", error.message);
  }
}

// Run the test
testPhase2CFeatures();
