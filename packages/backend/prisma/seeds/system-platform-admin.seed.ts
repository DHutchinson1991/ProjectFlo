// System Platform Seed - Infrastructure + Global Admin
// Creates: Timeline layers, Global Admin role, Daniel Hutchinson user (contact + contributor)
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.ADMIN);

async function main(db: PrismaClient): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('System Platform — Infrastructure & Admin');
    logger.startTimer('admin-seed');

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    try {
        // --- TIMELINE LAYERS ---
        logger.sectionDivider('System Infrastructure');
        logger.processing('Creating timeline layers...');

        const timelineLayers = [
            { name: "Video",    order_index: 1, color_hex: "#3B82F6", description: "Primary video track for main footage",               is_active: true },
            { name: "Audio",    order_index: 2, color_hex: "#10B981", description: "Audio track for ceremonies, vows, and ambient sound", is_active: true },
            { name: "Music",    order_index: 3, color_hex: "#8B5CF6", description: "Background music and soundtrack",                    is_active: true },
            { name: "Graphics", order_index: 4, color_hex: "#F59E0B", description: "Titles, overlays, and graphic elements",             is_active: true },
        ];

        let layersCreated = 0;
        let layersUpdated = 0;

        for (const layer of timelineLayers) {
            const existing = await prisma.timelineLayer.findUnique({ where: { name: layer.name } });
            if (existing) {
                await prisma.timelineLayer.update({
                    where: { name: layer.name },
                    data: { order_index: layer.order_index, color_hex: layer.color_hex, description: layer.description, is_active: layer.is_active },
                });
                layersUpdated++;
                logger.skipped(`Timeline layer "${layer.name}"`, 'already exists, updated', 'verbose');
            } else {
                await prisma.timelineLayer.create({ data: layer });
                layersCreated++;
                logger.created(`Timeline layer "${layer.name}"`, undefined, 'verbose');
            }
        }

        logger.smartSummary('Timeline layers', layersCreated, layersUpdated, timelineLayers.length);
        totalCreated += layersCreated;
        totalUpdated += layersUpdated;
        totalSkipped += (timelineLayers.length - layersCreated - layersUpdated);

        // --- GLOBAL ADMIN USER ---
        logger.sectionDivider('Global Admin User');
        logger.processing('Creating global admin user...');

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
        logger.processing('Creating Daniel Hutchinson (Global Admin)...');
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

        await prisma.contributors.upsert({
            where: { contact_id: danielContact.id },
            update: {
                role_id: globalAdminRole.id,
                password_hash: adminPassword,
                crew_color: "#7C3AED",
            },
            create: {
                contact_id: danielContact.id,
                role_id: globalAdminRole.id,
                password_hash: adminPassword,
                crew_color: "#7C3AED",
            },
        });

        // Track admin user/role creation (these are upserts, so they might be updates or creates)
        totalCreated += 2; // Assume created for summary purposes

        logger.success('Created global admin: Daniel Hutchinson');
        logger.info('Global Admin Details:', 'verbose');
        logger.info('  • Full name: Daniel Hutchinson', 'verbose');
        logger.info('  • Email: info@dhutchinson.co.uk', 'verbose');
        logger.info('  • Role: Global Admin', 'verbose');
        logger.info('  • Access: ALL brands and global settings', 'verbose');
        logger.info('  • Login password: Alined@2025', 'verbose');

        // Final Summary
        logger.success('Core System Setup Complete!');
        logger.endTimer('admin-seed', 'Admin system seeding');

        return {
            created: totalCreated,
            updated: totalUpdated,
            skipped: totalSkipped,
            total: totalCreated + totalUpdated + totalSkipped
        };
    } catch (error) {
        console.error("❌ System infrastructure setup failed:", error);
        throw error;
    }
}

export default main;
