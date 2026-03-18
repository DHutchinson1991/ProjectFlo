// Moonrise Films Team Setup - Contributors and Roles
// Creates: Team members, roles, and user-brand associations
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseTeam(brandId: number) {
    logger.sectionHeader('Team Setup');

    // Create Manager role for Moonrise Films
    const managerRole = await prisma.roles.upsert({
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
            type: $Enums.contacts_type.Contributor,
            brand_id: brandId,
        },
        create: {
            first_name: "Andy",
            last_name: "Galloway",
            email: "andy.galloway@projectflo.co.uk",
            type: $Enums.contacts_type.Contributor,
            brand_id: brandId,
        },
    });

    const andyContributor = await prisma.contributors.upsert({
        where: { contact_id: andyContact.id },
        update: {
            role_id: managerRole.id,
            contributor_type: "Internal",
            default_hourly_rate: 45.0,
            password_hash: managerPassword,
            is_crew: true,
            crew_color: "#2563EB",
        },
        create: {
            contact_id: andyContact.id,
            role_id: managerRole.id,
            contributor_type: "Internal",
            default_hourly_rate: 45.0,
            password_hash: managerPassword,
            is_crew: true,
            crew_color: "#2563EB",
        },
    });

    // Associate Andy with Moonrise Films brand
    await prisma.user_brands.upsert({
        where: {
            user_id_brand_id: {
                user_id: andyContributor.id,
                brand_id: brandId,
            },
        },
        update: {
            role: "Manager",
            is_active: true,
        },
        create: {
            user_id: andyContributor.id,
            brand_id: brandId,
            role: "Manager",
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
            type: $Enums.contacts_type.Contributor,
            brand_id: brandId,
        },
        create: {
            first_name: "Corri",
            last_name: "Lee",
            email: "corri.lee@projectflo.co.uk",
            type: $Enums.contacts_type.Contributor,
            brand_id: brandId,
        },
    });

    const corriContributor = await prisma.contributors.upsert({
        where: { contact_id: corriContact.id },
        update: {
            role_id: managerRole.id,
            contributor_type: "Internal",
            default_hourly_rate: 45.0,
            password_hash: managerPassword,
            is_crew: true,
            crew_color: "#DB2777",
        },
        create: {
            contact_id: corriContact.id,
            role_id: managerRole.id,
            contributor_type: "Internal",
            default_hourly_rate: 45.0,
            password_hash: managerPassword,
            is_crew: true,
            crew_color: "#DB2777",
        },
    });

    // Associate Corri with Moonrise Films brand
    await prisma.user_brands.upsert({
        where: {
            user_id_brand_id: {
                user_id: corriContributor.id,
                brand_id: brandId,
            },
        },
        update: {
            role: "Manager",
            is_active: true,
        },
        create: {
            user_id: corriContributor.id,
            brand_id: brandId,
            role: "Manager",
            is_active: true,
        },
    });

    // ── Crew Job Role Assignments ─────────────────────────────────────────────
    // Look up the global job roles and payment brackets we need
    logger.info('Assigning crew job roles...');

    const [directorRole, videographerRole, editorRole, producerRole] = await Promise.all([
        prisma.job_roles.findUnique({ where: { name: 'director' } }),
        prisma.job_roles.findUnique({ where: { name: 'videographer' } }),
        prisma.job_roles.findUnique({ where: { name: 'editor' } }),
        prisma.job_roles.findUnique({ where: { name: 'producer' } }),
    ]);

    // Helper: find a bracket by role id + tier name (returns null if not yet seeded)
    async function findBracket(jobRoleId: number | undefined, tierName: string) {
        if (!jobRoleId) return null;
        const bracket = await prisma.payment_brackets.findUnique({
            where: { job_role_id_name: { job_role_id: jobRoleId, name: tierName } },
        });
        return bracket?.id ?? null;
    }

    // Andy Galloway → Director (primary, lead) + Videographer (senior)
    if (directorRole) {
        const bracketId = await findBracket(directorRole.id, 'lead');
        await prisma.contributor_job_roles.upsert({
            where: { contributor_id_job_role_id: { contributor_id: andyContributor.id, job_role_id: directorRole.id } },
            update: { is_primary: true, payment_bracket_id: bracketId },
            create: { contributor_id: andyContributor.id, job_role_id: directorRole.id, is_primary: true, payment_bracket_id: bracketId },
        });
        logger.created('Andy → Director (Lead)', undefined, 'verbose');
    }
    if (videographerRole) {
        const bracketId = await findBracket(videographerRole.id, 'senior');
        await prisma.contributor_job_roles.upsert({
            where: { contributor_id_job_role_id: { contributor_id: andyContributor.id, job_role_id: videographerRole.id } },
            update: { is_primary: false, payment_bracket_id: bracketId },
            create: { contributor_id: andyContributor.id, job_role_id: videographerRole.id, is_primary: false, payment_bracket_id: bracketId },
        });
        logger.created('Andy → Videographer (Senior)', undefined, 'verbose');
    }

    // Corri Lee → Editor (primary, lead) + Producer (senior)
    if (editorRole) {
        const bracketId = await findBracket(editorRole.id, 'lead');
        await prisma.contributor_job_roles.upsert({
            where: { contributor_id_job_role_id: { contributor_id: corriContributor.id, job_role_id: editorRole.id } },
            update: { is_primary: true, payment_bracket_id: bracketId },
            create: { contributor_id: corriContributor.id, job_role_id: editorRole.id, is_primary: true, payment_bracket_id: bracketId },
        });
        logger.created('Corri → Editor (Lead)', undefined, 'verbose');
    }
    if (producerRole) {
        const bracketId = await findBracket(producerRole.id, 'senior');
        await prisma.contributor_job_roles.upsert({
            where: { contributor_id_job_role_id: { contributor_id: corriContributor.id, job_role_id: producerRole.id } },
            update: { is_primary: false, payment_bracket_id: bracketId },
            create: { contributor_id: corriContributor.id, job_role_id: producerRole.id, is_primary: false, payment_bracket_id: bracketId },
        });
        logger.created('Corri → Producer (Senior)', undefined, 'verbose');
    }

    logger.success('Created 2 team members for Moonrise Films');
    logger.info('Managers: Andy Galloway (Director/Videographer), Corri Lee (Editor/Producer)');
    logger.info('Global admin (Daniel) has access via admin system');

    return {
        managerRole,
        teamMembers: [
            { contact: andyContact, contributor: andyContributor },
            { contact: corriContact, contributor: corriContributor }
        ]
    };
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Team');

    try {
        // Find the Moonrise Films brand
        const brand = await prisma.brands.findUnique({
            where: { name: "Moonrise Films" }
        });

        if (!brand) {
            throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
        }

        const team = await createMoonriseTeam(brand.id);
        logger.success(`Team setup complete! Created ${team.teamMembers.length} team members`);
    } catch (error) {
        console.error("❌ Team setup failed:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Team setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
