const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testWorkflowEndpoints() {
    console.log('🧪 Testing Workflow Management API endpoints...');

    try {
        // Test 1: Get all workflow templates
        console.log('\n1️⃣ Testing GET /workflows/templates');
        const templatesResponse = await axios.get(`${BASE_URL}/workflows/templates`);
        console.log('✅ Templates found:', templatesResponse.data.length);

        if (templatesResponse.data.length > 0) {
            const templateId = templatesResponse.data[0].id;
            console.log('📋 First template ID:', templateId);

            // Test 2: Get specific template
            console.log('\n2️⃣ Testing GET /workflows/templates/:id');
            const templateResponse = await axios.get(`${BASE_URL}/workflows/templates/${templateId}`);
            console.log('✅ Template details:', {
                name: templateResponse.data.name,
                stagesCount: templateResponse.data.stages.length,
            });

            // Test 3: Get stages for template
            console.log('\n3️⃣ Testing GET /workflows/templates/:templateId/stages');
            const stagesResponse = await axios.get(`${BASE_URL}/workflows/templates/${templateId}/stages`);
            console.log('✅ Stages found:', stagesResponse.data.length);

            if (stagesResponse.data.length > 0) {
                const stageId = stagesResponse.data[0].id;

                // Test 4: Get rules for stage
                console.log('\n4️⃣ Testing GET /workflows/stages/:stageId/rules');
                const rulesResponse = await axios.get(`${BASE_URL}/workflows/stages/${stageId}/rules`);
                console.log('✅ Rules found:', rulesResponse.data.length);
            }

            // Test 5: Get workflow overview
            console.log('\n5️⃣ Testing GET /workflows/overview');
            const overviewResponse = await axios.get(`${BASE_URL}/workflows/overview`);
            console.log('✅ Overview data:', {
                totalTemplates: overviewResponse.data.summary.totalTemplates,
                activeTemplates: overviewResponse.data.summary.activeTemplates,
                totalStages: overviewResponse.data.summary.totalStages,
            });

            // Test 6: Get template analytics
            console.log('\n6️⃣ Testing GET /workflows/templates/:templateId/analytics');
            const analyticsResponse = await axios.get(`${BASE_URL}/workflows/templates/${templateId}/analytics`);
            console.log('✅ Analytics data:', {
                projectsUsingTemplate: analyticsResponse.data.usage.projectsUsingTemplate,
                totalTasksGenerated: analyticsResponse.data.usage.totalTasksGenerated,
            });
        }

        console.log('\n🎉 All workflow API tests completed successfully!');

    } catch (error) {
        console.error('❌ API test failed:', {
            endpoint: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
        });
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    testWorkflowEndpoints();
}

module.exports = { testWorkflowEndpoints };
