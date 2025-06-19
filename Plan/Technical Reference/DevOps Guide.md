# 🔧 DevOps Guide

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

> **📋 Important Reference**: For local development server management and port configuration, see [Server Management Guide](Server%20Management%20Guide.md) - **Backend: 3002, Frontend: 3001** ✅

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Introduction 🎯

This document outlines the **production deployment, infrastructure, and operations** procedures for ProjectFlo. 

> **For Local Development**: See [DEVELOPMENT.md](../../../DEVELOPMENT.md) in the project root for setup instructions, troubleshooting, and daily development workflow.

> **Key Principle:**  
> Automation and repeatability are paramount. Every deployment should be consistent and reliable.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PRODUCTION INFRASTRUCTURE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Production Infrastructure ☁️

Our hosting strategy is designed for scalability, security, and operational efficiency, leveraging best-in-class managed services to reduce operational overhead.

| Component                           | Service                  | Purpose & Configuration                                                                                                                                                                                                                                                                              |
| :---------------------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🖥️ Frontend**                     | **Vercel**               | Global edge network for Next.js with automatic deployments from `master` branch. Provides deployment previews for every pull request during review process.                                                                                                                                          |
| **⚙️ Backend**                      | **Render (Web Service)** | Managed NestJS hosting with auto-deploy from `master` branch. Service ID: `srv-d15f9063jp1c73fralbg`.                                                                                                                                                                                                  |
| **💾 Database**                     | **Render (PostgreSQL)**  | Managed PostgreSQL instance (`projectflo_instance`, database `projectflo_db`) co-located with backend for low-latency communication.                                                                                                                                                                 |
| **✨ CI/CD Orchestration**          | **GitHub Actions**       | Automated build, test, and deployment workflows for both frontend and backend triggered by repository events.                                                                                                                                                                                        |
| **🏗️ Infrastructure as Code (IaC)** | **Terraform (Planned)**  | Infrastructure defined as code to prevent manual configuration errors and enable reproducible environments. Currently deferred - manual setup on Render.                                                                                                                                            |
| **🗃️ Monorepo Management**          | **pnpm Workspaces**      | Manages frontend and backend packages within single repository, simplifying dependency management and deployment coordination.                                                                                                                                                                        |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ MONITORING & OBSERVABILITY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. Production Monitoring & Observability 📊

Production observability strategy for proactive issue identification and resolution.

| Aspect                | Tool / Method              | Production Implementation                                                                                                                                                |
| :-------------------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **📝 Logging**        | **Structured JSON (Pino)** | All log entries include `requestId` for request tracing. PII automatically redacted. Centralized logging via Render's log aggregation.                                   |
| **❤️‍🩹 Health Checks**  | `GET /health` Endpoint     | Kubernetes-style health endpoint used by Render to determine service health and traffic routing decisions.                                                               |
| **🐞 Error & Perf**   | **Sentry**                 | Automatic exception capture for both frontend and backend. Performance monitoring with end-to-end transaction tracing to identify bottlenecks.                          |
| **🗄️ DB Performance** | **`pg_stat_statements`**   | PostgreSQL extension enabled in production for query performance visibility and slow query identification.                                                               |
| **📡 Uptime**         | **UptimeRobot**            | External monitoring service that pings application endpoints every minute with immediate alerting for downtime.                                                          |

### **Alerting & On-Call (PagerDuty)**

Alerts are tiered to ensure the right level of response for every issue.

- **🚨 P1 (Critical):** Triggers an immediate **phone call**. Reserved for total site outage, login/payment failure, or security breach alerts.
- **⚠️ P2 (High):** Triggers a **push notification/email**. For issues like a spike in errors on a non-critical feature or high job queue latency.
- **ℹ️ P3 (Low):** Sends a message to a **dedicated Slack channel**. For informational alerts like a new dependency vulnerability being detected.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CI/CD PIPELINE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 4. CI/CD Pipeline 🔄

Our workflow is optimized for rapid, safe, and automated releases.

