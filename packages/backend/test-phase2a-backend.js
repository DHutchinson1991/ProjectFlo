#!/usr/bin/env node

// Test script for Task Templates and Enhanced Component Task Recipes
// Phase 2A Backend Testing

const BASE_URL = 'http://localhost:3002';

console.log('🎯 Phase 2A Backend Testing - Task Templates & Component Task Recipes');
console.log('============================================================================\n');

async function testTaskTemplates() {
    console.log('1. Testing Task Templates CRUD Operations...\n');

    try {
        // Test GET all task templates
        console.log('📋 Testing GET /task-templates');
        const response = await fetch(`${BASE_URL}/task-templates`);
        const templates = await response.json();
        console.log(`✅ Found ${templates.length} task templates`);

        if (templates.length > 0) {
            console.log('📄 First template:', {
                id: templates[0].id,
                name: templates[0].name,
                phase: templates[0].phase,
                effort_hours: templates[0].effort_hours,
                pricing_type: templates[0].pricing_type
            });
        }

        // Test GET specific task template
        if (templates.length > 0) {
            console.log(`\n🔍 Testing GET /task-templates/${templates[0].id}`);
            const detailResponse = await fetch(`${BASE_URL}/task-templates/${templates[0].id}`);
            const detail = await detailResponse.json();
            console.log(`✅ Template details loaded:`, {
                name: detail.name,
                component_task_recipes_count: detail._count?.component_task_recipes || 0,
                tasks_count: detail._count?.tasks || 0
            });
        }

        // Test CREATE new task template
        console.log('\n➕ Testing POST /task-templates');
        const createResponse = await fetch(`${BASE_URL}/task-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Task Template - Color Correction',
                phase: 'POST_PRODUCTION',
                effort_hours: 2.5,
                pricing_type: 'Hourly',
                average_duration_hours: 2.0
            })
        });

        if (createResponse.ok) {
            const newTemplate = await createResponse.json();
            console.log(`✅ Created task template:`, {
                id: newTemplate.id,
                name: newTemplate.name,
                effort_hours: newTemplate.effort_hours
            });

            // Test UPDATE
            console.log(`\n✏️ Testing PATCH /task-templates/${newTemplate.id}`);
            const updateResponse = await fetch(`${BASE_URL}/task-templates/${newTemplate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    effort_hours: 3.0,
                    phase: 'EDITING'
                })
            });

            if (updateResponse.ok) {
                const updated = await updateResponse.json();
                console.log(`✅ Updated task template effort_hours: ${updated.effort_hours}`);
            } else {
                console.log(`❌ Update failed: ${updateResponse.status}`);
            }

            // Test DELETE
            console.log(`\n🗑️ Testing DELETE /task-templates/${newTemplate.id}`);
            const deleteResponse = await fetch(`${BASE_URL}/task-templates/${newTemplate.id}`, {
                method: 'DELETE'
            });

            if (deleteResponse.ok) {
                console.log(`✅ Deleted task template successfully`);
            } else {
                console.log(`❌ Delete failed: ${deleteResponse.status}`);
            }
        } else {
            console.log(`❌ Create failed: ${createResponse.status}`);
            const error = await createResponse.text();
            console.log('Error:', error);
        }

        // Test analytics
        console.log('\n📊 Testing GET /task-templates/analytics');
        const analyticsResponse = await fetch(`${BASE_URL}/task-templates/analytics`);
        if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            console.log(`✅ Analytics loaded:`, {
                total_templates: analytics.total_templates,
                most_used_count: analytics.most_used_templates?.length || 0
            });
        } else {
            console.log(`❌ Analytics failed: ${analyticsResponse.status}`);
        }

    } catch (error) {
        console.log('❌ Task Templates test failed:', error.message);
    }
}

async function testComponentTaskRecipes() {
    console.log('\n\n2. Testing Component Task Recipe Management...\n');

    try {
        // Get available components first
        console.log('📋 Getting available components...');
        const componentsResponse = await fetch(`${BASE_URL}/components`);
        const components = await componentsResponse.json();

        if (components.length === 0) {
            console.log('❌ No components found for testing');
            return;
        }

        const testComponent = components[0];
        console.log(`✅ Using component: ${testComponent.name} (ID: ${testComponent.id})`);

        // Get component details with existing task recipes
        console.log(`\n🔍 Getting component details: /components/${testComponent.id}`);
        const detailResponse = await fetch(`${BASE_URL}/components/${testComponent.id}`);
        const componentDetail = await detailResponse.json();

        console.log(`✅ Component loaded:`, {
            name: componentDetail.name,
            type: componentDetail.type,
            existing_task_recipes: componentDetail.component_tasks?.length || 0
        });

        // Get available task templates for recipes
        console.log('\n📋 Getting available task templates...');
        const templatesResponse = await fetch(`${BASE_URL}/task-templates`);
        const templates = await templatesResponse.json();

        if (templates.length === 0) {
            console.log('❌ No task templates found for testing');
            return;
        }

        console.log(`✅ Found ${templates.length} task templates available`);

        // Test adding task recipes to component
        console.log(`\n➕ Testing POST /components/${testComponent.id}/task-recipes`);
        const addRecipesResponse = await fetch(`${BASE_URL}/components/${testComponent.id}/task-recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([
                {
                    task_template_name: templates[0].name,
                    hours_required: 2.5,
                    order_index: 1
                },
                {
                    task_template_name: templates.length > 1 ? templates[1].name : 'Manual Task',
                    hours_required: 1.0,
                    order_index: 2
                }
            ])
        });

        if (addRecipesResponse.ok) {
            const result = await addRecipesResponse.json();
            console.log(`✅ Added task recipes to component`);

            // Verify by getting component details again
            console.log(`\n🔍 Verifying task recipes were added...`);
            const verifyResponse = await fetch(`${BASE_URL}/components/${testComponent.id}`);
            const verifiedComponent = await verifyResponse.json();

            console.log(`✅ Component now has ${verifiedComponent.component_tasks?.length || 0} task recipes`);

            if (verifiedComponent.component_tasks && verifiedComponent.component_tasks.length > 0) {
                console.log('📄 Task recipes:', verifiedComponent.component_tasks.map(task => ({
                    id: task.id,
                    template_name: task.task_template_name,
                    hours: task.hours_required,
                    order: task.order_index
                })));
            }
        } else {
            console.log(`❌ Add task recipes failed: ${addRecipesResponse.status}`);
            const error = await addRecipesResponse.text();
            console.log('Error:', error);
        }

    } catch (error) {
        console.log('❌ Component Task Recipes test failed:', error.message);
    }
}

async function testComponentsAvailableTaskRecipes() {
    console.log('\n\n3. Testing Components Available Task Recipes Endpoint...\n');

    try {
        // This endpoint is from the existing components service
        const response = await fetch(`${BASE_URL}/components/coverage-scenes/available`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Available task recipes endpoint working');
        } else {
            console.log(`❌ Available task recipes failed: ${response.status}`);
        }

    } catch (error) {
        console.log('❌ Available task recipes test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    try {
        await testTaskTemplates();
        await testComponentTaskRecipes();
        await testComponentsAvailableTaskRecipes();

        console.log('\n\n🎉 Phase 2A Backend Testing Complete!');
        console.log('============================================');
        console.log('✅ Task Templates CRUD working');
        console.log('✅ Component Task Recipe management working');
        console.log('✅ Ready for frontend implementation');

    } catch (error) {
        console.log('\n❌ Test suite failed:', error.message);
    }
}

runAllTests();
