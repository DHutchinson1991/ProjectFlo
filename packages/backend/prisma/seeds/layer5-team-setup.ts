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

        // Assign a distinct crew colour per role
        const crewColorMap: Record<string, string> = {
            "Creative Director":   "#D97706",
            "Senior Videographer": "#059669",
            "Lead Editor":         "#7C3AED",
            "Producer":            "#DC2626",
        };
        const crewColor = crewColorMap[member.role] ?? "#2563EB";

        // Create contributor
        const contributor = await prisma.contributors.upsert({
            where: { contact_id: contact.id },
            update: {
                contributor_type: $Enums.contributors_type.Internal,
                default_hourly_rate: member.role === "Creative Director" ? 150.00 :
                    member.role === "Senior Videographer" ? 125.00 :
                        member.role === "Lead Editor" ? 100.00 : 85.00,
                password_hash: hashedPassword,
                is_crew: true,
                crew_color: crewColor,
            },
            create: {
                contact_id: contact.id,
                contributor_type: $Enums.contributors_type.Internal,
                default_hourly_rate: member.role === "Creative Director" ? 150.00 :
                    member.role === "Senior Videographer" ? 125.00 :
                        member.role === "Lead Editor" ? 100.00 : 85.00,
                password_hash: hashedPassword,
                is_crew: true,
                crew_color: crewColor,
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

    // ── Crew Job Role Assignments ─────────────────────────────────────────────
    console.log('\n📋 Assigning crew job roles to Layer5 team...');

    const [directorRole, videographerRole, editorRole, producerRole] = await Promise.all([
        prisma.job_roles.findUnique({ where: { name: 'director' } }),
        prisma.job_roles.findUnique({ where: { name: 'videographer' } }),
        prisma.job_roles.findUnique({ where: { name: 'editor' } }),
        prisma.job_roles.findUnique({ where: { name: 'producer' } }),
    ]);

    // Helper: find a bracket, returning null if not yet seeded
    async function findBracket(jobRoleId: number | undefined, tierName: string) {
        if (!jobRoleId) return null;
        const bracket = await prisma.payment_brackets.findUnique({
            where: { job_role_id_name: { job_role_id: jobRoleId, name: tierName } },
        });
        return bracket?.id ?? null;
    }

    // Role → job_role + tier mapping
    const roleMap: Record<string, { jobRole: typeof directorRole; tier: string }> = {
        'Creative Director':    { jobRole: directorRole,    tier: 'lead'   },
        'Senior Videographer':  { jobRole: videographerRole, tier: 'senior' },
        'Lead Editor':          { jobRole: editorRole,      tier: 'lead'   },
        'Producer':             { jobRole: producerRole,    tier: 'senior' },
    };

    for (const member of createdTeamMembers) {
        const mapping = roleMap[member.role as string];
        if (!mapping?.jobRole) continue;

        const { jobRole, tier } = mapping;
        const bracketId = await findBracket(jobRole.id, tier);
        const contributorId = (member.contributor as { id: number }).id;

        await prisma.contributor_job_roles.upsert({
            where: { contributor_id_job_role_id: { contributor_id: contributorId, job_role_id: jobRole.id } },
            update: { is_primary: true, payment_bracket_id: bracketId },
            create: { contributor_id: contributorId, job_role_id: jobRole.id, is_primary: true, payment_bracket_id: bracketId },
        });

        const contactName = `${(member.contact as { first_name: string }).first_name} ${(member.contact as { last_name: string }).last_name}`;
        console.log(`  ✅ ${contactName} → ${jobRole.display_name ?? jobRole.name} (${tier})`);
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
