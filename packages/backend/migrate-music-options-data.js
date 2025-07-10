#!/usr/bin/env node

/**
 * Data Migration Script: SceneMusicOption → SceneMediaComponent
 * Transfers existing music options data to the unified media component structure
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateSceneMusicOptions() {
    console.log('🎵 Starting SceneMusicOption → SceneMediaComponent migration...\n');

    try {
        // Step 1: Check if there are any SceneMusicOptions to migrate
        const musicOptionsCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM scene_music_options
        `;
        const originalCount = parseInt(musicOptionsCount[0].count);

        console.log(`📊 Found ${originalCount} music options to migrate`);

        if (originalCount === 0) {
            console.log('✅ No music options found to migrate. Migration complete!');
            return;
        }

        // Step 2: Check existing SceneMediaComponent music entries
        const existingMusicComponents = await prisma.sceneMediaComponent.count({
            where: { media_type: 'MUSIC' }
        });

        console.log(`📊 Existing music components: ${existingMusicComponents}`);

        // Step 3: Migrate data using raw SQL for better control
        console.log('🔄 Migrating music options data...');

        const migrationResult = await prisma.$executeRaw`
            INSERT INTO scene_media_components (
                scene_id,
                media_type,
                duration_seconds,
                is_primary,
                music_type,
                music_weight,
                notes,
                created_at,
                updated_at
            )
            SELECT 
                smo.scene_id,
                'MUSIC'::media_type as media_type,
                COALESCE(sl.estimated_duration, 30) as duration_seconds,
                false as is_primary,
                smo.music_type::text as music_type,
                smo.weight as music_weight,
                'Migrated from SceneMusicOption' as notes,
                NOW() as created_at,
                NOW() as updated_at
            FROM scene_music_options smo
            JOIN scenes_library sl ON smo.scene_id = sl.id
            WHERE NOT EXISTS (
                SELECT 1 FROM scene_media_components smc 
                WHERE smc.scene_id = smo.scene_id 
                AND smc.media_type = 'MUSIC'
                AND smc.music_type = smo.music_type::text
            )
        `;

        console.log(`✅ Migrated ${migrationResult} music option records`);

        // Step 4: Verify migration
        const newMusicComponents = await prisma.sceneMediaComponent.count({
            where: { media_type: 'MUSIC' }
        });

        console.log(`📊 Total music components after migration: ${newMusicComponents}`);

        // Step 5: Show sample migrated data
        const sampleMigrated = await prisma.sceneMediaComponent.findMany({
            where: {
                media_type: 'MUSIC',
                notes: 'Migrated from SceneMusicOption'
            },
            take: 3,
            include: {
                scene: {
                    select: { id: true, name: true }
                }
            }
        });

        if (sampleMigrated.length > 0) {
            console.log('\n📋 Sample migrated records:');
            sampleMigrated.forEach(comp => {
                console.log(`  - Scene "${comp.scene.name}" (ID: ${comp.scene_id}): ${comp.music_type} (weight: ${comp.music_weight})`);
            });
        }

        // Step 6: Check for any remaining issues
        const duplicateCheck = await prisma.$queryRaw`
            SELECT scene_id, music_type, COUNT(*) as count 
            FROM scene_media_components 
            WHERE media_type = 'MUSIC' 
            GROUP BY scene_id, music_type 
            HAVING COUNT(*) > 1
        `;

        if (duplicateCheck.length > 0) {
            console.log('\n⚠️  Warning: Found duplicate music components:');
            duplicateCheck.forEach(dup => {
                console.log(`  - Scene ${dup.scene_id}, Music Type ${dup.music_type}: ${dup.count} entries`);
            });
        } else {
            console.log('\n✅ No duplicates found');
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Update backend service methods to use SceneMediaComponent');
        console.log('  2. Test all music-related functionality');
        console.log('  3. When ready, drop the scene_music_options table');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
if (require.main === module) {
    migrateSceneMusicOptions()
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateSceneMusicOptions };
