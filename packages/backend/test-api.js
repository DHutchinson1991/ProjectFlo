const BASE_URL = 'http://localhost:3002';

async function testAPI() {
    console.log('🚀 Testing ProjectFlo Phase 1B API Endpoints...\n');

    // Test Timeline endpoints
    console.log('📊 Testing Timeline endpoints:');
    try {
        const timelineLayersResponse = await fetch(`${BASE_URL}/timeline/layers`);
        console.log(`GET /timeline/layers - Status: ${timelineLayersResponse.status}`);

        const timelineLayersData = await timelineLayersResponse.json();
        console.log('Timeline layers data:', timelineLayersData);
    } catch (error) {
        console.error('Timeline layers test failed:', error.message);
    }

    // Test Analytics endpoints
    console.log('\n📈 Testing Analytics endpoints:');
    try {
        const analyticsResponse = await fetch(`${BASE_URL}/analytics/components/overview`);
        console.log(`GET /analytics/components/overview - Status: ${analyticsResponse.status}`);

        const analyticsData = await analyticsResponse.json();
        console.log('Analytics overview data:', analyticsData);
    } catch (error) {
        console.error('Analytics overview test failed:', error.message);
    }

    // Test Analytics for specific component
    try {
        const componentAnalyticsResponse = await fetch(`${BASE_URL}/analytics/components/1`);
        console.log(`GET /analytics/components/1 - Status: ${componentAnalyticsResponse.status}`);

        const componentAnalyticsData = await componentAnalyticsResponse.json();
        console.log('Component analytics data:', componentAnalyticsData);
    } catch (error) {
        console.error('Component analytics test failed:', error.message);
    }

    // Test Components endpoints
    console.log('\n🧩 Testing Components endpoints:');
    try {
        const componentsResponse = await fetch(`${BASE_URL}/components`);
        console.log(`GET /components - Status: ${componentsResponse.status}`);

        const componentsData = await componentsResponse.json();
        console.log(`Found ${componentsData.length} components`);
    } catch (error) {
        console.error('Components test failed:', error.message);
    }

    // Test Dependencies endpoints with a component ID
    console.log('\n🔗 Testing Dependencies endpoints:');
    try {
        const dependenciesResponse = await fetch(`${BASE_URL}/components/1/dependencies`);
        console.log(`GET /components/1/dependencies - Status: ${dependenciesResponse.status}`);

        const dependenciesData = await dependenciesResponse.json();
        console.log('Dependencies data:', dependenciesData);
    } catch (error) {
        console.error('Dependencies test failed:', error.message);
    }

    console.log('\n✅ API testing complete!');
}

// Run the test
testAPI().catch(console.error);
