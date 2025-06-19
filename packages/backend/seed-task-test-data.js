/**
 * Seed script for Task Management testing
 * Creates the necessary projects, builds, and components for task testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTaskTestData() {
    console.log('🌱 Seeding task management test data...\n');

    try {
        // Create a test contact first
        const testContact = await prisma.contacts.upsert({
            where: { email: 'test.client@example.com' },
            update: {},
            create: {
                first_name: 'Test',
                last_name: 'Client',
                email: 'test.client@example.com',
                phone_number: '555-0123',
                type: 'Client'
            }
        });
        console.log('✅ Test contact created');

        // Create a test client
        const testClient = await prisma.clients.upsert({
            where: { contact_id: testContact.id },
            update: {},
            create: {
                contact_id: testContact.id
            }
        });
        console.log('✅ Test client created');

        // Create a test project
        const testProject = await prisma.projects.upsert({
            where: {
                client_id_wedding_date: {
                    client_id: testClient.id,
                    wedding_date: new Date('2024-08-15')
                }
            },
            update: {},
            create: {
                client_id: testClient.id,
                project_name: 'Test Wedding Project',
                wedding_date: new Date('2024-08-15'),
                booking_date: new Date('2024-02-15'),
                phase: 'Production'
            }
        });
        console.log('✅ Test project created');

        // Create a test build
        const testBuild = await prisma.builds.findFirst({
            where: { project_id: testProject.id }
        }) || await prisma.builds.create({
            data: {
                project_id: testProject.id,
                status: 'Booked',
                approved_price: 5000.00,
                live_price: 5000.00
            }
        });
        console.log('✅ Test build created');

        // Create build deliverables
        const testDeliverable = await prisma.build_deliverables.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                build_id: testBuild.id,
                deliverable_id: 1, // Assuming we have deliverable templates
                calculated_price: 2500.00
            }
        });
        console.log('✅ Test build deliverable created');

        // Get an editing style
        const editingStyle = await prisma.editing_styles.findFirst();
        if (!editingStyle) {
            throw new Error('No editing styles found. Please seed editing styles first.');
        }

        // Get a coverage scene
        const coverageScene = await prisma.coverage_scenes.findFirst();
        if (!coverageScene) {
            throw new Error('No coverage scenes found. Please seed coverage scenes first.');
        }

        // Create build components
        const testBuildComponent = await prisma.build_components.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                build_deliverable_id: testDeliverable.id,
                coverage_scene_id: coverageScene.id,
                editing_style_id: editingStyle.id,
                target_minutes: 3.5,
                is_included: true,
                calculated_price: 750.00
            }
        });
        console.log('✅ Test build component created');

        // Create a few more build components for testing
        for (let i = 2; i <= 5; i++) {
            await prisma.build_components.upsert({
                where: { id: i },
                update: {},
                create: {
                    id: i,
                    build_deliverable_id: testDeliverable.id,
                    coverage_scene_id: coverageScene.id,
                    editing_style_id: editingStyle.id,
                    target_minutes: 2.0 + i,
                    is_included: true,
                    calculated_price: 500.00 + (i * 100)
                }
            });
        }
        console.log('✅ Additional build components created');

        // Verify the data
        const projectCount = await prisma.projects.count();
        const buildComponentCount = await prisma.build_components.count();
        const taskTemplateCount = await prisma.task_templates.count();

        console.log('\n📊 Test data summary:');
        console.log(`   Projects: ${projectCount}`);
        console.log(`   Build components: ${buildComponentCount}`);
        console.log(`   Task templates: ${taskTemplateCount}`);

        console.log('\n🎉 Task management test data seeded successfully!');

    } catch (error) {
        console.error('❌ Failed to seed task test data:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding
seedTaskTestData();
