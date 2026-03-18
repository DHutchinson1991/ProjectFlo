// Layer5 Corporate Brand Setup - Brand Creation and Settings
// Creates: Layer5 brand and brand settings
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createLayer5Brand() {
    console.log("🏢 Creating Layer5 Corporate Videography Brand...");

    const layer5Brand = await prisma.brands.upsert({
        where: { name: "Layer5" },
        update: {
            display_name: "Layer5 Corporate Videography",
            description: "Professional corporate video production specializing in brand storytelling, training videos, and executive communications",
            business_type: "Corporate",
            website: "https://layer5video.com",
            email: "contact@layer5video.com",
            phone: "+1 (555) 789-0123",
            address_line1: "456 Business District Ave",
            address_line2: "Suite 800",
            city: "Atlanta",
            state: "GA",
            country: "United States",
            postal_code: "30309",
            timezone: "America/New_York",
            currency: "USD",
            is_active: true,
        },
        create: {
            name: "Layer5",
            display_name: "Layer5 Corporate Videography",
            description: "Professional corporate video production specializing in brand storytelling, training videos, and executive communications",
            business_type: "Corporate",
            website: "https://layer5video.com",
            email: "contact@layer5video.com",
            phone: "+1 (555) 789-0123",
            address_line1: "456 Business District Ave",
            address_line2: "Suite 800",
            city: "Atlanta",
            state: "GA",
            country: "United States",
            postal_code: "30309",
            timezone: "America/New_York",
            currency: "USD",
            is_active: true,
        }
    });

    console.log(`✅ Layer5 brand created/updated (ID: ${layer5Brand.id})`);

    // Configure brand settings
    console.log("⚙️ Creating Layer5 Brand Settings...");

    const brandSettings = [
        {
            key: "default_project_phase",
            value: "Inquiry",
            data_type: "string",
            category: "workflow",
            description: "Default phase for new projects"
        },
        {
            key: "working_hours",
            value: JSON.stringify({
                start: "09:00",
                end: "18:00",
                timezone: "America/New_York"
            }),
            data_type: "json",
            category: "schedule",
            description: "Standard working hours"
        },
        {
            key: "pricing_model",
            value: JSON.stringify({
                default_hourly_rate: 125,
                rush_multiplier: 1.5,
                weekend_multiplier: 1.25
            }),
            data_type: "json",
            category: "pricing",
            description: "Default pricing structure"
        },
        {
            key: "brand_colors",
            value: JSON.stringify({
                primary: "#1976d2",
                secondary: "#dc004e",
                accent: "#ffd600"
            }),
            data_type: "json",
            category: "branding",
            description: "Brand color scheme"
        },
        {
            key: "service_packages",
            value: JSON.stringify([
                "Corporate Brand Video",
                "Training & Educational Content",
                "Executive Communications",
                "Product Demonstrations",
                "Company Culture Videos",
                "Event Coverage"
            ]),
            data_type: "json",
            category: "services",
            description: "Available service packages"
        }
    ];

    for (const setting of brandSettings) {
        await prisma.brand_settings.upsert({
            where: {
                brand_id_key: {
                    brand_id: layer5Brand.id,
                    key: setting.key
                }
            },
            update: {
                value: setting.value,
                data_type: setting.data_type,
                category: setting.category,
                description: setting.description,
                is_active: true
            },
            create: {
                brand_id: layer5Brand.id,
                key: setting.key,
                value: setting.value,
                data_type: setting.data_type,
                category: setting.category,
                description: setting.description,
                is_active: true
            }
        });
    }

    console.log(`✅ Created ${brandSettings.length} brand settings for Layer5`);

    return layer5Brand;
}

async function main() {
    console.log("🏢 Seeding Layer5 Brand...");
    console.log("");

    try {
        const brand = await createLayer5Brand();

        console.log("");
        console.log("🎉 Layer5 Brand setup completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   • Brand: ${brand.name} (${brand.display_name})`);
        console.log(`   • Business Focus: Corporate video production`);
        console.log(`   • Location: Atlanta, GA`);
        console.log("");

    } catch (error) {
        console.error("❌ Error seeding Layer5 brand:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Layer5 brand setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
