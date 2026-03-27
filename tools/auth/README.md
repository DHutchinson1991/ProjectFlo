# Authentication Tools

Scripts for fetching and managing JWT auth tokens.

## Files

- `get-token.js` — CLI to fetch tokens (API or frontend mode)
- `auth-service.js` — Shared `ScriptAuthService` + `TokenManager` (internal library)
- `get-token.test.js` — Tests

## Token Storage

Tokens are stored in `.auth/tokens/`:
- `development.txt`
- `staging.txt`
- `production.txt`

## Usage

```bash
# API token (dev)
node tools/auth/get-token.js

# API token (staging, 24h)
node tools/auth/get-token.js --env staging --extend

# Frontend paste instructions
node tools/auth/get-token.js --frontend

# Interactive wizard
node tools/auth/get-token.js --interactive

# Or via pnpm scripts:
pnpm auth                  # dev API token
pnpm auth:frontend         # dev frontend token
pnpm auth:staging          # staging API token
pnpm auth:interactive      # guided setup
```

## Security

- The `.auth/` directory is automatically excluded from Git
- Tokens are environment-specific and never committed
- All sensitive authentication data is properly isolated