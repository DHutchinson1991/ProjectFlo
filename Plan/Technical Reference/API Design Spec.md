# 🔌 API Design Specification

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Purpose & Scope 🎯

This document defines the definitive standards, conventions, and design principles for the ProjectFlo RESTful API.

> **Key Objective:**  
> Create a predictable, consistent, and easy-to-use interface between the frontend and backend systems. Consistent adherence to these rules is mandatory to accelerate development, reduce bugs, and ensure the long-term maintainability of our platform.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ CORE PRINCIPLES ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Core Principles 📜

### 2.1 Versioning 🔄

**Rule:** All API routes must be prefixed with a version number.

> **Implementation:**
>
> - Format: `/api/v1/...`
> - Enables breaking changes in future versions
> - Maintains backward compatibility

### 2.2 Documentation 📚

**Rule:** API must be self-documenting using OpenAPI (v3).

> **Implementation:**
>
> - Auto-generated via NestJS
> - Interactive Swagger UI
> - Live documentation from code

### 2.3 Statelessness 🔒

**Rule:** All endpoints must be stateless.

> **Implementation:**
>
> - JWT for authentication
> - No server-side sessions
> - Complete request context

### 2.4 Performance Requirements ⚡

**Rule:** All API endpoints must meet the performance targets defined in `NFRS.md`.

> **Implementation:**
>
> - All endpoints must achieve:
>   - P95 (95th Percentile): < 300ms
>   - P99 (99th Percentile): < 500ms
> - Performance is monitored through application metrics
> - New endpoints must be load tested before production deployment
> - See `NFRS.md` Section 2 "Performance & Scalability Targets" for complete requirements

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ REQUEST/RESPONSE STANDARDS ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. Request & Response Standards 📦

### 3.1 Pagination Implementation

**Type:** Cursor-based pagination (mandatory)

\```http
GET /api/v1/tasks?limit=20&cursor=bGlrZTE2MjU4Mjc2MDA=
\```

\```json
{
"data": [
// 20 task objects
],
"nextCursor": "bGlrZTE2MjU4Mjc2MzA=",
"hasMore": true
}
\```

### 3.2 Collection Query Standards

| Operation  | Format         | Example                      |
| :--------- | :------------- | :--------------------------- |
| Filtering  | `?status=X,Y`  | `?status=Completed,Archived` |
| Date Range | `?field_gte=X` | `?created_gte=2025-01-01`    |
| Sorting    | `?sort=field`  | `?sort=-createdAt,priority`  |
| Searching  | `?q=term`      | `?q=John%20Smith`            |
| Fields     | `?fields=x,y`  | `?fields=projectName,id`     |

### 3.3 Error Response Format

**Standard:** RFC 7807 (Problem Details for HTTP APIs)

\```json
{
"type": "/errors/validation-failed",
"title": "Validation Failed",
"status": 400,
"detail": "One or more input fields are invalid.",
"invalidFields": [
{ "field": "email", "reason": "Email must be a valid email address." }
]
}
\```

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ DATA CONVENTIONS ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 4. Data Shapes & Conventions 📐

### 4.1 JSON Standards

- Keys: `camelCase` (mandatory)
- Dates: ISO 8601 format
- Nulls: Use for explicit empty values
- Undefined: Omit from response

### 4.2 Authentication Standards 🔐

**Bearer Token Format:**
\```http
Authorization: Bearer <JWT_TOKEN>
\```

**Status Codes:**

- `401`: Missing/invalid token
- `403`: Valid token, insufficient permissions

### 4.3 Idempotency Standards

**For Critical POST Requests:**

- Header: `Idempotency-Key: <UUID>`
- Storage: 24-hour key retention
- Response: Cached for duplicate requests

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
