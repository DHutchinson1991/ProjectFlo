# ⚡ Non-Functional Requirements (NFRs)

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Introduction 🎯

This document defines the quality attributes and operational requirements that ProjectFlo must meet. These requirements are critical for ensuring the system's reliability, performance, and maintainability.

> **Key Principle:**  
> Every non-functional requirement must be specific, measurable, and testable.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PERFORMANCE TARGETS ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Performance & Scalability Targets ⚡

The system must be fast, responsive, and capable of handling our projected user load without degradation.

| Requirement                    | Metric / Target                                                                                        | Business Impact / Justification                                                                                                                                 |
| :----------------------------- | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Response Time**          | P95 (95th Percentile): **< 300ms** <br> P99 (99th Percentile): **< 500ms**                             | User interactions that feel instantaneous are critical for a professional application. A slow system directly impacts user adoption and perceived quality.      |
| **Frontend Performance**       | Google Lighthouse score of **90+** on key client-facing pages (configurator, login, dashboard).        | High scores are critical for SEO, user retention, and brand perception. Poor performance on public pages will deter potential leads.                            |
| **Database Query Performance** | Any PR with a non-trivial query must include an `EXPLAIN ANALYZE` plan.                                | This proactive measure proves that queries are optimized _before_ reaching production, preventing a single slow query from degrading the entire application.    |
| **Concurrent Users (v1.0)**    | Support up to **20 concurrent admins** and **100 concurrent clients** without performance degradation. | Ensures the system remains performant under peak load, meeting the above targets even when busy. The stateless architecture allows for easy horizontal scaling. |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ RELIABILITY & AVAILABILITY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. Reliability & Availability Targets 🎯

The platform must be highly available and resilient to failure, with a clear strategy for data protection and service restoration.

| Requirement                        | Metric / Target                                                                                                                   | Business Impact / Justification                                                                                                                                                 |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Availability (Uptime)**          | **99.9%** ("three nines"), excluding planned maintenance.                                                                         | Guarantees the system is available when our clients and team need it, with no more than ~43 minutes of unplanned downtime per month.                                            |
| **Backup Strategy**                | - Point-in-Time Recovery (PITR) with a 14-day retention.<br>- Daily full logical backups stored off-site with a 90-day retention. | This multi-layered strategy ensures maximum data durability and protects against a wide range of failure scenarios.                                                             |
| **Recovery Time Objective (RTO)**  | **4 business hours.**                                                                                                             | This is the maximum acceptable time to restore the entire platform after a catastrophic failure, minimizing business disruption.                                                |
| **Recovery Point Objective (RPO)** | **15 minutes.**                                                                                                                   | This is the maximum acceptable amount of data loss. Our use of continuous PITR ensures that client and project data is protected, which is critical for a transactional system. |
| **Migration Rollback**             | A clear, documented procedure must exist for rolling back failed database migrations in production.                               | Ensures we can quickly and safely recover from a bad deployment, maintaining system stability.                                                                                  |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ SECURITY REQUIREMENTS ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 4. Security Requirements 🔒

The platform must be secure by design, protecting all user and company data against unauthorized access and threats.

| Requirement           | Metric / Target                                                                                 | Business Impact / Justification                                                                                                                                                     |
| :-------------------- | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compliance**        | The system must be fully compliant with **UK GDPR**.                                            | This is a non-negotiable legal requirement. Failure to comply can result in severe financial penalties and catastrophic reputational damage.                                        |
| **Password Security** | Passwords must be hashed using a modern, strong algorithm like **Argon2**.                      | Protects user credentials against breaches. A password leak would be catastrophic for client trust.                                                                                 |
| **Access Control**    | Implement strict Role-Based Access Control (RBAC) via `project_assignments` and API middleware. | This is the core security principle of least privilege. It ensures clients can only see their own data and contributors can only access assigned projects, preventing data leakage. |
| **Threat Mitigation** | API access must be protected with **rate limiting** on sensitive endpoints (e.g., login).       | Provides a critical defense against automated brute-force attacks and denial-of-service attacks that could bring the platform down.                                                 |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ USABILITY & ACCESSIBILITY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 🧑‍🤝‍🧑 5. Usability & Accessibility

The system must be intuitive for all users and accessible to people with disabilities.

| Requirement       | Metric / Target                                                                                                                                           | Business Impact / Justification                                                                                                                                                   |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Usability**     | A new Administrator, with no training, must be able to create a complete, multi-item quote for a new client in **under 15 minutes**. (Validated via UAT). | This clear benchmark for UI/UX success ensures the system is not too complex, which would hinder user adoption and prevent us from realizing efficiency gains.                    |
| **Accessibility** | The client-facing portal must meet **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards.                                                | This is both an ethical and legal consideration. It ensures our platform is usable by people with disabilities (e.g., using screen readers) and widens our potential client base. |

---

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ MAINTAINABILITY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 🔧 6. Maintainability

The codebase must be kept clean, well-tested, and easy for developers to understand and modify.

| Requirement         | Metric / Target                                                                                                                             | Business Impact / Justification                                                                                                                                                |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code Complexity** | A maximum cyclomatic complexity score per function/method will be enforced in the CI pipeline.                                              | Prevents the codebase from becoming overly complex ("spaghetti code"), making it easier to maintain and reducing the likelihood of bugs.                                       |
| **Test Coverage**   | Critical backend services (e.g., `QuotingService`, `BookingService`) must maintain a minimum of **80% unit test coverage**, enforced in CI. | Automated tests are critical for our ability to release new features confidently and without introducing regressions. This ensures long-term stability and developer velocity. |

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
