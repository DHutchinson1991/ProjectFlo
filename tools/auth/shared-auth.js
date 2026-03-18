
/**
 * Shared Authentication Utilities for Scripts
 *
 * JavaScript version of the shared auth service for use by Node.js scripts.
 * Provides authentication utilities that work in both script and frontend environments.
 */

const fs = require('fs');
const path = require('path');

// Environment configurations (same as in scripts)
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
 * JWT token utilities
 */
class TokenManager {
    constructor(tokenFile = null, environment = 'development') {
        this.token = null;
        this.environment = environment;

        // Use new .auth/tokens/ structure if no custom path provided
        if (!tokenFile) {
            tokenFile = `.auth/tokens/${environment}.txt`;
        }

        this.tokenFile = tokenFile;
        this.loadToken();
    }

    /**
     * Decode JWT token payload
     */
    decodeJwtPayload(token) {
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
     */
    isTokenExpired(token, bufferMinutes = 5) {
        try {
            const payload = this.decodeJwtPayload(token);
            const currentTime = Math.floor(Date.now() / 1000);
            const bufferTime = bufferMinutes * 60;
            return (payload.exp - currentTime) < bufferTime;
        } catch (error) {
            return true; // If we can't decode, assume it's expired
        }
    }

    /**
     * Get token expiration info
     */
    getTokenInfo(token) {
        try {
            const payload = this.decodeJwtPayload(token);
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
     * Load token from file
     */
    loadToken() {
        try {
            this.token = fs.readFileSync(this.tokenFile, 'utf8').trim();
        } catch (error) {
            this.token = null;
        }
    }

    /**
     * Save token to file
     */
    saveToken(token) {
        try {
            fs.writeFileSync(this.tokenFile, token);
            this.token = token;
        } catch (error) {
            console.error('Failed to save token:', error.message);
        }
    }

    /**
     * Get current token
     */
    getToken() {
        if (this.token && this.isTokenExpired(this.token)) {
            console.log('⏰ Token expired, clearing...');
            this.clearToken();
            return null;
        }
        return this.token;
    }

    /**
     * Set token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            this.saveToken(token);
        } else {
            this.clearToken();
        }
    }

    /**
     * Clear token
     */
    clearToken() {
        this.token = null;
    }

    /**
     * Check if we have a valid token
     */
    hasValidToken() {
        const token = this.getToken();
        return token !== null && !this.isTokenExpired(token);
    }
}

/**
 * Authentication service for scripts
 */
class ScriptAuthService {
    constructor(options = {}) {
        const env = options.environment || 'development';
        const envConfig = environments[env];

        if (!envConfig) {
            throw new Error(`Unknown environment: ${env}. Available: ${Object.keys(environments).join(', ')}`);
        }

        // Check for API_BASE_URL environment variable override
        this.baseURL = options.apiUrl || process.env.API_BASE_URL || envConfig.apiUrl;
        this.tokenManager = new TokenManager(options.tokenFile, env);
    }

    /**
     * Login with credentials
     */
    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add duration as header if specified
                ...(credentials.duration && { 'X-Token-Duration': credentials.duration.toString() })
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Login failed: ${response.status} - ${errorText}`);
        }

        const authData = await response.json();

        if (!authData.access_token) {
            throw new Error('No access token received');
        }

        this.tokenManager.setToken(authData.access_token);
        return authData;
    }

    /**
     * Get current token
     */
    getToken() {
        return this.tokenManager.getToken();
    }

    /**
     * Set token
     */
    setToken(token) {
        this.tokenManager.setToken(token);
    }

    /**
     * Check if we have a valid token
     */
    hasValidToken() {
        return this.tokenManager.hasValidToken();
    }

    /**
     * Get token info
     */
    getTokenInfo() {
        const token = this.getToken();
        if (!token) return null;
        return this.tokenManager.getTokenInfo(token);
    }

    /**
     * Clear token
     */
    clearToken() {
        this.tokenManager.clearToken();
    }

    /**
     * Get base URL
     */
    getBaseURL() {
        return this.baseURL;
    }
}

// Export singleton instance for scripts
const scriptAuth = new ScriptAuthService();

module.exports = {
    ScriptAuthService,
    TokenManager,
    scriptAuth,
    environments
};