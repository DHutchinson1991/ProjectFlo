# 🔐 Auth Token Script - Enhanced Authentication Utility

A comprehensive, production-ready Node.js script for obtaining and managing JWT authentication tokens for API testing and development workflows.

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Command Line Options](#-command-line-options)
- [Environment Support](#-environment-support)
- [Security Features](#-security-features)
- [Advanced Features](#-advanced-features)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [API Reference](#-api-reference)
- [Changelog](#-changelog)

## ✨ Features

### 🔒 Security & Reliability
- **Environment Variables**: No hardcoded credentials
- **Input Validation**: Email format, password length, URL validation
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Token Validation**: JWT decoding and expiration checking
- **Secure Storage**: Token persistence with automatic cleanup

### 🚀 Usability & Flexibility
- **Multi-Environment**: Development, staging, production support
- **CLI Interface**: Professional command-line with help and options
- **Token Caching**: Reuses valid tokens to avoid unnecessary logins
- **Verbose Output**: Detailed logging and status information
- **Force Refresh**: Manual token refresh capability

### 🔧 Advanced Features
- **Automated Token Management**: Background refresh and rotation
- **Shared Auth Service**: Unified authentication across scripts
- **Integration Ready**: Works with existing frontend authentication
- **Error Handling**: Comprehensive error handling and user feedback
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Get authentication token
node get-auth-token.js

# 4. Use with verbose output
node get-auth-token.js --verbose

# 5. Target specific environment
node get-auth-token.js --env staging
```

## 📦 Installation

### Prerequisites
- Node.js 18+ (for built-in fetch API)
- npm or pnpm package manager

### Setup
```bash
# Clone or navigate to your project
cd your-project

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Authentication Credentials (Required)
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password

# API Configuration (Optional)
API_BASE_URL=http://localhost:3002
```

### Environment Template

A `.env.example` file is provided as a template:

```bash
# Copy this file to .env and fill in your actual credentials

# Admin user credentials for API authentication
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-admin-password

# API endpoints (optional - defaults provided in scripts)
API_BASE_URL=http://localhost:3002
```

## 📖 Usage

### Basic Usage

```bash
# Get token for development environment
node get-auth-token.js

# Get token with detailed output
node get-auth-token.js --verbose

# Force token refresh
node get-auth-token.js --force

# Get help
node get-auth-token.js --help
```

### Advanced Usage

```bash
# Target staging environment
node get-auth-token.js --env staging

# Target production with verbose output
node get-auth-token.js --env production --verbose

# Use custom API URL
API_BASE_URL=https://custom-api.example.com node get-auth-token.js
```

### Using Generated Tokens

The script saves tokens to `auth-token.txt` and provides usage examples:

```bash
# Read token from file
export AUTH_TOKEN=$(cat auth-token.txt)

# Use in API calls
curl -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:3002/contributors

# Use in browser console
window.__auth.setToken("your-token-here")
```

## 🎯 Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--env <env>` | `-e` | Target environment (development, staging, production) | development |
| `--force` | `-f` | Force token refresh even if existing token is valid | false |
| `--verbose` | `-v` | Enable verbose output | false |
| `--help` | `-h` | Show help message | - |

### Option Examples

```bash
# Short options
node get-auth-token.js -e staging -v

# Long options
node get-auth-token.js --env production --force --verbose

# Combined usage
node get-auth-token.js --env staging --force
```

## 🌍 Environment Support

### Supported Environments

| Environment | API URL | Description |
|-------------|---------|-------------|
| development | `http://localhost:3002` | Local development server |
| staging | `https://api-staging.projectflo.com` | Staging environment |
| production | `https://api.projectflo.com` | Production environment |

### Custom Environments

You can override the API URL for any environment:

```bash
# Override development URL
API_BASE_URL=http://localhost:3001 node get-auth-token.js

# Override staging URL
API_BASE_URL=https://staging-api.example.com node get-auth-token.js --env staging
```

## 🔒 Security Features

### Credential Protection
- **No Hardcoded Secrets**: All credentials loaded from environment variables
- **Gitignored Files**: `.env` files automatically excluded from version control
- **Input Validation**: Email format and password strength validation
- **Secure Storage**: Tokens stored securely with automatic expiration

### Token Security
- **JWT Validation**: Tokens validated for format and expiration
- **Automatic Cleanup**: Expired tokens automatically removed
- **Secure Transmission**: HTTPS enforced for production environments
- **Token Rotation**: Support for periodic token refresh

### Best Practices
```bash
# Use strong passwords
ADMIN_PASSWORD=MySecureP@ssw0rd2024

# Never commit .env files
echo ".env" >> .gitignore

# Use environment-specific credentials
# Development: dev-admin@example.com
# Staging: staging-admin@example.com
# Production: admin@example.com
```

## ⚡ Advanced Features

### Token Caching & Reuse

The script automatically caches valid tokens:

```bash
# First run - fetches new token
node get-auth-token.js
# ✅ Successfully authenticated!

# Second run - reuses cached token
node get-auth-token.js
# ✅ Found valid existing token!
```

### Retry Mechanism

Automatic retry with exponential backoff:

```bash
# Handles temporary network issues
node get-auth-token.js
# ⚠️  Attempt 1 failed, retrying in 1000ms...
# ⚠️  Attempt 2 failed, retrying in 2000ms...
# ✅ Successfully authenticated!
```

### Automated Token Management

Use the automated token manager for background refresh:

```javascript
const { AutomatedTokenManager } = require('./packages/frontend/src/lib/token-manager');

const manager = new AutomatedTokenManager({
    tokenFile: 'auth-token.txt',
    environment: 'development',
    refreshThresholdMinutes: 5
});

// Manager automatically refreshes tokens
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest test/auth-scripts.test.js

# Run in watch mode
npm run test:watch
```

### Test Coverage

The test suite covers:
- ✅ Token management and validation
- ✅ Authentication service functionality
- ✅ Environment configuration
- ✅ Error handling and retry mechanisms
- ✅ CLI argument parsing
- ✅ Integration scenarios

### Writing Tests

```javascript
const { ScriptAuthService, TokenManager } = require('../shared-auth');

describe('Auth Service', () => {
    test('should login successfully', async () => {
        const authService = new ScriptAuthService();
        const result = await authService.login({
            email: 'test@example.com',
            password: 'password123'
        });

        expect(result.access_token).toBeDefined();
    });
});
```

## 🔧 Troubleshooting

### Common Issues

#### "Missing required environment variables"
```bash
# Solution: Create .env file
cp .env.example .env
# Edit .env with your credentials
```

#### "Login failed: 401 - Invalid credentials"
```bash
# Solutions:
# 1. Check credentials in .env
# 2. Verify user exists in database
# 3. Check if backend server is running
```

#### "Network error" or connection refused
```bash
# Solutions:
# 1. Check if backend server is running
# 2. Verify API_BASE_URL in .env
# 3. Check network connectivity
```

#### Token not saving
```bash
# Check file permissions
ls -la auth-token.txt

# Check if directory is writable
touch auth-token.txt
```

### Debug Mode

Enable verbose output for detailed debugging:

```bash
node get-auth-token.js --verbose
```

### Environment-Specific Issues

#### Development Environment
```bash
# Check if local server is running
curl http://localhost:3002/health

# Verify database is accessible
# Check backend logs
```

#### Staging/Production
```bash
# Check network connectivity
ping api-staging.projectflo.com

# Verify SSL certificates
curl -I https://api-staging.projectflo.com
```

## 📚 API Reference

### ScriptAuthService

#### Constructor
```javascript
const authService = new ScriptAuthService(options);
```

**Options:**
- `environment`: Target environment ('development', 'staging', 'production')
- `apiUrl`: Custom API URL
- `tokenFile`: Token file path

#### Methods

##### `login(credentials)`
Authenticates user and stores token.

**Parameters:**
- `credentials`: Object with `email` and `password`

**Returns:** Promise resolving to auth data

##### `getToken()`
Gets current valid token.

**Returns:** Token string or null

##### `hasValidToken()`
Checks if a valid token exists.

**Returns:** Boolean

##### `getTokenInfo()`
Gets detailed token information.

**Returns:** Token info object or null

### TokenManager

#### Constructor
```javascript
const tokenManager = new TokenManager(tokenFile);
```

#### Methods

##### `getToken()`
Gets current token with expiration check.

##### `setToken(token)`
Sets and saves token.

##### `clearToken()`
Clears current token.

##### `isTokenExpired(token, bufferMinutes)`
Checks if token is expired.

##### `getTokenInfo(token)`
Gets detailed token information.

### AutomatedTokenManager

#### Constructor
```javascript
const manager = new AutomatedTokenManager(config);
```

**Config:**
- `tokenFile`: Token file path
- `environment`: Target environment
- `refreshThresholdMinutes`: Minutes before expiry to refresh
- `maxRetries`: Maximum retry attempts
- `onTokenRefresh`: Callback for token refresh
- `onTokenExpired`: Callback for token expiry

## 📝 Changelog

### Version 2.0.0 - Enhanced Authentication (Current)
- ✅ **Security Hardening**: Environment variables, input validation
- ✅ **Retry Mechanism**: Exponential backoff for network failures
- ✅ **Token Validation**: JWT decoding and expiration checking
- ✅ **Multi-Environment**: Development, staging, production support
- ✅ **CLI Interface**: Professional command-line with help
- ✅ **Automated Management**: Background token refresh and rotation
- ✅ **Shared Auth Service**: Unified authentication across scripts
- ✅ **Comprehensive Testing**: 15+ test cases covering core functionality

### Version 1.0.0 - Basic Authentication
- ✅ Basic JWT token retrieval
- ✅ Simple file storage
- ✅ Basic error handling

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
pnpm install

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Code Standards
- Use ES6+ features
- Add JSDoc comments for public APIs
- Write comprehensive tests
- Follow existing code style
- Update documentation for changes

### Testing Guidelines
- Test both success and failure scenarios
- Mock external dependencies
- Test edge cases and error conditions
- Maintain >80% code coverage
- Test CLI functionality

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check this README
2. Review troubleshooting section
3. Check existing issues
4. Create a new issue with detailed information

---

**Happy authenticating! 🔐✨**