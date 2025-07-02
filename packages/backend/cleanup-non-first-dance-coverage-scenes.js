const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupNonFirstDanceCoverageScenes() {
    console.log('🧹 Starting cleanup of non-First Dance coverage scenes...');

    try {
        // Get all coverage scenes
        console.log('\n📋 Current coverage scenes:');
        const allCoverageScenes = await prisma.coverage_scenes.findMany({
            orderBy: { id: 'asc' }
        });

        console.log(`Total coverage scenes: ${allCoverageScenes.length}`);

        allCoverageScenes.forEach(scene => {
            const isFirstDance = scene.name.includes('First Dance');
            const icon = isFirstDance ? '✅' : '🗑️';
            console.log(`  ${icon} ID ${scene.id.toString().padStart(2)}: ${scene.name}`);
        });

        // Identify coverage scenes to keep (First Dance only)
        const scenesToKeep = allCoverageScenes.filter(scene =>
            scene.name.includes('First Dance')
        );

        // Identify coverage scenes to remove (everything else)
        const scenesToRemove = allCoverageScenes.filter(scene =>
            !scene.name.includes('First Dance')
        );

        console.log(`\n📊 Cleanup Plan:`);
        console.log(`✅ Keeping ${scenesToKeep.length} First Dance coverage scene(s)`);
        console.log(`🗑️  Removing ${scenesToRemove.length} non-First Dance coverage scenes`);

        // Show what we're keeping
        if (scenesToKeep.length > 0) {
            console.log(`\n✅ Coverage scenes to KEEP:`);
            scenesToKeep.forEach(scene => {
                console.log(`   ID ${scene.id.toString().padStart(2)}: ${scene.name}`);
            });
        }

        // Show what we're removing
        if (scenesToRemove.length > 0) {
            console.log(`\n🗑️  Coverage scenes to REMOVE:`);
            scenesToRemove.forEach(scene => {
                console.log(`   ID ${scene.id.toString().padStart(2)}: ${scene.name}`);
            });

            console.log(`\n⚠️  About to remove ${scenesToRemove.length} coverage scenes. Proceeding...`);

            // Check for any component linkages that might be affected
            console.log('\n🔍 Checking for component linkages...');
            for (const scene of scenesToRemove) {
                const linkedComponents = await prisma.componentLibrary.findMany({
                    where: {
                        coverage_scenes: {
                            some: {
                                coverage_scene_id: scene.id
                            }
                        }
                    }
                });

                if (linkedComponents.length > 0) {
                    console.log(`⚠️  Scene "${scene.name}" has ${linkedComponents.length} linked component(s):`);
                    linkedComponents.forEach(comp => {
                        console.log(`     - ${comp.name} (${comp.type})`);
                    });
                }
            }

            // Remove coverage scene links first
            console.log('\n🧹 Removing coverage scene links...');
            for (const scene of scenesToRemove) {
                try {
                    const deletedLinks = await prisma.componentCoverageScene.deleteMany({
                        where: { coverage_scene_id: scene.id }
                    });
                    if (deletedLinks.count > 0) {
                        console.log(`✅ Removed ${deletedLinks.count} link(s) for scene: ${scene.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to remove links for scene ${scene.name}:`, error.message);
                }
            }

            // Remove the coverage scenes
            console.log('\n🧹 Removing coverage scenes...');
            let removedCount = 0;

            for (const scene of scenesToRemove) {
                try {
                    await prisma.coverage_scenes.delete({
                        where: { id: scene.id }
                    });
                    console.log(`✅ Removed coverage scene ID ${scene.id}: "${scene.name}"`);
                    removedCount++;
                } catch (error) {
                    if (error.code === 'P2025') {
                        console.log(`⚠️  ID ${scene.id}: Already deleted`);
                    } else {
                        console.error(`❌ Failed to remove coverage scene ID ${scene.id}:`, error.message);
                    }
                }
            }

            console.log(`\n🎉 Successfully removed ${removedCount} coverage scenes!`);
        } else {
            console.log('\n✅ No coverage scenes to remove - already clean!');
        }

        // Final verification
        console.log('\n📊 Final coverage scenes status:');
        const finalCoverageScenes = await prisma.coverage_scenes.findMany({
            orderBy: { id: 'asc' }
        });

        if (finalCoverageScenes.length > 0) {
            console.log(`Remaining coverage scenes: ${finalCoverageScenes.length}`);
            finalCoverageScenes.forEach(scene => {
                console.log(`✅ ID ${scene.id.toString().padStart(2)}: ${scene.name}`);
            });
        } else {
            console.log('No coverage scenes remaining.');
        }

        // Verify our First Dance coverage scene and its links
        const firstDanceScene = finalCoverageScenes.find(scene => scene.name.includes('First Dance'));
        if (firstDanceScene) {
            console.log('\n🔍 Verifying First Dance coverage scene links...');
            const linkedComponents = await prisma.componentLibrary.findMany({
                where: {
                    coverage_scenes: {
                        some: {
                            coverage_scene_id: firstDanceScene.id
                        }
                    }
                },
                include: {
                    coverage_scenes: {
                        include: {
                            coverage_scene: true
                        }
                    }
                }
            });

            if (linkedComponents.length > 0) {
                console.log(`✅ First Dance coverage scene has ${linkedComponents.length} linked component(s):`);
                linkedComponents.forEach(comp => {
                    console.log(`   🔗 ${comp.name} (${comp.type})`);
                });
            } else {
                console.log('⚠️  First Dance coverage scene has no linked components');
            }
        }

        console.log('\n🎉 Coverage scene cleanup complete!');
        console.log('🎬 Database now focused on First Dance only!');

    } catch (error) {
        console.error('❌ Error during coverage scene cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup function
cleanupNonFirstDanceCoverageScenes();
