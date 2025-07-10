// System Infrastructure Seed - Core System Setup + Global Admin
// Creates: Timeline layers, global admin user, and basic system infrastructure
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🏗️ Setting up Core System Infrastructure...");
    console.log("");

    try {
        // --- SYSTEM INFRASTRUCTURE ---
        console.log("🏗️ === SYSTEM INFRASTRUCTURE ===");

        // Create Timeline Layers
        console.log("🎬 Creating Timeline Layers...");
        const timelineLayers = [
            {
                name: "Video",
                order_index: 1,
                color_hex: "#3B82F6", // Blue
                description: "Primary video track for main footage",
                is_active: true,
            },
            {
                name: "Audio",
                order_index: 2,
                color_hex: "#10B981", // Green
                description: "Audio track for ceremonies, vows, and ambient sound",
                is_active: true,
            },
            {
                name: "Music",
                order_index: 3,
                color_hex: "#8B5CF6", // Purple
                description: "Background music and soundtrack",
                is_active: true,
            },
            {
                name: "Graphics",
                order_index: 4,
                color_hex: "#F59E0B", // Amber
                description: "Titles, overlays, and graphic elements",
                is_active: true,
            },
        ];

        for (const layer of timelineLayers) {
            await prisma.timelineLayer.upsert({
                where: { name: layer.name },
                update: {
                    order_index: layer.order_index,
                    color_hex: layer.color_hex,
                    description: layer.description,
                    is_active: layer.is_active,
                },
                create: layer,
            });
        }
        console.log(`  ✓ Created ${timelineLayers.length} timeline layers`);

        // --- GLOBAL ADMIN USER ---
        console.log("👑 Creating Global Admin User...");

        // Create global Admin role (not tied to any specific brand)
        const globalAdminRole = await prisma.roles.upsert({
            where: { name: "Global Admin" },
            update: {
                description: "System-wide administrator with access to all brands and global settings.",
                brand_id: null, // Global role, not tied to a specific brand
            },
            create: {
                name: "Global Admin",
                description: "System-wide administrator with access to all brands and global settings.",
                brand_id: null, // Global role, not tied to a specific brand
            },
        });

        // Hash admin password
        const adminPassword = await bcrypt.hash("Alined@2025", 10);

        // Create Daniel Hutchinson (Global Admin)
        console.log("👤 Creating Daniel Hutchinson (Global Admin)...");
        const danielContact = await prisma.contacts.upsert({
            where: { email: "info@dhutchinson.co.uk" },
            update: {
                first_name: "Daniel",
                last_name: "Hutchinson",
                type: $Enums.contacts_type.Contributor,
                brand_id: null, // Global admin, not tied to specific brand
            },
            create: {
                first_name: "Daniel",
                last_name: "Hutchinson",
                email: "info@dhutchinson.co.uk",
                type: $Enums.contacts_type.Contributor,
                brand_id: null, // Global admin, not tied to specific brand
            },
        });

        const danielContributor = await prisma.contributors.upsert({
            where: { contact_id: danielContact.id },
            update: {
                role_id: globalAdminRole.id,
                default_hourly_rate: 50.0,
                password_hash: adminPassword,
                contributor_type: "Internal",
            },
            create: {
                contact_id: danielContact.id,
                role_id: globalAdminRole.id,
                default_hourly_rate: 50.0,
                password_hash: adminPassword,
                contributor_type: "Internal",
            },
        });

        console.log(`  ✓ Created global admin: Daniel Hutchinson`);
        console.log("    👑 Can access ALL brands and global settings");
        console.log("");

        // Final Summary
        console.log("");
        console.log("🎉 =======================================");
        console.log("✅ Core System Setup Complete!");
        console.log("📊 Summary:");
        console.log("   • 1 Global Admin user");
        console.log("   • 1 Global Admin role");
        console.log(`   • ${timelineLayers.length} Timeline layers`);
        console.log("");
        console.log("🔐 Global Admin Login:");
        console.log("   👑 Global Admin:");
        console.log("      📧 Email: info@dhutchinson.co.uk");
        console.log("      🔑 Password: Alined@2025");
        console.log("      🌐 Access: ALL brands + global settings");
        console.log("");
        console.log("🏗️ Infrastructure Created:");
        console.log("   • Video, Audio, Music, Graphics timeline layers");
        console.log("");
        console.log("🔧 Next Steps:");
        console.log("   1. Run moonrise-films-seed.ts for brand setup");
        console.log("   2. Brand managers will be created there");
        console.log("");
        console.log("💡 Global admin can access all brands");
        console.log("   Brand-specific users are in brand seed files");
        console.log("=======================================");
    } catch (error) {
        console.error("❌ System infrastructure setup failed:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error("❌ System infrastructure setup failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
