#!/usr/bin/env node

/**
 * ProjectFlo Auth Token CLI
 *
 * Fetches a JWT token for API testing or frontend development.
 *
 * Usage:
 *   node tools/auth/get-token.js                      # API token for dev
 *   node tools/auth/get-token.js --frontend            # Token + frontend paste instructions
 *   node tools/auth/get-token.js --env staging         # Staging environment
 *   node tools/auth/get-token.js --interactive         # Guided setup wizard
 *   node tools/auth/get-token.js --extend              # 24-hour token
 */

require('dotenv').config();

const { ScriptAuthService, environments } = require('./auth-service.js');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const net = require('net');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        env: 'development',
        help: false,
        verbose: false,
        force: false,
        frontend: false,
        interactive: false,
        duration: null,
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
            case '--frontend':
                options.frontend = true;
                break;
            case '--interactive':
            case '-i':
                options.interactive = true;
                break;
            case '--extend':
                options.duration = 24 * 60 * 60;
                break;
            case '--duration':
            case '-d': {
                const val = args[++i];
                options.duration = parseDuration(val);
                break;
            }
            default:
                if (arg.startsWith('--env=')) {
                    options.env = arg.split('=')[1];
                } else if (arg.startsWith('--duration=')) {
                    options.duration = parseDuration(arg.split('=')[1]);
                } else {
                    console.error(`Unknown option: ${arg}`);
                    process.exit(1);
                }
        }
    }

    return options;
}

