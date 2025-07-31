// Moonrise Films Inquiries Setup - Wedding Inquiries & Leads
// Creates: Sample wedding inquiries for Moonrise Films
import { PrismaClient, $Enums, inquiries } from "@prisma/client";

const prisma = new PrismaClient();

interface ContactType {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    company_name: string | null;
    type: $Enums.contacts_type;
    brand_id: number | null;
    archived_at: Date | null;
}

export async function createMoonriseInquiries() {
    console.log("📧 Creating Sample Inquiries for Moonrise Films...");

    // Find Moonrise Films brand
    const moonriseBrand = await prisma.brands.findFirst({
        where: { name: "Moonrise Films" }
    });

    if (!moonriseBrand) {
        throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
    }

    console.log(`✅ Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

    // Create sample inquiry contacts
    console.log("👥 Creating inquiry contacts...");

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

    const contacts: ContactType[] = [];
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

    console.log(`✅ Created ${contacts.length} inquiry contacts`);

    // Create wedding inquiries
    console.log("💍 Creating wedding inquiries...");

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

    const inquiries: inquiries[] = [];
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
        } else {
            inquiries.push(existingInquiry);
        }
    }

    console.log(`✅ Created ${inquiries.length} wedding inquiries`);

    // Summary by status
    const statusCounts = inquiries.reduce((acc, inquiry) => {
        acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Inquiry Status Summary:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count} inquiries`);
    });

    return {
        brand: moonriseBrand,
        contacts,
        inquiries,
        statusCounts
    };
}

async function main() {
    console.log("📧 Seeding Moonrise Films Inquiries...");
    console.log("");

    try {
        const results = await createMoonriseInquiries();

        console.log("");
        console.log("🎉 Moonrise Inquiries seeding completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   • ${results.contacts.length} inquiry contacts created`);
        console.log(`   • ${results.inquiries.length} wedding inquiries created for Moonrise Films`);
        console.log(`   • Lead sources: Instagram, Referral, Website, Wedding Expo, Google Search`);
        console.log(`   • Venues: Grand Ballroom, Lakeside Resort, Mountain View Lodge, Historic Manor, Beachfront Resort`);
        console.log("");

    } catch (error) {
        console.error("❌ Error seeding Moonrise inquiries:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Moonrise inquiries setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
