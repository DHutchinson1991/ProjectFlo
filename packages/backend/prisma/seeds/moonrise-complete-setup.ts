// Moonrise Films Complete Setup - Orchestrates all seed modules
// Runs all moonrise seed modules in the correct order
import { createMoonriseBrand } from './moonrise-brand-setup';
import { createMoonriseTeam } from './moonrise-team-setup';
import { createMoonriseScenes } from './moonrise-scenes-setup';
import { createMoonriseFilmLibrary } from './moonrise-film-library';
import { createMoonriseTaskLibrary } from './moonrise-task-library';
import { createMoonriseCoverageLibrary, assignCoverageToScenes } from './moonrise-coverage-library';
import { createMoonriseProjects } from './moonrise-projects-setup';
import { createMoonriseInquiries } from './moonrise-inquiries-setup';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🏢 Seeding Moonrise Films - Complete Setup...");
    console.log("===============================================");

    try {
        // 1. Create Brand
        console.log("\n🏢 STEP 1: Brand Setup");
        const brand = await createMoonriseBrand();

        // 2. Create Team
        console.log("\n👥 STEP 2: Team Setup");
        const team = await createMoonriseTeam(brand.id);

        // 3. Create Scenes
        console.log("\n🎬 STEP 3: Scenes Setup");
        await createMoonriseScenes(brand.id);

        // 4. Create Film Library
        console.log("\n📚 STEP 4: Film Library Setup");
        const filmCount = await createMoonriseFilmLibrary(brand.id);

        // 5. Create Task Library
        console.log("\n📋 STEP 5: Task Library Setup");
        const taskCount = await createMoonriseTaskLibrary(brand.id);

        // 6. Create Coverage Library
        console.log("\n🎬 STEP 6: Coverage Library Setup");
        const coverageStats = await createMoonriseCoverageLibrary();

        // 7. Assign Coverage to Scenes
        console.log("\n🎯 STEP 7: Scene Coverage Assignments");
        const assignmentCount = await assignCoverageToScenes();

        // 8. Create Sample Projects
        console.log("\n💒 STEP 8: Sample Projects Setup");
        const projectsResult = await createMoonriseProjects();

        // 9. Create Sample Inquiries
        console.log("\n📧 STEP 9: Sample Inquiries Setup");
        const inquiriesResult = await createMoonriseInquiries();

        // Final Summary
        console.log("\n🎉 =======================================");
        console.log("✅ Moonrise Films Complete Setup Finished!");
        console.log("📊 Summary:");
        console.log(`   • 1 brand (${brand.name})`);
        console.log(`   • ${team.teamMembers.length} team members (Managers)`);
        console.log(`   • 2 wedding scenes (First Dance + Ceremony)`);
        console.log(`   • ${filmCount} film library items`);
        console.log(`   • ${taskCount} task library items`);
        console.log(`   • ${coverageStats.totalCoverage} coverage items (${coverageStats.videoCoverageCount} video + ${coverageStats.audioCoverageCount} audio)`);
        console.log(`   • ${assignmentCount} scene coverage assignments`);
        console.log(`   • ${projectsResult.projects.length} sample wedding projects`);
        console.log(`   • ${inquiriesResult.inquiries.length} sample wedding inquiries`);
        console.log("");
        console.log("🏢 Brand: Moonrise Films (Premium Wedding Videography)");
        console.log("");
        console.log("👥 Brand Team Members:");
        console.log("   🧑‍💼 Manager: Andy Galloway (andy.galloway@projectflo.co.uk)");
        console.log("   👥 Manager: Corri Lee (corri.lee@projectflo.co.uk)");
        console.log("");
        console.log("📋 Sample Data:");
        console.log(`   • Projects: Sarah & Michael's Garden Wedding, Emily & David's Vineyard Celebration`);
        console.log(`   • Inquiries: 5 wedding leads from various sources (Instagram, Referral, Website, etc.)`);
        console.log("");
        console.log("🔐 Brand Team Login:");
        console.log("   📧 Andy/Corri: [email] | 🔑 Password: Manager@2025");
        console.log("");
        console.log("🌐 Global Access:");
        console.log("   🌟 Global Admin: Daniel Hutchinson (from admin seed)");
        console.log("   📧 Global: info@dhutchinson.co.uk | 🔑 Password: Alined@2025");
        console.log("   🌟 Can access ALL brands including Moonrise Films");
        console.log("");
        console.log("🎬 Content Created:");
        console.log("   • First Dance Film");
        console.log("   • Ceremony Film");
        console.log("   • 2 scenes each with video, audio, and music components");
        console.log("   • 26 coverage items (video shots + audio techniques)");
        console.log("   • Scene-specific coverage assignments for ceremony and first dance");
        console.log("");
        console.log("✨ Ready for comprehensive wedding film workflow!");
        console.log("=======================================");

    } catch (error) {
        console.error("❌ Moonrise Films setup failed:", error);
        throw error;
    }
}

// Export the main function for use in other modules
export default main;

if (require.main === module) {
    main()
        .catch((e) => {
            console.error("❌ Moonrise Films setup failed:", e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
