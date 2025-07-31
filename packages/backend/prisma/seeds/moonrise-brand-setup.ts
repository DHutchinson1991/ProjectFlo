// Moonrise Films Brand Setup - Core Brand Creation
// Creates: Brand entity, settings, and basic configuration
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createMoonriseBrand() {
    console.log("🏢 Creating Moonrise Films Brand...");

    const moonriseBrand = await prisma.brands.upsert({
        where: { name: "Moonrise Films" },
        update: {
            display_name: "Moonrise Films",
            description: "Premium wedding videography specializing in personal and intimate events",
            business_type: "Wedding Videography",
            website: "https://moonrisefilms.com",
            email: "hello@moonrisefilms.com",
            phone: "+1 (555) 123-4567",
            address_line1: "123 Creative Studio Lane",
            city: "Nashville",
            state: "TN",
            country: "United States",
            postal_code: "37201",
            timezone: "America/Chicago",
            currency: "USD",
            is_active: true,
        },
        create: {
            name: "Moonrise Films",
            display_name: "Moonrise Films",
            description: "Premium wedding videography specializing in personal and intimate events",
            business_type: "Wedding Videography",
            website: "https://moonrisefilms.com",
            email: "hello@moonrisefilms.com",
            phone: "+1 (555) 123-4567",
            address_line1: "123 Creative Studio Lane",
            city: "Nashville",
            state: "TN",
            country: "United States",
            postal_code: "37201",
            timezone: "America/Chicago",
            currency: "USD",
            is_active: true,
        },
    });

    // Create brand settings for Moonrise Films
    const brandSettings = [
        {
            brand_id: moonriseBrand.id,
            key: "default_timezone",
            value: "America/Chicago",
            data_type: "string",
            category: "general",
            description: "Default timezone for Moonrise Films",
        },
        {
            brand_id: moonriseBrand.id,
            key: "client_portal_enabled",
            value: "true",
            data_type: "boolean",
            category: "features",
            description: "Enable client portal access",
        },
        {
            brand_id: moonriseBrand.id,
            key: "default_film_length",
            value: "5",
            data_type: "number",
            category: "workflow",
            description: "Default film length in minutes",
        },
        {
            brand_id: moonriseBrand.id,
            key: "branding_colors",
            value: JSON.stringify({
                primary: "#8B5A3C", // Warm brown
                secondary: "#F4A460", // Sandy brown
                accent: "#DAA520" // Goldenrod
            }),
            data_type: "json",
            category: "branding",
            description: "Moonrise Films brand color palette",
        },
    ];

    for (const settingData of brandSettings) {
        await prisma.brand_settings.upsert({
            where: {
                brand_id_key: {
                    brand_id: settingData.brand_id,
                    key: settingData.key,
                },
            },
            update: settingData,
            create: settingData,
        });
    }

    console.log(`  ✓ Created Moonrise Films brand with settings`);
    return moonriseBrand;
}

async function main() {
    console.log("🏢 Seeding Moonrise Films Brand Setup...");

    try {
        const brand = await createMoonriseBrand();
        console.log(`✅ Brand setup complete! Brand ID: ${brand.id}`);
    } catch (error) {
        console.error("❌ Brand setup failed:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Brand setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
