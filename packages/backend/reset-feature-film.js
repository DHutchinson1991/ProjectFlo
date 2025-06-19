// Reset Feature Film components
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetFeatureFilmComponents() {
    console.log("🧹 Cleaning up existing Feature Film components...");

    // Find the Feature Film deliverable
    const featureFilm = await prisma.deliverables.findFirst({
        where: { name: "Feature Film (10-15 min)" },
    });

    if (featureFilm) {
        // Delete existing assigned components
        await prisma.deliverableAssignedComponents.deleteMany({
            where: { deliverable_id: featureFilm.id },
        });

        console.log("✅ Cleaned up existing components for Feature Film");
    } else {
        console.log("❌ Feature Film deliverable not found");
    }

    await prisma.$disconnect();
}

resetFeatureFilmComponents().catch(console.error);
