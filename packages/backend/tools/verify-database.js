const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log("🔍 Verifying database state...\n");

    // Check key counts for main tables
    const contacts = await prisma.contacts.count();
    const scenes = await prisma.scenesLibrary.count();
    const coverage = await prisma.coverage.count();
    const timelineLayers = await prisma.timeline_layers.count();
    const contributors = await prisma.contributors.count();
    const roles = await prisma.roles.count();
    const projects = await prisma.projects.count();

    console.log("📊 Database Statistics:");
    console.log(`   Contacts: ${contacts}`);
    console.log(`   Scenes: ${scenes}`);
    console.log(`   Coverage Types: ${coverage}`);
    console.log(`   Timeline Layers: ${timelineLayers}`);
    console.log(`   Contributors: ${contributors}`);
    console.log(`   Roles: ${roles}`);
    console.log(`   Projects: ${projects}\n`);

    // Check for essential data
    if (timelineLayers === 0) {
      console.log(
        "⚠️  Warning: No timeline layers found. Run database seeding.",
      );
    } else {
      console.log("✅ Timeline layers are populated");
    }

    if (scenes === 0) {
      console.log("⚠️  Warning: No scenes found. Run database seeding.");
    } else {
      console.log("✅ Scenes library is populated");
    }

    if (roles === 0) {
      console.log("⚠️  Warning: No roles found. Run database seeding.");
    } else {
      console.log("✅ Roles are configured");
    }

    // Test a simple relationship query
    const firstScene = await prisma.scenesLibrary.findFirst({
      include: {
        music_options: true,
      },
    });

    if (firstScene) {
      console.log(
        `✅ Sample scene "${firstScene.name}" retrieved with relations`,
      );
    }

    console.log("\n✅ Database verification completed successfully!");
  } catch (error) {
    console.error("❌ Database verification failed:", error.message);

    if (error.message.includes("connect")) {
      console.log("💡 Hint: Make sure the database is running and accessible");
    }
    if (error.message.includes("does not exist")) {
      console.log(
        "💡 Hint: Run 'npx prisma migrate dev' to create database tables",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
