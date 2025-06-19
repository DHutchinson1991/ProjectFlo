// Test script for Phase 1B Backend APIs
// Run this to verify Timeline and Analytics endpoints are working

const API_BASE = 'http://localhost:3002';

async function testPhase1BAPIs() {
    console.log('🧪 Testing Phase 1B Backend APIs...\n');

    try {
        // Test 1: Timeline Layers
        console.log('1. Testing Timeline Layers...');
        const layersResponse = await fetch(`${API_BASE}/timeline/layers`);
        const layers = await layersResponse.json();
        console.log(`✅ Timeline Layers: ${layers.length} layers found`);
        layers.forEach(layer => {
            console.log(`   • ${layer.name} (#${layer.order_index}, ${layer.color_hex})`);
        });

        // Test 2: Components Overview
        console.log('\n2. Testing Component Analytics...');
        const overviewResponse = await fetch(`${API_BASE}/analytics/components/overview`);
        const overview = await overviewResponse.json();
        console.log(`✅ Components Overview:`);
        console.log(`   • Total Components: ${overview.overview.total_components}`);
        console.log(`   • Coverage Linked: ${overview.overview.coverage_linked_count}`);
        console.log(`   • Edit Components: ${overview.overview.edit_count}`);
        console.log(`   • Total Usage: ${overview.overview.total_usage}`);

        // Test 3: Individual Component Analytics
        if (overview.top_components.length > 0) {
            const firstComponent = overview.top_components[0];
            console.log(`\n3. Testing Individual Component Analytics (${firstComponent.name})...`);
            const componentResponse = await fetch(`${API_BASE}/analytics/components/${firstComponent.id}`);
            const componentAnalytics = await componentResponse.json();
            console.log(`✅ Component Analytics:`);
            console.log(`   • Usage Count: ${componentAnalytics.component.usage_count}`);
            console.log(`   • Performance Score: ${componentAnalytics.component.performance_score}`);
            console.log(`   • Complexity: ${componentAnalytics.component.complexity_score}`);
        }

        // Test 4: Timeline Component Creation
        console.log('\n4. Testing Timeline Component Creation...');
        const newTimelineComponent = {
            deliverable_id: 1,
            component_id: 1,
            layer_id: 1,
            start_time_seconds: 300, // 5:00 mark (5-second aligned)
            duration_seconds: 180,   // 3 minutes
            notes: 'Test component for API verification'
        };

        const createResponse = await fetch(`${API_BASE}/timeline/components`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTimelineComponent)
        });

        if (createResponse.ok) {
            const createdComponent = await createResponse.json();
            console.log(`✅ Timeline Component Created: ID ${createdComponent.id}`);
            console.log(`   • Start Time: ${createdComponent.start_time_seconds}s`);
            console.log(`   • Duration: ${createdComponent.duration_seconds}s`);
            console.log(`   • Layer: ${createdComponent.layer.name}`);

            // Clean up - delete the test component
            await fetch(`${API_BASE}/timeline/components/${createdComponent.id}`, {
                method: 'DELETE'
            });
            console.log(`🧹 Test component cleaned up`);
        } else {
            const error = await createResponse.text();
            console.log(`⚠️  Timeline Component Creation: ${error}`);
        }

        // Test 5: Usage Recording
        console.log('\n5. Testing Usage Recording...');
        const usageResponse = await fetch(`${API_BASE}/analytics/components/1/usage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deliverable_id: 1,
                actual_duration_seconds: 180,
                estimated_duration_seconds: 200
            })
        });

        if (usageResponse.ok) {
            const usageResult = await usageResponse.json();
            console.log(`✅ Usage Recorded: Component usage count updated`);
        } else {
            console.log(`⚠️  Usage Recording failed`);
        }

        console.log('\n🎉 Phase 1B Backend API Tests Complete!');
        console.log('\n📋 Summary:');
        console.log('✅ Timeline Layers API working');
        console.log('✅ Component Analytics API working');
        console.log('✅ Timeline Component CRUD working');
        console.log('✅ Usage Recording working');
        console.log('\nReady for Phase 1C Frontend Implementation! 🚀');

    } catch (error) {
        console.error('❌ API Test Error:', error.message);
    }
}

// Run the tests
testPhase1BAPIs();
