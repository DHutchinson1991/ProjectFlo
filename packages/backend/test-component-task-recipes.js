/**
 * Test script for Phase 2A - Component Task Recipe Management
 * Tests the enhanced component detail page functionality
 */

const BASE_URL = 'http://localhost:3002';

async function testComponentTaskRecipeManagement() {
    console.log('🧪 Testing Component Task Recipe Management...\n');

    try {
        // Test 1: Get component with existing task recipes
        console.log('1. Getting component details...');
        const componentResponse = await fetch(`${BASE_URL}/components/1`);
        const component = await componentResponse.json();
        console.log(`   Component: ${component.name}`);
        console.log(`   Existing task recipes: ${component.component_tasks?.length || 0}`);

        // Test 2: Get available task templates
        console.log('\n2. Getting task templates...');
        const templatesResponse = await fetch(`${BASE_URL}/task-templates`);
        const templates = await templatesResponse.json();
        console.log(`   Available task templates: ${templates.length}`);
        console.log(`   First template: ${templates[0]?.name} (${templates[0]?.effort_hours}h)`);

        // Test 3: Add a new task recipe
        console.log('\n3. Adding new task recipe...');
        const newRecipe = {
            task_template_name: templates[2].name, // Use the 3rd template
            hours_required: parseFloat(templates[2].effort_hours),
            order_index: (component.component_tasks?.length || 0) + 1
        };

        const addResponse = await fetch(`${BASE_URL}/components/1/task-recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([newRecipe])
        });

        if (addResponse.ok) {
            const updatedComponent = await addResponse.json();
            console.log(`   ✅ Added: ${newRecipe.task_template_name} (${newRecipe.hours_required}h)`);
            console.log(`   Total task recipes now: ${updatedComponent.component_tasks?.length || 0}`);
        } else {
            throw new Error(`Failed to add task recipe: ${addResponse.status}`);
        }

        // Test 4: Verify the task recipe was added
        console.log('\n4. Verifying task recipe was added...');
        const verifyResponse = await fetch(`${BASE_URL}/components/1`);
        const verifiedComponent = await verifyResponse.json();
        const addedRecipe = verifiedComponent.component_tasks?.find(t => t.task_template_name === newRecipe.task_template_name);

        if (addedRecipe) {
            console.log(`   ✅ Verified: Recipe ID ${addedRecipe.id} exists`);

            // Test 5: Delete the task recipe
            console.log('\n5. Deleting task recipe...');
            const deleteResponse = await fetch(`${BASE_URL}/components/1/task-recipes/${addedRecipe.id}`, {
                method: 'DELETE'
            });

            if (deleteResponse.ok) {
                const finalComponent = await deleteResponse.json();
                console.log(`   ✅ Deleted task recipe successfully`);
                console.log(`   Final task recipe count: ${finalComponent.component_tasks?.length || 0}`);
            } else {
                throw new Error(`Failed to delete task recipe: ${deleteResponse.status}`);
            }
        } else {
            throw new Error('Task recipe was not found after adding');
        }

        console.log('\n🎉 All tests passed! Phase 2A functionality is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testComponentTaskRecipeManagement();
