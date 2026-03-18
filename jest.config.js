/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/test/**/*.test.js',
        '<rootDir>/packages/**/test/**/*.test.js'
    ],
    collectCoverageFrom: [
        'shared-auth.js',
        'get-auth-token.js',
        'packages/frontend/get-dev-token.js',
        '!**/node_modules/**',
        '!**/test/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    testTimeout: 10000,
    verbose: true
};