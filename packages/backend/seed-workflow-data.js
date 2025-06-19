const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWorkflowData() {
    console.log('🌱 Seeding workflow management data...');

    try {
        // Create a default workflow template
        const defaultTemplate = await prisma.workflow_templates.create({
            data: {
                name: 'Standard Wedding Workflow',
                description: 'Default workflow for wedding videography projects',
                is_active: true,
            },
        });

        console.log('✅ Created workflow template:', defaultTemplate.name);

        // Create workflow stages
        const stages = [
            {
                name: 'Inquiry & Consultation',
                description: 'Initial client contact and consultation phase',
                order_index: 1,
            },
            {
                name: 'Pre-Production',
                description: 'Planning and preparation phase',
                order_index: 2,
            },
            {
                name: 'Production',
                description: 'Wedding day filming',
                order_index: 3,
            },
            {
                name: 'Post-Production',
                description: 'Editing and delivery phase',
                order_index: 4,
            },
        ];

        for (const stage of stages) {
            const createdStage = await prisma.workflow_stages.create({
                data: {
                    ...stage,
                    workflow_template_id: defaultTemplate.id,
                },
            });
            console.log(`✅ Created stage: ${createdStage.name}`);
        }

        // Get task templates for rule creation
        const taskTemplates = await prisma.task_templates.findMany({
            take: 5, // Just get first 5 for example
        });

        if (taskTemplates.length > 0) {
            // Create some example task generation rules
            const stagesList = await prisma.workflow_stages.findMany({
                where: { workflow_template_id: defaultTemplate.id },
                orderBy: { order_index: 'asc' },
            });

            // Add rules to pre-production stage
            if (stagesList.length > 1 && taskTemplates.length > 0) {
                const preProductionStage = stagesList[1]; // Pre-Production stage

                const exampleRule = await prisma.task_generation_rules.create({
                    data: {
                        workflow_stage_id: preProductionStage.id,
                        task_template_id: taskTemplates[0].id,
                        is_required: true,
                        component_type: 'COVERAGE_LINKED',
                    },
                });

                console.log('✅ Created task generation rule for stage:', preProductionStage.name);
            }
        }

        console.log('🎉 Workflow management seed completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding workflow data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    seedWorkflowData();
}

module.exports = { seedWorkflowData };
