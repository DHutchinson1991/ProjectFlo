#!/usr/bin/env node

// Migrate Films to Brand 1 (Moonrise Films)
// Updates all existing films to be associated with brand_id: 1

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("🎬 Migrating Films to Moonrise Films Brand...");
    console.log("");

    try {
        // Check current films
        const allFilms = await prisma.filmLibrary.findMany();
        console.log(`📊 Found ${allFilms.length} films in database`);

        // Show current state
        console.log("\n📋 Current Films State:");
        for (const film of allFilms) {
            console.log(`  • ID ${film.id}: "${film.name}" - brand_id: ${film.brand_id || 'NULL'}`);
        }

        // Update all films without brand_id to belong to brand 1 (Moonrise Films)
        const updateResult = await prisma.filmLibrary.updateMany({
            where: {
                brand_id: null
            },
            data: {
                brand_id: 1 // Moonrise Films
            }
        });

        console.log(`\n✅ Updated ${updateResult.count} films to belong to Moonrise Films (brand_id: 1)`);

        // Verify the update
        const updatedFilms = await prisma.filmLibrary.findMany({
            include: {
                brand: true
            }
        });

        console.log("\n📋 Updated Films State:");
        for (const film of updatedFilms) {
            console.log(`  • ID ${film.id}: "${film.name}" - brand: ${film.brand?.name || 'No Brand'} (ID: ${film.brand_id})`);
        }

        console.log("");
        console.log("🎉 Films migration completed successfully!");
        console.log(`📊 All ${updatedFilms.length} films are now associated with brands`);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error("❌ Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
