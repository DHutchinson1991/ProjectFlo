---
description: "Use when running terminal commands, starting servers, managing databases, troubleshooting ports, running Prisma commands, or navigating between project directories."
---

# ProjectFlo — Command Reference

## Navigation

Always run `pwd` before executing commands. Valid locations:

| Alias | Path | Key Commands |
|-------|------|-------------|
| **Root** | `c:\Users\works\Documents\Code Projects\ProjectFlo` | `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint:fix` |
| **Backend** | `c:\Users\works\Documents\Code Projects\ProjectFlo\packages\backend` | `npm run start:dev`, `npm test`, `npx prisma *` |
| **Frontend** | `c:\Users\works\Documents\Code Projects\ProjectFlo\packages\frontend` | `npm run dev`, `npm run build` |

If lost, recover with: `cd "c:\Users\works\Documents\Code Projects\ProjectFlo"`

Avoid being in `packages/` itself — always go one level deeper.

## Server Management

**Agent rules:**
- NEVER start servers (`pnpm dev`, `npm run start:dev`, etc.) — instruct the user to start them
- Agent MAY stop existing servers when needed for the task
- If servers are needed, ask user to run `pnpm dev` from root in a dedicated terminal

**Ports:** Frontend = 3001, Backend = 3002, Prisma Studio = 5555

**Stuck ports:**
```bash
npx kill-port 3001 3002
# or: netstat -ano | findstr :3002
```

## Root Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start both frontend + backend concurrently |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests in all packages |
| `pnpm lint:fix` | Lint and auto-fix all packages |
| `pnpm format` | Format all code with Prettier |
| `pnpm --filter backend run <script>` | Run a script in backend only |
| `pnpm --filter frontend run <script>` | Run a script in frontend only |

## Backend Commands (from `packages/backend`)

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Generate Prisma client + build NestJS |
| `npm test` | Run Jest tests |
| `npm run test:e2e` | Run end-to-end tests |

## Database & Prisma (from `packages/backend`)

Always use `npx prisma` (not global `prisma`).

| Command | Purpose |
|---------|---------|
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev --name "description"` | Create and apply migration |
| `npx prisma db push` | Push schema to DB (no migration) |
| `npx prisma db seed` | Seed database |
| `npx prisma db push --force-reset && npx prisma db seed` | Full DB reset + reseed |
| `npx prisma studio` | Open database browser (port 5555) |

**Schema change workflow:**
1. Stop backend server
2. Edit `prisma/schema.prisma`
3. `npx prisma migrate dev --name "describe-changes"`
4. `npx prisma generate`
5. Run any data migration scripts
6. Restart server

## Dependencies

```bash
pnpm install                              # Install all
pnpm --filter backend add <package>       # Add to backend
pnpm --filter frontend add <package>      # Add to frontend
```

## Troubleshooting

```bash
# Kill all node processes
taskkill /F /IM node.exe

# Clear and reinstall
rm -rf node_modules packages/*/node_modules && pnpm install

# Check TypeScript errors
cd packages/backend && npm run build
cd packages/frontend && npm run build
```
