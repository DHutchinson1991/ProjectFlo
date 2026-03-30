// Moonrise Films Platform Setup - Brand, Settings, and Team
// Creates: Brand entity, settings, payment schedule templates, team members, roles
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';
import * as bcrypt from "bcrypt";

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseBrand(db: PrismaClient) {
    prisma = db;
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
        {
            brand_id: moonriseBrand.id,
            key: "overtime_multiplier",
            value: "1.5",
            data_type: "number",
            category: "finance",
            description: "Overtime rate multiplier applied to hourly rate (e.g. 1.5 = time-and-a-half)",
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

export async function createMoonriseTeam(db: PrismaClient, brandId: number) {
    prisma = db;
    logger.sectionHeader('Team Setup');

    // Create Manager role for Moonrise Films
    const managerRole = await prisma.systemRole.upsert({
        where: { name: "Manager" },
        update: {
            description: "Project and team management. Oversees workflows, schedules, and team coordination.",
            brand_id: brandId,
        },
        create: {
            name: "Manager",
            description: "Project and team management. Oversees workflows, schedules, and team coordination.",
            brand_id: brandId,
        },
    });

    // Hash passwords
    const managerPassword = await bcrypt.hash("Manager@2025", 10);

    // Create Andy Galloway (Manager)
    logger.info("Creating Andy Galloway (Manager)...");
    const andyContact = await prisma.contacts.upsert({
        where: { email: "andy.galloway@projectflo.co.uk" },
        update: {
            first_name: "Andy",
            last_name: "Galloway",
                type: $Enums.contacts_type.Crew,
            brand_id: brandId,
        },
        create: {
            first_name: "Andy",
            last_name: "Galloway",
            email: "andy.galloway@projectflo.co.uk",
            type: $Enums.contacts_type.Crew,
            brand_id: brandId,
        },
    });

    const andyCrewMember = await prisma.crew.upsert({
        where: { contact_id: andyContact.id },
        update: { crew_color: "#2563EB" },
        create: { contact_id: andyContact.id, crew_color: "#2563EB" },
    });

    await prisma.userAccount.upsert({
        where: { contact_id: andyContact.id },
        update: { system_role_id: managerRole.id, password_hash: managerPassword },
        create: { contact_id: andyContact.id, system_role_id: managerRole.id, password_hash: managerPassword },
    });

    // Associate Andy with Moonrise Films brand
    await prisma.brandMember.upsert({
        where: {
            crew_id_brand_id: {
                crew_id: andyCrewMember.id,
                brand_id: brandId,
            },
        },
        update: { is_active: true },
        create: {
            crew_id: andyCrewMember.id,
            brand_id: brandId,
            is_active: true,
        },
    });

    // Create Corri Lee (Manager)
    logger.info("Creating Corri Lee (Manager)...");
    const corriContact = await prisma.contacts.upsert({
        where: { email: "corri.lee@projectflo.co.uk" },
        update: {
            first_name: "Corri",
            last_name: "Lee",
                type: $Enums.contacts_type.Crew,
            brand_id: brandId,
        },
        create: {
            first_name: "Corri",
            last_name: "Lee",
            email: "corri.lee@projectflo.co.uk",
            type: $Enums.contacts_type.Crew,
            brand_id: brandId,
        },
    });

    const corriCrewMember = await prisma.crew.upsert({
        where: { contact_id: corriContact.id },
        update: { crew_color: "#DB2777" },
        create: { contact_id: corriContact.id, crew_color: "#DB2777" },
    });

    await prisma.userAccount.upsert({
        where: { contact_id: corriContact.id },
        update: { system_role_id: managerRole.id, password_hash: managerPassword },
        create: { contact_id: corriContact.id, system_role_id: managerRole.id, password_hash: managerPassword },
    });

    // Associate Corri with Moonrise Films brand
    await prisma.brandMember.upsert({
        where: {
            crew_id_brand_id: {
                crew_id: corriCrewMember.id,
                brand_id: brandId,
            },
        },
        update: { is_active: true },
        create: {
            crew_id: corriCrewMember.id,
            brand_id: brandId,
            is_active: true,
        },
    });

    // ── Crew Job Role Assignments ─────────────────────────────────────────────
    logger.info('Assigning crew job roles...');

    const [directorRole, videographerRole, editorRole, producerRole, soundEngineerRole] = await Promise.all([
        prisma.job_roles.findUnique({ where: { name: 'director' } }),
        prisma.job_roles.findUnique({ where: { name: 'videographer' } }),
        prisma.job_roles.findUnique({ where: { name: 'editor' } }),
        prisma.job_roles.findUnique({ where: { name: 'producer' } }),
        prisma.job_roles.findUnique({ where: { name: 'sound_engineer' } }),
    ]);

    async function findBracket(jobRoleId: number | undefined, tierName: string) {
        if (!jobRoleId) return null;
        const bracket = await prisma.payment_brackets.findUnique({
            where: { job_role_id_name: { job_role_id: jobRoleId, name: tierName } },
        });
        return bracket?.id ?? null;
    }

    // Andy Galloway → Director (primary, lead) + Videographer (senior) + Sound Engineer (senior)
    if (directorRole) {
        const bracketId = await findBracket(directorRole.id, 'lead');
        await prisma.crewJobRole.upsert({
            where: { crew_id_job_role_id: { crew_id: andyCrewMember.id, job_role_id: directorRole.id } },
            update: { is_primary: true, payment_bracket_id: bracketId },
            create: { crew_id: andyCrewMember.id, job_role_id: directorRole.id, is_primary: true, payment_bracket_id: bracketId },
        });
        logger.created('Andy → Director (Lead)', undefined, 'verbose');
    }
    if (videographerRole) {
        const bracketId = await findBracket(videographerRole.id, 'senior');
        await prisma.crewJobRole.upsert({
            where: { crew_id_job_role_id: { crew_id: andyCrewMember.id, job_role_id: videographerRole.id } },
            update: { is_primary: false, payment_bracket_id: bracketId },
            create: { crew_id: andyCrewMember.id, job_role_id: videographerRole.id, is_primary: false, payment_bracket_id: bracketId },
        });
        logger.created('Andy → Videographer (Senior)', undefined, 'verbose');
    }
    if (soundEngineerRole) {
        const bracketId = await findBracket(soundEngineerRole.id, 'senior');
        await prisma.crewJobRole.upsert({
            where: { crew_id_job_role_id: { crew_id: andyCrewMember.id, job_role_id: soundEngineerRole.id } },
            update: { is_primary: false, payment_bracket_id: bracketId },
            create: { crew_id: andyCrewMember.id, job_role_id: soundEngineerRole.id, is_primary: false, payment_bracket_id: bracketId },
        });
        logger.created('Andy → Sound Engineer (Senior)', undefined, 'verbose');
    }

    // Corri Lee → Editor (primary, lead) + Producer (senior)
    if (editorRole) {
        const bracketId = await findBracket(editorRole.id, 'lead');
        await prisma.crewJobRole.upsert({
            where: { crew_id_job_role_id: { crew_id: corriCrewMember.id, job_role_id: editorRole.id } },
            update: { is_primary: true, payment_bracket_id: bracketId },
            create: { crew_id: corriCrewMember.id, job_role_id: editorRole.id, is_primary: true, payment_bracket_id: bracketId },
        });
        logger.created('Corri → Editor (Lead)', undefined, 'verbose');
    }
    if (producerRole) {
        const bracketId = await findBracket(producerRole.id, 'senior');
        await prisma.crewJobRole.upsert({
            where: { crew_id_job_role_id: { crew_id: corriCrewMember.id, job_role_id: producerRole.id } },
            update: { is_primary: false, payment_bracket_id: bracketId },
            create: { crew_id: corriCrewMember.id, job_role_id: producerRole.id, is_primary: false, payment_bracket_id: bracketId },
        });
        logger.created('Corri → Producer (Senior)', undefined, 'verbose');
    }

    logger.success('Created 2 team members for Moonrise Films');
    logger.info('Managers: Andy Galloway (Director/Videographer/Sound Engineer), Corri Lee (Editor/Producer)');
    logger.info('Global admin (Daniel) has access via admin system');

    return {
        managerRole,
        teamMembers: [
            { contact: andyContact, crewMember: andyCrewMember },
            { contact: corriContact, crewMember: corriCrewMember }
        ]
    };
}
