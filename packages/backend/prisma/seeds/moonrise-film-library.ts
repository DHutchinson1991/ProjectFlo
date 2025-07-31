// Moonrise Films Film Library Setup - Film Items and Deliverables
// Creates: Film library items for wedding videography
import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

export async function createMoonriseFilmLibrary(brandId: number) {
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
            brand_id: brandId,
        },
        {
            name: "Ceremony Film",
            description: "Complete multi-camera edit of the wedding ceremony",
            type: $Enums.FilmType.STANDARD,
            includes_music: false,
            delivery_timeline: 21,
            version: "1.0",
            brand_id: brandId,
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
    return filmItems.length;
}

async function main() {
    console.log("📚 Seeding Moonrise Films Film Library...");

    try {
        // Find the Moonrise Films brand
        const brand = await prisma.brands.findUnique({
            where: { name: "Moonrise Films" }
        });

        if (!brand) {
            throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
        }

        const filmCount = await createMoonriseFilmLibrary(brand.id);
        console.log(`✅ Film library setup complete! Created ${filmCount} film items`);
    } catch (error) {
        console.error("❌ Film library setup failed:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Film library setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
