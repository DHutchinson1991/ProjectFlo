/**
 * Automated Token Management
 *
 * Provides utilities for automated token management, including:
 * - Token refresh scheduling
 * - Automatic cleanup of expired tokens
 * - Token rotation for security
 */

import { ScriptAuthService } from './shared-auth';
import { promises as fs } from 'fs';

export interface TokenManagerConfig {
    tokenFile: string;
    environment: 'development' | 'staging' | 'production';
    refreshThresholdMinutes: number;
    maxRetries: number;
    onTokenRefresh?: (newToken: string) => void;
    onTokenExpired?: () => void;
}

export class AutomatedTokenManager {
    private config: TokenManagerConfig;
    private authService: ScriptAuthService;
    private refreshTimer: NodeJS.Timeout | null = null;
    private isRefreshing = false;

    constructor(config: TokenManagerConfig) {
        this.config = config;
        this.authService = new ScriptAuthService({
            environment: config.environment,
            tokenFile: config.tokenFile
        });

        // Start automated management
        this.startAutomatedManagement();
    }

    /**
     * Start automated token management
     */
    private startAutomatedManagement(): void {
        // Check token status immediately
        this.checkAndRefreshToken();

        // Set up periodic checks (every 5 minutes)
        this.refreshTimer = setInterval(() => {
            this.checkAndRefreshToken();
        }, 5 * 60 * 1000);
    }

    /**
     * Stop automated management
     */
    stop(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Check token status and refresh if needed
     */
    private async checkAndRefreshToken(): Promise<void> {
        if (this.isRefreshing) return;

        try {
            const token = this.authService.getToken();
            if (!token) {
                console.log('🔄 No token found, attempting to get new token...');
                await this.refreshToken();
                return;
            }

            const tokenInfo = this.authService.getTokenInfo();
            if (!tokenInfo || tokenInfo.isExpired) {
                console.log('⏰ Token expired, refreshing...');
                if (this.config.onTokenExpired) {
                    this.config.onTokenExpired();
                }
                await this.refreshToken();
                return;
            }

            // Check if token is close to expiring
            const minutesUntilExpiry = Math.floor((tokenInfo.timeUntilExpiry || 0) / (1000 * 60));
            if (minutesUntilExpiry <= this.config.refreshThresholdMinutes) {
                console.log(`⏰ Token expires in ${minutesUntilExpiry} minutes, refreshing...`);
                await this.refreshToken();
            }

        } catch (error) {
            console.error('❌ Error during token check:', error);
        }
    }

    /**
     * Refresh the token
     */
    private async refreshToken(): Promise<void> {
        if (this.isRefreshing) return;

        this.isRefreshing = true;
        let retries = 0;

        while (retries <= this.config.maxRetries) {
            try {
                // Get credentials from environment
                const email = process.env.ADMIN_EMAIL;
                const password = process.env.ADMIN_PASSWORD;

                if (!email || !password) {
                    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables');
                }

                console.log('🔄 Refreshing authentication token...');
                const authData = await this.authService.login({ email, password });

                if (this.config.onTokenRefresh) {
                    this.config.onTokenRefresh(authData.access_token);
                }

                console.log('✅ Token refreshed successfully');
                break;

            } catch (error) {
                retries++;
                console.error(`❌ Token refresh attempt ${retries} failed:`, error instanceof Error ? error.message : 'Unknown error');

                if (retries <= this.config.maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, retries), 30000); // Max 30 seconds
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        this.isRefreshing = false;
    }

    /**
     * Get current token
     */
    getToken(): string | null {
        return this.authService.getToken();
    }

    /**
     * Get token info
     */
    getTokenInfo() {
        return this.authService.getTokenInfo();
    }

    /**
     * Force token refresh
     */
    async forceRefresh(): Promise<void> {
        await this.refreshToken();
    }

    /**
     * Check if token is valid
     */
    hasValidToken(): boolean {
        return this.authService.hasValidToken();
    }

    /**
     * Clean up expired tokens from file system
     */
    static async cleanupExpiredTokens(tokenFiles: string[]): Promise<void> {
        for (const file of tokenFiles) {
            try {
                const token = await fs.readFile(file, 'utf8');
                if (token.trim()) {
                    // Simple check - if file exists and has content, assume it's a token
                    // In a real implementation, you'd decode and check expiration
                    console.log(`🧹 Would clean up expired token in ${file}`);
                    // await fs.unlink(file); // Uncomment to actually delete
                }
            } catch {
                // File doesn't exist or can't be read, skip
            }
        }
    }
}

/**
 * Token Rotation Manager for enhanced security
 */
export class TokenRotationManager {
    private managers: Map<string, AutomatedTokenManager> = new Map();
    private rotationTimer: NodeJS.Timeout | null = null;

    /**
     * Add a token manager for rotation
     */
    addManager(name: string, manager: AutomatedTokenManager): void {
        this.managers.set(name, manager);
    }

    /**
     * Remove a token manager
     */
    removeManager(name: string): void {
        const manager = this.managers.get(name);
        if (manager) {
            manager.stop();
            this.managers.delete(name);
        }
    }

    /**
     * Start token rotation (refresh all tokens periodically)
     */
    startRotation(intervalHours: number = 24): void {
        this.stopRotation(); // Stop any existing rotation

        this.rotationTimer = setInterval(async () => {
            console.log('🔄 Starting scheduled token rotation...');

            for (const [name, manager] of this.managers) {
                try {
                    console.log(`🔄 Rotating token for ${name}...`);
                    await manager.forceRefresh();
                } catch (error) {
                    console.error(`❌ Failed to rotate token for ${name}:`, error);
                }
            }

            console.log('✅ Token rotation completed');
        }, intervalHours * 60 * 60 * 1000);
    }

    /**
     * Stop token rotation
     */
    stopRotation(): void {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = null;
        }
    }

    /**
     * Get status of all managed tokens
     */
    getStatus(): Record<string, { hasValidToken: boolean; tokenInfo: { expiresAt: Date | undefined; timeUntilExpiry: number } | null }> {
        const status: Record<string, { hasValidToken: boolean; tokenInfo: { expiresAt: Date | undefined; timeUntilExpiry: number } | null }> = {};

        for (const [name, manager] of this.managers) {
            const tokenInfo = manager.getTokenInfo();
            status[name] = {
                hasValidToken: manager.hasValidToken(),
                tokenInfo: tokenInfo ? {
                    expiresAt: tokenInfo.expiresAt,
                    timeUntilExpiry: Math.floor((tokenInfo.timeUntilExpiry || 0) / (1000 * 60))
                } : null
            };
        }

        return status;
    }

    /**
     * Stop all managers
     */
    stopAll(): void {
        this.stopRotation();

        for (const manager of this.managers.values()) {
            manager.stop();
        }

        this.managers.clear();
    }
}

// Export convenience functions
export const createTokenManager = (config: TokenManagerConfig): AutomatedTokenManager => {
    return new AutomatedTokenManager(config);
};

export const createTokenRotationManager = (): TokenRotationManager => {
    return new TokenRotationManager();
};