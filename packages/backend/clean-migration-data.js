const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanMigrationData() {
  try {
    console.log("🧹 Cleaning up previous migration data...\n");

    // Remove any workflow templates that were created by migration
    const migratedTemplates = await prisma.workflow_templates.findMany({
      where: {
        OR: [
          { name: { contains: "Tasks (ID:" } },
          { name: { contains: "Tasks (DELIVERABLE:" } },
          { name: { contains: "Tasks (COVERAGE_SCENE:" } },
          { name: { contains: "Tasks (EDITING_STYLE:" } },
        ],
      },
    });

    console.log(
      `Found ${migratedTemplates.length} migration workflow templates to remove`,
    );

    for (const template of migratedTemplates) {
      await prisma.workflow_templates.delete({
        where: { id: template.id },
      });
      console.log(`✅ Removed workflow template: "${template.name}"`);
    }

    // Clear workflow_template_id from entities
    await prisma.component_library.updateMany({
      data: { workflow_template_id: null },
    });

    await prisma.deliverable_templates.updateMany({
      data: { workflow_template_id: null },
    });

    await prisma.coverage_scenes.updateMany({
      data: { workflow_template_id: null },
    });

    await prisma.editing_styles.updateMany({
      data: { workflow_template_id: null },
    });

    console.log("\n✅ Cleanup completed!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanMigrationData();
