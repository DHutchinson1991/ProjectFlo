---
description: "Use when configuring deployments, CI/CD pipelines, build scripts, or environment setup for production, staging, or preview environments."
---

# ProjectFlo — Deployment Conventions

## Agent rules
- **Always read this file before asking the user any question about environments, hosting, or infrastructure.** The full stack is documented here — do not ask what is already known.
- Production DATABASE_URL is managed by Render and is not stored locally. To run a one-off command against the Render DB, instruct the user to use the **Render Dashboard → ProjectFlo service → Shell tab**. The `DATABASE_URL` env var is already available there.
- Render is configured via **Render Blueprint** (`render.yaml`). Infrastructure changes (new services, env vars, DB config) must be made in `render.yaml`, not manually in the Render dashboard.

## Infrastructure

| Component | Platform | Config file |
|-----------|----------|-------------|
| Backend API | Render | `render.yaml` |
| Frontend | Vercel | `vercel.json`, Vercel dashboard |
| Database | Render PostgreSQL 15 | `render.yaml` (database section) |
| Local DB | Docker | `docker-compose.yml` |

## CI/CD (GitHub Actions)

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `.github/workflows/ci.yml` | Push to `master`/`develop`, PRs | Lint → Type-check → Test → Build |
| `.github/workflows/deploy.yml` | Push to `master` | Deploy frontend (Vercel) → Deploy backend (Render) |

## Build commands

### Backend (Render)

```bash
corepack enable && pnpm install && npm run build && npx prisma migrate deploy && npx prisma db seed
```

Start: `node dist/main`

### Frontend (Vercel)

Vercel auto-detects Next.js. Build output: `.next/`.

## Pre-deploy checklist

- [ ] `pnpm build` passes locally (both packages).
- [ ] `pnpm test` passes.
- [ ] `pnpm lint` passes (CI will block on failures).
- [ ] New migrations are committed and tested against a fresh database.
- [ ] No hardcoded `localhost` URLs in code destined for production.
- [ ] Environment variables for new features are added to Render/Vercel dashboards.

## Branch → environment mapping

| Branch | Environment | Auto-deploy |
|--------|-------------|-------------|
| `master` | Production | Yes (Render + Vercel) |
| `develop` | — | CI only (no deploy) |
| Feature branches | Vercel preview | Yes (Vercel PR previews) |

## Local development

```bash
docker compose up -d          # Start PostgreSQL
pnpm install                  # Install all deps
cd packages/backend
npx prisma migrate dev        # Apply migrations
npx prisma db seed            # Seed data
cd ../..
pnpm dev                      # Start both apps
```

Ports: Frontend = 3001, Backend = 3002, Prisma Studio = 5555.
