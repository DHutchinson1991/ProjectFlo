# Authentication Tools

This directory contains scripts and utilities for managing authentication tokens and API access.

## Files

- `get-auth-token.js` - Main script for generating JWT tokens
- `get-dev-token.js` - Quick development token script
- `shared-auth.js` - Shared authentication utilities and TokenManager class
- `AUTH-TOKEN-SCRIPT-README.md` - Detailed usage documentation

## Token Storage

Tokens are now stored in the `.auth/tokens/` directory:
- `development.txt` - Development environment tokens
- `staging.txt` - Staging environment tokens
- `production.txt` - Production environment tokens

## Usage

```bash
# Generate a development token
node tools/auth/get-auth-token.js

# Generate a token for specific environment
node tools/auth/get-auth-token.js --env staging

# Quick development token
node tools/auth/get-dev-token.js
```

## Security

- The `.auth/` directory is automatically excluded from Git
- Tokens are environment-specific and never committed
- All sensitive authentication data is properly isolated