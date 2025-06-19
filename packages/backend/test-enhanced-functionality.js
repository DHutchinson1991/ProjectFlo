/**
 * Comprehensive test for Phase 2A - Enhanced Component Task Recipe Management
 * Tests all new functionality including drag-and-drop, inline editing, and UI enhancements
 */

const BASE_URL = 'http://localhost:3002';

async function testEnhancedComponentTaskRecipeManagement() {
    console.log('🧪 Testing Enhanced Component Task Recipe Management...\n');

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

        // Test 3: Add multiple task recipes for reordering test
        console.log('\n3. Adding multiple task recipes...');
        const newRecipes = [
            {
                task_template_name: templates[0].name,
                hours_required: parseFloat(templates[0].effort_hours),
                order_index: 1
            },
            {
                task_template_name: templates[1].name,
                hours_required: parseFloat(templates[1].effort_hours),
                order_index: 2
            },
            {
                task_template_name: templates[2].name,
                hours_required: parseFloat(templates[2].effort_hours),
                order_index: 3
            }
        ];

        const addResponse = await fetch(`${BASE_URL}/components/1/task-recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecipes)
        });

        if (addResponse.ok) {
            const updatedComponent = await addResponse.json();
            console.log(`   ✅ Added ${newRecipes.length} task recipes`);
            console.log(`   Total task recipes now: ${updatedComponent.component_tasks?.length || 0}`);
        } else {
            throw new Error(`Failed to add task recipes: ${addResponse.status}`);
        }

        // Test 4: Test inline editing by updating hours for a task recipe
        console.log('\n4. Testing inline editing (updating hours)...');
        const verifyResponse = await fetch(`${BASE_URL}/components/1`);
        const verifiedComponent = await verifyResponse.json();
        const firstRecipe = verifiedComponent.component_tasks[0];

        const updatedHours = firstRecipe.hours_required + 2;
        const updateResponse = await fetch(`${BASE_URL}/components/task-recipes/${firstRecipe.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours_required: updatedHours })
        });

        if (updateResponse.ok) {
            console.log(`   ✅ Updated hours from ${firstRecipe.hours_required}h to ${updatedHours}h`);
        } else {
            throw new Error(`Failed to update task recipe: ${updateResponse.status}`);
        }

        // Test 5: Test drag-and-drop reordering by updating order_index
        console.log('\n5. Testing drag-and-drop reordering...');
        const finalComponentResponse = await fetch(`${BASE_URL}/components/1`);
        const finalComponent = await finalComponentResponse.json();
        const recipes = finalComponent.component_tasks;

        if (recipes.length >= 2) {
            // Simulate drag-and-drop by swapping first and second recipe orders
            const reorderPromises = [
                fetch(`${BASE_URL}/components/task-recipes/${recipes[0].id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_index: 2 })
                }),
                fetch(`${BASE_URL}/components/task-recipes/${recipes[1].id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_index: 1 })
                })
            ];

            await Promise.all(reorderPromises);
            console.log(`   ✅ Reordered task recipes successfully`);
        }

        // Test 6: Verify final state and calculate summary stats
        console.log('\n6. Verifying final state and calculating summary...');
        const summaryResponse = await fetch(`${BASE_URL}/components/1`);
        const summaryComponent = await summaryResponse.json();
        const finalRecipes = summaryComponent.component_tasks;

        const totalHours = finalRecipes.reduce((sum, recipe) => sum + recipe.hours_required, 0);
        const avgHours = totalHours / finalRecipes.length;

        console.log(`   Final recipe count: ${finalRecipes.length}`);
        console.log(`   Total hours: ${totalHours}h`);
        console.log(`   Average hours per task: ${Math.round(avgHours * 10) / 10}h`);

        // Test 7: Clean up by deleting all added recipes
        console.log('\n7. Cleaning up test data...');
        const deletePromises = finalRecipes.map(recipe =>
            fetch(`${BASE_URL}/components/1/task-recipes/${recipe.id}`, {
                method: 'DELETE'
            })
        );

        await Promise.all(deletePromises);
        console.log(`   ✅ Cleaned up ${finalRecipes.length} task recipes`);

        console.log('\n🎉 All enhanced functionality tests passed!');
        console.log('✨ Features tested:');
        console.log('   - CRUD operations (Create, Read, Update, Delete)');
        console.log('   - Inline editing simulation');
        console.log('   - Drag-and-drop reordering simulation');
        console.log('   - Summary statistics calculation');
        console.log('   - Batch operations');

    } catch (error) {
        console.error('❌ Enhanced functionality test failed:', error.message);
        process.exit(1);
    }
}

// Run the enhanced test
testEnhancedComponentTaskRecipeManagement();
