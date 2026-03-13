// Moonrise Films Brand Setup - Core Brand Creation
// Creates: Brand entity, settings, and basic configuration
import { PrismaClient } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseBrand() {
    logger.sectionHeader('Brand Setup', 'Moonrise Films');

    const moonriseBrand = await prisma.brands.upsert({
        where: { name: "Moonrise Films" },
        update: {
            display_name: "Moonrise Films",
            description: "Premium wedding videography specializing in personal and intimate events",
            business_type: "Wedding Videography",
            website: "https://moonrisefilms.com",
            email: "hello@moonrisefilms.com",
            phone: "+1 (555) 123-4567",
            address_line1: "2 Brambles Walk",
            address_line2: "Wellington",
            city: "Telford",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "TF1 2ED",
            timezone: "Europe/London",
            currency: "GBP",
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
            address_line1: "2 Brambles Walk",
            address_line2: "Wellington",
            city: "Telford",
            state: "Shropshire",
            country: "United Kingdom",
            postal_code: "TF1 2ED",
            timezone: "Europe/London",
            currency: "GBP",
            is_active: true,
        },
    });

    // Create brand settings for Moonrise Films
    const brandSettings = [
        {
            brand_id: moonriseBrand.id,
            key: "default_timezone",
            value: "Europe/London",
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

    logger.success('Created Moonrise Films brand with settings');

    // ── Default Payment Schedule Templates ──────────────────────────────────
    const defaultTemplates = [
        {
            name: '50/50 Split',
            description: '50% booking deposit, 50% final balance due 30 days before the event',
            is_default: true,
            rules: [
                { label: 'Booking Deposit', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'AFTER_BOOKING', trigger_days: 0, order_index: 0 },
                { label: 'Final Balance (30 days before)', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'BEFORE_EVENT', trigger_days: 30, order_index: 1 },
            ],
        },
        {
            name: '3-Way Split',
            description: '34% on booking, 33% at 60 days before, 33% final balance at 30 days before',
            is_default: false,
            rules: [
                { label: 'Booking Deposit', amount_type: 'PERCENT', amount_value: 34, trigger_type: 'AFTER_BOOKING', trigger_days: 0, order_index: 0 },
                { label: 'Second Instalment (60 days before)', amount_type: 'PERCENT', amount_value: 33, trigger_type: 'BEFORE_EVENT', trigger_days: 60, order_index: 1 },
                { label: 'Final Balance (30 days before)', amount_type: 'PERCENT', amount_value: 33, trigger_type: 'BEFORE_EVENT', trigger_days: 30, order_index: 2 },
            ],
        },
        {
            name: 'Full Upfront',
            description: '100% of the fee due on booking',
            is_default: false,
            rules: [
                { label: 'Full Payment on Booking', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'AFTER_BOOKING', trigger_days: 0, order_index: 0 },
            ],
        },
        {
            name: '25/75 Split',
            description: '25% retainer on booking, 75% final balance due 30 days before',
            is_default: false,
            rules: [
                { label: 'Booking Retainer', amount_type: 'PERCENT', amount_value: 25, trigger_type: 'AFTER_BOOKING', trigger_days: 0, order_index: 0 },
                { label: 'Final Balance (30 days before)', amount_type: 'PERCENT', amount_value: 75, trigger_type: 'BEFORE_EVENT', trigger_days: 30, order_index: 1 },
            ],
        },
    ];

    for (const tpl of defaultTemplates) {
        const existing = await prisma.payment_schedule_templates.findFirst({
            where: { brand_id: moonriseBrand.id, name: tpl.name },
        });
        if (!existing) {
            await prisma.payment_schedule_templates.create({
                data: {
                    brand_id: moonriseBrand.id,
                    name: tpl.name,
                    description: tpl.description,
                    is_default: tpl.is_default,
                    is_active: true,
                    rules: { create: tpl.rules },
                },
            });
            logger.success(`Created payment schedule template: ${tpl.name}`);
        }
    }

    return moonriseBrand;
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Brand Setup');

    try {
        const brand = await createMoonriseBrand();
        logger.success(`Brand setup complete! Brand ID: ${brand.id}`);
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
