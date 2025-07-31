// Moonrise Films Projects Setup - Sample Wedding Projects
// Creates: Sample wedding projects with clients for Moonrise Films
import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

export async function createMoonriseProjects() {
    console.log("🎬 Creating Sample Projects for Moonrise Films...");

    // Find Moonrise Films brand
    const moonriseBrand = await prisma.brands.findFirst({
        where: { name: "Moonrise Films" }
    });

    if (!moonriseBrand) {
        throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
    }

    console.log(`✅ Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

    // Create sample client contacts first
    console.log("👥 Creating sample client contacts...");

    const sarahContact = await prisma.contacts.upsert({
        where: { email: "sarah.johnson@email.com" },
        update: {
            first_name: "Sarah",
            last_name: "Johnson",
            type: $Enums.contacts_type.Client,
            brand_id: moonriseBrand.id,
            phone_number: "+1 (555) 234-5678",
        },
        create: {
            first_name: "Sarah",
            last_name: "Johnson",
            email: "sarah.johnson@email.com",
            phone_number: "+1 (555) 234-5678",
            type: $Enums.contacts_type.Client,
            brand_id: moonriseBrand.id,
        },
    });

    const emilyContact = await prisma.contacts.upsert({
        where: { email: "emily.chen@email.com" },
        update: {
            first_name: "Emily",
            last_name: "Chen",
            type: $Enums.contacts_type.Client,
            brand_id: moonriseBrand.id,
            phone_number: "+1 (555) 345-6789",
        },
        create: {
            first_name: "Emily",
            last_name: "Chen",
            email: "emily.chen@email.com",
            phone_number: "+1 (555) 345-6789",
            type: $Enums.contacts_type.Client,
            brand_id: moonriseBrand.id,
        },
    });

    // Create clients linked to contacts
    const client1 = await prisma.clients.upsert({
        where: { contact_id: sarahContact.id },
        update: {},
        create: {
            contact_id: sarahContact.id,
        }
    });

    const client2 = await prisma.clients.upsert({
        where: { contact_id: emilyContact.id },
        update: {},
        create: {
            contact_id: emilyContact.id,
        }
    });

    console.log(`✅ Created clients: ${sarahContact.first_name} ${sarahContact.last_name} and ${emilyContact.first_name} ${emilyContact.last_name}`);

    // Create sample wedding projects
    console.log("💒 Creating sample wedding projects...");

    // Check if projects already exist to avoid duplicates
    const existingProject1 = await prisma.projects.findFirst({
        where: {
            client_id: client1.id,
            project_name: "Sarah & Michael's Garden Wedding"
        }
    });

    const existingProject2 = await prisma.projects.findFirst({
        where: {
            client_id: client2.id,
            project_name: "Emily & David's Vineyard Celebration"
        }
    });

    let project1, project2;

    if (!existingProject1) {
        project1 = await prisma.projects.create({
            data: {
                client_id: client1.id,
                brand_id: moonriseBrand.id,
                project_name: "Sarah & Michael's Garden Wedding",
                wedding_date: new Date("2025-09-15T16:00:00Z"), // September 15, 2025
                booking_date: new Date("2025-01-20T10:00:00Z"), // Booked in January
                phase: "PLANNING"
            }
        });
        console.log(`✅ Created project: "${project1.project_name}" (ID: ${project1.id})`);
    } else {
        project1 = existingProject1;
        console.log(`ℹ️ Project "${project1.project_name}" already exists (ID: ${project1.id})`);
    }

    if (!existingProject2) {
        project2 = await prisma.projects.create({
            data: {
                client_id: client2.id,
                brand_id: moonriseBrand.id,
                project_name: "Emily & David's Vineyard Celebration",
                wedding_date: new Date("2025-10-22T17:30:00Z"), // October 22, 2025
                booking_date: new Date("2025-02-14T14:00:00Z"), // Booked on Valentine's Day
                phase: "PLANNING"
            }
        });
        console.log(`✅ Created project: "${project2.project_name}" (ID: ${project2.id})`);
    } else {
        project2 = existingProject2;
        console.log(`ℹ️ Project "${project2.project_name}" already exists (ID: ${project2.id})`);
    }

    console.log(`✅ Created 2 sample clients and 2 wedding projects for Moonrise Films`);

    return {
        brand: moonriseBrand,
        clients: [client1, client2],
        projects: [project1, project2],
        contacts: [sarahContact, emilyContact]
    };
}

async function main() {
    console.log("🎬 Seeding Moonrise Films Projects...");
    console.log("");

    try {
        const results = await createMoonriseProjects();

        console.log("");
        console.log("🎉 Moonrise Projects seeding completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   • ${results.clients.length} sample clients created`);
        console.log(`   • ${results.projects.length} wedding projects created for Moonrise Films`);
        console.log("");

    } catch (error) {
        console.error("❌ Error seeding Moonrise projects:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Moonrise projects setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
