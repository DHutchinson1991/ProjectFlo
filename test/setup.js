/**
 * Jest Test Setup
 *
 * Global test configuration and utilities
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'test@example.com';
process.env.ADMIN_PASSWORD = 'testpassword123';

// Mock console methods to reduce noise during testing
global.originalConsole = { ...console };

// Uncomment to silence console output during tests
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();

// Clean up function to restore console after tests
global.restoreConsole = () => {
    console = global.originalConsole;
};

// Global test utilities
global.testUtils = {
    // Generate mock JWT token
    generateMockToken: (overrides = {}) => {
        const defaultPayload = {
            sub: '123',
            email: 'test@example.com',
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            ...overrides
        };

        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = Buffer.from(JSON.stringify(defaultPayload)).toString('base64');
        const signature = 'mock_signature';
        return `${header}.${payload}.${signature}`;
    },

    // Generate expired token
    generateExpiredToken: () => {
        return global.testUtils.generateMockToken({
            exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        });
    },

    // Mock fetch response
    mockFetchResponse: (data, options = {}) => ({
        ok: options.ok !== false,
        status: options.status || 200,
        json: jest.fn().mockResolvedValue(data),
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
        ...options
    }),

    // Clean up test files
    cleanupTestFiles: (files) => {
        const fs = require('fs');
        files.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    }
};