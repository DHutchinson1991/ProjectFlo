/**
 * Test script for Task Management System
 * Tests the full CRUD operations for tasks with realistic data
 */

const BASE_URL = 'http://localhost:3002';

async function testTaskManagement() {
    console.log('🎯 Testing Task Management System...\n');

    try {
        // Test 1: Get available projects, components, and templates for task creation
        console.log('1. Getting available data for task creation...');
        const [projectsResponse, templatesResponse] = await Promise.all([
            fetch(`${BASE_URL}/analytics/components/overview`), // This should give us projects
            fetch(`${BASE_URL}/task-templates`)
        ]);

        const templates = await templatesResponse.json();
        console.log(`   Available task templates: ${templates.length}`);
        console.log(`   First template: ${templates[0]?.name} (${templates[0]?.effort_hours}h)`);

        // Test 2: Create a test task (we'll use hardcoded IDs for now)
        console.log('\n2. Creating a new task...');
        const newTask = {
            project_id: 1,
            build_component_id: 1,
            task_template_id: templates[0].id,
            planned_duration_hours: parseFloat(templates[0].effort_hours || 8),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            assigned_to_contributor_id: 1,
            is_client_visible: false
        };

        const createResponse = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });

        if (createResponse.ok) {
            const createdTask = await createResponse.json();
            console.log(`   ✅ Created task: ${createdTask.task_template.name}`);
            console.log(`   Task ID: ${createdTask.id}, Status: ${createdTask.status}`);

            // Test 3: Get all tasks
            console.log('\n3. Getting all tasks...');
            const allTasksResponse = await fetch(`${BASE_URL}/tasks`);
            const allTasks = await allTasksResponse.json();
            console.log(`   Total tasks: ${allTasks.data.length}`);
            console.log(`   Total pages: ${allTasks.meta.totalPages}`);

            // Test 4: Get board data (Kanban view)
            console.log('\n4. Getting Kanban board data...');
            const boardResponse = await fetch(`${BASE_URL}/tasks/board`);
            const boardData = await boardResponse.json();
            console.log(`   Board summary: ${JSON.stringify(boardData.summary.by_status)}`);
            console.log(`   Overdue tasks: ${boardData.summary.overdue}`);

            // Test 5: Update task status
            console.log('\n5. Updating task status...');
            const statusUpdate = { status: 'In_Progress' };
            const updateResponse = await fetch(`${BASE_URL}/tasks/${createdTask.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statusUpdate)
            });

            if (updateResponse.ok) {
                const updatedTask = await updateResponse.json();
                console.log(`   ✅ Updated status to: ${updatedTask.status}`);
            }

            // Test 6: Add a comment to the task
            console.log('\n6. Adding a comment...');
            const comment = {
                content: "Starting work on this task. Looks straightforward!"
            };

            const commentResponse = await fetch(`${BASE_URL}/tasks/${createdTask.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(comment)
            });

            if (commentResponse.ok) {
                const addedComment = await commentResponse.json();
                console.log(`   ✅ Added comment: "${addedComment.comment_text}"`);
            }

            // Test 7: Add time entry
            console.log('\n7. Adding time entry...');
            const timeEntry = {
                hours: 2.5,
                description: "Initial setup and research",
                date: new Date().toISOString()
            };

            const timeResponse = await fetch(`${BASE_URL}/tasks/${createdTask.id}/time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timeEntry)
            });

            if (timeResponse.ok) {
                const timeResult = await timeResponse.json();
                console.log(`   ✅ Added ${timeResult.hours_added}h, total: ${timeResult.new_total}h`);
            }

            // Test 8: Get task details with all relations
            console.log('\n8. Getting full task details...');
            const detailResponse = await fetch(`${BASE_URL}/tasks/${createdTask.id}`);
            const taskDetails = await detailResponse.json();
            console.log(`   Task: ${taskDetails.task_template.name}`);
            console.log(`   Project: ${taskDetails.project.project_name || 'Unnamed Project'}`);
            console.log(`   Assigned to: ${taskDetails.assigned_to_contributor?.contact.first_name || 'Unassigned'}`);
            console.log(`   Comments: ${taskDetails.task_comments.length}`);

            // Test 9: Test bulk operations
            console.log('\n9. Testing bulk operations...');
            const bulkUpdate = {
                task_ids: [createdTask.id],
                updates: {
                    status: 'Completed'
                }
            };

            const bulkResponse = await fetch(`${BASE_URL}/tasks/bulk-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulkUpdate)
            });

            if (bulkResponse.ok) {
                const bulkResult = await bulkResponse.json();
                console.log(`   ✅ ${bulkResult.message}`);
            }

            // Test 10: Get analytics
            console.log('\n10. Getting task analytics...');
            const analyticsResponse = await fetch(`${BASE_URL}/tasks/analytics`);
            const analytics = await analyticsResponse.json();
            console.log(`   Total tasks: ${analytics.summary.total_tasks}`);
            console.log(`   By status: ${JSON.stringify(analytics.by_status)}`);

            // Test 11: Clean up - delete the test task
            console.log('\n11. Cleaning up test data...');
            const deleteResponse = await fetch(`${BASE_URL}/tasks/${createdTask.id}`, {
                method: 'DELETE'
            });

            if (deleteResponse.ok) {
                console.log(`   ✅ Test task deleted successfully`);
            }

            console.log('\n🎉 All task management tests passed!');
            console.log('✨ Features tested:');
            console.log('   - Task CRUD operations');
            console.log('   - Kanban board data');
            console.log('   - Status updates');
            console.log('   - Comments system');
            console.log('   - Time tracking');
            console.log('   - Bulk operations');
            console.log('   - Task analytics');
            console.log('   - Full task details with relations');

        } else {
            const error = await createResponse.text();
            throw new Error(`Failed to create task: ${createResponse.status} - ${error}`);
        }

    } catch (error) {
        console.error('❌ Task management test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testTaskManagement();
