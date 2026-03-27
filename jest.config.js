/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/tools/**/*.test.js',
        '<rootDir>/scripts/**/*.test.js',
        '<rootDir>/packages/**/test/**/*.test.js'
    ],
    collectCoverageFrom: [
        'tools/auth/auth-service.js',
        'tools/auth/get-token.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tools/jest-setup.js'],
    testTimeout: 10000,
    verbose: true
};