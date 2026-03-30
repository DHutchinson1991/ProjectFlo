---
description: "Use when running terminal commands, starting servers, managing databases, troubleshooting ports, running Prisma commands, or navigating between project directories."
---

# ProjectFlo — Command Reference

## Navigation

Always run commands from the **root** unless specifically noted. Valid locations:

| Alias | Path | Use When |
|-------|------|----------|
| **Root** | `c:\Users\works\Documents\Code Projects\ProjectFlo` | All day-to-day work |
| **Backend** | `...\packages\backend` | Only for `npx prisma migrate dev --name` (needs local cwd) |
| **Frontend** | `...\packages\frontend` | Rarely needed |

If lost, recover with: `cd "c:\Users\works\Documents\Code Projects\ProjectFlo"`

Avoid being in `packages/` itself — always go one level deeper.

## Git Safety

**Agent rules:**
- NEVER use `git stash` — it risks losing in-progress work and creates recovery headaches
- NEVER use `git reset --hard` — destructive and irreversible
- NEVER use `git push --force` without explicit user confirmation
- To check pre-existing build errors, use `git log` or ask the user — do NOT stash/checkout to test

## File Operations

**Agent rules:**
- Use `rm` / `mv` terminal commands for file deletion and moves — they are silent on success (clean output)
- NEVER use inline `node -e "require('fs')..."` scripts for file operations — they produce verbose noisy output even when successful
- For moves that update imports, verify with `file_search` immediately after, then fix imports in affected files

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

Run everything from root. These cover 95% of agent tasks.

### Dev & Build
| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start both frontend + backend concurrently |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests in all packages |
| `pnpm lint:fix` | Lint and auto-fix all packages |
| `pnpm format` | Format all code with Prettier |
| `pnpm check` | Typecheck + lint all packages |
| `pnpm check:frontend` | Typecheck + lint frontend only |
| `pnpm check:backend` | Typecheck + lint backend only |

### Database (no cd required)
| Command | Purpose |
|---------|---------|
| `pnpm db:generate` | Generate Prisma client after schema changes |
| `pnpm db:push` | Push schema to DB (no migration file) |
| `pnpm db:seed` | Seed database |
| `pnpm db:migrate` | Create + apply migration (prompts for name) |
| `pnpm db:studio` | Open database browser at port 5555 |
| `pnpm db:reset` | Force-reset DB schema + reseed |

### Auth Tokens
| Command | Purpose |
|---------|---------|
| `pnpm auth` | Get token (dev) |
| `pnpm auth:frontend` | Get token formatted for frontend paste |
| `pnpm auth:refresh` | Extend + force-refresh current token |
| `pnpm auth:interactive` | Guided token setup |
| `pnpm auth:help` | Show all auth options |

## Backend Commands (from `packages/backend`)

Only needed for operations not covered by root scripts.

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Generate Prisma client + build NestJS |
| `npm test` | Run Jest tests |

## Database & Prisma

Use root `pnpm db:*` scripts for all DB work — no need to `cd packages/backend`.

Exception: named migrations require a `--name` flag, use:
```bash
cd packages/backend && npx prisma migrate dev --name "describe-changes"
```

**Schema change workflow:**
1. Stop backend server
2. Edit `prisma/schema.prisma`
3. `cd packages/backend && npx prisma migrate dev --name "describe-changes"`
4. `pnpm db:generate`
5. Run any data migration scripts
6. Restart server
## Dependencies

```bash
pnpm install                              # Install all
pnpm --filter backend add <package>       # Add to backend
pnpm --filter frontend add <package>      # Add to frontend
```

## Search & CLI Tools

Three tools are available system-wide for fast codebase search and data processing. **Prefer VS Code tools** (`grep_search`, `file_search`, `read_file`, `get_errors`) over these when possible — they cost zero Node processes. Use these CLI tools when VS Code tools are insufficient (e.g., complex regex, JSON transformation, glob-based file discovery).

### ripgrep (`rg`) — fast text search
```bash
# Search for a pattern across backend and frontend
rg "CrewMember" packages/backend/src packages/frontend/src

# Case-insensitive, show only matching text
rg -o -i "crewmember" packages/

# Search specific file types only
rg "TODO" --type ts

# Count matches per file
rg -c "useState" packages/frontend/src/features/

# Fixed string (no regex interpretation)
rg -F "X-Brand-Context" packages/backend/src
```

### fd — fast file finder
```bash
# Find files by name pattern
fd "schema" packages/backend/

# Find all TypeScript files under a feature
fd -e ts -e tsx packages/frontend/src/features/catalog/

# Find directories only
fd -t d "hooks" packages/frontend/src/

# Find and delete (use with caution)
fd -e js.map packages/backend/dist --exec rm {}
```

