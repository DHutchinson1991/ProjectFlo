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
- **`/app/settings/components`**: Manage the global video component pool and component-deliverable associations.
- **`/app/settings/music`**: Configure music options, types, and editing style preferences.
- **`/app/settings/recipes`**: A powerful interface to manage the automation rules that connect services to production tasks.
- **`/app/settings/team`**: Manage contributor accounts, system-level roles, and default pay rates.

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Admin User

### 3.11 Enhanced Deliverable Management

**Route:** `/app/settings/services/deliverables`

#### Purpose

Full-page deliverable template editor with component-based configuration system and **integrated visual timeline builder** for managing complex video products and their component placement.

#### Key Functionality

- **Component-Based Builder**
  - Drag-and-drop component selection from global pool
  - Visual component arrangement and sequencing
  - Live complexity calculation and **per-component pricing preview**
  - Component compatibility validation and dependency checking

- **Visual Timeline Builder (Integrated)**
  - **Horizontal, drag-and-drop timeline interface** for component placement within deliverable templates
  - **Multi-layer timeline** (Video, Audio, Dialogue) with component positioning
  - **5-second snapping grid** for precise component timing and alignment
  - **Real-time collaboration** with live updates across team members
  - Component duration management and overlap detection
  - Timeline zoom controls (5-second to 2-minute scales) and precision editing tools
  - **Per-deliverable component overrides** for timeline positioning

- **Multi-Level Music Configuration**
  - Deliverable-level music selection for span deliverables
  - Component-level music options and overrides
  - Music type filtering and preview functionality
  - Integration with editing style music preferences

- **Raw Footage Configuration**
  - Processing level selection interface
  - Delivery format configuration options
  - Coverage moment selection from timeline
  - Custom moment definition and tagging

- **Advanced Settings**
  - **Component-specific timeline management** within deliverable context
  - **Per-deliverable component overrides** for timeline positioning and duration
  - Delivery deadline management and milestone tracking
  - Complexity multiplier configuration and pricing engine integration
  - Coverage requirement calculation and validation
  - Editing style compatibility matrix and component recommendations

#### Technical Details

- **Template:** A (Dashboard Layout) with full-page editor - **NO MODALS**
- **Auth Required:** Yes
- **Permissions:** Admin User
- **Real-time:** Yes (complexity and pricing updates, timeline collaboration)
- **Timeline Tech Stack:** React DnD, Canvas API, @hello-pangea/dnd, WebSocket for collaboration

### 3.12 Video Component Pool Management

**Route:** `/app/settings/components`

#### Purpose

**Full-page, inline-editing component management interface** for the global pool of reusable video components that form the building blocks of all deliverables. This is **NOT a modal-based system** but a dedicated full-page interface with comprehensive component management capabilities.

#### Key Functionality

- **Full-Page Component Table (NO MODALS)**
  - **Inline editing** for component names, types, and basic properties directly in table cells
  - **Two distinct sections**: "Coverage Components" and "Edit Components" with clear visual separation
  - **Coverage Components** require linking to coverage scenes with visual validation indicators
  - Real-time component type switching with automatic validation and dependency checking
  - Bulk operations and multi-select functionality for batch updates
  - Advanced filtering and search across all component properties and relationships

- **Coverage Component Requirements & Dependencies**
  - **Mandatory coverage scene linking** for all COVERAGE_LINKED components with validation
  - Visual indication when coverage scenes are missing, invalid, or need attention
  - Coverage scene impact analysis and dependency mapping across multiple deliverables
  - Scene-to-component relationship validation with conflict resolution
  - **Component dependency management** with visual dependency mapping and circular reference detection

- **Per-Component Pricing & Profitability System**
  - **Real-time pricing calculation** based on task hours × rates × complexity modifiers
  - **Profit margin analysis** with cost vs. price breakdowns and optimization suggestions
  - Component profitability tracking across all projects and historical performance
  - Pricing history and trend analysis for each component with seasonality insights
  - **Pricing engine integration** for automatic rate updates and modifier application

- **Component Compatibility & Validation**
  - Component compatibility matrix with automated warnings for problematic combinations
  - Multi-deliverable impact analysis when components are modified or deprecated
  - Component usage tracking across all templates and active projects
  - Validation rules for component relationships and timeline positioning requirements

#### Technical Details

- **Template:** A (Dashboard Layout) - **FULL PAGE ONLY, NO MODAL SYSTEM**
- **Auth Required:** Yes
- **Permissions:** Admin User
- **Real-time Updates:** Component pricing, dependency validation, coverage analysis, usage tracking
- **UI Framework:** Material-UI with custom inline editing components and drag-and-drop support

### 3.13 Music Integration Management

**Route:** `/app/settings/music`

#### Purpose

Comprehensive music asset and preference management system supporting multi-level music configuration.

#### Key Functionality

- **Music Asset Library**
  - Music type categorization and filtering
  - Track duration and metadata management
  - Component compatibility configuration
  - Preview and playback functionality

- **Editing Style Music Preferences**
  - Default music type weighting system
  - Style-specific music recommendations
  - Music preference inheritance rules
  - Compatibility matrix management

- **Music Configuration Rules**
  - Deliverable-level music track management
  - Component-level music option configuration
  - Multi-track music coordination
  - Music type selection logic

#### Technical Details

- **Template:** A (Dashboard Layout)
- **Auth Required:** Yes
- **Permissions:** Admin User

### 3.14 Enhanced Quote Configuration

**Route:** `/app/quotes/[id]/configure`

#### Purpose

Advanced quote configuration interface with component-based deliverable builder for complex wedding videography packages.

#### Key Functionality

- **Interactive Deliverable Builder**
  - Component selection from available pool
  - Real-time complexity and pricing calculations
  - Visual component arrangement interface
  - Coverage requirement validation

- **Music Configuration Interface**
  - Deliverable-level music selection
  - Component-specific music options
  - Music preview and approval workflow
  - Style-based music recommendations

- **Raw Footage Configuration**
  - Processing level selection
  - Delivery format options
  - Scene selection from coverage timeline
  - Custom moment requests

- **Client Collaboration Features**
  - Configuration sharing and approval
  - Change request workflow
  - Real-time pricing updates
  - Component explanation and education

#### Technical Details

- **Template:** A (Dashboard Layout) with specialized configuration panels
- **Auth Required:** Yes
- **Permissions:** Sales User, Admin User
- **Real-time:** Yes (pricing, complexity, compatibility)

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
