# 🗺️ Project Roadmap: ProjectFlo

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ GUIDING PRINCIPLE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Guiding Principle 🎯

This roadmap is structured to deliver functional, end-to-end user workflows in phases. Each phase builds upon the last, ensuring that core logic is in place before dependent features are developed.

> **Core Strategy:**  
> Establish the **"brain"** of the system first, then build the user-facing experiences that rely on it.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PHASE 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Phase 1: Foundation & Service Configuration 🏛️

> **Goal:** To establish the core application shell and empower an Administrator to define the business's service offerings. This phase is about building the "engine" before the rest of the car.

### 2.1 Platform Setup 🏗️

- Initialize the monorepo with Next.js (frontend) and NestJS (backend) applications
- Set up the core database schema

### 2.2 Authentication & Core Layout 🔐

- Implement Login (`/login`) for the **Admin** role
- Build the primary `Template A: Dashboard Layout` with the main sidebar navigation

### 2.3 Core Admin Functionality ⚙️

- Build the Settings pages (`/app/settings`) for:
  - **Services:** Full CRUD for deliverables, scenes, and styles
  - **Recipes:** The interface for defining the automation rules that link services to tasks
  - **Team:** Basic user management for creating internal accounts
- Build the master CRM page (`/app/contacts`)

> **✅ Phase 1 Outcome:**  
> An Admin can log in, define every service the company offers, and set up the rules for how those services are priced and produced.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PHASE 2 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 3. Phase 2: The Quoting & Sales Pipeline 📈

> **Goal:** To build the complete workflow for converting a potential lead into a booked project. This phase makes the "engine" from Phase 1 useful by building the primary sales tools around it.

### 3.1 Public-Facing Funnel 🌐

- Build the **Quote Configurator** (`/quote-configurator`) page for potential clients

### 3.2 Inquiry Management 📥

- Build the **Inquiries** list and detail views (`/app/inquiries` and `/app/inquiries/[id]`)
- Capture leads from the configurator

### 3.3 Quote Management ✉️

- Build the **Quotes** list and detail views (`/app/quotes` and `/app/quotes/[id]`)
- Create Admin workspace for creating and refining proposals

### 3.4 Core Action 🚀

- Implement the **"Mark as Booked"** functionality
- Handle quote-to-project transition with price locking

> **✅ Phase 2 Outcome:**  
> An Admin can manage the entire sales process, from a new lead submitting a configuration to creating a formal quote and booking the project.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PHASE 3 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 4. Phase 3: Project & Task Management 🎬

> **Goal:** To build the core functionality for managing a project after it has been booked. This phase focuses on the internal production team's experience.

### 4.1 Task Management System 📋

- Automated task generation from booked projects
- Task assignment and tracking interface
- Progress monitoring and reporting

### 4.2 Resource Management 👥

- Team member availability tracking
- Workload balancing tools
- Capacity planning features

### 4.3 Project Dashboard 📊

- Project health monitoring
- Timeline visualization
- Budget tracking

> **✅ Phase 3 Outcome:**  
> The production team can efficiently manage their work, track progress, and maintain project health.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
