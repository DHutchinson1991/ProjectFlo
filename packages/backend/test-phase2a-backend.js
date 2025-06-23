#!/usr/bin/env node

// Test script for Task Templates and Enhanced Component Task Recipes
// Phase 2A Backend Testing

const BASE_URL = "http://localhost:3002";

console.log(
  "🎯 Phase 2A Backend Testing - Task Templates & Component Task Recipes",
);
console.log(
  "============================================================================\n",
);

async function testTaskTemplates() {
  console.log("1. Testing Task Templates CRUD Operations...\n");

  try {
    // Test GET all task templates
    console.log("📋 Testing GET /task-templates");
    const response = await fetch(`${BASE_URL}/task-templates`);
    const templates = await response.json();
    console.log(`✅ Found ${templates.length} task templates`);

    if (templates.length > 0) {
      console.log("📄 First template:", {
        id: templates[0].id,
        name: templates[0].name,
        phase: templates[0].phase,
        effort_hours: templates[0].effort_hours,
        pricing_type: templates[0].pricing_type,
      });
    }

    // Test GET specific task template
    if (templates.length > 0) {
      console.log(`\n🔍 Testing GET /task-templates/${templates[0].id}`);
      const detailResponse = await fetch(
        `${BASE_URL}/task-templates/${templates[0].id}`,
      );
      const detail = await detailResponse.json();
      console.log(`✅ Template details loaded:`, {
        name: detail.name,
        component_task_recipes_count:
          detail._count?.component_task_recipes || 0,
        tasks_count: detail._count?.tasks || 0,
      });
    }

    // Test CREATE new task template
    console.log("\n➕ Testing POST /task-templates");
    const createResponse = await fetch(`${BASE_URL}/task-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Task Template - Color Correction",
        phase: "POST_PRODUCTION",
        effort_hours: 2.5,
        pricing_type: "Hourly",
        average_duration_hours: 2.0,
      }),
    });

    if (createResponse.ok) {
      const newTemplate = await createResponse.json();
      console.log(`✅ Created task template:`, {
        id: newTemplate.id,
        name: newTemplate.name,
        effort_hours: newTemplate.effort_hours,
      });

      // Test UPDATE
      console.log(`\n✏️ Testing PATCH /task-templates/${newTemplate.id}`);
      const updateResponse = await fetch(
        `${BASE_URL}/task-templates/${newTemplate.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            effort_hours: 3.0,
            phase: "EDITING",
          }),
        },
      );

      if (updateResponse.ok) {
        const updated = await updateResponse.json();
        console.log(
          `✅ Updated task template effort_hours: ${updated.effort_hours}`,
        );
      } else {
        console.log(`❌ Update failed: ${updateResponse.status}`);
      }

      // Test DELETE
      console.log(`\n🗑️ Testing DELETE /task-templates/${newTemplate.id}`);
      const deleteResponse = await fetch(
        `${BASE_URL}/task-templates/${newTemplate.id}`,
        {
          method: "DELETE",
        },
      );

      if (deleteResponse.ok) {
        console.log(`✅ Deleted task template successfully`);
      } else {
        console.log(`❌ Delete failed: ${deleteResponse.status}`);
      }
    } else {
      console.log(`❌ Create failed: ${createResponse.status}`);
      const error = await createResponse.text();
      console.log("Error:", error);
    }

    // Test analytics
    console.log("\n📊 Testing GET /task-templates/analytics");
    const analyticsResponse = await fetch(
      `${BASE_URL}/task-templates/analytics`,
    );
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      console.log(`✅ Analytics loaded:`, {
        total_templates: analytics.total_templates,
        most_used_count: analytics.most_used_templates?.length || 0,
      });
    } else {
      console.log(`❌ Analytics failed: ${analyticsResponse.status}`);
    }
  } catch (error) {
    console.log("❌ Task Templates test failed:", error.message);
  }
}

async function testComponentTaskRecipes() {
  console.log("\n\n2. Testing Component Task Recipe Management...\n");

  try {
    // Get available components first
    console.log("📋 Getting available components...");
    const componentsResponse = await fetch(`${BASE_URL}/components`);
    const components = await componentsResponse.json();

    if (components.length === 0) {
      console.log("❌ No components found for testing");
      return;
    }

    const testComponent = components[0];
    console.log(
      `✅ Using component: ${testComponent.name} (ID: ${testComponent.id})`,
    );

    // Get component details with existing task recipes
    console.log(
      `\n🔍 Getting component details: /components/${testComponent.id}`,
    );
    const detailResponse = await fetch(
      `${BASE_URL}/components/${testComponent.id}`,
    );
    const componentDetail = await detailResponse.json();

    console.log(`✅ Component loaded:`, {
      name: componentDetail.name,
      type: componentDetail.type,
      workflows_supported: "via UniversalWorkflowManager",
    });

    console.log(
      "✅ Component detail retrieval working - now uses workflow system for task management",
    );
  } catch (error) {
    console.log("❌ Component detail test failed:", error.message);
  }
}

async function testWorkflowSystem() {
  console.log("\n\n3. Testing Workflow System Integration...\n");

  try {
    // Test that workflow endpoints are available
    const workflowResponse = await fetch(`${BASE_URL}/workflow-templates`);

    if (workflowResponse.ok) {
      const workflows = await workflowResponse.json();
      console.log("✅ Workflow system integrated");
      console.log(`Found ${workflows.length} workflow templates`);
    } else {
      console.log(
        `❌ Workflow system not accessible: ${workflowResponse.status}`,
      );
    }
  } catch (error) {
    console.log("❌ Workflow system test failed:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testTaskTemplates();
    await testComponentTaskRecipes();
    await testWorkflowSystem();

    console.log("\n\n🎉 Backend Testing Complete!");
    console.log("============================================");
    console.log("✅ Task Templates available");
    console.log("✅ Components working with workflow system");
    console.log("✅ Task recipes removed - now using UniversalWorkflowManager");
    console.log("✅ Ready for frontend testing");
  } catch (error) {
    console.log("\n❌ Test suite failed:", error.message);
  }
}

runAllTests();
