// Admin Account + System Infrastructure Seed
// Creates: Admin user, timeline layers, and basic system infrastructure
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    console.log("🚀 Setting up Admin Account + System Infrastructure...");
    console.log("");

    try {
        // --- 1. ADMIN ACCOUNT SETUP ---
        console.log("👑 === ADMIN ACCOUNT SETUP ===");

        // Create Admin role
        console.log("📋 Creating Admin Role...");
        const adminRole = await prisma.roles.upsert({
            where: { name: "Admin" },
            update: {
                description: "Full system access. Manages settings, users, and finances.",
            },
            create: {
                name: "Admin",
                description: "Full system access. Manages settings, users, and finances.",
            },
        });
        console.log("  ✓ Admin role created/updated");

        // Hash the password
        const hashedPassword = await bcrypt.hash("Alined@2025", SALT_ROUNDS);

        // Create admin contact
        console.log("👤 Creating Admin Contact...");
        const contact = await prisma.contacts.upsert({
            where: { email: "info@dhutchinson.co.uk" },
            update: {
                first_name: "Daniel",
                last_name: "Hutchinson",
                type: $Enums.contacts_type.Contributor,
            },
            create: {
                first_name: "Daniel",
                last_name: "Hutchinson",
                email: "info@dhutchinson.co.uk",
                type: $Enums.contacts_type.Contributor,
            },
        });
        console.log("  ✓ Admin contact created/updated");

        // Create admin contributor
        console.log("🔧 Creating Admin Contributor...");
        await prisma.contributors.upsert({
            where: { contact_id: contact.id },
            update: {
                role_id: adminRole.id,
                default_hourly_rate: 50.0,
                password_hash: hashedPassword,
            },
            create: {
                contact_id: contact.id,
                role_id: adminRole.id,
                default_hourly_rate: 50.0,
                password_hash: hashedPassword,
            },
        });
        console.log("  ✓ Admin contributor created/updated");
        console.log("  📧 Email: info@dhutchinson.co.uk");
        console.log("  🔑 Password: Alined@2025");

        // --- 2. SYSTEM INFRASTRUCTURE ---
        console.log("");
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

        // Final Summary
        console.log("");
        console.log("🎉 =======================================");
        console.log("✅ Setup Complete!");
        console.log("📊 Summary:");
        console.log("   • 1 Admin account (info@dhutchinson.co.uk)");
        console.log("   • 1 Admin role");
        console.log(`   • ${timelineLayers.length} Timeline layers`);
        console.log("");
        console.log("🔐 Login Details:");
        console.log("   📧 Email: info@dhutchinson.co.uk");
        console.log("   🔑 Password: Alined@2025");
        console.log("");
        console.log("💡 Run wedding-film-seed.ts for wedding content");
        console.log("=======================================");

    } catch (error) {
        console.error("❌ Setup failed:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error("❌ Setup failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
