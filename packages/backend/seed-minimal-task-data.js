/**
 * Simple seed script for Task Management testing
 * Creates just the minimal data needed for task testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMinimalTaskTestData() {
    console.log('🌱 Seeding minimal task management test data...\n');

    try {
        // Check if we already have the necessary data
        const projectCount = await prisma.projects.count();
        const buildComponentCount = await prisma.build_components.count();

        if (projectCount > 0 && buildComponentCount > 0) {
            console.log('✅ Sufficient test data already exists');
            console.log(`   Projects: ${projectCount}`);
            console.log(`   Build components: ${buildComponentCount}`);
            return;
        }

        // Get existing data we can use
        const existingContact = await prisma.contacts.findFirst();
        const existingClient = await prisma.clients.findFirst();
        const existingProject = await prisma.projects.findFirst();
        const existingBuild = await prisma.builds.findFirst();
        const existingDeliverable = await prisma.deliverables.findFirst();
        const existingCoverageScene = await prisma.coverage_scenes.findFirst();
        const existingEditingStyle = await prisma.editing_styles.findFirst();

        if (!existingCoverageScene || !existingEditingStyle) {
            throw new Error('Please seed coverage scenes and editing styles first.');
        }

        // Create test contact if needed
        let testContact = existingContact;
        if (!testContact) {
            testContact = await prisma.contacts.create({
                data: {
                    first_name: 'Test',
                    last_name: 'Client',
                    email: 'test.client@example.com',
                    phone_number: '555-0123',
                    type: 'Client'
                }
            });
            console.log('✅ Test contact created');
        }

        // Create test client if needed
        let testClient = existingClient;
        if (!testClient) {
            testClient = await prisma.clients.create({
                data: {
                    contact_id: testContact.id
                }
            });
            console.log('✅ Test client created');
        }

        // Create test project if needed
        let testProject = existingProject;
        if (!testProject) {
            testProject = await prisma.projects.create({
                data: {
                    client_id: testClient.id,
                    project_name: 'Test Wedding Project',
                    wedding_date: new Date('2024-08-15'),
                    booking_date: new Date('2024-02-15'),
                    phase: 'Production'
                }
            });
            console.log('✅ Test project created');
        }

        // Create test build if needed
        let testBuild = existingBuild;
        if (!testBuild) {
            testBuild = await prisma.builds.create({
                data: {
                    project_id: testProject.id,
                    status: 'Booked',
                    approved_price: 5000.00,
                    live_price: 5000.00
                }
            });
            console.log('✅ Test build created');
        }

        // Create build deliverable if needed
        let buildDeliverable = await prisma.build_deliverables.findFirst({
            where: { build_id: testBuild.id }
        });

        if (!buildDeliverable && existingDeliverable) {
            buildDeliverable = await prisma.build_deliverables.create({
                data: {
                    build_id: testBuild.id,
                    deliverable_id: existingDeliverable.id
                }
            });
            console.log('✅ Test build deliverable created');
        }

        // Create build components if needed
        const existingBuildComponents = await prisma.build_components.findMany({
            where: { build_deliverable_id: buildDeliverable?.id }
        });

        if (existingBuildComponents.length === 0 && buildDeliverable) {
            // Create a few build components
            for (let i = 0; i < 3; i++) {
                await prisma.build_components.create({
                    data: {
                        build_deliverable_id: buildDeliverable.id,
                        coverage_scene_id: existingCoverageScene.id,
                        editing_style_id: existingEditingStyle.id,
                        target_minutes: 2.0 + i,
                        is_included: true,
                        calculated_price: 500.00 + (i * 100)
                    }
                });
            }
            console.log('✅ Test build components created');
        }

        // Final verification
        const finalProjectCount = await prisma.projects.count();
        const finalBuildComponentCount = await prisma.build_components.count();
        const taskTemplateCount = await prisma.task_templates.count();

        console.log('\n📊 Test data summary:');
        console.log(`   Projects: ${finalProjectCount}`);
        console.log(`   Build components: ${finalBuildComponentCount}`);
        console.log(`   Task templates: ${taskTemplateCount}`);

        console.log('\n🎉 Minimal task management test data ready!');

    } catch (error) {
        console.error('❌ Failed to seed minimal task test data:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding
seedMinimalTaskTestData();
