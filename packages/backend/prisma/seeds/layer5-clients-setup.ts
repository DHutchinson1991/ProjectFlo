// Layer5 Corporate Clients Setup - Sample Corporate Clients
// Creates: Sample corporate clients for Layer5
import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

export async function createLayer5Clients() {
    console.log("🏢 Creating Sample Corporate Clients for Layer5...");

    // Find Layer5 brand
    const layer5Brand = await prisma.brands.findFirst({
        where: { name: "Layer5" }
    });

    if (!layer5Brand) {
        throw new Error("Layer5 brand not found. Please run layer5-brand-setup.ts first.");
    }

    console.log(`✅ Found Layer5 brand (ID: ${layer5Brand.id})`);

    const sampleClients = [
        {
            contact: {
                first_name: "Jennifer",
                last_name: "Walsh",
                email: "jennifer.walsh@techcorp.com",
                phone_number: "+1 (404) 555-0100",
                company_name: "TechCorp Solutions"
            },
            client: {
                company_name: "TechCorp Solutions"
            }
        },
        {
            contact: {
                first_name: "Michael",
                last_name: "Johnson",
                email: "michael.johnson@healthcare-innovations.com",
                phone_number: "+1 (404) 555-0200",
                company_name: "Healthcare Innovations Inc"
            },
            client: {
                company_name: "Healthcare Innovations Inc"
            }
        },
        {
            contact: {
                first_name: "Lisa",
                last_name: "Anderson",
                email: "lisa.anderson@sustainableenergy.com",
                phone_number: "+1 (404) 555-0300",
                company_name: "Sustainable Energy Partners"
            },
            client: {
                company_name: "Sustainable Energy Partners"
            }
        }
    ];

    const createdClients: unknown[] = [];

    for (const clientData of sampleClients) {
        // Create contact
        const contact = await prisma.contacts.upsert({
            where: { email: clientData.contact.email },
            update: {
                first_name: clientData.contact.first_name,
                last_name: clientData.contact.last_name,
                phone_number: clientData.contact.phone_number,
                company_name: clientData.contact.company_name,
                type: $Enums.contacts_type.Client,
                brand_id: layer5Brand.id
            },
            create: {
                first_name: clientData.contact.first_name,
                last_name: clientData.contact.last_name,
                email: clientData.contact.email,
                phone_number: clientData.contact.phone_number,
                company_name: clientData.contact.company_name,
                type: $Enums.contacts_type.Client,
                brand_id: layer5Brand.id
            }
        });

        // Create client
        const client = await prisma.clients.upsert({
            where: { contact_id: contact.id },
            update: {},
            create: {
                contact_id: contact.id
            }
        });

        createdClients.push({
            contact,
            client,
            companyName: clientData.client.company_name
        });

        console.log(`✅ Created client: ${clientData.client.company_name} (Contact ID: ${contact.id}, Client ID: ${client.id})`);
    }

    return {
        brand: layer5Brand,
        clients: createdClients
    };
}

async function main() {
    console.log("🏢 Seeding Layer5 Clients...");
    console.log("");

    try {
        const results = await createLayer5Clients();

        console.log("");
        console.log("🎉 Layer5 Clients setup completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   • ${results.clients.length} corporate clients created for Layer5`);
        console.log(`   • Companies: TechCorp Solutions, Healthcare Innovations Inc, Sustainable Energy Partners`);
        console.log("");

    } catch (error) {
        console.error("❌ Error seeding Layer5 clients:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Layer5 clients setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
