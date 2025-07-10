#!/usr/bin/env node

/**
 * Auth Standardization Verification Script
 * 
 * This script scans the frontend codebase for authentication-related
 * patterns and reports any non-standard usage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Root directory of the frontend project
const FRONTEND_ROOT = path.join(__dirname);

// Bad patterns to look for
const BAD_PATTERNS = [
    {
        pattern: 'localStorage.getItem("authToken")',
        description: 'Direct localStorage access for auth token (use authService.getToken() instead)'
    },
    {
        pattern: 'localStorage.setItem("authToken"',
        description: 'Direct localStorage setting for auth token (use authService.setToken() instead)'
    },
    {
        pattern: 'api.auth.',
        description: 'Using api.auth directly (use authService instead)'
    },
    {
        pattern: 'api.setAuthToken(',
        description: 'Using api.setAuthToken (use authService.setToken() instead)'
    },
    {
        pattern: 'localStorage.removeItem("authToken")',
        description: 'Direct localStorage removal for auth token (use authService.setToken(null) instead)'
    }
];

// Good patterns to look for
const GOOD_PATTERNS = [
    {
        pattern: 'import { authService }',
        description: 'Proper import of authService'
    },
    {
        pattern: 'authService.setToken(',
        description: 'Proper use of authService.setToken'
    },
    {
        pattern: 'authService.getToken(',
        description: 'Proper use of authService.getToken'
    },
    {
        pattern: 'authService.login(',
        description: 'Proper use of authService.login'
    }
];

// Run a grep command and return the results
function grepFiles(pattern) {
    try {
        const command = `grep -r "${pattern}" --include="*.ts" --include="*.tsx" src`;
        const result = execSync(command, { cwd: FRONTEND_ROOT, encoding: 'utf8' });
        return result.trim().split('\n').filter(line => line.trim());
    } catch (error) {
        // grep returns exit code 1 when no matches are found
        if (error.status === 1) {
            return [];
        }
        console.error(`Error running grep: ${error.message}`);
        return [];
    }
}

// Main function
async function verifyAuthStandardization() {
    console.log('🔍 Checking for non-standard authentication usage in frontend code...\n');

    let badPatternFound = false;

    // Check for bad patterns
    console.log('⚠️ Checking for problematic patterns:');
    console.log('-----------------------------------');

    for (const { pattern, description } of BAD_PATTERNS) {
        const matches = grepFiles(pattern);

        if (matches.length > 0) {
            badPatternFound = true;
            console.log(`❌ Found ${matches.length} instance(s) of: ${description}`);
            matches.slice(0, 3).forEach(match => console.log(`   - ${match.trim()}`));
            if (matches.length > 3) {
                console.log(`   - ... and ${matches.length - 3} more`);
            }
            console.log('');
        } else {
            console.log(`✅ No instances of: ${description}`);
        }
    }

    console.log('\n✅ Checking for good patterns:');
    console.log('-----------------------------------');

    for (const { pattern, description } of GOOD_PATTERNS) {
        const matches = grepFiles(pattern);

        if (matches.length > 0) {
            console.log(`✅ Found ${matches.length} instance(s) of: ${description}`);
        } else {
            console.log(`⚠️ No instances of: ${description}`);
        }
    }

    console.log('\n-----------------------------------');
    if (badPatternFound) {
        console.log('⚠️ Some non-standard authentication patterns were found!');
        console.log('📚 Please refer to src/lib/AUTH_STANDARDS.md for best practices.');
    } else {
        console.log('🎉 All authentication usage appears to be standardized!');
    }
    console.log('-----------------------------------\n');
}

// Run the verification
verifyAuthStandardization();
