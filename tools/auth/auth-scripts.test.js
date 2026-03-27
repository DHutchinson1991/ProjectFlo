/**
 * Comprehensive Tests for Auth Token Scripts
 *
 * Tests cover:
 * - Shared authentication service functionality
 * - Token management and validation
 * - CLI argument parsing
 * - Environment configuration
 * - Error handling and retry mechanisms
 * - Integration with different environments
 */

const { ScriptAuthService, TokenManager } = require('./shared-auth');

// Define environments directly for tests
const envs = {
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
const fs = require('fs');
const path = require('path');

// Mock fetch for testing
global.fetch = jest.fn();

// Mock environment variables
process.env.ADMIN_EMAIL = 'test@example.com';
process.env.ADMIN_PASSWORD = 'testpassword123';

describe('Auth Token Scripts - Comprehensive Tests', () => {

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Reset environment variables
        process.env.ADMIN_EMAIL = 'test@example.com';
        process.env.ADMIN_PASSWORD = 'testpassword123';
        delete process.env.API_BASE_URL;

        // Clean up any test token files
        const testTokenFile = 'test-auth-token.txt';
        if (fs.existsSync(testTokenFile)) {
            fs.unlinkSync(testTokenFile);
        }
    });

    afterAll(() => {
        // Clean up test files
        const testTokenFile = 'test-auth-token.txt';
        if (fs.existsSync(testTokenFile)) {
            fs.unlinkSync(testTokenFile);
        }
    });

    describe('TokenManager', () => {
        test('should decode valid JWT token', () => {
            const tokenManager = new TokenManager('test-auth-token.txt');

            // Mock JWT token (header.payload.signature)
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({
                sub: '123',
                email: 'test@example.com',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
            })).toString('base64');
            const signature = 'signature';
            const token = `${header}.${payload}.${signature}`;

            const decoded = tokenManager.decodeJwtPayload(token);
            expect(decoded.sub).toBe('123');
            expect(decoded.email).toBe('test@example.com');
            expect(decoded.role).toBe('admin');
        });

        test('should detect expired tokens', () => {
            const tokenManager = new TokenManager('test-auth-token.txt');

            // Create expired token
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({
                sub: '123',
                email: 'test@example.com',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
                exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago (expired)
            })).toString('base64');
            const signature = 'signature';
            const expiredToken = `${header}.${payload}.${signature}`;

            expect(tokenManager.isTokenExpired(expiredToken)).toBe(true);
        });

        test('should detect valid tokens', () => {
            const tokenManager = new TokenManager('test-auth-token.txt');

            // Create valid token
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({
                sub: '123',
                email: 'test@example.com',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7200 // 2 hours from now
            })).toString('base64');
            const signature = 'signature';
            const validToken = `${header}.${payload}.${signature}`;

            expect(tokenManager.isTokenExpired(validToken)).toBe(false);
        });

        test('should handle invalid JWT tokens gracefully', () => {
            const tokenManager = new TokenManager('test-auth-token.txt');

            expect(() => tokenManager.decodeJwtPayload('invalid.token')).toThrow('Invalid JWT token format');
            expect(tokenManager.isTokenExpired('invalid.token')).toBe(true);
        });

        test('should save and load tokens from file', () => {
            const testTokenFile = 'test-auth-token.txt';
            const tokenManager = new TokenManager(testTokenFile);
            // Use a valid JWT token that won't expire
            const testToken = global.testUtils.generateMockToken();

            tokenManager.setToken(testToken);
            expect(tokenManager.getToken()).toBe(testToken);

            // Create new instance to test file loading
            const newTokenManager = new TokenManager(testTokenFile);
            expect(newTokenManager.getToken()).toBe(testToken);
        });
    });

    describe('ScriptAuthService', () => {
        test('should initialize with default environment', () => {
            const authService = new ScriptAuthService();
            expect(authService.getBaseURL()).toBe(envs.development.apiUrl);
        });

        test('should initialize with custom environment', () => {
            const authService = new ScriptAuthService({ environment: 'staging' });
            expect(authService.getBaseURL()).toBe(envs.staging.apiUrl);
        });

        test('should initialize with custom API URL', () => {
            const customUrl = 'https://custom-api.example.com';
            const authService = new ScriptAuthService({ apiUrl: customUrl });
            expect(authService.getBaseURL()).toBe(customUrl);
        });

        test('should successfully login and store token', async () => {
            const validToken = global.testUtils.generateMockToken();
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    access_token: validToken,
                    user: { email: 'test@example.com', role: { name: 'admin' } }
                })
            };

            global.fetch.mockResolvedValue(mockResponse);

            const authService = new ScriptAuthService();
            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result.access_token).toBe(validToken);
            expect(authService.getToken()).toBe(validToken);
            expect(global.fetch).toHaveBeenCalledWith(
                `${envs.development.apiUrl}/auth/login`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'password123'
                    })
                })
            );
        });

        test('should handle login failures', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                text: jest.fn().mockResolvedValue('Invalid credentials')
            };

            global.fetch.mockResolvedValue(mockResponse);

            const authService = new ScriptAuthService();

            await expect(authService.login({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            })).rejects.toThrow('Login failed: 401 - Invalid credentials');
        });

        test('should validate token expiration', async () => {
            const authService = new ScriptAuthService();

            // Mock expired token
            const expiredToken = 'header.' + Buffer.from(JSON.stringify({
                sub: '123',
                email: 'test@example.com',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000) - 7200,
                exp: Math.floor(Date.now() / 1000) - 3600
            })).toString('base64') + '.signature';

            authService.setToken(expiredToken);
            expect(authService.getToken()).toBeNull(); // Should be cleared due to expiration
            expect(authService.hasValidToken()).toBe(false);
        });
    });

    describe('Environment Configuration', () => {
        test('should have all required environments', () => {
            expect(envs).toHaveProperty('development');
            expect(envs).toHaveProperty('staging');
            expect(envs).toHaveProperty('production');
        });

        test('should have valid API URLs for all environments', () => {
            Object.values(envs).forEach(env => {
                expect(env.apiUrl).toMatch(/^https?:\/\/.+/);
                expect(env.name).toBeDefined();
                expect(env.description).toBeDefined();
            });
        });

        test('should use development as default environment', () => {
            const authService = new ScriptAuthService();
            expect(authService.getBaseURL()).toBe(envs.development.apiUrl);
        });
    });

    describe('Environment Variable Overrides', () => {
        test('should handle API_BASE_URL environment variable override', () => {
            process.env.API_BASE_URL = 'https://override.example.com';
            const authService = new ScriptAuthService();
            expect(authService.getBaseURL()).toBe('https://override.example.com');
            delete process.env.API_BASE_URL; // Clean up
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors during login', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const authService = new ScriptAuthService();

            await expect(authService.login({
                email: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Network error');
        });

        test('should handle malformed JSON responses', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
            };

            global.fetch.mockResolvedValue(mockResponse);

            const authService = new ScriptAuthService();

            await expect(authService.login({
                email: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Invalid JSON');
        });
    });

    describe('Integration Tests', () => {
        test('should work end-to-end with valid credentials', async () => {
            const validToken = global.testUtils.generateMockToken();
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    access_token: validToken,
                    user: { email: 'test@example.com', role: { name: 'admin' } }
                })
            };

            global.fetch.mockResolvedValue(mockResponse);

            const authService = new ScriptAuthService();
            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('user');
            expect(authService.hasValidToken()).toBe(true);
            expect(authService.getTokenInfo()).toBeTruthy();
        });

        test('should handle token persistence across service instances', () => {
            const tokenFile = 'test-auth-token.txt';
            const token1 = global.testUtils.generateMockToken();

            // First instance
            const authService1 = new ScriptAuthService({ tokenFile });
            authService1.setToken(token1);

            // Second instance should load the same token
            const authService2 = new ScriptAuthService({ tokenFile });
            expect(authService2.getToken()).toBe(token1);
        });
    });
});