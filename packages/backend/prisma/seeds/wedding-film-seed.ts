// Wedding Film Seed - First Dance + Ceremony Only
// Creates: Scenes and Films for minimal wedding film workflow
import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("💒 Seeding Wedding Film Data (First Dance + Ceremony)...");
  console.log("");

  try {
    // --- 1. VIDEO SCENES ---
    console.log("🎥 Creating Video Scenes...");

    const videoScenes = [
      {
        name: "Ceremony Processional",
        description: "Bridal party and bride entrance footage",
        type: $Enums.MediaType.VIDEO,
        complexity_score: 4,
        estimated_duration: 3,
        base_task_hours: 2.5,
      },
      {
        name: "Vows Exchange",
        description: "Personal vows and ring exchange with audio enhancement",
        type: $Enums.MediaType.VIDEO,
        complexity_score: 6,
        estimated_duration: 4,
        base_task_hours: 3.5,
      },
      {
        name: "Ceremony Recessional",
        description: "Exit and celebration after ceremony",
        type: $Enums.MediaType.VIDEO,
        complexity_score: 3,
        estimated_duration: 2,
        base_task_hours: 2.0,
      },
      {
        name: "First Dance Sequence",
        description: "Couple's first dance with multiple camera angles",
        type: $Enums.MediaType.VIDEO,
        complexity_score: 5,
        estimated_duration: 4,
        base_task_hours: 3.0,
      },
    ];

    for (const scene of videoScenes) {
      const existing = await prisma.scenesLibrary.findFirst({
        where: { name: scene.name },
      });

      if (!existing) {
        await prisma.scenesLibrary.create({
          data: scene,
        });
      }
    }
    console.log(`  ✓ Created ${videoScenes.length} video scenes`);

    // --- 2. AUDIO SCENES ---
    console.log("🎵 Creating Audio Scenes...");

    const audioScenes = [
      {
        name: "Ceremony Audio",
        description: "Enhanced ceremony audio with vows and music",
        type: $Enums.MediaType.AUDIO,
        complexity_score: 4,
        estimated_duration: 1,
        base_task_hours: 2.5,
      },
      {
        name: "Ambient Sound",
        description: "Natural ambient sounds and venue acoustics",
        type: $Enums.MediaType.AUDIO,
        complexity_score: 3,
        estimated_duration: 1,
        base_task_hours: 1.5,
      },
      {
        name: "First Dance Audio",
        description: "Music and ambient sound for first dance",
        type: $Enums.MediaType.AUDIO,
        complexity_score: 5,
        estimated_duration: 2,
        base_task_hours: 3.0,
      },
      {
        name: "Background Music",
        description: "Cinematic background scoring",
        type: $Enums.MediaType.MUSIC,
        complexity_score: 2,
        estimated_duration: 1,
        base_task_hours: 1.0,
      },
    ];

    for (const scene of audioScenes) {
      const existing = await prisma.scenesLibrary.findFirst({
        where: { name: scene.name },
      });

      if (!existing) {
        await prisma.scenesLibrary.create({
          data: scene,
        });
      }
    }
    console.log(`  ✓ Created ${audioScenes.length} audio scenes`);

    // --- 3. FILM LIBRARY ---
    console.log("📚 Creating Film Library...");

    const filmItems = [
      {
        name: "First Dance Film",
        description: "A cinematic film capturing the couple's first dance",
        type: $Enums.FilmType.STANDARD,
        includes_music: true,
        default_music_type: $Enums.MusicType.MODERN,
        delivery_timeline: 14,
        version: "1.0",
      },
      {
        name: "Ceremony Film",
        description: "Complete multi-camera edit of the wedding ceremony",
        type: $Enums.FilmType.STANDARD,
        includes_music: false,
        delivery_timeline: 21,
        version: "1.0",
      },
    ];

    for (const film of filmItems) {
      await prisma.filmLibrary.upsert({
        where: { name: film.name },
        update: {
          description: film.description,
          type: film.type,
          includes_music: film.includes_music,
          default_music_type: film.default_music_type,
          delivery_timeline: film.delivery_timeline,
          version: film.version,
        },
        create: film,
      });
    }
    console.log(`  ✓ Created ${filmItems.length} film items`);

    // Final Summary
    console.log("");
    console.log("🎉 =======================================");
    console.log("✅ Wedding Film Data Complete!");
    console.log("📊 Summary:");
    console.log(`   • ${videoScenes.length} video scenes`);
    console.log(`   • ${audioScenes.length} audio scenes`);
    console.log(`   • ${filmItems.length} film items`);
    console.log("");
    console.log("🎬 Films Created:");
    console.log("   • First Dance Film");
    console.log("   • Ceremony Film");
    console.log("");
    console.log("✨ Ready for focused wedding film workflow!");
    console.log("=======================================");
  } catch (error) {
    console.error("❌ Wedding film seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Wedding film seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
