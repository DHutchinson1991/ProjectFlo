#!/usr/bin/env node

// Get Auth Token and Test Protected Brand Filtering Endpoints
// This script logs in and tests all brand filtering endpoints with authentication

const baseUrl = 'http://localhost:3002';

async function login() {
    try {
        console.log('🔐 Logging in to get auth token...');

        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'info@dhutchinson.co.uk',
                password: 'Alined@2025'
            })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            console.log('✅ Login successful!');
            console.log(`👤 User: ${data.user?.contact?.first_name} ${data.user?.contact?.last_name}`);
            return data.access_token;
        } else {
            console.log('❌ Login failed:', data);
            return null;
        }
    } catch (error) {
        console.log('💥 Login error:', error.message);
        return null;
    }
}

async function testProtectedEndpoint(url, description, token) {
    try {
        console.log(`\n🧪 Testing: ${description}`);
        console.log(`📡 URL: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

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

async function testPublicEndpoint(url, description) {
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
    console.log('🚀 Testing Brand Filtering with Authentication');
    console.log('===============================================');

    // Step 1: Get auth token
    const token = await login();
    if (!token) {
        console.log('❌ Cannot proceed without auth token');
        return;
    }

    console.log('\n🔓 Testing Protected Endpoints with Auth Token:');
    console.log('================================================');

    // Test protected endpoints
    await testProtectedEndpoint(`${baseUrl}/contacts`, 'All Contacts', token);
    await testProtectedEndpoint(`${baseUrl}/contacts?brandId=1`, 'Contacts for Brand 1', token);
    await testProtectedEndpoint(`${baseUrl}/roles`, 'All Roles', token);
    await testProtectedEndpoint(`${baseUrl}/roles?brandId=1`, 'Roles for Brand 1', token);

    console.log('\n🌐 Testing Public Endpoints (No Auth Required):');
    console.log('===============================================');

    // Test public endpoints
    await testPublicEndpoint(`${baseUrl}/scenes`, 'All Scenes');
    await testPublicEndpoint(`${baseUrl}/scenes?brandId=1`, 'Scenes for Brand 1');
    await testPublicEndpoint(`${baseUrl}/films`, 'All Films');
    await testPublicEndpoint(`${baseUrl}/films?brandId=1`, 'Films for Brand 1');
    await testPublicEndpoint(`${baseUrl}/brands`, 'All Brands');

    console.log('\n🎉 Brand Filtering Test with Auth Complete!');
    console.log('============================================');
}

main().catch(console.error);
