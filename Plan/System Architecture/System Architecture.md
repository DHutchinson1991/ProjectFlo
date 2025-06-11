# 🏛️ System Architecture Document: ProjectFlo v1.0

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS
🔢 Version - 1.0
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PURPOSE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Purpose 🎯

This document provides a comprehensive overview of the technical architecture for ProjectFlo v1.0. It defines the core architectural principles, the primary technologies chosen, and the high-level implementation strategy for its core logic.

> It is intended for all technical stakeholders—engineers, architects, and DevOps personnel—to establish a shared understanding of the system's design, de-risk the project by making key decisions upfront, and serve as a living document that guides development and prevents architectural drift.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CORE PRINCIPLES ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Core Architectural Principles 📜

These foundational principles are non-negotiable and must inform all technical design decisions to ensure the long-term maintainability, scalability, and robustness of the platform.

### 2.1 Separation of Concerns

**Principle:** A strict separation between frontend and backend.

> **Implementation:**
>
> - Monorepo with distinct Next.js frontend and NestJS backend
> - Communication via versioned RESTful API only
> - Zero direct database access from frontend

### 2.2 Transactional Service Layer

**Principle:** Atomic database transactions for complex operations.

> **Implementation:**
>
> - Prisma's `$transaction` API in NestJS services
> - Guaranteed data integrity across multi-step operations
> - Complete success or complete failure - no partial states

### 2.3 UTC-First Timezone Policy

**Principle:** All datetime operations standardized to UTC.

> **Implementation:**
>
> - PostgreSQL `TIMESTAMPTZ` data type
> - Frontend handles localization with `date-fns-tz`
> - Server-side logic remains timezone-agnostic

### 2.4 "Data for Analysis" Policy

**Principle:** Structure data for future business intelligence.

> **Implementation:**
>
> - Centralized `AuditService` for event logging
> - Timestamp-based tracking of state changes
> - Built-in analytics foundations

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ SYSTEM ARCHITECTURE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. System Architecture & Technology Stack 🏗️

### 3.1 Frontend (Client-Side) 💻

| Component          | Technology      | Justification                                                                            |
| :----------------- | :-------------- | :--------------------------------------------------------------------------------------- |
| **Core Framework** | Next.js (React) | - SSR for dynamic pages<br>- SSG for marketing content<br>- Strong SEO optimization      |
| **UI Libraries**   | MUI + Tailwind  | - MUI for admin interfaces<br>- Tailwind for client portal<br>- Consistent design system |
| **State: Server**  | TanStack Query  | - Efficient API caching<br>- Request deduplication<br>- Background refetching            |
| **State: Client**  | Redux Toolkit   | - Complex UI state management<br>- Multi-step wizards<br>- Global notifications          |

### 3.2 Backend (Server-Side) ⚙️

| Component          | Technology | Justification                                                                      |
| :----------------- | :--------- | :--------------------------------------------------------------------------------- |
| **Core Framework** | NestJS     | - TypeScript-first architecture<br>- Modular design<br>- Enterprise-grade features |
| **Database**       | PostgreSQL | - ACID compliance<br>- Rich feature set<br>- Production reliability                |
| **ORM**            | Prisma     | - Type-safe queries<br>- Migration management<br>- Excellent DX                    |
| **Caching**        | Redis      | - Session management<br>- Rate limiting<br>- Real-time features                    |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CORE LOGIC ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 🔌 4. Core Logic & Integrations

### **Automation & Logic Implementation**

- **Quoting Engine**

  > **Workflow:** Implemented in a dedicated `QuotingService` in NestJS. The frontend sends a configuration, the service reads `component_task_recipes`, calculates costs from `task_templates` and `operator_types`, and returns the `live_price` for immediate display.

- **Project Health Monitoring**

  > **Workflow:** A NestJS cron job (`ProjectHealthCron`) runs daily. It queries for projects with overdue tasks or budget risks, creates records in the `notifications` table, and pushes real-time alerts to admins via WebSockets.

- **AI Integration**
  > **Workflow:** All user-initiated AI actions are processed **asynchronously**. The API returns `202 Accepted` immediately, dispatches a job to **BullMQ**, and a worker processes the LLM request. The result is pushed back to the user's client via WebSockets.

### **Third-Party Integrations**

- **Core Services:** Google Workspace, Clockify, Frame.io, Stripe.
- **Graceful Degradation**
  > **Policy:** Each integration must have a defined failure policy. For example, if the Clockify API is down, time-tracking requests will be added to the BullMQ queue and retried with an exponential backoff strategy. This ensures no data is lost and that a failure in an external service does not cascade into a failure of our core platform.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
