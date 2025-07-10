// Layer5 Corporate Videography Brand Seed - Complete Brand Setup
// Creates: Brand, team members, and settings for Layer5 Corporate Videography
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🏢 Seeding Layer5 Corporate Videography Brand (Complete Setup)...");
    console.log("");

    try {
        // --- 0. CREATE LAYER5 BRAND ---
        console.log("🏢 Creating Layer5 Brand...");

        const layer5Brand = await prisma.brands.upsert({
            where: { name: "Layer5" },
            update: {
                display_name: "Layer5 Corporate Videography",
                description: "Professional corporate video production specializing in brand storytelling, training videos, and executive communications",
                business_type: "Corporate",
                website: "https://layer5video.com",
                email: "contact@layer5video.com",
                phone: "+1 (555) 789-0123",
                address_line1: "456 Business District Ave",
                address_line2: "Suite 800",
                city: "Atlanta",
                state: "GA",
                country: "United States",
                postal_code: "30309",
                timezone: "America/New_York",
                currency: "USD",
                is_active: true,
            },
            create: {
                name: "Layer5",
                display_name: "Layer5 Corporate Videography",
                description: "Professional corporate video production specializing in brand storytelling, training videos, and executive communications",
                business_type: "Corporate",
                website: "https://layer5video.com",
                email: "contact@layer5video.com",
                phone: "+1 (555) 789-0123",
                address_line1: "456 Business District Ave",
                address_line2: "Suite 800",
                city: "Atlanta",
                state: "GA",
                country: "United States",
                postal_code: "30309",
                timezone: "America/New_York",
                currency: "USD",
                is_active: true,
            },
        });

        console.log(`✅ Layer5 Brand created/updated: ${layer5Brand.name} (ID: ${layer5Brand.id})`);
        console.log("");

        // --- 1. CREATE BRAND SETTINGS ---
        console.log("⚙️ Creating Layer5 Brand Settings...");

        const brandSettings = [
            {
                key: "default_project_type",
                value: "corporate_video",
                data_type: "string",
                category: "workflow",
                description: "Default project type for new projects"
            },
            {
                key: "client_portal_enabled",
                value: "true",
                data_type: "boolean",
                category: "general",
                description: "Enable client portal for project reviews"
            },
            {
                key: "auto_backup_enabled",
                value: "true",
                data_type: "boolean",
                category: "general",
                description: "Automatically backup project files"
            },
            {
                key: "default_video_format",
                value: "4K",
                data_type: "string",
                category: "production",
                description: "Default video format for deliverables"
            },
            {
                key: "standard_turnaround_days",
                value: "14",
                data_type: "number",
                category: "workflow",
                description: "Standard project turnaround time in days"
            },
            {
                key: "brand_colors",
                value: JSON.stringify({
                    primary: "#1976d2",
                    secondary: "#dc004e",
                    accent: "#ffd600"
                }),
                data_type: "json",
                category: "branding",
                description: "Brand color scheme"
            },
            {
                key: "service_packages",
                value: JSON.stringify([
                    "Corporate Brand Video",
                    "Training & Educational Content",
                    "Executive Communications",
                    "Product Demonstrations",
                    "Company Culture Videos",
                    "Event Coverage"
                ]),
                data_type: "json",
                category: "services",
                description: "Available service packages"
            }
        ];

        for (const setting of brandSettings) {
            await prisma.brand_settings.upsert({
                where: {
                    brand_id_key: {
                        brand_id: layer5Brand.id,
                        key: setting.key
                    }
                },
                update: {
                    value: setting.value,
                    data_type: setting.data_type,
                    category: setting.category,
                    description: setting.description,
                    is_active: true
                },
                create: {
                    brand_id: layer5Brand.id,
                    key: setting.key,
                    value: setting.value,
                    data_type: setting.data_type,
                    category: setting.category,
                    description: setting.description,
                    is_active: true
                }
            });
        }

        console.log(`✅ Created ${brandSettings.length} brand settings for Layer5`);
        console.log("");

        // --- 2. CREATE TEAM MEMBERS ---
        console.log("👥 Creating Layer5 Team Members...");

        const teamMembers = [
            {
                first_name: "Sarah",
                last_name: "Chen",
                email: "sarah.chen@layer5video.com",
                phone_number: "+1 (555) 789-0124",
                company_name: "Layer5 Corporate Videography",
                role: "Creative Director",
                department: "Creative"
            },
            {
                first_name: "Marcus",
                last_name: "Rodriguez",
                email: "marcus.rodriguez@layer5video.com",
                phone_number: "+1 (555) 789-0125",
                company_name: "Layer5 Corporate Videography",
                role: "Senior Video Producer",
                department: "Production"
            },
            {
                first_name: "Emma",
                last_name: "Thompson",
                email: "emma.thompson@layer5video.com",
                phone_number: "+1 (555) 789-0126",
                company_name: "Layer5 Corporate Videography",
                role: "Post-Production Specialist",
                department: "Post-Production"
            },
            {
                first_name: "David",
                last_name: "Kim",
                email: "david.kim@layer5video.com",
                phone_number: "+1 (555) 789-0127",
                company_name: "Layer5 Corporate Videography",
                role: "Account Manager",
                department: "Client Services"
            }
        ];

        for (const member of teamMembers) {
            // Create contact record
            const contact = await prisma.contacts.upsert({
                where: { email: member.email },
                update: {
                    first_name: member.first_name,
                    last_name: member.last_name,
                    phone_number: member.phone_number,
                    company_name: member.company_name,
                    type: $Enums.contacts_type.Contributor,
                    brand_id: layer5Brand.id
                },
                create: {
                    first_name: member.first_name,
                    last_name: member.last_name,
                    email: member.email,
                    phone_number: member.phone_number,
                    company_name: member.company_name,
                    type: $Enums.contacts_type.Contributor,
                    brand_id: layer5Brand.id
                }
            });

            // Create role first
            const role = await prisma.roles.upsert({
                where: { name: member.role },
                update: {
                    description: `${member.role} role for ${member.department}`,
                    brand_id: layer5Brand.id
                },
                create: {
                    name: member.role,
                    description: `${member.role} role for ${member.department}`,
                    brand_id: layer5Brand.id
                }
            });

            // Create contributor record
            const hashedPassword = await bcrypt.hash(`${member.first_name.toLowerCase()}123`, 10);

            const contributor = await prisma.contributors.upsert({
                where: { contact_id: contact.id },
                update: {
                    role_id: role.id,
                    password_hash: hashedPassword,
                    default_hourly_rate: 50.00
                },
                create: {
                    contact_id: contact.id,
                    role_id: role.id,
                    password_hash: hashedPassword,
                    default_hourly_rate: 50.00
                }
            });

            // Create user-brand association
            await prisma.user_brands.upsert({
                where: {
                    user_id_brand_id: {
                        user_id: contributor.id,
                        brand_id: layer5Brand.id
                    }
                },
                update: {
                    role: member.role === "Creative Director" ? "Admin" : "Member",
                    is_active: true
                },
                create: {
                    user_id: contributor.id,
                    brand_id: layer5Brand.id,
                    role: member.role === "Creative Director" ? "Admin" : "Member",
                    is_active: true
                }
            });

            console.log(`✅ Created team member: ${member.first_name} ${member.last_name} (${member.role})`);
        }

        console.log("");

        // --- 3. CREATE SAMPLE CLIENTS ---
        console.log("🏢 Creating Sample Corporate Clients...");

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

            // Create client (simpler structure based on schema)
            const client = await prisma.clients.upsert({
                where: { contact_id: contact.id },
                update: {
                    // No additional fields to update based on schema
                },
                create: {
                    contact_id: contact.id
                }
            });

            console.log(`✅ Created client: ${clientData.client.company_name} (Contact ID: ${contact.id}, Client ID: ${client.id})`);
        }

        console.log("");
        console.log("🎉 Layer5 Corporate Videography Brand setup completed successfully!");
        console.log("");
        console.log("📊 Summary:");
        console.log(`   • Brand: ${layer5Brand.name}`);
        console.log(`   • Settings: ${brandSettings.length} configured`);
        console.log(`   • Team Members: ${teamMembers.length} added`);
        console.log(`   • Sample Clients: ${sampleClients.length} created`);
        console.log("");
        console.log("🔑 Team Member Login Credentials:");
        console.log("   • sarah.chen@layer5video.com (Password: sarah123)");
        console.log("   • marcus.rodriguez@layer5video.com (Password: marcus123)");
        console.log("   • emma.thompson@layer5video.com (Password: emma123)");
        console.log("   • david.kim@layer5video.com (Password: david123)");
        console.log("");

    } catch (error) {
        console.error("❌ Error seeding Layer5 Brand:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => {
        console.log("✅ Layer5 Corporate Videography Brand seed completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Layer5 Brand seed failed:", error);
        process.exit(1);
    });
