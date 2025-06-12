# 🔧 DevOps Guide

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - June 12, 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Introduction 🎯

This document outlines the development operations procedures and practices for ProjectFlo. It serves as the definitive guide for building, deploying, and maintaining the system.

> **Key Principle:**  
> Automation and repeatability are paramount. Every deployment should be consistent and reliable.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ HOSTING INFRASTRUCTURE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Hosting Infrastructure ☁️

Our hosting strategy is designed for developer efficiency, scalability, and security, leveraging best-in-class managed services to reduce operational overhead.

| Component                           | Service                  | Justification & Implementation                                                                                                                                                                                                                                                                       |
| :---------------------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🖥️ Frontend**                     | **Vercel**               | Seamless native integration for Next.js. The global edge network ensures the fastest possible load times. Automatic deployment previews for every pull request are a critical part of our review process. Deployed from `master` branch via GitHub Actions.                                          |
| **⚙️ Backend**                      | **Render (Web Service)** | Simple yet powerful platform for our NestJS backend. Auto-deploys from `master` branch triggered by GitHub Actions. Service ID: `srv-d15f9063jp1c73fralbg`.                                                                                                                                          |
| **💾 Database**                     | **Render (PostgreSQL)**  | Managed PostgreSQL instance (`projectflo_instance`, database `projectflo_db`) co-located with the backend on Render for low-latency private network communication.                                                                                                                                   |
| **✨ CI/CD Orchestration**          | **GitHub Actions**       | Native integration with the GitHub repository for automating build, test, and deployment workflows for both frontend and backend.                                                                                                                                                                    |
| **🏗️ Infrastructure as Code (IaC)** | **Terraform (Deferred)** | Our entire backend infrastructure (servers, databases, env vars) is defined as code. This prevents manual "click-ops" errors, allows version control of our infrastructure, and enables us to spin up perfect replicas of our environments in minutes. (Currently deferred, manual setup on Render). |
| **🗃️ Monorepo Management**          | **pnpm Workspaces**      | Used to manage the frontend and backend packages within a single repository, simplifying dependency management and cross-package scripting.                                                                                                                                                          |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ MONITORING & LOGGING ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. Monitoring & Logging 📊

Our strategy is to create a highly observable system where we can proactively identify and resolve issues.

| Aspect                | Tool / Method              | Implementation Details                                                                                                                                       |
| :-------------------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **📝 Logging**        | **Structured JSON (Pino)** | Every log entry will include a `requestId` to trace a single user's journey. Personal Identifiable Information (PII) will be automatically redacted.         |
| **❤️‍🩹 Health Checks**  | `GET /health` Endpoint     | A simple endpoint used by our hosting provider to determine if a service instance is healthy and should receive traffic.                                     |
| **🐞 Error & Perf**   | **Sentry**                 | Automatically captures all unhandled exceptions (frontend & backend). Its performance monitoring will trace transactions end-to-end to identify bottlenecks. |
| **🗄️ DB Performance** | **`pg_stat_statements`**   | This PostgreSQL extension must be enabled in production to give us powerful runtime visibility into slow or frequently executed queries.                     |
| **📡 Uptime**         | **UptimeRobot**            | An external service that pings our primary application endpoints every minute to alert us immediately if the site is down for external users.                |

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
  - (Add any other necessary backend environment variables here).
- **Node Version (in Render Settings):** Set to a compatible version (e.g., 20 or 22).

### **Local Development Notes & Troubleshooting**

- **Prisma Client Generation:**
  - After making changes to `packages/backend/prisma/schema.prisma`, always regenerate the Prisma Client to ensure TypeScript types are up-to-date with your schema.
  - To do this, run the following command from within the `packages/backend` directory:
    ```bash
    pnpm exec prisma generate
    ```
  - Alternatively, from the project root, you can run:
    ```bash
    pnpm --filter backend exec prisma generate
    ```
- **IDE TypeScript Server Refresh (VS Code Example):**
  - If you encounter TypeScript errors related to Prisma types (e.g., `Module '@prisma/client' has no exported member 'PrismaClient'`, or properties not found on `PrismaService` or model instances) even after generating the client, your IDE's TypeScript server might have stale type information.
  - In VS Code, try restarting the TS server: Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P), type "TypeScript", and select "TypeScript: Restart TS server".
  - If the command isn't available or issues persist, a full restart of VS Code is recommended.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ BACKUP & DISASTER RECOVERY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 5. Backup & Disaster Recovery 🔒

Our approach to backup and disaster recovery ensures that we can quickly restore service and minimize data loss in any situation.

| Component                     | Strategy & Frequency                                                                                                                                                                             |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🌐 Database**               | **Automated Backups (pg_dump)**: Daily backups retained for 30 days. Stored in AWS S3 with cross-region replication.                                                                             |
| **📂 File Storage**           | **Snapshot Backups**: Daily snapshots of our file storage (e.g., AWS EBS volumes) retained for 14 days.                                                                                          |
| **🔧 Configuration**          | **IaC Snapshots (Terraform)**: Version-controlled snapshots of our Terraform configurations. New snapshots are taken and tagged with each production release.                                    |
| **📅 Disaster Recovery Plan** | **Quarterly DR Drills**: Full restoration drills from backups to a separate AWS region to ensure our team is familiar with the process and to identify any gaps in our documentation or tooling. |

### **Backup Verification & Retention Policy**

To ensure our backups are functional and reliable:

- **Weekly Restore Tests:** A random sample of backups will be restored each week to a staging environment to verify integrity and completeness.
- **Long-term Retention:** Critical data (e.g., database backups) will have a long-term retention policy, with backups stored for at least 7 years to comply with regulatory requirements.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