### jq — JSON processor
```bash
# Pretty-print a JSON file
cat tsconfig.json | jq .

# Extract a specific field from package.json
jq '.scripts' packages/backend/package.json

# Filter an array from JSON output
jq '.dependencies | keys' packages/frontend/package.json
```

### bat — syntax-highlighted file preview (replaces `cat`)
```bash
# View a file with syntax highlighting and line numbers
bat packages/backend/src/main.ts

# Show only a range of lines
bat -r 10:30 packages/frontend/src/app/layout.tsx

# Plain output (no decorations) — useful when piping
bat -pp packages/backend/prisma/schema.prisma
```

### sd — find-and-replace (replaces `sed`)
```bash
# Simple string replacement in a file
sd 'oldName' 'newName' packages/backend/src/catalog/services/example.service.ts

# Regex replacement
sd 'CrewMember(\w+)' 'StaffMember$1' packages/frontend/src/features/catalog/packages/types.ts

# Preview changes without writing (pipe through sd)
cat file.ts | sd 'old' 'new'

# Bulk rename across files (combine with fd + xargs)
fd -e ts packages/backend/src/catalog/ --exec sd 'OldTerm' 'NewTerm' {}
```
**Agent rule:** Prefer `replace_string_in_file` / `multi_replace_string_in_file` tools over `sd` when editing <5 files. Use `sd` for bulk renames across many files where the VS Code tools would be too slow.

### delta — improved git diffs
Delta is configured as the git pager. It activates automatically with `git diff` and `git log -p`.
```bash
# View staged changes with syntax highlighting
git diff --staged

# View diff for a specific file
git diff -- packages/backend/src/main.ts

# Side-by-side diff
git -c delta.side-by-side=true diff
```
**Setup (one-time):** Configure git to use delta:
```bash
git config --global core.pager delta
git config --global interactive.diffFilter 'delta --color-only'
git config --global delta.navigate true
git config --global delta.line-numbers true
git config --global delta.syntax-theme Dracula
```

### Agent rules for CLI tools
1. **Prefer VS Code tools first** — `grep_search` over `rg`, `file_search` over `fd`, `read_file` over `bat`/`cat | jq`, `replace_string_in_file` over `sd`.
2. **These count toward your 3-command terminal budget** — combine with `&&` when chaining.
3. **Append process count check** after any terminal use: `&& tasklist | findstr /I node | wc -l`.
4. **Use `sd` for bulk renames** across >5 files — faster than repeated `replace_string_in_file` calls.
5. **Use `bat -r`** to view specific line ranges when terminal output is needed (e.g., verifying script output).

## Troubleshooting

```bash
# Kill all node processes
taskkill /F /IM node.exe

# Clear and reinstall
rm -rf node_modules packages/*/node_modules && pnpm install
```

> **Never run `pnpm build` or `tsc` just to find type errors** — use the `get_errors` tool instead (zero Node processes).

## Process Hygiene (prevents VS Code crashes)

Node process buildup is the #1 cause of VS Code crashes in this repo. **Up to 4 agents run concurrently**, so terminal discipline is critical.

### The math
- 4 agents × 5 terminal commands each = 20+ Node processes = crash
- Target: **≤8 Node processes at any time** (dev servers + Prisma + headroom)

### Agent rules (MANDATORY)
1. **Max 3 terminal commands per agent per task.** If you need more, use non-terminal tools.
2. **Combine commands with `&&`** — this counts as 1 command:
   - Good: `pnpm db:generate && pnpm db:push`
   - Bad: two separate `run_in_terminal` calls
3. **Never use `isBackground: true`** for finite commands (typecheck, test, lint, build, prisma). Only use background for intentionally long-running servers (which agents should NOT start).
4. **NEVER use terminal to check errors.** Use the `get_errors` tool — zero overhead.
5. **NEVER use terminal to read files, list directories, or search code.** Use `read_file`, `file_search`, `grep_search` instead.
6. **After ANY terminal command,** append process count check:
   ```bash
   pnpm db:generate && tasklist | findstr /I node | wc -l
   ```
   If count >8, run `taskkill /F /IM node.exe` and warn user to restart `pnpm dev`.

### Only these operations need the terminal
| Operation | Command |
|-----------|--------|
| Generate Prisma client | `pnpm db:generate` |
| Push schema (no migration) | `pnpm db:push` |
| Create migration | `cd packages/backend && npx prisma migrate dev --name "description"` |
| Reset + reseed DB | `pnpm db:reset` |
| Run tests | `pnpm test` (only when user asks) |
| Install packages | `pnpm install` / `pnpm add` |

Everything else should use VS Code tools (get_errors, read_file, file_search, grep_search).

### Manual monitoring
```bash
# Count current node processes
tasklist | findstr /I node | wc -l

# Kill ALL node processes (will stop dev servers too)
taskkill /F /IM node.exe

# Kill only a specific PID
taskkill /F /PID <pid>
```
