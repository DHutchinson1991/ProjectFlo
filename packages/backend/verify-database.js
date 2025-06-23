const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log("🔍 Verifying database state...\n");

    // Check key counts
    const contacts = await prisma.contacts.count();
    const components = await prisma.component_library.count();
    const deliverables = await prisma.deliverable_templates.count();
    const workflowTemplates = await prisma.workflow_templates.count();
    const workflowStages = await prisma.workflow_stages.count();
    const taskGenerationRules = await prisma.task_generation_rules.count();
    const projects = await prisma.projects.count();
    const tasks = await prisma.tasks.count();

    console.log("📊 Database Statistics:");
    console.log(`   Contacts: ${contacts}`);
    console.log(`   Components: ${components}`);
    console.log(`   Deliverables: ${deliverables}`);
    console.log(`   Workflow Templates: ${workflowTemplates}`);
    console.log(`   Workflow Stages: ${workflowStages}`);
    console.log(`   Task Generation Rules: ${taskGenerationRules}`);
    console.log(`   Projects: ${projects}`);
    console.log(`   Tasks: ${tasks}\n`);

    // Check workflow relationships
    const workflowWithStages = await prisma.workflow_templates.findFirst({
      include: {
        stages: true,
        deliverable_templates: true,
        component_library: true,
      },
    });

    if (workflowWithStages) {
      console.log("✅ Workflow Integration Verified:");
      console.log(`   Template: "${workflowWithStages.name}"`);
      console.log(`   Stages: ${workflowWithStages.stages.length}`);
      console.log(
        `   Connected Deliverables: ${workflowWithStages.deliverable_templates.length}`,
      );
      console.log(
        `   Connected Components: ${workflowWithStages.component_library.length}\n`,
      );
    }

    // Check component types
    const componentTypes = await prisma.component_library.groupBy({
      by: ["type"],
      _count: true,
    });

    console.log("🔧 Component Types:");
    componentTypes.forEach(({ type, _count }) => {
      console.log(`   ${type}: ${_count}`);
    });

    console.log("\n✅ Database verification complete!");
  } catch (error) {
    console.error("❌ Database verification failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
