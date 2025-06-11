# 🔧 DevOps Guide

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Introduction 🎯

This document outlines the development operations procedures and practices for ProjectFlo. It serves as the definitive guide for building, deploying, and maintaining the system.

> **Key Principle:**  
> Automation and repeatability are paramount. Every deployment should be consistent and reliable.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ HOSTING INFRASTRUCTURE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Hosting Infrastructure ☁️

Our hosting strategy is designed for developer efficiency, scalability, and security, leveraging best-in-class managed services to reduce operational overhead.

| Component                           | Service       | Justification & Implementation                                                                                                                                                                                                                         |
| :---------------------------------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🖥️ Frontend**                     | **Vercel**    | Seamless native integration for Next.js. The global edge network ensures the fastest possible load times. **Automatic deployment previews** for every pull request are a critical part of our review process.                                          |
| **⚙️ Backend & Services**           | **Render**    | Simple yet powerful platform for our NestJS backend, PostgreSQL database, and Redis instance. Its **private network** allows services to communicate securely with zero latency, without public internet exposure.                                     |
| **🏗️ Infrastructure as Code (IaC)** | **Terraform** | Our entire backend infrastructure (servers, databases, env vars) is defined as code. This prevents manual "click-ops" errors, allows version control of our infrastructure, and enables us to spin up perfect replicas of our environments in minutes. |

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

- **Repository:** A single **monorepo** using `pnpm` workspaces to simplify dependency management and code sharing (especially our `@projectflo/types` package).
- **Workflow:** We use the **GitHub Flow** model. All work is done on feature branches. Pull Requests (PRs) into `main` are mandatory, requiring one peer approval and passing all CI checks. Merging to `main` signifies a production release.
- **Environments:**
  - **Development:** A local Docker environment managed with `docker-compose.yml`.
  - **Preview:** Automated per-PR deployments via Vercel/Render for review.
  - **Production:** Deployed automatically from `main` after a successful merge.
- **Code Quality Gates 🐶:** **Husky** will be used for pre-commit hooks to automatically run linting and formatting on a developer's machine _before_ they can commit code. This prevents trivial style errors from ever reaching the CI pipeline.

### **CI/CD Pipeline (GitHub Actions)**

The pipeline consists of the following sequential stages, triggered on every PR:

1.  **📦 Install & Lint:** Install dependencies and run ESLint/Prettier to catch syntax and style issues.
2.  **🧪 Test:** Run the full suite of unit, integration, and end-to-end (E2E) tests. A minimum code coverage threshold will be enforced.
3.  **🧱 Build:** Compile the frontend and backend applications into production-ready artifacts.
4.  **🚀 Deploy:** If all previous stages pass, the code is automatically deployed to the appropriate environment (Preview or Production).

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
