// Moonrise Films Inquiries Setup - Wedding Inquiries & Leads
// Creates: Sample wedding inquiries for Moonrise Films
import { PrismaClient, $Enums, type inquiries as Inquiry, type contacts as Contact, type brands as Brand } from "@prisma/client";
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
        {
            first_name: "Jennifer",
            last_name: "Williams",
            email: "jennifer.williams@email.com",
            phone_number: "+1 (555) 876-5432"
        },
        {
            first_name: "Michael",
            last_name: "Rodriguez",
            email: "michael.rodriguez@email.com",
            phone_number: "+1 (555) 987-6543"
        },
        {
            first_name: "Amanda",
            last_name: "Thompson",
            email: "amanda.thompson@email.com",
            phone_number: "+1 (555) 765-4321"
        },
        {
            first_name: "Ryan",
            last_name: "Davis",
            email: "ryan.davis@email.com",
            phone_number: "+1 (555) 654-3210"
        },
        {
            first_name: "Jessica",
            last_name: "Miller",
            email: "jessica.miller@email.com",
            phone_number: "+1 (555) 543-2109"
        }
    ];

    const contacts: Contact[] = [];
    for (const contactData of inquiryContacts) {
        const contact = await prisma.contacts.upsert({
            where: { email: contactData.email },
            update: contactData,
            create: {
                ...contactData,
                type: $Enums.contacts_type.Client_Lead,
                brand_id: moonriseBrand.id
            }
        });
        contacts.push(contact);
    }

    logger.success(`Upserted ${contacts.length} inquiry contacts`);

    // Create wedding inquiries
    logger.sectionDivider('Creating wedding inquiries');

    const inquiryData = [
        {
            contact_id: contacts[0].id,
            status: $Enums.inquiries_status.New,
            wedding_date: new Date("2025-11-15T16:00:00Z"),
            venue_details: "The Grand Ballroom - Downtown Metro City",
            lead_source: "Instagram"
        },
        {
            contact_id: contacts[1].id,
            status: $Enums.inquiries_status.Contacted,
            wedding_date: new Date("2025-12-03T15:30:00Z"),
            venue_details: "Lakeside Resort - Clearwater Lake",
            lead_source: "Referral"
        },
        {
            contact_id: contacts[2].id,
            status: $Enums.inquiries_status.Proposal_Sent,
            wedding_date: new Date("2025-08-21T17:00:00Z"),
            venue_details: "Mountain View Lodge - Blue Ridge Mountains",
            lead_source: "Website"
        },
        {
            contact_id: contacts[3].id,
            status: $Enums.inquiries_status.New,
            wedding_date: new Date("2025-10-05T16:30:00Z"),
            venue_details: "Historic Manor House - Countryside Estate",
            lead_source: "Wedding Expo"
        },
        {
            contact_id: contacts[4].id,
            status: $Enums.inquiries_status.Proposal_Sent,
            wedding_date: new Date("2025-09-28T18:00:00Z"),
            venue_details: "Beachfront Resort - Sunset Bay",
            lead_source: "Google Search"
        }
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
