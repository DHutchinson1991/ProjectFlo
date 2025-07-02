// Wedding Film Seed - First Dance + Ceremony Only
// Creates: Coverage, Components, and Content for minimal wedding film workflow
import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("💒 Seeding Wedding Film Data (First Dance + Ceremony)...");
    console.log("");

    try {
        // --- 1. COVERAGE SCENES ---
        console.log("📹 Creating Coverage Scenes...");

        const coverageScenes = [
            {
                name: "Ceremony",
                description: "Full wedding ceremony coverage from multiple angles.",
            },
            {
                name: "First Dance",
                description: "Couple's first dance together.",
            },
        ];

        for (const scene of coverageScenes) {
            await prisma.coverage.upsert({
                where: { name: scene.name },
                update: { description: scene.description },
                create: scene,
            });
        }
        console.log(`  ✓ Created ${coverageScenes.length} coverage scenes`);

        // --- 2. VIDEO COMPONENTS ---
        console.log("🎥 Creating Video Components...");

        const videoComponents = [
            {
                name: "Ceremony Processional",
                description: "Bridal party and bride entrance footage",
                type: $Enums.ComponentType.VIDEO,
                complexity_score: 4,
                estimated_duration: 3,
                base_task_hours: 2.5,
                is_coverage_linked: true,
            },
            {
                name: "Vows Exchange",
                description: "Personal vows and ring exchange with audio enhancement",
                type: $Enums.ComponentType.VIDEO,
                complexity_score: 6,
                estimated_duration: 4,
                base_task_hours: 3.5,
                is_coverage_linked: true,
            },
            {
                name: "Ceremony Recessional",
                description: "Exit and celebration after ceremony",
                type: $Enums.ComponentType.VIDEO,
                complexity_score: 3,
                estimated_duration: 2,
                base_task_hours: 2.0,
                is_coverage_linked: true,
            },
            {
                name: "First Dance Sequence",
                description: "Couple's first dance with multiple camera angles",
                type: $Enums.ComponentType.VIDEO,
                complexity_score: 5,
                estimated_duration: 4,
                base_task_hours: 3.0,
                is_coverage_linked: true,
            },
        ];

        for (const component of videoComponents) {
            const existing = await prisma.componentLibrary.findFirst({
                where: { name: component.name },
            });

            if (!existing) {
                await prisma.componentLibrary.create({
                    data: component,
                });
            }
        }
        console.log(`  ✓ Created ${videoComponents.length} video components`);

        // --- 3. GRAPHICS COMPONENTS ---
        console.log("🎨 Creating Graphics Components...");

        const graphicsComponents = [
            {
                name: "Opening Title Sequence",
                description: "Branded opening with couple names and wedding date",
                type: $Enums.ComponentType.GRAPHICS,
                complexity_score: 4,
                estimated_duration: 1,
                base_task_hours: 2.5,
                is_coverage_linked: false,
            },
            {
                name: "Closing Credits",
                description: "End credits with thank you messages",
                type: $Enums.ComponentType.GRAPHICS,
                complexity_score: 3,
                estimated_duration: 1,
                base_task_hours: 1.5,
                is_coverage_linked: false,
            },
            {
                name: "Transition Graphics",
                description: "Scene transitions and lower thirds",
                type: $Enums.ComponentType.GRAPHICS,
                complexity_score: 5,
                estimated_duration: 2,
                base_task_hours: 3.0,
                is_coverage_linked: false,
            },
            {
                name: "Location Titles",
                description: "Venue and location name overlays",
                type: $Enums.ComponentType.GRAPHICS,
                complexity_score: 2,
                estimated_duration: 1,
                base_task_hours: 1.0,
                is_coverage_linked: false,
            },
        ];

        for (const component of graphicsComponents) {
            const existing = await prisma.componentLibrary.findFirst({
                where: { name: component.name },
            });

            if (!existing) {
                await prisma.componentLibrary.create({
                    data: component,
                });
            }
        }
        console.log(`  ✓ Created ${graphicsComponents.length} graphics components`);

        // --- 4. CONTENT LIBRARY ---
        console.log("📚 Creating Content Library...");

        const contentItems = [
            {
                name: "First Dance Film",
                description: "A cinematic film capturing the couple's first dance",
                type: $Enums.ContentType.STANDARD,
                includes_music: true,
                default_music_type: $Enums.MusicType.MODERN,
                delivery_timeline: 14,
                version: "1.0",
            },
            {
                name: "Ceremony Film",
                description: "Complete multi-camera edit of the wedding ceremony",
                type: $Enums.ContentType.STANDARD,
                includes_music: false,
                delivery_timeline: 21,
                version: "1.0",
            },
        ];

        for (const content of contentItems) {
            await prisma.contentLibrary.upsert({
                where: { name: content.name },
                update: {
                    description: content.description,
                    type: content.type,
                    includes_music: content.includes_music,
                    default_music_type: content.default_music_type,
                    delivery_timeline: content.delivery_timeline,
                    version: content.version,
                },
                create: content,
            });
        }
        console.log(`  ✓ Created ${contentItems.length} content items`);

        // --- 5. COMPONENT-COVERAGE LINKS ---
        console.log("🔗 Linking Components to Coverage...");

        const coverageLinks = [
            { componentName: "Ceremony Processional", coverageName: "Ceremony" },
            { componentName: "Vows Exchange", coverageName: "Ceremony" },
            { componentName: "Ceremony Recessional", coverageName: "Ceremony" },
            { componentName: "First Dance Sequence", coverageName: "First Dance" },
        ];

        for (const link of coverageLinks) {
            const component = await prisma.componentLibrary.findFirst({
                where: { name: link.componentName },
            });
            const coverage = await prisma.coverage.findFirst({
                where: { name: link.coverageName },
            });

            if (component && coverage) {
                await prisma.componentCoverage.upsert({
                    where: {
                        component_id_coverage_id: {
                            component_id: component.id,
                            coverage_id: coverage.id,
                        },
                    },
                    update: {},
                    create: {
                        component_id: component.id,
                        coverage_id: coverage.id,
                    },
                });
            }
        }
        console.log(`  ✓ Created ${coverageLinks.length} component-coverage links`);

        // Final Summary
        console.log("");
        console.log("🎉 =======================================");
        console.log("✅ Wedding Film Data Complete!");
        console.log("📊 Summary:");
        console.log(`   • ${coverageScenes.length} coverage scenes`);
        console.log(`   • ${videoComponents.length} video components`);
        console.log(`   • ${graphicsComponents.length} graphics components`);
        console.log(`   • ${contentItems.length} content items`);
        console.log(`   • ${coverageLinks.length} component-coverage links`);
        console.log("");
        console.log("🎬 Content Created:");
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
