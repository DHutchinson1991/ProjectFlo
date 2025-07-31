// Layer5 Corporate Team Setup - Team Members and Roles
// Creates: Layer5 team members with corporate video expertise
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface TeamMember {
    contact: unknown;
    contributor: unknown;
    role: string;
    skills: string[];
}

export async function createLayer5Team(brandId: number) {
    console.log("👥 Creating Layer5 Team Members...");

    // Find Layer5 brand if not provided
    let layer5Brand;
    if (brandId) {
        layer5Brand = await prisma.brands.findUnique({ where: { id: brandId } });
    } else {
        layer5Brand = await prisma.brands.findFirst({ where: { name: "Layer5" } });
    }

    if (!layer5Brand) {
        throw new Error("Layer5 brand not found. Please run layer5-brand-setup.ts first.");
    }

    console.log(`✅ Found Layer5 brand (ID: ${layer5Brand.id})`);

    const teamMembers = [
        {
            first_name: "Sarah",
            last_name: "Chen",
            email: "sarah.chen@layer5video.com",
            role: "Creative Director",
            skills: ["Creative Direction", "Brand Strategy", "Client Relations", "Project Management"],
            password: "sarah123"
        },
        {
            first_name: "Marcus",
            last_name: "Rodriguez",
            email: "marcus.rodriguez@layer5video.com",
            role: "Senior Videographer",
            skills: ["Cinematography", "Multi-Camera Setup", "Corporate Events", "Interview Lighting"],
            password: "marcus123"
        },
        {
            first_name: "Emma",
            last_name: "Thompson",
            email: "emma.thompson@layer5video.com",
            role: "Lead Editor",
            skills: ["Video Editing", "Motion Graphics", "Color Grading", "Audio Post-Production"],
            password: "emma123"
        },
        {
            first_name: "David",
            last_name: "Kim",
            email: "david.kim@layer5video.com",
            role: "Producer",
            skills: ["Production Management", "Budget Planning", "Vendor Relations", "Quality Assurance"],
            password: "david123"
        }
    ];

    const createdTeamMembers: TeamMember[] = [];

    for (const member of teamMembers) {
        // Hash password
        const hashedPassword = await bcrypt.hash(member.password, 10);

        // Create contact
        const contact = await prisma.contacts.upsert({
            where: { email: member.email },
            update: {
                first_name: member.first_name,
                last_name: member.last_name,
                type: $Enums.contacts_type.Contributor,
                brand_id: layer5Brand.id
            },
            create: {
                first_name: member.first_name,
                last_name: member.last_name,
                email: member.email,
                type: $Enums.contacts_type.Contributor,
                brand_id: layer5Brand.id
            }
        });

        // Create contributor
        const contributor = await prisma.contributors.upsert({
            where: { contact_id: contact.id },
            update: {
                contributor_type: $Enums.contributors_type.Internal,
                default_hourly_rate: member.role === "Creative Director" ? 150.00 :
                    member.role === "Senior Videographer" ? 125.00 :
                        member.role === "Lead Editor" ? 100.00 : 85.00,
                password_hash: hashedPassword
            },
            create: {
                contact_id: contact.id,
                contributor_type: $Enums.contributors_type.Internal,
                default_hourly_rate: member.role === "Creative Director" ? 150.00 :
                    member.role === "Senior Videographer" ? 125.00 :
                        member.role === "Lead Editor" ? 100.00 : 85.00,
                password_hash: hashedPassword
            }
        });

        createdTeamMembers.push({
            contact,
            contributor,
            role: member.role,
            skills: member.skills
        });

        console.log(`✅ Created team member: ${member.first_name} ${member.last_name} (${member.role})`);
    }

    return {
        brand: layer5Brand,
        teamMembers: createdTeamMembers
    };
}

async function main() {
    console.log("👥 Seeding Layer5 Team...");
    console.log("");

    try {
        const result = await createLayer5Team(0); // Will find brand automatically

        console.log("");
        console.log("🎉 Layer5 Team setup completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   • ${result.teamMembers.length} team members created`);
        console.log(`   • Roles: Creative Director, Senior Videographer, Lead Editor, Producer`);
        console.log("");
        console.log("🔑 Team Member Login Credentials:");
        console.log("   • sarah.chen@layer5video.com (Password: sarah123)");
        console.log("   • marcus.rodriguez@layer5video.com (Password: marcus123)");
        console.log("   • emma.thompson@layer5video.com (Password: emma123)");
        console.log("   • david.kim@layer5video.com (Password: david123)");
        console.log("");

    } catch (error) {
        console.error("❌ Error seeding Layer5 team:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Layer5 team setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
