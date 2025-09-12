#!/usr/bin/env node

/**
 * Get Authentication Token for API Testing
 *
 * This script logs in with admin credentials and returns a JWT token
 * that can be used for testing authenticated API endpoints.
 */

// Load environment variables
require('dotenv').config();

// Import shared authentication service
const { ScriptAuthService } = require('./shared-auth.js');

// Import readline for interactive mode
const readline = require('readline');

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
            case '--interactive':
            case '-i':
                options.interactive = true;
                break;
            case '--duration':
            case '-d':
                const durationValue = args[++i];
                // Parse duration (e.g., "24h", "7d", "3600s", "60m")
                const durationMatch = durationValue.match(/^(\d+)([smhd])$/);
                if (durationMatch) {
                    const [, num, unit] = durationMatch;
                    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
                    options.duration = parseInt(num) * multipliers[unit];
                } else {
                    console.error(`Invalid duration format: ${durationValue}. Use format like 24h, 7d, 60m, 3600s`);
                    process.exit(1);
                }
                break;
            case '--extend':
                // Quick preset for extended duration (24 hours)
                options.duration = 24 * 60 * 60; // 24 hours in seconds
                break;
            default:
                if (arg.startsWith('--env=')) {
                    options.env = arg.split('=')[1];
                } else if (arg.startsWith('--duration=')) {
                    const durationValue = arg.split('=')[1];
                    const durationMatch = durationValue.match(/^(\d+)([smhd])$/);
                    if (durationMatch) {
                        const [, num, unit] = durationMatch;
                        const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
                        options.duration = parseInt(num) * multipliers[unit];
                    } else {
                        console.error(`Invalid duration format: ${durationValue}. Use format like 24h, 7d, 60m, 3600s`);
                        process.exit(1);
                    }
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
🔐 Auth Token Script - Get JWT tokens for API testing

USAGE:
    node get-auth-token.js [options]

OPTIONS:
    -e, --env <environment>    Target environment (development, staging, production) [default: development]
    -d, --duration <duration>  Token duration (e.g., 24h, 7d, 60m, 3600s) [default: server default]
    --extend                   Quick preset for 24-hour token duration
    -i, --interactive          Interactive mode with guided prompts
    -f, --force                Force token refresh even if existing token is valid
    -v, --verbose              Enable verbose output
    -h, --help                 Show this help message

ENVIRONMENTS:
    development    http://localhost:3002 (default)
    staging        https://api-staging.projectflo.com
    production     https://api.projectflo.com

EXAMPLES:
    node get-auth-token.js                     # Get token for development
    node get-auth-token.js --env staging       # Get token for staging
    node get-auth-token.js --duration 24h      # Get 24-hour token
    node get-auth-token.js --extend            # Quick 24-hour token
    node get-auth-token.js --duration 7d       # Get 7-day token
    node get-auth-token.js --interactive       # Interactive guided setup
    node get-auth-token.js --force             # Force refresh existing token
    node get-auth-token.js --verbose           # Show detailed output

ENVIRONMENT VARIABLES:
    ADMIN_EMAIL     Admin user email (required)
    ADMIN_PASSWORD  Admin user password (required)
    API_BASE_URL    Override default API URL for environment

The token will be saved to auth-token.txt and displayed with usage examples.
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

/**
 * Auto-detect environment based on various signals
 */
function autoDetectEnvironment() {
    const fs = require('fs');
    const path = require('path');

    // 1. Git branch detection
    try {
        const gitHead = fs.readFileSync('.git/HEAD', 'utf8').trim();
        if (gitHead.includes('staging')) {
            console.log('🎯 Auto-detected environment: staging (git branch)');
            return 'staging';
        } else if (gitHead.includes('production') || gitHead.includes('main') || gitHead.includes('master')) {
            console.log('🎯 Auto-detected environment: production (git branch)');
            return 'production';
        }
    } catch (error) {
        // Git not available or not a git repo
    }

    // 2. Directory-based detection
    const currentDir = process.cwd();
    const dirName = path.basename(currentDir);

    if (dirName.includes('staging') || dirName.includes('stage')) {
        console.log('🎯 Auto-detected environment: staging (directory name)');
        return 'staging';
    } else if (dirName.includes('prod') || dirName.includes('production')) {
        console.log('🎯 Auto-detected environment: production (directory name)');
        return 'production';
    }

    // 3. Environment variable detection
    if (process.env.NODE_ENV === 'production') {
        console.log('🎯 Auto-detected environment: production (NODE_ENV)');
        return 'production';
    } else if (process.env.NODE_ENV === 'staging') {
        console.log('🎯 Auto-detected environment: staging (NODE_ENV)');
        return 'staging';
    }

    // 4. File-based detection
    const stagingFiles = ['.staging', 'staging.json', 'config.staging.js'];
    const prodFiles = ['.production', 'production.json', 'config.production.js'];

    for (const file of stagingFiles) {
        if (fs.existsSync(file)) {
            console.log(`🎯 Auto-detected environment: staging (found ${file})`);
            return 'staging';
        }
    }

    for (const file of prodFiles) {
        if (fs.existsSync(file)) {
            console.log(`🎯 Auto-detected environment: production (found ${file})`);
            return 'production';
        }
    }

    // 5. Port-based detection (check if servers are running)
    const net = require('net');

    return new Promise((resolve) => {
        // Check staging port (common staging ports)
        const stagingPorts = [3003, 4000, 8080];
        let checkedPorts = 0;
        const totalPorts = stagingPorts.length;

        if (totalPorts === 0) {
            resolve('development');
            return;
        }

        stagingPorts.forEach(port => {
            const client = net.createConnection({ port, host: 'localhost' }, () => {
                console.log(`🎯 Auto-detected environment: staging (server running on port ${port})`);
                client.end();
                resolve('staging');
            });

            client.on('error', () => {
                checkedPorts++;
                if (checkedPorts === totalPorts) {
                    resolve('development');
                }
            });

            client.setTimeout(1000, () => {
                client.destroy();
                checkedPorts++;
                if (checkedPorts === totalPorts) {
                    resolve('development');
                }
            });
        });
    });
}

// Interactive mode functionality
async function runInteractiveMode() {
    console.log('🎯 Welcome to Interactive Auth Token Setup!');
    console.log('==========================================\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    try {
        // Auto-detect suggested environment
        let suggestedEnv = 'development';
        try {
            if (typeof autoDetectEnvironment() === 'string') {
                suggestedEnv = autoDetectEnvironment();
            } else {
                suggestedEnv = await autoDetectEnvironment();
            }
        } catch (error) {
            // Auto-detection failed, use default
        }

        // Environment selection
        console.log('🌍 Choose your environment:');
        Object.entries(environments).forEach(([key, env], index) => {
            const marker = key === suggestedEnv ? ' ⭐' : '';
            console.log(`  ${index + 1}. ${env.name} - ${env.description}${marker}`);
            console.log(`     URL: ${env.apiUrl}`);
        });
        console.log('  4. Custom environment');

        const defaultChoice = Object.keys(environments).indexOf(suggestedEnv) + 1;
        const envChoice = await question(`\nEnter your choice (1-4) [${defaultChoice}]: `);
        const choice = parseInt(envChoice) || 1;

        let selectedEnv = 'development';
        if (choice >= 1 && choice <= 3) {
            selectedEnv = Object.keys(environments)[choice - 1];
        } else if (choice === 4) {
            const customUrl = await question('Enter custom API URL: ');
            if (!customUrl.trim()) {
                console.log('❌ Custom URL cannot be empty. Using development.');
            } else {
                selectedEnv = 'custom';
                environments.custom = {
                    name: 'Custom',
                    apiUrl: customUrl.trim(),
                    description: 'Custom environment'
                };
            }
        }

        console.log(`✅ Selected: ${environments[selectedEnv].name}\n`);

        // Duration selection
        console.log('⏰ Choose token duration:');
        console.log('  1. Default (server setting)');
        console.log('  2. 1 hour');
        console.log('  3. 24 hours (recommended)');
        console.log('  4. 7 days');
        console.log('  5. 30 days');
        console.log('  6. Custom duration');

        const durationChoice = await question('\nEnter your choice (1-6) [3]: ');
        const durationNum = parseInt(durationChoice) || 3;

        let duration = null;
        if (durationNum === 2) duration = 3600;        // 1 hour
        else if (durationNum === 3) duration = 86400;  // 24 hours
        else if (durationNum === 4) duration = 604800; // 7 days
        else if (durationNum === 5) duration = 2592000; // 30 days
        else if (durationNum === 6) {
            const customDuration = await question('Enter custom duration (e.g., 24h, 7d, 60m): ');
            if (customDuration.trim()) {
                const durationMatch = customDuration.match(/^(\d+)([smhd])$/);
                if (durationMatch) {
                    const [, num, unit] = durationMatch;
                    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
                    duration = parseInt(num) * multipliers[unit];
                } else {
                    console.log('❌ Invalid duration format. Using default.');
                }
            }
        }

        if (duration) {
            console.log(`✅ Token duration: ${Math.floor(duration / 3600)} hours\n`);
        } else {
            console.log('✅ Token duration: Default (server setting)\n');
        }

        // Force refresh option
        const forceChoice = await question('🔄 Force token refresh? (y/N): ');
        const force = forceChoice.toLowerCase().startsWith('y');

        if (force) {
            console.log('✅ Will force token refresh\n');
        }

        // Verbose output option
        const verboseChoice = await question('📝 Enable verbose output? (y/N): ');
        const verbose = verboseChoice.toLowerCase().startsWith('y');

        if (verbose) {
            console.log('✅ Verbose output enabled\n');
        }

        // Summary
        console.log('📋 Configuration Summary:');
        console.log(`   Environment: ${environments[selectedEnv].name}`);
        console.log(`   API URL: ${environments[selectedEnv].apiUrl}`);
        console.log(`   Duration: ${duration ? Math.floor(duration / 3600) + ' hours' : 'Default'}`);
        console.log(`   Force refresh: ${force ? 'Yes' : 'No'}`);
        console.log(`   Verbose: ${verbose ? 'Yes' : 'No'}`);

        const confirm = await question('\n🚀 Proceed with these settings? (Y/n): ');
        if (confirm.toLowerCase().startsWith('n')) {
            console.log('❌ Setup cancelled.');
            rl.close();
            return;
        }

        console.log('\n🔐 Starting authentication...\n');

        // Run with collected options
        const options = {
            env: selectedEnv,
            duration: duration,
            force: force,
            verbose: verbose
        };

        rl.close();
        await getAuthToken(options);

    } catch (error) {
        console.error('❌ Interactive setup failed:', error.message);
        rl.close();
        process.exit(1);
    }
}

// Using built-in fetch API (Node.js 18+)

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

async function getAuthToken(options = {}) {
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

        // Auto-detect environment if not specified
        if (!options.env) {
            if (typeof autoDetectEnvironment() === 'string') {
                options.env = autoDetectEnvironment();
            } else {
                // Handle async auto-detection
                options.env = await autoDetectEnvironment();
            }
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
            environment: options.env
            // tokenFile will default to .auth/tokens/{environment}.txt
        });

        // Check for existing token (unless force refresh is requested)
        if (!options.force && authService.hasValidToken()) {
            console.log('✅ Found valid existing token!');
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

        console.log('🔐 Getting authentication token...');
        console.log(`📧 Using admin email: ${adminEmail}`);

        // Login with retry mechanism
        const authData = await retryWithBackoff(async () => {
            const loginPayload = {
                email: adminEmail,
                password: adminPassword
            };

            // Add duration if specified (try different backend patterns)
            if (options.duration) {
                // Pattern 1: Add to payload
                loginPayload.duration = options.duration;

                // Pattern 2: Add as expires_in (OAuth style)
                loginPayload.expires_in = options.duration;

                console.log(`⏰ Requesting token with ${Math.floor(options.duration / 3600)}h duration...`);
            }

            return await authService.login(loginPayload);
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
        console.log('🔑 Access Token:');
        console.log(authData.access_token);
        console.log('');
        console.log('📋 Usage Examples:');
        console.log('');
        console.log('# Test contributors API:');
        console.log(`curl -H "Authorization: Bearer ${authData.access_token}" ${authService.getBaseURL()}/contributors`);
        console.log('');
        console.log('# Test specific contributor:');
        console.log(`curl -H "Authorization: Bearer ${authData.access_token}" ${authService.getBaseURL()}/contributors/3`);
        console.log('');
        console.log('# Test contacts API:');
        console.log(`curl -H "Authorization: Bearer ${authData.access_token}" ${authService.getBaseURL()}/contacts`);
        console.log('');
        console.log('# Update contributor (example):');
        console.log(`curl -X PATCH -H "Authorization: Bearer ${authData.access_token}" \\
      -H "Content-Type: application/json" \\
      -d '{"first_name":"Updated Name"}' \\
      ${authService.getBaseURL()}/contributors/3`);
        console.log('');

        console.log('💾 Token automatically saved by auth service!');
        console.log('✅ Token saved! You can use it with:');
        console.log('export AUTH_TOKEN=$(cat auth-token.txt)');
        console.log(`curl -H "Authorization: Bearer $AUTH_TOKEN" ${authService.getBaseURL()}/contributors`);

        return authData;

    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running');
        console.log('2. Check if the admin user exists (run seed files)');
        console.log('3. Verify the credentials are correct');
        console.log('4. Check your .env file has the correct values');
        process.exit(1);
    }
}

// Run the function
const options = parseArgs();

// Check if interactive mode is requested
if (options.interactive) {
    runInteractiveMode().catch(error => {
        console.error('❌ Interactive mode failed:', error.message);
        process.exit(1);
    });
} else {
    getAuthToken(options);
}
