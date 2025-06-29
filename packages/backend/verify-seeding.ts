import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySeeding() {
  console.log("🔍 Verifying database seeding...\n");

  try {
    // Basic counts
    const [
      contactCount,
      componentCount,
      deliverableCount,
      workflowCount,
      taskCount,
    ] = await Promise.all([
      prisma.contacts.count(),
      prisma.componentLibrary.count(),
      prisma.deliverables.count(),
      prisma.workflow_templates.count(),
      prisma.tasks.count(),
    ]);

    console.log("📊 Database Statistics:");
    console.log(`   📞 Contacts: ${contactCount}`);
    console.log(`   🧩 Components: ${componentCount}`);
    console.log(`   📦 Deliverables: ${deliverableCount}`);
    console.log(`   🔄 Workflows: ${workflowCount}`);
    console.log(`   ✅ Tasks: ${taskCount}\n`);

    // Check for workflow integration
    const workflowWithRelations = await prisma.workflow_templates.findFirst({
      include: {
        stages: true,
        deliverables: true,
        components: true,
      },
    });

    if (workflowWithRelations) {
      console.log("✅ Workflow Integration Found:");
      console.log(`   Name: "${workflowWithRelations.name}"`);
      console.log(`   Stages: ${workflowWithRelations.stages.length}`);
      console.log(
        `   Connected Deliverables: ${workflowWithRelations.deliverables.length}`,
      );
      console.log(
        `   Connected Components: ${workflowWithRelations.components.length}\n`,
      );
    }

    // Check sample data
    const sampleComponent = await prisma.componentLibrary.findFirst({
      include: {
        workflow_template: {
          include: {
            stages: true,
          },
        },
      },
    });

    if (sampleComponent) {
      console.log("🧩 Sample Component:");
      console.log(`   Name: "${sampleComponent.name}"`);
      console.log(`   Type: ${sampleComponent.type}`);
      console.log(`   Complexity: ${sampleComponent.complexity_score}/5`);
      console.log(
        `   Estimated Duration: ${sampleComponent.estimated_duration}min`,
      );
      if (sampleComponent.workflow_template) {
        console.log(
          `   Workflow: "${sampleComponent.workflow_template.name}" (${sampleComponent.workflow_template.stages.length} stages)`,
        );
      }
    }

    console.log("\n🎉 Database seeding verification complete!");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeeding();
