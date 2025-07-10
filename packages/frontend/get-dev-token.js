#!/usr/bin/env node

/**
 * Authentication Token Utility for Frontend Development
 * 
 * This script gets a valid auth token and provides commands to set it
 * in the frontend development environment.
 */

// Using built-in fetch API (Node.js 18+)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function getAuthTokenForDevelopment() {
    try {
        console.log('🔐 Getting authentication token for frontend development...');

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

        // Save to file for development use
        const tokenFile = path.join(__dirname, 'dev-auth-token.txt');
        fs.writeFileSync(tokenFile, authData.access_token);

        console.log('');
        console.log('🔑 Token saved to dev-auth-token.txt');
        console.log('');
        console.log('📋 Frontend Development Usage:');
        console.log('');
        console.log('1. In your browser console, run:');
        console.log('```');
        console.log(`window.__auth.setToken("${authData.access_token}")`);
        console.log('```');
        console.log('');
        console.log('2. Or in your code:');
        console.log('```');
        console.log(`import { setDevAuthToken } from '@/lib/auth-utils';`);
        console.log(`setDevAuthToken("${authData.access_token.substring(0, 20)}..."); // Use the full token from dev-auth-token.txt`);
        console.log('```');
        console.log('');
        console.log('3. Verify token is set:');
        console.log('```');
        console.log('window.__auth.debug()');
        console.log('```');

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
getAuthTokenForDevelopment();
