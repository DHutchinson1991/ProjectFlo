# 🔒 Security Design

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Introduction 🎯

This document defines the security architecture and controls implemented in ProjectFlo to protect data, ensure privacy, and maintain compliance with relevant standards.

> **Key Principle:**  
> Security must be built-in by design, not added as an afterthought.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ AUTHENTICATION & AUTHORIZATION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Authentication & Authorization 🔐

### Authentication

The Passport.js library will be used with two primary strategies to verify user identity:

- **JWTs (JSON Web Tokens):** For standard client and contributor logins via email and password.
- **Google OAuth 2.0:** For admin users to enforce Multi-Factor Authentication (MFA) and leverage Google's robust security infrastructure.

### Authorization

A strict **Role-Based Access Control (RBAC)** model will be enforced at the API level. Access will be denied by default.

> **Implementation:** This will be implemented using custom NestJS Guards. The guard will extract the user's ID from the JWT, check the `project_assignments` table to determine their `role_id` for the requested resource, and then verify if that role has the required permission via the `role_permissions` table.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ DATA SECURITY ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. Data Security 🔒

The following controls are mandatory to protect the application and its data from common threats.

| Security Control                | Implementation Method                                                                                                                                                                           | Justification / Threat Mitigated                                                                                                                                                                                                      |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Password Hashing**            | Passwords must be hashed using **Argon2**, the current industry best practice.                                                                                                                  | Protects user credentials against offline attacks in the event of a database breach.                                                                                                                                                  |
| **Secret Management**           | All secrets (API keys, DB URLs, JWT secrets) must be managed as **environment variables** and never committed to source control. **Zod** will validate the presence of all env vars on startup. | Prevents accidental exposure of sensitive credentials in the codebase. Startup validation prevents misconfiguration failures.                                                                                                         |
| **Transport Security**          | **HTTPS/TLS 1.2+** must be enforced on all connections.                                                                                                                                         | Prevents data interception and Man-in-the-Middle (MITM) attacks.                                                                                                                                                                      |
| **Rate Limiting**               | The API must implement rate limiting on sensitive endpoints using a library like `nestjs-throttler`.                                                                                            | Mitigates brute-force attacks on authentication endpoints and prevents Denial-of-Service (DoS) attacks on the general API.                                                                                                            |
| **Secure File Uploads**         | All file uploads must be proxied through the backend API. Direct client-side uploads to cloud storage are **strictly prohibited**.                                                              | - **Workflow:** Client uploads to backend -> Backend streams to secure storage bucket.<br>- **Access Control:** Files are not public. The frontend must request a time-limited, pre-signed URL from the backend to download any file. |
| **CORS Policy**                 | A strict Cross-Origin Resource Sharing policy will be configured in NestJS to **only** allow requests from the approved frontend domain.                                                        | Prevents malicious websites from making requests to our API on behalf of an authenticated user.                                                                                                                                       |
| **Web Vulnerabilities (OWASP)** | Adherence to OWASP Top 10 best practices is mandatory. This includes:                                                                                                                           | Protects against a wide range of common web application attacks.                                                                                                                                                                      |
|                                 | - **Input Validation:** Use libraries like **Zod** on all API endpoints to sanitize and validate all incoming data.                                                                             | Prevents Cross-Site Scripting (XSS) and various Injection attacks (SQL, NoSQL, etc.).                                                                                                                                                 |
|                                 | - **CSRF Protection:** Implement anti-CSRF tokens or other standard protection mechanisms for any state-changing requests originating from a browser.                                           | Prevents Cross-Site Request Forgery, where a malicious site could trick a user into performing an unwanted action.                                                                                                                    |
|                                 | - **Secure Cookies:** Use `httpOnly`, `secure`, and `sameSite` attributes on all session-related cookies.                                                                                       | Mitigates cookie theft via XSS and prevents CSRF attacks.                                                                                                                                                                             |
| **Dependency Scanning**         | The CI/CD pipeline must include automated dependency scanning using a tool like **Snyk** or `npm audit --audit-level=high`.                                                                     | Proactively detects and flags known vulnerabilities in third-party packages before they reach production.                                                                                                                             |
