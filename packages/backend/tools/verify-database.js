const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log("🔍 Verifying database state...\n");

    // Check key counts for main tables with error handling
    const contacts = await prisma.contacts.count().catch(() => 0);
    const scenes = await prisma.scenesLibrary.count().catch(() => 0);
    const coverage = await prisma.coverage.count().catch(() => 0);
    const timelineLayers = await prisma.timeline_layers.count().catch(() => 0);
    const contributors = await prisma.contributors.count().catch(() => 0);
    const roles = await prisma.roles.count().catch(() => 0);
    const projects = await prisma.projects.count().catch(() => 0);

    // Check calendar tables
    const calendarEvents = await prisma.calendar_events.count().catch(() => 0);
    const tags = await prisma.tags.count().catch(() => 0);
    const calendarSettings = await prisma.calendar_settings.count().catch(() => 0);

    console.log("📊 Database Statistics:");
    console.log(`   Contacts: ${contacts}`);
    console.log(`   Scenes: ${scenes}`);
    console.log(`   Coverage Types: ${coverage}`);
    console.log(`   Timeline Layers: ${timelineLayers}`);
    console.log(`   Contributors: ${contributors}`);
    console.log(`   Roles: ${roles}`);
    console.log(`   Projects: ${projects}`);
    console.log(`   Calendar Events: ${calendarEvents}`);
    console.log(`   Calendar Tags: ${tags}`);
    console.log(`   Calendar Settings: ${calendarSettings}\n`);

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
