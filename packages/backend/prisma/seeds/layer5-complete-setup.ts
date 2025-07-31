// Layer5 Corporate Complete Setup - Orchestrates all Layer5 seed modules
// Runs all Layer5 seed modules in the correct order
import { createLayer5Brand } from './layer5-brand-setup';
import { createLayer5Team } from './layer5-team-setup';
import { createLayer5Clients } from './layer5-clients-setup';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🏢 Seeding Layer5 Corporate Videography - Complete Setup...");
    console.log("===============================================");

    try {
        // 1. Create Brand
        console.log("\n🏢 STEP 1: Brand Setup");
        const brand = await createLayer5Brand();

        // 2. Create Team
        console.log("\n👥 STEP 2: Team Setup");
        const team = await createLayer5Team(brand.id);

        // 3. Create Sample Clients
        console.log("\n🏢 STEP 3: Sample Clients Setup");
        const clients = await createLayer5Clients();

        // Final Summary
        console.log("\n🎉 =======================================");
        console.log("✅ Layer5 Corporate Videography Complete Setup Finished!");
        console.log("📊 Summary:");
        console.log(`   • 1 brand (${brand.name})`);
        console.log(`   • ${team.teamMembers.length} team members`);
        console.log(`   • ${clients.clients.length} sample corporate clients`);
        console.log("");
        console.log("🏢 Brand: Layer5 Corporate Videography");
        console.log("");
        console.log("👥 Team Members:");
        console.log("   🎬 Creative Director: Sarah Chen (sarah.chen@layer5video.com)");
        console.log("   📹 Senior Videographer: Marcus Rodriguez (marcus.rodriguez@layer5video.com)");
        console.log("   ✂️ Lead Editor: Emma Thompson (emma.thompson@layer5video.com)");
        console.log("   📋 Producer: David Kim (david.kim@layer5video.com)");
        console.log("");
        console.log("🏢 Sample Clients:");
        console.log("   • TechCorp Solutions");
        console.log("   • Healthcare Innovations Inc");
        console.log("   • Sustainable Energy Partners");
        console.log("");
        console.log("🔐 Team Member Login Credentials:");
        console.log("   📧 All members: [email] | 🔑 Password: [firstname]123");
        console.log("");
        console.log("🌐 Global Access:");
        console.log("   🌟 Global Admin: Daniel Hutchinson (from admin seed)");
        console.log("   📧 Global: info@dhutchinson.co.uk | 🔑 Password: Alined@2025");
        console.log("   🌟 Can access ALL brands including Layer5");
        console.log("");
        console.log("🎬 Services Focus:");
        console.log("   • Corporate Brand Videos");
        console.log("   • Training & Educational Content");
        console.log("   • Executive Communications");
        console.log("   • Product Demonstrations");
        console.log("   • Company Culture Videos");
        console.log("   • Event Coverage");
        console.log("");
        console.log("✨ Ready for professional corporate video production!");
        console.log("===============================================");

    } catch (error) {
        console.error("❌ Layer5 setup failed:", error);
        throw error;
    }
}

// Export the main function for use in other modules
export default main;

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Layer5 setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