- **Repository:** A single **monorepo** (`DHutchinson1991/ProjectFlo`) using `pnpm` workspaces.
- **Branching Strategy:**
  - `master`: This branch represents the **live production code**. Deployments to production environments (Vercel for frontend, Render for backend) are triggered exclusively by pushes (merges) to this branch.
  - `develop`: This is the **main integration branch**. All feature branches are created from `develop` and merged back into `develop` via Pull Requests.
  - `feature/*`: Short-lived branches for new features, bug fixes, or improvements. Created from `develop` and merged back into `develop` via Pull Requests.
- **Workflow:**
  1. Create a `feature/*` branch from the latest `develop`.
  2. Make commits to the feature branch.
  3. Open a Pull Request from the feature branch to `develop`.
     - CI checks (`ci.yml`) run automatically.
     - Vercel previews for the frontend are generated.
  4. After review and CI passes, merge the feature branch into `develop`.
  5. When `develop` is ready for a production release, open a Pull Request from `develop` to `master`.
     - CI checks (`ci.yml`) run automatically.
     - Vercel previews for the frontend are generated.
  6. After final review and CI passes, merge `develop` into `master`.
  7. Merging to `master` triggers the `deploy.yml` workflow, deploying to production.
- **Environments:**
  - **Development:** A local environment managed with `pnpm` workspaces.
  - **Preview (Frontend):** Automated per-PR deployments via Vercel (for PRs targeting `develop` and `master`).
  - **Preview (Backend):** (Currently not set up with separate preview instances on Render via PRs; direct deployment to production service from `master`).
  - **Production (Frontend):** Deployed automatically from `master` to Vercel via GitHub Actions.
  - **Production (Backend):** Deployed automatically from `master` to Render (Service ID: `srv-d15f9063jp1c73fralbg`) via GitHub Actions triggering a Render deploy.
- **Code Quality Gates 🐶:** **Husky** with **lint-staged** is used for pre-commit hooks to automatically run linting (`eslint --fix`) and formatting (`prettier --write`) on staged files.
  - Configuration: `.lintstagedrc.json`
  - Husky setup: `prepare` script (`husky install`) in root `package.json`.

### **GitHub Actions Workflows**

Two main workflows automate our CI/CD process, located in `.github/workflows/`:

1.  **`ci.yml` (Continuous Integration):**

    - **Trigger:** On push or pull request to the `master` and `develop` branches.
    - **Purpose:** Validates code quality, runs tests, and builds the applications.
    - **Jobs:**
      - `validate`: Installs dependencies (`pnpm install`), runs ESLint, and performs type-checking.
      - `test`: Runs automated tests (e.g., `pnpm -r test`). (Test suite implementation is pending).
      - `build`: Compiles both frontend and backend applications (`pnpm -r build`).

2.  **`deploy.yml` (Continuous Deployment):**
    - **Trigger:** On push to the `master` branch only.
    - **Purpose:** Deploys the frontend to Vercel and the backend to Render for the production environment.
    - **Jobs:**
      - **`deploy-frontend`:**
        - Checks out code.
        - Sets up Node.js (v20) and pnpm (v8).
        - Installs all monorepo dependencies (`pnpm install`).
        - Installs Vercel CLI (`pnpm add -g vercel`).
        - Deploys the `packages/frontend` directory to Vercel production:
          - Command: `vercel deploy --prod --token $VERCEL_TOKEN --yes`.
          - Uses `working-directory: ./packages/frontend`.
        - Requires GitHub Secret: `VERCEL_TOKEN`.
      - **`deploy-backend`:**
        - Depends on the successful completion of `deploy-frontend`.
        - Checks out code.
        - Uses the `johnbeynon/render-deploy-action@v0.0.8` action to trigger a new deployment on Render for the backend service.
        - Requires GitHub Secrets:
          - `RENDER_SERVICE_ID`: `srv-d15f9063jp1c73fralbg` (for the ProjectFlo backend service).
          - `RENDER_API_KEY`: Your Render account API key.
        - Note: This action only _triggers_ the deployment on Render. Render then uses its own configured build and start commands for its production service.

### **Vercel Project Configuration (Frontend - `projectflo-frontend`)**

