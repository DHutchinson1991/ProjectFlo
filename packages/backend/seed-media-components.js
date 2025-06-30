// Seed Sample Components with Media Types
// Run this with: node seed-media-components.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedMediaComponents() {
  try {
    console.log("🎬 Seeding Media Components for Timeline...\n");

    // Define sample components for each media type
    const mediaComponents = [
      // Graphics Components
      {
        name: "Wedding Title Card",
        description: "Opening title with couple names and date",
        type: "GRAPHICS",
        estimated_duration: 5,
        complexity_score: 3,
        base_task_hours: 1.5,
      },
      {
        name: "Lower Third - Couple Names",
        description: "Lower third graphics for couple introduction",
        type: "GRAPHICS",
        estimated_duration: 3,
        complexity_score: 2,
        base_task_hours: 1.0,
      },
      {
        name: "Wedding Party Introductions",
        description: "Graphics for wedding party member names",
        type: "GRAPHICS",
        estimated_duration: 30,
        complexity_score: 4,
        base_task_hours: 2.0,
      },

      // Video Components
      {
        name: "Ceremony Main Coverage",
        description: "Primary ceremony footage - wide shots",
        type: "VIDEO",
        estimated_duration: 1800, // 30 minutes
        complexity_score: 5,
        base_task_hours: 4.0,
      },
      {
        name: "Reception Highlights",
        description: "Key moments from reception",
        type: "VIDEO",
        estimated_duration: 600, // 10 minutes
        complexity_score: 6,
        base_task_hours: 3.0,
      },
      {
        name: "Couple Portraits",
        description: "Couple portrait session footage",
        type: "VIDEO",
        estimated_duration: 300, // 5 minutes
        complexity_score: 4,
        base_task_hours: 2.5,
      },

      // Audio Components
      {
        name: "Vow Exchange Audio",
        description: "Clean audio capture of wedding vows",
        type: "AUDIO",
        estimated_duration: 300, // 5 minutes
        complexity_score: 3,
        base_task_hours: 2.0,
      },
      {
        name: "Reception Speeches",
        description: "Best man, maid of honor speeches",
        type: "AUDIO",
        estimated_duration: 600, // 10 minutes
        complexity_score: 4,
        base_task_hours: 1.5,
      },
      {
        name: "Ambient Ceremony Audio",
        description: "Natural ceremony atmosphere and crowd reactions",
        type: "AUDIO",
        estimated_duration: 900, // 15 minutes
        complexity_score: 2,
        base_task_hours: 1.0,
      },

      // Music Components
      {
        name: "Processional Music",
        description: "Music for wedding party entrance",
        type: "MUSIC",
        estimated_duration: 180, // 3 minutes
        complexity_score: 2,
        base_task_hours: 0.5,
      },
      {
        name: "First Dance Song",
        description: "Couple's first dance music",
        type: "MUSIC",
        estimated_duration: 240, // 4 minutes
        complexity_score: 1,
        base_task_hours: 0.25,
      },
      {
        name: "Reception Background Music",
        description: "Background music for reception highlights",
        type: "MUSIC",
        estimated_duration: 600, // 10 minutes
        complexity_score: 3,
        base_task_hours: 1.0,
      },
    ];

    let createdCount = 0;
    let existingCount = 0;

    // Insert components
    for (const component of mediaComponents) {
      const existingComponent = await prisma.componentLibrary.findFirst({
        where: {
          name: component.name,
          type: component.type,
        },
      });

      if (existingComponent) {
        console.log(
          `✓ Component "${component.name}" (${component.type}) already exists`,
        );
        existingCount++;
        continue;
      }

      const createdComponent = await prisma.componentLibrary.create({
        data: {
          ...component,
          usage_count: 0,
          performance_score: 5.0,
        },
      });

      console.log(
        `✅ Created ${component.type} component: ${createdComponent.name} (ID: ${createdComponent.id})`,
      );
      createdCount++;
    }

    console.log(`\n🎯 Media components seeded successfully!`);
    console.log(`   Created: ${createdCount} new components`);
    console.log(`   Existing: ${existingCount} components\n`);

    // Show components by type
    const componentsByType = await prisma.componentLibrary.groupBy({
      by: ["type"],
      _count: { type: true },
      where: {
        type: {
          in: ["GRAPHICS", "VIDEO", "AUDIO", "MUSIC"],
        },
      },
    });

    console.log("Components by Media Type:");
    componentsByType.forEach((group) => {
      console.log(`  ${group.type}: ${group._count.type} components`);
    });

    // Show sample components for timeline
    console.log("\nSample Timeline Components:");
    const sampleComponents = await prisma.componentLibrary.findMany({
      where: {
        type: { in: ["GRAPHICS", "VIDEO", "AUDIO", "MUSIC"] },
      },
      select: {
        id: true,
        name: true,
        type: true,
        estimated_duration: true,
      },
      take: 8,
      orderBy: [{ type: "asc" }, { estimated_duration: "asc" }],
    });

    sampleComponents.forEach((comp) => {
      const duration = comp.estimated_duration
        ? `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, "0")}`
        : "N/A";
      console.log(
        `  ${comp.type.padEnd(8)} | ${comp.name.padEnd(30)} | ${duration}`,
      );
    });
  } catch (error) {
    console.error("❌ Error seeding media components:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMediaComponents();
