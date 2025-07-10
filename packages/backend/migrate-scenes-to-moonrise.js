// Migration script to associate existing scenes with Moonrise Films brand
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Migrating existing scenes to Moonrise Films brand...');

    try {
        // Get Moonrise Films brand
        const moonriseBrand = await prisma.brands.findFirst({
            where: { name: 'Moonrise Films' }
        });

        if (!moonriseBrand) {
            console.error('❌ Moonrise Films brand not found. Please run moonrise-films-seed.ts first.');
            return;
        }

        console.log(`📍 Found Moonrise Films brand (ID: ${moonriseBrand.id})`);

        // Get all scenes that should belong to Moonrise Films
        const moonriseSceneNames = [
            'Ceremony Processional',
            'Vows Exchange',
            'Ceremony Recessional',
            'First Dance Sequence',
            'Ceremony Audio',
            'First Dance Audio',
            'Ambient Sound',
            'Background Music'
        ];

        // Update scenes to associate with Moonrise Films
        for (const sceneName of moonriseSceneNames) {
            const scene = await prisma.scenesLibrary.findFirst({
                where: { name: sceneName }
            });

            if (scene && scene.brand_id === null) {
                await prisma.scenesLibrary.update({
                    where: { id: scene.id },
                    data: { brand_id: moonriseBrand.id }
                });
                console.log(`  ✓ Updated "${sceneName}" to belong to Moonrise Films`);
            } else if (scene && scene.brand_id === moonriseBrand.id) {
                console.log(`  ⚠️ Scene "${sceneName}" already belongs to Moonrise Films`);
            } else if (!scene) {
                console.log(`  ⚠️ Scene "${sceneName}" not found in database`);
            }
        }

        // Show summary
        const moonriseScenes = await prisma.scenesLibrary.findMany({
            where: { brand_id: moonriseBrand.id }
        });

        const globalScenes = await prisma.scenesLibrary.findMany({
            where: { brand_id: null }
        });

        console.log('');
        console.log('📊 Migration Summary:');
        console.log(`   • Moonrise Films scenes: ${moonriseScenes.length}`);
        console.log(`   • Global scenes: ${globalScenes.length}`);
        console.log('');
        console.log('✅ Scene migration completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