- **Connected Repository:** `DHutchinson1991/ProjectFlo`.
- **Framework Preset:** Next.js.
- **Root Directory (in Vercel Settings):** `packages/frontend`.
- **Build & Output Settings:** Standard Next.js defaults, Vercel typically handles these automatically.
- **Environment Variables (Example):**
  - `NEXT_PUBLIC_API_URL`: `https://projectflo.onrender.com` (or the specific URL of your deployed backend). This needs to be set in Vercel project settings.

### **Render Service Configuration (Backend - `ProjectFlo`, Service ID: `srv-d15f9063jp1c73fralbg`)**

- **Repository:** `DHutchinson1991/ProjectFlo`, Branch: `master`.
- **Auto-Deploy:** Enabled (On commit to the specified branch).
- **Root Directory (in Render Settings):** `packages/backend`.
- **Build Command (in Render Settings):** `corepack enable && corepack prepare pnpm@8 --activate && pnpm install --frozen-lockfile && pnpm run build`
  - This command is executed by Render within the `packages/backend` directory.
  - The `pnpm run build` part executes the `build` script from `packages/backend/package.json` (which is `prisma generate && nest build`).
- **Start Command (in Render Settings):** `node dist/src/main.js`
  - This command is executed by Render within the `packages/backend` directory.
- **Environment Variables (Set in Render Service Environment):**
  - `DATABASE_URL`: The **Internal Connection String** for the `projectflo_db` PostgreSQL instance on Render.
  - `JWT_SECRET`: A strong, unique, randomly generated secret for JWT signing.
  - `NEXT_PUBLIC_API_URL`: Frontend environment variable pointing to production backend URL.
- **Node Version (in Render Settings):** Set to Node.js v20 or higher for compatibility.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ BACKUP & DISASTER RECOVERY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 5. Backup & Disaster Recovery 🔒

Our approach to backup and disaster recovery ensures quick service restoration and minimal data loss in production environments.

| Component                     | Strategy & Frequency                                                                                                                                                                             |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🌐 Database**               | **Automated Backups (pg_dump)**: Daily backups retained for 30 days. Render provides automatic PostgreSQL backups with point-in-time recovery.                                                 |
| **📂 Application Code**       | **Git Version Control**: All code versioned in GitHub with tagged releases for rollback capability.                                                                                             |
| **🔧 Configuration**          | **Environment Variables**: All configuration stored in Render service settings with backup documentation in secure storage.                                                                     |
| **📅 Disaster Recovery Plan** | **Quarterly DR Drills**: Full restoration testing to verify backup integrity and team familiarity with recovery procedures.                                                                      |

### **Backup Verification & Retention Policy**

To ensure our backups are functional and reliable:

- **Weekly Restore Tests:** Random sample backups restored to staging environment to verify integrity and completeness.
- **Production Recovery Time Objective (RTO):** Target maximum downtime of 4 hours for full system restoration.
- **Production Recovery Point Objective (RPO):** Target maximum data loss of 1 hour through automated backups.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ SECURITY & COMPLIANCE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 6. Security & Compliance 🔐

### **Production Security Measures**

| Security Layer              | Implementation                                                                 |
| :-------------------------- | :---------------------------------------------------------------------------- |
| **🔐 Authentication**       | JWT tokens with secure secret rotation policy                                |
| **🌐 HTTPS/TLS**           | Enforced SSL/TLS for all production traffic via Vercel and Render            |
| **🗄️ Database Security**    | Render managed PostgreSQL with private network access and encrypted storage  |
| **🔑 Secret Management**    | Environment variables managed via Render's secure configuration system       |
| **🛡️ Input Validation**     | Server-side validation and sanitization for all API endpoints                |
| **📊 Audit Logging**       | Comprehensive logging of all administrative actions and data modifications    |

### **Compliance & Data Protection**

- **Data Encryption**: All data encrypted in transit (TLS) and at rest (database encryption)
- **Access Control**: Role-based access control (RBAC) with principle of least privilege
- **Privacy**: PII handling with automatic redaction in logs and secure data processing

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
