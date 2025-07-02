const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log("🔍 Verifying database state...\n");

    // Check key counts for main tables
    const contacts = await prisma.contacts.count();
    const components = await prisma.components.count();
    const coverage = await prisma.coverage.count();
    const timelineLayers = await prisma.timeline_layers.count();
    const contributors = await prisma.contributors.count();
    const roles = await prisma.roles.count();
    const projects = await prisma.projects.count();

    console.log("📊 Database Statistics:");
    console.log(`   Contacts: ${contacts}`);
    console.log(`   Components: ${components}`);
    console.log(`   Coverage Types: ${coverage}`);
    console.log(`   Timeline Layers: ${timelineLayers}`);
    console.log(`   Contributors: ${contributors}`);
    console.log(`   Roles: ${roles}`);
    console.log(`   Projects: ${projects}\n`);

    // Check for essential data
    if (timelineLayers === 0) {
      console.log("⚠️  Warning: No timeline layers found. Run database seeding.");
    } else {
      console.log("✅ Timeline layers are populated");
    }

    if (components === 0) {
      console.log("⚠️  Warning: No components found. Run database seeding.");
    } else {
      console.log("✅ Components library is populated");
    }

    if (roles === 0) {
      console.log("⚠️  Warning: No roles found. Run database seeding.");
    } else {
      console.log("✅ Roles are configured");
    }

    // Test a simple relationship query
    const firstComponent = await prisma.components.findFirst({
      include: {
        ComponentCoverage: true,
      }
    });

    if (firstComponent) {
      console.log(`✅ Sample component "${firstComponent.name}" retrieved with relations`);
    }

    console.log("\n✅ Database verification completed successfully!");

  } catch (error) {
    console.error("❌ Database verification failed:", error.message);

    if (error.message.includes("connect")) {
      console.log("💡 Hint: Make sure the database is running and accessible");
    }
    if (error.message.includes("does not exist")) {
      console.log("💡 Hint: Run 'npx prisma migrate dev' to create database tables");
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
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
