const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupNonFirstDanceDeliverables() {
    console.log('🧹 Starting cleanup of non-First Dance deliverable templates...');

    try {
        // Get all deliverables
        const allDeliverables = await prisma.deliverables.findMany({
            orderBy: { id: 'asc' }
        });

        console.log(`Total deliverable templates: ${allDeliverables.length}`);

        // Show all deliverables
        console.log('\n📋 Current deliverable templates:');
        allDeliverables.forEach(deliverable => {
            const isFirstDance = deliverable.name.includes('First Dance');
            const icon = isFirstDance ? '✅' : '🗑️';
            console.log(`  ${icon} ID ${deliverable.id.toString().padStart(2)}: ${deliverable.name} (${deliverable.type})`);
        });

        // Identify deliverables to keep (First Dance only)
        const deliverablesToKeep = allDeliverables.filter(deliverable =>
            deliverable.name.includes('First Dance')
        );

        // Identify deliverables to remove (everything else)
        const deliverablesToRemove = allDeliverables.filter(deliverable =>
            !deliverable.name.includes('First Dance')
        );

        console.log(`\n📊 Cleanup Plan:`);
        console.log(`✅ Keeping ${deliverablesToKeep.length} First Dance deliverable template(s)`);
        console.log(`🗑️  Removing ${deliverablesToRemove.length} non-First Dance deliverable templates`);

        // Show what we're keeping
        if (deliverablesToKeep.length > 0) {
            console.log(`\n✅ Deliverable templates to KEEP:`);
            deliverablesToKeep.forEach(deliverable => {
                console.log(`   ID ${deliverable.id.toString().padStart(2)}: ${deliverable.name}`);
            });
        }

        // Show what we're removing
        if (deliverablesToRemove.length > 0) {
            console.log(`\n🗑️  Deliverable templates to REMOVE:`);
            deliverablesToRemove.forEach(deliverable => {
                console.log(`   ID ${deliverable.id.toString().padStart(2)}: ${deliverable.name}`);
            });

            console.log(`\n⚠️  About to remove ${deliverablesToRemove.length} deliverable templates. Proceeding...`);

            // Check for any build assignments or related data
            console.log('\n🔍 Checking for related data...');
            for (const deliverable of deliverablesToRemove) {
                // Check for build deliverables
                const buildDeliverables = await prisma.build_deliverables.findMany({
                    where: { deliverable_id: deliverable.id }
                });

                // Check for assigned components
                const assignedComponents = await prisma.deliverableAssignedComponents.findMany({
                    where: { deliverable_id: deliverable.id }
                });

                // Check for music tracks
                const musicTracks = await prisma.deliverableMusicTrack.findMany({
                    where: { deliverable_id: deliverable.id }
                });

                // Check for versions
                const versions = await prisma.deliverableVersion.findMany({
                    where: { deliverable_id: deliverable.id }
                });

                // Check for change logs
                const changeLogs = await prisma.deliverableChangeLog.findMany({
                    where: { deliverable_id: deliverable.id }
                });

                if (buildDeliverables.length > 0 || assignedComponents.length > 0 ||
                    musicTracks.length > 0 || versions.length > 0 || changeLogs.length > 0) {
                    console.log(`⚠️  Deliverable "${deliverable.name}" has related data:`);
                    if (buildDeliverables.length > 0) console.log(`     - ${buildDeliverables.length} build deliverable(s)`);
                    if (assignedComponents.length > 0) console.log(`     - ${assignedComponents.length} assigned component(s)`);
                    if (musicTracks.length > 0) console.log(`     - ${musicTracks.length} music track(s)`);
                    if (versions.length > 0) console.log(`     - ${versions.length} version(s)`);
                    if (changeLogs.length > 0) console.log(`     - ${changeLogs.length} change log(s)`);
                }
            }

            // Remove related data first, then deliverables
            console.log('\n🧹 Removing related data...');
            for (const deliverable of deliverablesToRemove) {
                try {
                    // Remove in order due to foreign key constraints
                    await prisma.deliverableChangeLog.deleteMany({
                        where: { deliverable_id: deliverable.id }
                    });

                    await prisma.deliverableVersion.deleteMany({
                        where: { deliverable_id: deliverable.id }
                    });

                    await prisma.deliverableMusicTrack.deleteMany({
                        where: { deliverable_id: deliverable.id }
                    });

                    await prisma.deliverableAssignedComponents.deleteMany({
                        where: { deliverable_id: deliverable.id }
                    });

                    await prisma.build_deliverables.deleteMany({
                        where: { deliverable_id: deliverable.id }
                    });

                    console.log(`✅ Cleaned related data for: ${deliverable.name}`);
                } catch (error) {
                    console.error(`❌ Failed to clean related data for ${deliverable.name}:`, error.message);
                }
            }

            // Remove the deliverable templates
            console.log('\n🧹 Removing deliverable templates...');
            let removedCount = 0;

            for (const deliverable of deliverablesToRemove) {
                try {
                    await prisma.deliverables.delete({
                        where: { id: deliverable.id }
                    });
                    console.log(`✅ Removed deliverable template ID ${deliverable.id}: "${deliverable.name}"`);
                    removedCount++;
                } catch (error) {
                    if (error.code === 'P2025') {
                        console.log(`⚠️  ID ${deliverable.id}: Already deleted`);
                    } else {
                        console.error(`❌ Failed to remove deliverable template ID ${deliverable.id}:`, error.message);
                    }
                }
            }

            console.log(`\n🎉 Successfully removed ${removedCount} deliverable templates!`);
        } else {
            console.log('\n✅ No deliverable templates to remove - already clean!');
        }

        // Final verification
        console.log('\n📊 Final deliverable templates status:');
        const finalDeliverables = await prisma.deliverables.findMany({
            orderBy: { id: 'asc' }
        });

        if (finalDeliverables.length > 0) {
            console.log(`Remaining deliverable templates: ${finalDeliverables.length}`);
            finalDeliverables.forEach(deliverable => {
                console.log(`✅ ID ${deliverable.id.toString().padStart(2)}: ${deliverable.name} (${deliverable.type})`);
            });
        } else {
            console.log('No deliverable templates remaining.');
        }

        console.log('\n🎉 Deliverable template cleanup complete!');
        console.log('🎬 Frontend will now show only First Dance deliverable!');

    } catch (error) {
        console.error('❌ Error during deliverable cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup function
cleanupNonFirstDanceDeliverables();
