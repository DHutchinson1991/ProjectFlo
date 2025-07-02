// Simple script to test auth endpoints
const fetch = require('node-fetch');

async function testAuth() {
    console.log('Testing auth endpoints...');

    try {
        // Login
        console.log('\nAttempting login...');
        const loginResponse = await fetch('http://localhost:3002/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'info@dhutchinson.co.uk',
                password: 'Alined@2025'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login status:', loginResponse.status, loginResponse.statusText);
        console.log('Headers:', Object.fromEntries(loginResponse.headers.entries()));

        if (!loginResponse.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        console.log('Login successful. Token received.');
        const token = loginData.access_token;

        // Profile
        console.log('\nFetching profile with token...');
        const profileResponse = await fetch('http://localhost:3002/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const profileData = await profileResponse.json();
        console.log('Profile status:', profileResponse.status, profileResponse.statusText);
        console.log('Headers:', Object.fromEntries(profileResponse.headers.entries()));
        console.log('Profile data:', profileData);

        // Test CORS
        console.log('\nTesting CORS preflight request...');
        const corsResponse = await fetch('http://localhost:3002/auth/profile', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3001',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Authorization'
            }
        });

        console.log('CORS status:', corsResponse.status, corsResponse.statusText);
        console.log('CORS Headers:', Object.fromEntries(corsResponse.headers.entries()));

    } catch (error) {
        console.error('Error during test:', error);
    }
}

testAuth();
