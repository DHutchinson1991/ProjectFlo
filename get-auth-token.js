#!/usr/bin/env node

/**
 * Get Authentication Token for API Testing
 * 
 * This script logs in with admin credentials and returns a JWT token
 * that can be used for testing authenticated API endpoints.
 */

// Using built-in fetch API (Node.js 18+)

async function getAuthToken() {
    try {
        console.log('🔐 Getting authentication token...');

        const loginResponse = await fetch('http://localhost:3002/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'info@dhutchinson.co.uk',
                password: 'Alined@2025'
            })
        });

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
        }

        const authData = await loginResponse.json();

        if (!authData.access_token) {
            throw new Error('No access token received');
        }

        console.log('✅ Successfully authenticated!');
        console.log('👤 User:', authData.user?.email || 'Unknown');
        console.log('🎯 Role:', authData.user?.role?.name || 'Unknown');
        console.log('');
        console.log('🔑 Access Token:');
        console.log(authData.access_token);
        console.log('');
        console.log('📋 Usage Examples:');
        console.log('');
        console.log('# Test contributors API:');
        console.log(`curl -H "Authorization: Bearer ${authData.access_token}" http://localhost:3002/contributors`);
        console.log('');
        console.log('# Test specific contributor:');
        console.log(`curl -H "Authorization: Bearer ${authData.access_token}" http://localhost:3002/contributors/3`);
        console.log('');
        console.log('# Test contacts API:');
        console.log(`curl -H "Authorization: Bearer ${authData.access_token}" http://localhost:3002/contacts`);
        console.log('');
        console.log('# Update contributor (example):');
        console.log(`curl -X PATCH -H "Authorization: Bearer ${authData.access_token}" \\
     -H "Content-Type: application/json" \\
     -d '{"first_name":"Updated Name"}' \\
     http://localhost:3002/contributors/3`);
        console.log('');

        // Store token in a simple way for other scripts to use
        console.log('💾 Saving token to auth-token.txt...');
        require('fs').writeFileSync('auth-token.txt', authData.access_token);
        console.log('✅ Token saved! You can use it with:');
        console.log('export AUTH_TOKEN=$(cat auth-token.txt)');
        console.log('curl -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:3002/contributors');

        return authData;

    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running on port 3002');
        console.log('2. Check if the admin user exists (run seed files)');
        console.log('3. Verify the credentials are correct');
        process.exit(1);
    }
}

// Run the function
getAuthToken();
