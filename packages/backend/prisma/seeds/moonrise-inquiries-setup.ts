// Moonrise Films Inquiries Setup - Wedding Inquiries & Leads
// Creates: Sample wedding inquiries for Moonrise Films
import { PrismaClient, type Prisma, $Enums, type inquiries as Inquiry, type contacts as Contact, type brands as Brand } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// Using Prisma Contact type directly; no custom ContactType needed

export async function createMoonriseInquiries(): Promise<{ brand: Brand; contacts: Contact[]; inquiries: Inquiry[]; statusCounts: Record<string, number>; summary: SeedSummary }> {
    logger.sectionHeader('Creating Sample Inquiries for Moonrise Films');

    // Find Moonrise Films brand
    const moonriseBrand = await prisma.brands.findFirst({
        where: { name: "Moonrise Films" }
    });

    if (!moonriseBrand) {
        logger.error('Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.');
        throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
    }

    logger.success(`Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

    // Create sample inquiry contacts
    logger.sectionDivider('Creating inquiry contacts');

    const inquiryContacts = [
        // DISABLED: Inquiry contacts cleared (not creating sample inquiries)
    ];

    const contacts: Contact[] = [];
    // Temporary commented out since no inquiry contacts needed
    // for (const contactData of inquiryContacts) {
    //     const contact = await prisma.contacts.upsert({...});
    //     contacts.push(contact);
    // }

    logger.success(`Inquiry contacts: 0 (disabled)`);

    // Create wedding inquiries
    logger.sectionDivider('Creating wedding inquiries');

    const inquiryData: Prisma.inquiriesUncheckedCreateInput[] = [
        // DISABLED: Sample inquiries cleared (keeping only inquiry 13)
    ];

    const inquiries: Inquiry[] = [];
    let created = 0;
    let skipped = 0;
    for (const inquiry of inquiryData) {
        // Check if inquiry already exists
        const existingInquiry = await prisma.inquiries.findFirst({
            where: {
                contact_id: inquiry.contact_id,
                wedding_date: inquiry.wedding_date
            }
        });

        if (!existingInquiry) {
            const newInquiry = await prisma.inquiries.create({
                data: inquiry
            });
            inquiries.push(newInquiry);
            created += 1;
            const dateText = newInquiry.wedding_date ? newInquiry.wedding_date.toISOString().slice(0, 10) : 'no-date';
            logger.created(`Inquiry for contact ${newInquiry.contact_id} on ${dateText}`);
        } else {
            inquiries.push(existingInquiry);
            skipped += 1;
            const dateText = existingInquiry.wedding_date ? existingInquiry.wedding_date.toISOString().slice(0, 10) : 'no-date';
            logger.skipped(`Inquiry for contact ${existingInquiry.contact_id} on ${dateText}`);
        }
    }

    const summary: SeedSummary = { created, updated: 0, skipped, total: created + skipped };
    logger.summary('Inquiries', summary);

    // Summary by status
    const statusCounts = inquiries.reduce((acc, inquiry) => {
        acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    logger.sectionDivider('Inquiry Status Summary');
    Object.entries(statusCounts).forEach(([status, count]) => {
        logger.info(`${status}: ${count}`);
    });

    return {
        brand: moonriseBrand,
        contacts,
        inquiries,
        statusCounts,
        summary
    };
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Inquiries');

    try {
        const results = await createMoonriseInquiries();
        logger.sectionDivider('Summary');
        logger.success('Moonrise Inquiries seeding completed successfully!');
        logger.info(`${results.contacts.length} inquiry contacts processed`);
        logger.info(`${results.inquiries.length} inquiries processed`);
        logger.info(`Created: ${results.summary.created}, Skipped: ${results.summary.skipped}`);

    } catch (error) {
        logger.error(`Error seeding Moonrise inquiries: ${String(error)}`);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            logger.error(`Moonrise inquiries setup failed: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
