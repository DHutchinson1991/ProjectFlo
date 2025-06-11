# 🗺️ Application Sitemap

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PURPOSE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Purpose 🎯

This document maps the complete navigation structure of ProjectFlo, defining the hierarchy and relationships between all pages and features.

> **Key Objective:**  
> Create a clear mental model of the application's structure for developers and designers.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ NAVIGATION STRUCTURE ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 🌐 2. Public-Facing Pages

These pages are accessible to anyone and serve as the primary entry points into the application. They are designed to be simple, focused, and efficient at converting visitors.

### 2.1 Quote Configurator

**Route:** `/quote-configurator`

#### Purpose

The interactive tool for potential clients to build a preliminary quote. This is a **critical lead-generation tool** designed to engage users by providing immediate value and transparency.

#### Key Functionality

- Interactive deliverable selection
- Dynamic pricing calculation
- Real-time cost breakdown
- Lead capture form

#### Technical Details

- **Template:** B (Centered Content)
- **Auth Required:** No
- **Cache Strategy:** Static with revalidation

### 2.2 Login

**Route:** `/login`

#### Purpose

The single, unified login form for all user types (Clients, Admins, Contributors).

#### Key Functionality

- Email/password authentication
- Role-based routing
- Password reset flow
- MFA for admin accounts

#### Technical Details

- **Template:** B (Centered Content)
- **Auth Required:** No
- **Rate Limited:** Yes

## ⚙️ 3. Admin & Contributor Application

This is the core internal application used by the team. All pages use **Template A: Dashboard Layout** for a consistent experience.

### 3.1 Dashboard

**Route:** `/app/dashboard`

#### Purpose

The main landing page after login, providing a high-level overview of business health and immediate priorities.

#### Key Components

1. **Activity Feed**

   - Real-time updates
   - Actionable notifications
   - Team activity stream

2. **Performance Metrics**

   - Revenue tracking
   - Project health indicators
   - Team productivity stats

3. **Quick Actions**
   - Create new quote
   - Add new client
   - Start new project

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Base User
- **Real-time:** Yes

### 3.2 Inquiries

**Route:** `/app/inquiries`

#### Purpose

A list view of all new leads from the website. This is the primary workspace for the sales process.

#### Key Functionality

- Filterable and searchable table of inquiries
- Inquiry assignment to team members
- Status updates and tracking
- New quote initiation from inquiry record

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Sales User
- **Real-time:** Yes

### 3.3 Inquiry Detail

**Route:** `/app/inquiries/[id]`

#### Purpose

The detail view for a single inquiry, acting as the central record for all pre-booking communication and associated quotes.

#### Key Components

- Inquiry information summary
- Contact history log
- Associated quotes overview

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Sales User

### 3.4 Quotes

**Route:** `/app/quotes`

#### Purpose

A list view of all quotes (builds) that have been created but not yet booked, providing a clear view of the sales pipeline.

#### Key Functionality

- Searchable and sortable table of quotes
- Quote status tracking
- Quick access to quote details

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Sales User

### 3.5 Quote Detail

**Route:** `/app/quotes/[id]`

#### Purpose

The main workspace for building and editing a client's quote. This is one of the most complex and powerful screens in the application.

#### Key Functionality

- Detailed configuration panel for quote items
- Instant `live_price` updates
- Proposal sending and project booking

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Sales User

### 3.6 Projects

**Route:** `/app/projects`

#### Purpose

A list view of all booked and active projects. This is the central hub for project management.

#### Key Functionality

- Searchable table of projects
- Key dates and status indicators
- Budget health color-coding

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Base User

### 3.7 Project Detail

**Route:** `/app/projects/[id]`

#### Purpose

The detail view for a single project, using a tabbed interface to organize information clearly.

#### Tabs

- **Overview:** High-level project summary, key contacts, and important notes.
- **Tasks:** A comprehensive list of all production tasks. Admins can assign tasks to contributors here.
- **Financials:** The project's financial command center, showing profitability, invoices, and payments.
- **Files:** A file manager for all project assets, with links to Frame.io.

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Base User

### 3.8 Tasks

**Route:** `/app/tasks`

#### Purpose

A personalized "to-do list" for a contributor, showing only the tasks assigned to them across all projects to provide maximum focus.

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Contributor

### 3.9 Contacts

**Route:** `/app/contacts`

#### Purpose

The master CRM list of all people in the system, ensuring a single source of truth for contact information.

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Base User

### 3.10 Settings

**Route:** `/app/settings`

#### Purpose

A parent page using a sub-navigation pattern for all administrative settings.

#### Sub-pages

- **`/app/settings/services`**: Manage the core "ingredients" of the business (deliverables, scenes, styles).
- **`/app/settings/recipes`**: A powerful interface to manage the automation rules that connect services to production tasks.
- **`/app/settings/team`**: Manage contributor accounts, system-level roles, and default pay rates.

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Admin User

## 🤝 4. Client Portal

This is the logged-in experience for clients. All pages use a simplified version of **Template A: Dashboard Layout** to avoid overwhelming them.

### 4.1 Client Dashboard

**Route:** `/client/dashboard`

#### Purpose

The main landing page for a client, designed to be welcoming and provide immediate assurance.

#### Key Components

- Prominent welcome message
- Project status summary
- Outstanding alerts (e.g., "You have a new invoice")

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Client User

### 4.2 Client Project

**Route:** `/client/project`

#### Purpose

A detailed, read-only view of their project, providing complete transparency.

#### Sub-pages

- **`/client/project/build`**: A clean "Build Sheet" listing everything they have purchased.
- **`/client/project/timeline`**: The high-level, interactive project timeline showing completed and upcoming phases.

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Client User

### 4.3 Client Financials

**Route:** `/client/financials`

#### Purpose

A simple and secure area for clients to manage their finances.

#### Key Functionality

- List of all invoices with status
- Clear "Pay Now" button integrating with Stripe

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Client User

### 4.4 Change Order Detail

**Route:** `/client/change-orders/[id]`

#### Purpose

A focused, single-task view for approving a pending change order, designed to be unambiguous and secure.

#### Key Functionality

- Clear description of requested changes
- Price difference and new total project cost
- Formal "I Approve This Change" button

#### Technical Details

- **Template:** B (Centered Content)
- **Auth Required:** Yes
- **Permissions:** Client User
