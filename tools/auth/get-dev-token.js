#!/usr/bin/env node

/**
 * Authentication Token Utility for Frontend Development
 *
 * This script gets a valid auth token and provides commands to set it
 * in the frontend development environment.
 */

// Load environment variables
require('dotenv').config();

// Import shared authentication service
const { ScriptAuthService } = require('./shared-auth.js');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        env: 'development',
        help: false,
        verbose: false,
        force: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--env':
            case '-e':
                options.env = args[++i];
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--force':
            case '-f':
                options.force = true;
                break;
            default:
                if (arg.startsWith('--env=')) {
                    options.env = arg.split('=')[1];
                } else {
                    console.error(`Unknown option: ${arg}`);
                    process.exit(1);
                }
        }
    }

    return options;
}

// Show help information
function showHelp() {
    console.log(`
🔐 Frontend Dev Token Script - Get tokens for frontend development

USAGE:
    node Scripts/auth-token/get-dev-token.js [options]

OPTIONS:
    -e, --env <environment>    Target environment (development, staging, production) [default: development]
    -f, --force                Force token refresh even if existing token is valid
    -v, --verbose              Enable verbose output
    -h, --help                 Show this help message

ENVIRONMENTS:
    development    http://localhost:3002 (default)
    staging        https://api-staging.projectflo.com
    production     https://api.projectflo.com

EXAMPLES:
    node Scripts/auth-token/get-dev-token.js                     # Get token for development
    node Scripts/auth-token/get-dev-token.js --env staging       # Get token for staging
    node Scripts/auth-token/get-dev-token.js --force             # Force refresh existing token
    node Scripts/auth-token/get-dev-token.js --verbose           # Show detailed output

ENVIRONMENT VARIABLES:
    ADMIN_EMAIL     Admin user email (required)
    ADMIN_PASSWORD  Admin user password (required)
    API_BASE_URL    Override default API URL for environment

The token will be saved to Scripts/auth-token/auth-token.txt for unified use.
`);
}

// Environment configurations
const environments = {
    development: {
        name: 'Development',
        apiUrl: 'http://localhost:3002',
        description: 'Local development server'
    },
    staging: {
        name: 'Staging',
        apiUrl: 'https://api-staging.projectflo.com',
        description: 'Staging environment'
    },
    production: {
        name: 'Production',
        apiUrl: 'https://api.projectflo.com',
        description: 'Production environment'
    }
};

// Using built-in fetch API (Node.js 18+)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object} Decoded payload
 */
function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch (error) {
        throw new Error('Invalid JWT token format');
    }
}

/**
 * Check if token is expired or will expire soon
 * @param {string} token - JWT token
 * @param {number} bufferMinutes - Buffer time in minutes before expiration
 * @returns {boolean} True if token needs refresh
 */
function isTokenExpired(token, bufferMinutes = 5) {
    try {
        const payload = decodeJwtPayload(token);
        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = bufferMinutes * 60;
        return (payload.exp - currentTime) < bufferTime;
    } catch (error) {
        return true; // If we can't decode, assume it's expired
    }
}

/**
 * Get token expiration info
 * @param {string} token - JWT token
 * @returns {object} Token info with expiration details
 */
function getTokenInfo(token) {
    try {
        const payload = decodeJwtPayload(token);
        const expirationDate = new Date(payload.exp * 1000);
        const issuedDate = new Date(payload.iat * 1000);
        const currentTime = Date.now();

        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            issuedAt: issuedDate,
            expiresAt: expirationDate,
            isExpired: payload.exp * 1000 < currentTime,
            timeUntilExpiry: Math.max(0, payload.exp * 1000 - currentTime)
        };
    } catch (error) {
        return { isExpired: true, error: error.message };
    }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on authentication errors (400-499)
            if (error.message.includes('Login failed') && error.message.includes('4')) {
                throw error;
            }

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

async function getAuthTokenForDevelopment(options = {}) {
    try {
        // Parse command line arguments if not provided
        if (!options.env) {
            options = parseArgs();
        }

        // Show help if requested
        if (options.help) {
            showHelp();
            return;
        }

        // Validate environment selection
        if (!environments[options.env]) {
            console.error(`❌ Unknown environment: ${options.env}`);
            console.log('Available environments:', Object.keys(environments).join(', '));
            process.exit(1);
        }

        const envConfig = environments[options.env];
        console.log(`🌍 Target Environment: ${envConfig.name} (${envConfig.description})`);
        if (options.verbose) {
            console.log(`📍 API URL: ${envConfig.apiUrl}`);
        }

        // Validate environment variables
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const apiBaseUrl = process.env.API_BASE_URL || envConfig.apiUrl;

        if (!adminEmail || !adminPassword) {
            throw new Error('Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(adminEmail)) {
            throw new Error('Invalid email format in ADMIN_EMAIL environment variable');
        }

        // Validate password length
        if (adminPassword.length < 6) {
            throw new Error('ADMIN_PASSWORD must be at least 6 characters long');
        }

        // Create auth service instance for this environment
        const authService = new ScriptAuthService({
            environment: options.env,
            tokenFile: 'Scripts/auth-token/auth-token.txt'
        });

        // Check for existing token in dev file (unless force refresh is requested)
        if (!options.force && authService.hasValidToken()) {
            console.log('✅ Found valid existing token in dev file!');
            const tokenInfo = authService.getTokenInfo();
            if (tokenInfo) {
                console.log('👤 User:', tokenInfo.email || 'Unknown');
                console.log('🎯 Role:', tokenInfo.role || 'Unknown');
                console.log('⏰ Token expires:', tokenInfo.expiresAt.toLocaleString());
                const minutesUntilExpiry = Math.floor(tokenInfo.timeUntilExpiry / (1000 * 60));
                console.log(`⏳ Time until expiry: ${minutesUntilExpiry} minutes`);
                console.log('');
                console.log('🔄 Using existing token (no refresh needed)');
                return { access_token: authService.getToken(), user: { email: tokenInfo.email, role: { name: tokenInfo.role } } };
            }
        } else if (options.force) {
            console.log('🔄 Force refresh requested, ignoring existing token...');
        }

        console.log('🔐 Getting authentication token for frontend development...');
        console.log(`📧 Using admin email: ${adminEmail}`);

        // Login with retry mechanism
        const authData = await retryWithBackoff(async () => {
            return await authService.login({
                email: adminEmail,
                password: adminPassword
            });
        });

        console.log('✅ Successfully authenticated!');
        console.log('👤 User:', authData.user?.email || 'Unknown');
        console.log('🎯 Role:', authData.user?.role?.name || 'Unknown');

        // Display token information
        const tokenInfo = authService.getTokenInfo();
        if (tokenInfo) {
            console.log('⏰ Token expires:', tokenInfo.expiresAt.toLocaleString());
            const minutesUntilExpiry = Math.floor(tokenInfo.timeUntilExpiry / (1000 * 60));
            console.log(`⏳ Time until expiry: ${minutesUntilExpiry} minutes`);
        }

        console.log('');
        console.log('🔑 Token saved to Scripts/auth-token/auth-token.txt');
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
        console.log(`setDevAuthToken("${authData.access_token.substring(0, 20)}..."); // Use the full token from Scripts/auth-token/auth-token.txt`);
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
const options = parseArgs();
getAuthTokenForDevelopment(options);