function parseDuration(val) {
    const match = val.match(/^(\d+)([smhd])$/);
    if (!match) {
        console.error(`Invalid duration format: ${val}. Use format like 24h, 7d, 60m, 3600s`);
        process.exit(1);
    }
    const [, num, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(num) * multipliers[unit];
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function showHelp() {
    console.log(`
🔐 ProjectFlo Auth Token CLI

USAGE:
    node tools/auth/get-token.js [options]

OPTIONS:
    -e, --env <env>        Target environment (development, staging, production) [default: development]
    -d, --duration <dur>   Token duration (e.g., 24h, 7d, 60m, 3600s) [default: server default]
    --extend               Quick preset for 24-hour token
    --frontend             Output frontend paste instructions instead of curl examples
    -i, --interactive      Interactive guided setup
    -f, --force            Force refresh even if existing token is valid
    -v, --verbose          Verbose output
    -h, --help             Show this help message

ENVIRONMENTS:
    development    http://localhost:3002 (default)
    staging        https://api-staging.projectflo.com
    production     https://api.projectflo.com

EXAMPLES:
    node tools/auth/get-token.js                          # Dev API token
    node tools/auth/get-token.js --frontend               # Dev frontend token
    node tools/auth/get-token.js --env staging --extend   # 24h staging token
    node tools/auth/get-token.js --interactive             # Guided wizard

ENVIRONMENT VARIABLES:
    ADMIN_EMAIL     Admin email (required)
    ADMIN_PASSWORD  Admin password (required)
    API_BASE_URL    Override API URL
`);
}

// ---------------------------------------------------------------------------
// Auto-detect environment
// ---------------------------------------------------------------------------

function autoDetectEnvironment() {
    // Git branch
    try {
        const gitHead = fs.readFileSync('.git/HEAD', 'utf8').trim();
        if (gitHead.includes('staging')) return 'staging';
        if (gitHead.includes('production') || gitHead.includes('main') || gitHead.includes('master')) return 'production';
    } catch {
        // .git/HEAD may not exist in CI or non-git environments
    }

    // NODE_ENV
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'staging') return 'staging';

    return 'development';
}

// ---------------------------------------------------------------------------
// Interactive mode
// ---------------------------------------------------------------------------

async function runInteractiveMode() {
    console.log('🎯 Welcome to Interactive Auth Token Setup!');
    console.log('==========================================\n');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q) => new Promise((resolve) => rl.question(q, resolve));

    try {
        const suggestedEnv = autoDetectEnvironment();

        // Environment selection
        console.log('🌍 Choose your environment:');
        Object.entries(environments).forEach(([key, env], index) => {
            const marker = key === suggestedEnv ? ' ⭐' : '';
            console.log(`  ${index + 1}. ${env.name} - ${env.description}${marker}`);
        });
        console.log('  4. Custom environment');

        const defaultChoice = Object.keys(environments).indexOf(suggestedEnv) + 1;
        const envChoice = await question(`\nEnter your choice (1-4) [${defaultChoice}]: `);
        const choice = parseInt(envChoice) || defaultChoice;

        let selectedEnv = 'development';
        if (choice >= 1 && choice <= 3) {
            selectedEnv = Object.keys(environments)[choice - 1];
        } else if (choice === 4) {
            const customUrl = await question('Enter custom API URL: ');
            if (!customUrl.trim()) {
                console.log('❌ Custom URL cannot be empty. Using development.');
            } else {
                selectedEnv = 'custom';
                environments.custom = { name: 'Custom', apiUrl: customUrl.trim(), description: 'Custom environment' };
            }
        }
        console.log(`✅ Selected: ${environments[selectedEnv].name}\n`);

        // Duration
        console.log('⏰ Choose token duration:');
        console.log('  1. Default (server setting)');
        console.log('  2. 1 hour');
        console.log('  3. 24 hours (recommended)');
        console.log('  4. 7 days');
        console.log('  5. 30 days');
        const durationChoice = await question('\nEnter your choice (1-5) [3]: ');
        const durationMap = { 1: null, 2: 3600, 3: 86400, 4: 604800, 5: 2592000 };
        const duration = durationMap[parseInt(durationChoice) || 3] ?? null;

        // Mode
        const modeChoice = await question('🖥️  Output frontend paste instructions? (y/N): ');
        const frontend = modeChoice.toLowerCase().startsWith('y');

        // Force
        const forceChoice = await question('🔄 Force token refresh? (y/N): ');
        const force = forceChoice.toLowerCase().startsWith('y');

        // Summary
        console.log('\n📋 Configuration Summary:');
        console.log(`   Environment: ${environments[selectedEnv].name}`);
        console.log(`   Duration: ${duration ? Math.floor(duration / 3600) + ' hours' : 'Default'}`);
        console.log(`   Mode: ${frontend ? 'Frontend' : 'API'}`);
        console.log(`   Force refresh: ${force ? 'Yes' : 'No'}`);

        const confirm = await question('\n🚀 Proceed? (Y/n): ');
        if (confirm.toLowerCase().startsWith('n')) {
            console.log('❌ Cancelled.');
            rl.close();
            return;
        }

        console.log('\n🔐 Starting authentication...\n');
        rl.close();
        await getToken({ env: selectedEnv, duration, frontend, force, verbose: false });
    } catch (error) {
        console.error('❌ Interactive setup failed:', error.message);
        rl.close();
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Core: fetch token
// ---------------------------------------------------------------------------

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (error.message.includes('Login failed') && error.message.includes('4')) throw error;
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}

async function getToken(options = {}) {
    try {
        if (options.help) { showHelp(); return; }

        if (!options.env) {
            options.env = autoDetectEnvironment();
        }

        if (!environments[options.env]) {
            console.error(`❌ Unknown environment: ${options.env}`);
            console.log('Available:', Object.keys(environments).join(', '));
            process.exit(1);
        }

        const envConfig = environments[options.env];
        console.log(`🌍 Target Environment: ${envConfig.name} (${envConfig.description})`);
        if (options.verbose) console.log(`📍 API URL: ${envConfig.apiUrl}`);

        // Validate env vars
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            throw new Error('Missing ADMIN_EMAIL and/or ADMIN_PASSWORD in .env');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(adminEmail)) throw new Error('Invalid ADMIN_EMAIL format');
        if (adminPassword.length < 6) throw new Error('ADMIN_PASSWORD must be ≥6 characters');

        const authService = new ScriptAuthService({ environment: options.env });

        // Reuse existing token unless --force
        if (!options.force && authService.hasValidToken()) {
            console.log('✅ Found valid existing token!');
            const info = authService.getTokenInfo();
            if (info) {
                printTokenInfo(info);
                console.log('🔄 Using existing token (no refresh needed)');
                if (options.frontend) printFrontendInstructions(authService.getToken());
                return { access_token: authService.getToken() };
            }
        } else if (options.force) {
            console.log('🔄 Force refresh requested...');
        }

        console.log('🔐 Getting authentication token...');
        console.log(`📧 Using admin email: ${adminEmail}`);

        const loginPayload = { email: adminEmail, password: adminPassword };
        if (options.duration) {
            loginPayload.duration = options.duration;
            loginPayload.expires_in = options.duration;
            console.log(`⏰ Requesting ${Math.floor(options.duration / 3600)}h duration...`);
        }

        const authData = await retryWithBackoff(() => authService.login(loginPayload));

        console.log('✅ Successfully authenticated!');
        console.log('👤 User:', authData.user?.email || 'Unknown');
        console.log('🎯 Role:', authData.user?.role?.name || 'Unknown');

        const info = authService.getTokenInfo();
        if (info) printTokenInfo(info);

        console.log('');

        if (options.frontend) {
            printFrontendInstructions(authData.access_token);
        } else {
            printApiInstructions(authData.access_token, authService.getBaseURL());
        }

        console.log('💾 Token saved automatically.');
        return authData;

    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running');
        console.log('2. Check if the admin user exists (run seed files)');
        console.log('3. Verify credentials in .env');
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function printTokenInfo(info) {
    console.log('👤 User:', info.email || 'Unknown');
    console.log('🎯 Role:', info.role || 'Unknown');
    console.log('⏰ Expires:', info.expiresAt.toLocaleString());
    console.log(`⏳ Time left: ${Math.floor(info.timeUntilExpiry / 60000)} minutes`);
}

function printApiInstructions(token, baseURL) {
    console.log('🔑 Access Token:');
    console.log(token);
    console.log('');
    console.log('📋 Usage Examples:');
    console.log(`curl -H "Authorization: Bearer ${token}" ${baseURL}/crew`);
    console.log('');
    console.log('export AUTH_TOKEN=$(cat .auth/tokens/development.txt)');
    console.log(`curl -H "Authorization: Bearer $AUTH_TOKEN" ${baseURL}/crew`);
}

function printFrontendInstructions(token) {
    console.log('📋 Frontend Development Usage:');
    console.log('');
    console.log('1. In your browser console:');
    console.log(`   window.__auth.setToken("${token}")`);
    console.log('');
    console.log('2. Or in code:');
    console.log(`   import { setDevAuthToken } from '@/lib/auth-utils';`);
    console.log(`   setDevAuthToken("${token.substring(0, 20)}...");`);
    console.log('');
    console.log('3. Verify:');
    console.log('   window.__auth.debug()');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const options = parseArgs();

if (options.interactive) {
    runInteractiveMode().catch((error) => {
        console.error('❌ Interactive mode failed:', error.message);
        process.exit(1);
    });
} else {
    getToken(options);
}
