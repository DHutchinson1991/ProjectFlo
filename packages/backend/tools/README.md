# Backend Development Tools

This directory contains development tools for debugging, maintenance, and verification of the ProjectFlo backend.

## Current Status

The following tools are currently available:

### API Testing Tools
- `test-components-api.sh` - Bash script for testing the Components API
- `test-components-api.bat` - Windows batch file for testing the Components API

## Planned Tools

This directory is designed to grow with additional development tools:

### **Health & Monitoring**
- `health-check.js` - Full system health diagnostics
- `verify-database.js` - Database structure and connectivity verification
- `performance-test.js` - API performance benchmarking
- `load-test.js` - Database load testing

### **Data Management**
- `backup-database.js` - Database backup utilities
- `cleanup-orphaned-data.js` - Remove orphaned records
- `reset-dev-environment.js` - Reset development data
- `anonymize-production-data.js` - Data anonymization

### **Migration & Maintenance**
- `data-migration/` - Data migration scripts
- `schema-validator.js` - Validate schema consistency
- `index-optimizer.js` - Database index optimization

## Testing vs. Tools

**For automated API testing**, you can use the **E2E test suite**:

```bash
# Run comprehensive API tests (recommended)
npm run test:e2e

# Run unit tests
npm test

# Run tests with coverage
npm run test:cov
```

**For manual API testing with curl + jq**, use the new testing scripts:

```bash
# On Linux/Mac/WSL:
bash tools/test-components-api.sh

# On Windows with git bash:
bash tools/test-components-api.sh

# On Windows with cmd:
tools\test-components-api.bat
```

These scripts will:
1. Authenticate with the API
2. Test all major API endpoints for the Components module
3. Create, update, and delete test data
4. Format the JSON output with jq for better readability

You may need to:
- Ensure the backend server is running
- Update the API_URL variable in the scripts if not using the default localhost:3000
- Update the EMAIL and PASSWORD variables to match your system credentials
- Make sure jq.exe is in your PATH or in the same directory as the scripts

## Prerequisites

- Backend server should be running on `localhost:3002` (for verification tools)
- Database should be seeded with basic data
- Run from the backend directory: `/packages/backend/`

## Quick Commands

```bash
# Run comprehensive API tests
npm run test:e2e

# Start development server
npm run start:dev

# Open database browser
npx prisma studio

# Manual API testing with curl/jq
curl -s http://localhost:3002/components | ./jq.exe 'length'
```

## Tool Development Guidelines

When adding new tools to this directory:

1. **Clear Purpose**: Each tool should have a specific debugging/maintenance purpose
2. **Documentation**: Include usage examples and what the tool checks/does
3. **Error Handling**: Tools should gracefully handle connection failures
4. **Logging**: Use clear console output with ✅/❌ indicators
5. **Non-Destructive**: Tools should verify/report, not modify data (unless explicitly named as cleanup/migration tools)

## Current Backend Organization

```
packages/backend/
├── prisma/
│   ├── seeds/           # Focused seed files (admin + wedding content)
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tools/               # Development tools (this directory)
├── test/                # E2E tests (comprehensive API testing)
├── src/                 # Main application code
└── [config files]      # Package.json, tsconfig, etc.
```
