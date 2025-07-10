#!/usr/bin/env node

// Test Brand Filtering API Endpoints
// Tests all controllers with brand filtering implementation

const baseUrl = 'http://localhost:3002';

async function testEndpoint(url, description) {
    try {
        console.log(`\n🧪 Testing: ${description}`);
        console.log(`📡 URL: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Status: ${response.status}`);
            console.log(`📊 Results: ${Array.isArray(data) ? data.length : 'N/A'} items`);

            // Show first item if it's an array
            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                console.log(`📝 Sample: ${JSON.stringify({
                    id: item.id,
                    name: item.name || item.first_name || item.display_name || 'N/A',
                    brand_id: item.brand_id || 'N/A'
                }, null, 2)}`);
            }
        } else {
            console.log(`❌ Status: ${response.status}`);
            console.log(`🚨 Error: ${JSON.stringify(data, null, 2)}`);
        }
    } catch (error) {
        console.log(`💥 Network Error: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Testing Brand Filtering API Endpoints');
    console.log('==========================================');

    // Test 1: Contacts (should work - already implemented)
    await testEndpoint(`${baseUrl}/contacts`, 'All Contacts');
    await testEndpoint(`${baseUrl}/contacts?brandId=1`, 'Contacts for Brand 1');

    // Test 2: Scenes (should work - already implemented)
    await testEndpoint(`${baseUrl}/scenes`, 'All Scenes');
    await testEndpoint(`${baseUrl}/scenes?brandId=1`, 'Scenes for Brand 1');

    // Test 3: Films (should work - just implemented)
    await testEndpoint(`${baseUrl}/films`, 'All Films');
    await testEndpoint(`${baseUrl}/films?brandId=1`, 'Films for Brand 1');

    // Test 4: Roles (should work - already implemented)
    await testEndpoint(`${baseUrl}/roles`, 'All Roles');
    await testEndpoint(`${baseUrl}/roles?brandId=1`, 'Roles for Brand 1');

    // Test 5: Brands (for reference)
    await testEndpoint(`${baseUrl}/brands`, 'All Brands');

    console.log('\n🎉 Brand Filtering Test Complete!');
    console.log('==========================================');
}

main().catch(console.error);
