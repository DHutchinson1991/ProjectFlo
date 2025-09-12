/**
 * Shared Authentication Utilities
 *
 * Provides authentication utilities that can be used by both frontend and scripts.
 * Follows the same patterns as the main authService but works in Node.js environments.
 */

import { readFileSync, writeFileSync } from 'fs';

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
export class TokenManager {
    private token: string | null = null;
    private tokenFile: string;

    constructor(tokenFile: string = 'auth-token.txt') {
        this.tokenFile = tokenFile;
        this.loadToken();
    }

    /**
     * Decode JWT token payload
     */
    private decodeJwtPayload(token: string) {
        try {
            const payload = token.split('.')[1];
            const decoded = Buffer.from(payload, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        } catch {
            throw new Error('Invalid JWT token format');
        }
    }

    /**
     * Check if token is expired or will expire soon
     */
    isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
        try {
            const payload = this.decodeJwtPayload(token);
            const currentTime = Math.floor(Date.now() / 1000);
            const bufferTime = bufferMinutes * 60;
            return (payload.exp - currentTime) < bufferTime;
        } catch {
            return true; // If we can't decode, assume it's expired
        }
    }

    /**
     * Get token expiration info
     */
    getTokenInfo(token: string) {
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
            return { isExpired: true, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Load token from file
     */
    private loadToken(): void {
        try {
            this.token = readFileSync(this.tokenFile, 'utf8').trim();
        } catch {
            this.token = null;
        }
    }

    /**
     * Save token to file
     */
    private saveToken(token: string): void {
        try {
            writeFileSync(this.tokenFile, token);
            this.token = token;
        } catch (error) {
            console.error('Failed to save token:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Get current token
     */
    getToken(): string | null {
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
    setToken(token: string | null): void {
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
    clearToken(): void {
        this.token = null;
        try {
            // Note: In a real implementation, you might want to delete the file
            // But for now, we'll just clear the in-memory token
        } catch {
            // Ignore errors when clearing token
        }
    }

    /**
     * Check if we have a valid token
     */
    hasValidToken(): boolean {
        const token = this.getToken();
        return token !== null && !this.isTokenExpired(token);
    }
}

/**
 * Authentication service for scripts
 */
export class ScriptAuthService {
    private tokenManager: TokenManager;
    private baseURL: string;

    constructor(options: {
        tokenFile?: string;
        environment?: keyof typeof environments;
        apiUrl?: string;
    } = {}) {
        const env = options.environment || 'development';
        const envConfig = environments[env];

        this.baseURL = options.apiUrl || envConfig.apiUrl;
        this.tokenManager = new TokenManager(options.tokenFile);
    }

    /**
     * Login with credentials
     */
    async login(credentials: { email: string; password: string }) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
    getToken(): string | null {
        return this.tokenManager.getToken();
    }

    /**
     * Set token
     */
    setToken(token: string | null): void {
        this.tokenManager.setToken(token);
    }

    /**
     * Check if we have a valid token
     */
    hasValidToken(): boolean {
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
    clearToken(): void {
        this.tokenManager.clearToken();
    }

    /**
     * Get base URL
     */
    getBaseURL(): string {
        return this.baseURL;
    }
}

// Export singleton instance for scripts
export const scriptAuth = new ScriptAuthService();

// Export for frontend compatibility
// In browser environments, this will be overridden by the real authService
export const authService = scriptAuth;