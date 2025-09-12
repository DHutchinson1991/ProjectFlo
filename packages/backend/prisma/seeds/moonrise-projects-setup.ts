// Moonrise Films Projects Setup - Sample Wedding Projects
// Creates: Sample wedding projects with clients for Moonrise Films
import { PrismaClient, $Enums, type brands as Brand, type clients as Client, type projects as Project, type contacts as Contact } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseProjects(): Promise<{ brand: Brand; clients: Client[]; projects: Project[]; contacts: Contact[]; summary: SeedSummary }> {
    logger.sectionHeader('Creating Sample Projects for Moonrise Films');

    // Find Moonrise Films brand
    const moonriseBrand = await prisma.brands.findFirst({
        where: { name: "Moonrise Films" }
    });

    if (!moonriseBrand) {
        logger.error('Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.');
        throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
    }

    logger.success(`Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

    // Create sample client contacts first
    logger.sectionDivider('Creating sample client contacts');

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

    logger.success(`Clients ready: ${sarahContact.first_name} ${sarahContact.last_name} and ${emilyContact.first_name} ${emilyContact.last_name}`);

    // Create sample wedding projects
    logger.sectionDivider('Creating sample wedding projects');

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

    let created = 0;
    let skipped = 0;

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
        created += 1;
        logger.created(`Project: "${project1.project_name}" (ID: ${project1.id})`);
    } else {
        project1 = existingProject1;
        skipped += 1;
        logger.skipped(`Project "${project1.project_name}" already exists (ID: ${project1.id})`);
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
        created += 1;
        logger.created(`Project: "${project2.project_name}" (ID: ${project2.id})`);
    } else {
        project2 = existingProject2;
        skipped += 1;
        logger.skipped(`Project "${project2.project_name}" already exists (ID: ${project2.id})`);
    }

    const summary: SeedSummary = { created, updated: 0, skipped, total: created + skipped };
    logger.summary('Projects', summary);

    return {
        brand: moonriseBrand,
        clients: [client1, client2],
        projects: [project1, project2],
        contacts: [sarahContact, emilyContact],
        summary
    };
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Projects');

    try {
        const results = await createMoonriseProjects();
        logger.sectionDivider('Summary');
        logger.success('Moonrise Projects seeding completed successfully!');
        logger.info(`${results.clients.length} sample clients processed`);
        logger.info(`${results.projects.length} projects processed`);
        logger.info(`Created: ${results.summary.created}, Skipped: ${results.summary.skipped}`);

    } catch (error) {
        logger.error(`Error seeding Moonrise projects: ${String(error)}`);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            logger.error(`Moonrise projects setup failed: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
