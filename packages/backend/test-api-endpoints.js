const fetch = require("node-fetch");

async function testWorkflowAPI() {
  console.log("🔍 Testing Workflow API Endpoints...\n");

  try {
    // Test workflow templates endpoint
    console.log("Testing GET /workflows/templates...");
    const templatesResponse = await fetch(
      "http://localhost:3002/workflows/templates",
    );

    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log(`✅ Found ${templates.length} workflow templates`);

      if (templates.length > 0) {
        console.log(`   First template: "${templates[0].name}"`);

        // Test getting specific template with stages
        const templateId = templates[0].id;
        console.log(`\nTesting GET /workflows/templates/${templateId}...`);

        const templateResponse = await fetch(
          `http://localhost:3002/workflows/templates/${templateId}`,
        );
        if (templateResponse.ok) {
          const template = await templateResponse.json();
          console.log(`✅ Template details retrieved: "${template.name}"`);
          console.log(
            `   Stages: ${template.stages ? template.stages.length : 0}`,
          );
        } else {
          console.log(
            `❌ Failed to get template details: ${templateResponse.status}`,
          );
        }
      }
    } else {
      console.log(`❌ Failed to get templates: ${templatesResponse.status}`);
    }

    // Test components endpoint
    console.log("\nTesting GET /components...");
    const componentsResponse = await fetch("http://localhost:3002/components");

    if (componentsResponse.ok) {
      const components = await componentsResponse.json();
      console.log(`✅ Found ${components.length} components`);
    } else {
      console.log(`❌ Failed to get components: ${componentsResponse.status}`);
    }

    // Test deliverables endpoint
    console.log("\nTesting GET /deliverables/templates...");
    const deliverablesResponse = await fetch(
      "http://localhost:3002/deliverables/templates",
    );

    if (deliverablesResponse.ok) {
      const deliverables = await deliverablesResponse.json();
      console.log(`✅ Found ${deliverables.length} deliverable templates`);
    } else {
      console.log(
        `❌ Failed to get deliverables: ${deliverablesResponse.status}`,
      );
    }

    console.log("\n✅ API testing complete!");
  } catch (error) {
    console.error("❌ API testing failed:", error.message);
  }
}

testWorkflowAPI();
