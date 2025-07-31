// Moonrise Films Team Setup - Contributors and Roles
// Creates: Team members, roles, and user-brand associations
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function createMoonriseTeam(brandId: number) {
    console.log("👥 Creating Moonrise Films Team...");

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
    console.log("👤 Creating Andy Galloway (Manager)...");
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
        },
        create: {
            contact_id: andyContact.id,
            role_id: managerRole.id,
            contributor_type: "Internal",
            default_hourly_rate: 45.0,
            password_hash: managerPassword,
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
    console.log("👤 Creating Corri Lee (Manager)...");
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
        },
        create: {
            contact_id: corriContact.id,
            role_id: managerRole.id,
            contributor_type: "Internal",
            default_hourly_rate: 45.0,
            password_hash: managerPassword,
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

    console.log(`  ✓ Created 2 team members for Moonrise Films`);
    console.log("  👥 Managers: Andy Galloway, Corri Lee");
    console.log("  🌐 Global admin (Daniel) has access via admin system");

    return {
        managerRole,
        teamMembers: [
            { contact: andyContact, contributor: andyContributor },
            { contact: corriContact, contributor: corriContributor }
        ]
    };
}

async function main() {
    console.log("👥 Seeding Moonrise Films Team...");

    try {
        // Find the Moonrise Films brand
        const brand = await prisma.brands.findUnique({
            where: { name: "Moonrise Films" }
        });

        if (!brand) {
            throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
        }

        const team = await createMoonriseTeam(brand.id);
        console.log(`✅ Team setup complete! Created ${team.teamMembers.length} team members`);
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
