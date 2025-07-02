const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupComponentTypesWithConstraints() {
    console.log('🧹 Starting comprehensive component type cleanup...');

    try {
        // Step 1: Find EDIT and COVERAGE_LINKED components
        const obsoleteComponents = await prisma.componentLibrary.findMany({
            where: {
                type: {
                    in: ['EDIT', 'COVERAGE_LINKED']
                }
            },
            select: { id: true, name: true, type: true }
        });

        console.log(`\n🎬 Found ${obsoleteComponents.length} obsolete components to remove`);
        obsoleteComponents.forEach(comp => {
            console.log(`- ${comp.name} (${comp.type}, ID: ${comp.id})`);
        });

        if (obsoleteComponents.length === 0) {
            console.log('✨ No obsolete components found!');
            return;
        }

        const obsoleteIds = obsoleteComponents.map(c => c.id);

        // Step 2: Remove foreign key references first
        console.log('\n🔗 Removing foreign key references...');

        // Remove from deliverable_assigned_components
        const deletedAssignments = await prisma.deliverableAssignedComponents.deleteMany({
            where: {
                component_id: {
                    in: obsoleteIds
                }
            }
        });
        console.log(`✅ Removed ${deletedAssignments.count} deliverable assignments`);

        // Remove from timeline_component_instances (if this table exists)
        try {
            const deletedInstances = await prisma.timelineComponentInstance.deleteMany({
                where: {
                    component_id: {
                        in: obsoleteIds
                    }
                }
            });
            console.log(`✅ Removed ${deletedInstances.count} timeline instances`);
        } catch (error) {
            console.log('ℹ️  Timeline instances table not found or no instances to remove');
        }

        // Remove from component_task_recipes (if this table exists)
        try {
            const deletedRecipes = await prisma.componentTaskRecipe.deleteMany({
                where: {
                    component_id: {
                        in: obsoleteIds
                    }
                }
            });
            console.log(`✅ Removed ${deletedRecipes.count} task recipes`);
        } catch (error) {
            console.log('ℹ️  Component task recipes table not found or no recipes to remove');
        }

        // Remove from any other tables that might reference these components
        // Check for default tasks
        try {
            const deletedDefaultTasks = await prisma.defaultTask.deleteMany({
                where: {
                    component_id: {
                        in: obsoleteIds
                    }
                }
            });
            console.log(`✅ Removed ${deletedDefaultTasks.count} default tasks`);
        } catch (error) {
            console.log('ℹ️  Default tasks table not found or no tasks to remove');
        }

        // Step 3: Now remove the components themselves
        console.log('\n🗑️  Removing obsolete components...');

        for (const comp of obsoleteComponents) {
            try {
                await prisma.componentLibrary.delete({
                    where: { id: comp.id }
                });
                console.log(`✅ Removed: ${comp.name} (${comp.type})`);
            } catch (error) {
                console.log(`❌ Error removing ${comp.name}: ${error.message}`);
            }
        }

        // Step 4: Final verification
        const remainingObsolete = await prisma.componentLibrary.count({
            where: {
                type: {
                    in: ['EDIT', 'COVERAGE_LINKED']
                }
            }
        });

        if (remainingObsolete === 0) {
            console.log('\n✅ All obsolete components successfully removed!');
            console.log('🔄 You can now run: npx prisma db push to update the schema');
        } else {
            console.log(`\n⚠️  ${remainingObsolete} obsolete components still remain`);
        }

        // Show final component counts
        const finalComponents = await prisma.componentLibrary.groupBy({
            by: ['type'],
            _count: {
                type: true
            }
        });

        console.log('\n📊 Final component distribution:');
        finalComponents.forEach(group => {
            console.log(`  ${group.type}: ${group._count.type}`);
        });

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupComponentTypesWithConstraints()
    .catch((error) => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    });
