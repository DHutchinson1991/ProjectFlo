# 📋 Product Requirements Document (PRD)

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Purpose & Scope 🎯

This document details the complete functional and non-functional requirements for ProjectFlo v1.0. Its purpose is to serve as the definitive guide for the engineering, design, and quality assurance teams.

> **Key Objective:**  
> Translate strategic vision into concrete, actionable development requirements while maintaining alignment with business goals.

### 1.1 Implementation Status & Architecture Documentation 📚

**Current Status:** The core system architecture described in this PRD has been implemented and is reflected in the current codebase. The following comprehensive documentation provides detailed explanations of the implemented systems:

**Core System Architecture:**
- **[Complete Coverage-Components-Deliverables-Tasks System](../Complete%20Coverage-Components-Deliverables-Tasks%20System.md)** - ✅ **IMPLEMENTED** - Comprehensive four-layer system with full data relationships
- **[Comprehensive Pricing Engine Implementation](../Comprehensive%20Pricing%20Engine%20Implementation.md)** - ✅ **IMPLEMENTED** - Task-based pricing with modifier system
- **[Complete System Architecture](../Complete%20System%20Architecture.md)** - ✅ **IMPLEMENTED** - End-to-end workflow and business logic

**Supporting Systems:**
- **[Music System Architecture](../Music%20System%20Architecture.md)** - 🚧 **PARTIALLY IMPLEMENTED** - Schema ready, timeline integration pending
- **[Raw Footage Processing](../Raw%20Footage%20Processing.md)** - 🚧 **PARTIALLY IMPLEMENTED** - Processing levels defined, automation pending
- **[Timeline Interface Specification](../Timeline%20Interface%20Specification.md)** - ⏳ **PLANNED** - Frontend interface specification

> **Note:** This PRD now serves as the requirements foundation for the implemented system. New features and enhancements should reference both this PRD and the detailed architecture documentation above.

---

## 2. Guiding Principles ✨

Our design and development are guided by four foundational principles. Adherence to these principles is mandatory for all features.

### **Single Source of Truth**

All data must have a single, canonical location in the database. Data entered once must be seamlessly available wherever it's needed without duplication.

> **Implication:** This eliminates data-entry errors, resolves version control issues (e.g., "Which proposal is correct?"), and ensures that when core information is updated in one place, it is correct everywhere.

### **Automate Everything Repetitive**

If a task is performed manually more than twice, it must be considered a prime candidate for automation. Our team's time should be spent on high-impact, creative work, not rote administration.

> **Implication:** The system will actively take work off our team's plate, from generating task lists based on a quote to sending payment reminders, thereby increasing operational leverage and scalability.

### **Data-Driven by Default**

The system must not be a passive data repository. It must actively use the data it collects to provide actionable insights, improve estimates, and flag risks. Every feature should be designed with the question, "How can this data make us smarter?"

> **Implication:** The platform will evolve into a predictive tool, helping us forecast project profitability, identify our most efficient team members for specific tasks, and understand the true cost of our services.

### **User-Centric Design**

Every feature must provide clear, tangible value to at least one of our core user roles. The user experience must be intuitive, efficient, and empowering.

> **Implication:** The success of a feature is measured by its adoption and the value it delivers to the end-user, whether it's a client feeling informed or a contributor feeling unblocked.

---

### **Terminology Standards**

To ensure consistent communication across all stakeholders, these key terms are used with specific meanings:

> **Build:** The core data structure representing a creative project (stored in `builds` table). Used consistently in technical contexts and client-facing UI ("Build Sheet").
>
> **Quote:** A Build in its pre-approval state. Uses the same data structure but with `status = 'Proposal Sent'`. Represents the configuration and pricing before client commitment.
>
> **Project:** The business-friendly term for a booked Build (`status = 'Booked'`). Used in navigation, client communication, and general discussion.
>
> **Component:** A building block of video deliverables (e.g., "Ceremony Highlight", "Reception Dancing"). Components have coverage requirements, complexity scores, and editing parameters.
>
> **Deliverable:** A final video product composed of one or more components (e.g., "Feature Film" made from ceremony + reception components).
>
> This clear terminology mapping ensures that database structure (`builds`), UI elements ("Build Sheet"), and human communication remain aligned while maintaining user-friendly language.

---

## 3. Enhanced Deliverable System Requirements 🎬

**IMPLEMENTATION STATUS: ✅ FULLY IMPLEMENTED**

ProjectFlo's deliverable system supports the complex, component-based nature of wedding videography through a comprehensive architecture detailed in **[Complete System Architecture](../Complete%20System%20Architecture.md)**.

### 3.1 Component Library Architecture (🚧 Enhanced Implementation)

#### 3.1.1 Enhanced Component Pool Management

**Requirement:** 🚧 IN PROGRESS - The system maintains a centralized pool of reusable components with advanced management and analytics capabilities.

> **Current Implementation:**
> - Global `component_library` table with comprehensive metadata ✅
> - **Updated component types**: `COVERAGE_LINKED` (requires coverage scenes) and `EDIT` (post-production) 🚧
> - Complexity scoring system (1-10 scale) for accurate pricing ✅
> - Coverage scene associations via `ComponentCoverageScene` table ✅
> - Task-based pricing via `ComponentTaskRecipe` system ✅
> - **NEW**: Component dependency system for linking related components 🚧
> - **NEW**: Usage analytics and performance tracking 🚧
> - **NEW**: Full-page table interface with inline editing 🚧

#### 3.1.2 Advanced Component Configuration System (🚧 Enhanced)

**Requirement:** 🚧 IN PROGRESS - Enhanced component configuration with visual timeline builder and real-time collaboration.

> **Enhanced Implementation:**
> - Per-component editing style selection with override capability ✅
> - Component-level music options via `ComponentMusicOption` table ✅
> - Task-based pricing calculation (Hours × $75 base rate × modifiers) ✅
> - **NEW**: Visual timeline positioning system with drag-and-drop interface 🚧
> - **NEW**: Multi-layer timeline support (Video, Audio, Dialogue) 🚧
> - **NEW**: 5-second snapping grid for precise component placement 🚧
> - **NEW**: Real-time collaboration for component and timeline editing 🚧
> - **NEW**: Component templates and marketplace integration 🚧

### 3.2 Advanced Deliverable Types (🚧 Major Enhancement)

#### 3.2.1 Enhanced Standard Deliverable System

**Requirement:** 🚧 IN PROGRESS - Standard deliverables enhanced with visual timeline builder and advanced collaboration features.

> **Enhanced Implementation:**
> - Component assignment via `DeliverableAssignedComponents` table ✅
> - Timeline ordering with `order_index` field ✅
> - Duration overrides and editing style overrides per assignment ✅
> - **NEW**: Visual timeline positioning with `timeline_components` table 🚧
> - **NEW**: Multi-layer timeline organization with `timeline_layers` table 🚧
> - **NEW**: Deliverable categories (Films vs Assets) classification 🚧
> - **NEW**: Real-time collaboration and change tracking 🚧
> - **NEW**: Timeline analytics and optimization insights 🚧

#### 3.2.2 Visual Timeline Builder System (🚧 Major Implementation)

**Requirement:** 🚧 IN PROGRESS - Comprehensive visual timeline editor with drag-and-drop functionality and multi-layer support.

> **Implementation Status:**
> - Timeline database schema implemented via enhanced `timeline_components`, `timeline_layers` tables 🚧
> - **NEW**: Canvas-based timeline editor with 60fps performance 🚧
> - **NEW**: Drag-and-drop component placement with magnetic snapping 🚧
> - **NEW**: 5-second snap grid system with zoom levels 🚧
> - **NEW**: Multi-layer support for Video, Audio, and Dialogue 🚧
> - **NEW**: Timeline mini-map and ruler system 🚧
> - **NEW**: Auto-save and undo/redo functionality 🚧
> - **NEW**: Real-time collaboration with conflict resolution 🚧

**For detailed timeline architecture, see [Phase 1 - Component Management.md](../Implementation/Phase%201%20-%20Component%20Management.md).**

> **Enhanced Timeline Builder Requirements:**
> - **5-Second Snap Grid**: All components automatically align to 5-second intervals for professional precision
> - **Multi-layer Organization**: Separate Video, Audio, and Dialogue layers with color coding
> - **Real-time Collaboration**: Multiple users can edit timelines simultaneously with change tracking
> - **Performance Optimization**: Canvas-based rendering for smooth 60fps interactions
> - **Mobile Support**: Touch-optimized timeline builder for tablet devices
> - **Multi-Track Layout**: Separate tracks for Video, Audio, Graphics, and Notes organization
> - **Precise Timecode Display**: Shows exact start/end times (00:03:30 - 00:04:30 format)
> - **Visual Duration Blocks**: Component blocks sized proportional to actual duration
> - **Real-Time Duration Calculation**: Total deliverable duration updates as components are placed
> - **Drag-and-Drop Placement**: Intuitive component positioning with automatic snap assistance
> - **Timeline Template Persistence**: Save complete timeline configurations as reusable templates
> - **Client Timeline Export**: Export visual timeline presentations for client approval

#### 3.2.4 Template Management Interface (🚧 Partially Implemented)

**Requirement:** 🚧 IN PROGRESS - Advanced template management interface with enhanced usability and organization features.

> **Current Implementation:**
> - Basic template CRUD operations ✅
> - Template categories and organization 🚧 IN PROGRESS
> - Advanced template management interface ⏳ PLANNED

> **Advanced Template Management Requirements:**
> - **Compact Detail View**: Template information presented in well-organized, space-efficient layout
> - **Grouped Statistics**: Template statistics grouped into logical sections (Overview, Workflow)
> - **Inline Editing**: Title, description, version, and category editable directly within template header
> - **Collapsible Sections**: Component builder and complex sections collapsible to reduce cognitive load
> - **Manual Save Persistence**: Component changes saved only when explicitly requested (no auto-save)
> - **Modal-Based Category Management**: Full CRUD operations for template categories
> - **Style Management Integration**: Visual interface for associating editing styles with templates

#### 3.2.2 Raw Footage Deliverable System (✅ Implemented)

**Requirement:** ✅ COMPLETE - The system handles raw footage deliverables with flexible processing and delivery options via separate `RAW_FOOTAGE` deliverable type.

> **Current Implementation:**
> - Processing level selection (MINIMAL, STANDARD, PREMIUM) via `ProcessingLevel` enum ✅
> - Delivery format configuration (MP4_H264, PRORES_422, ORIGINAL_CODEC) via `DeliveryFormat` enum ✅
> - Scene selection from coverage moments ✅
> - Separate workflow from standard component system ✅

**For detailed raw footage architecture, see [Raw Footage Processing](../Raw%20Footage%20Processing.md).**

### 3.3 Music Integration System (🚧 Partially Implemented)

#### 3.3.1 Multi-Level Music Architecture

**Requirement:** 🚧 IN PROGRESS - Music configuration works at both deliverable and component levels.

> **Current Implementation:**
> - Component-level music options via `ComponentMusicOption` table ✅
> - Deliverable-level music via `DeliverableMusicTrack` table ✅
> - Music type classification (NONE, SCENE_MATCHED, ORCHESTRAL, PIANO, MODERN, VINTAGE) ✅
> - Music weighting system for recommendations ✅

**For advanced music system architecture, see [Music System Architecture](../Music%20System%20Architecture.md).**

### 3.4 Task Generation & Automation (✅ Implemented)

#### 3.4.1 Automatic Task Generation

**Requirement:** ✅ COMPLETE - Component configurations automatically generate specific work tasks.

> **Current Implementation:**
> - Task generation from `ComponentTaskRecipe` configurations ✅
> - Task hour estimation and pricing calculation ✅
> - Build approval triggers task creation ✅
> - Task assignment to contributors ✅
> - Progress tracking and time logging integration ✅

#### 3.4.2 Task-Based Pricing

**Requirement:** ✅ COMPLETE - Pricing calculation based on task hours with admin modifiers.

> **Current Implementation:**
> - Base pricing: Task Hours × $75 hourly rate ✅
> - Pricing modifiers (Peak Season, Rush Job, Volume Discount) via `PricingModifier` table ✅
> - Real-time pricing calculation API ✅
> - Change order pricing with approval workflow ✅

**For complete pricing architecture, see [Pricing Engine Documentation](../Pricing%20Engine%20Documentation.md).**

#### 3.4.3 Per-Component Pricing System (✅ CRITICAL REQUIREMENT)

**Requirement:** ✅ COMPLETE - **Pricing is calculated individually per component**, not per deliverable, ensuring granular cost control and profitability analysis.

> **Per-Component Pricing Implementation:**
> - **Individual Component Costing**: Each component in a deliverable has its own pricing calculation ✅
> - **Formula**: Component Price = (Task Hours × $75 Base Rate) × Pricing Modifiers ✅
> - **Aggregated Deliverable Pricing**: Deliverable total = Sum of all component prices ✅
> - **Real-time Updates**: Component pricing updates instantly when task hours or modifiers change ✅
> - **Profit Margin Analysis**: Cost vs. price breakdown displayed per component ✅
> - **Component Profitability Tracking**: Historical analysis of component performance and optimization suggestions ✅

> **Business Impact:**
> - **Granular Cost Control**: Identify which specific components are profitable vs. loss-making
> - **Accurate Quote Generation**: Precise pricing based on actual component complexity
> - **Performance Optimization**: Data-driven decisions on component pricing and task allocation
> - **Transparent Client Communication**: Clear breakdown of what drives pricing in each quote

> - Complexity-based task generation and hour estimation

### 3.5 AI-Powered Automation Features (⏳ Planned)

#### 3.5.1 AI Task Suggestion System

**Requirement:** ⏳ PLANNED - AI-powered system to suggest tasks and estimate hours for new services and components.

> **AI Task Generation Requirements:**
> - **Service Analysis**: Send service descriptions to LLM for task template suggestions
> - **Hour Estimation**: AI-powered hour estimation based on historical data and component complexity
> - **Task Template Generation**: Automatic creation of suggested task templates from AI analysis
> - **Admin Review Interface**: Admin approval workflow for AI-generated suggestions before implementation

#### 3.5.2 AI Communication Assistance

**Requirement:** ⏳ PLANNED - AI-powered communication drafting for client interactions and business correspondence.

> **AI Communication Requirements:**
> - **Quote Follow-up Drafting**: AI-generated follow-up emails for quotes based on timing and context
> - **Client Communication Templates**: AI-powered personalized client communication drafting
> - **Professional Brand Voice**: Consistent brand voice across all AI-generated communications
> - **Context-Aware Messaging**: Communication tailored to specific client status and project phase

### 3.6 Quote Generation & Client Experience (✅ Implemented)

#### 3.6.1 Interactive Quote Configurator

**Requirement:** ✅ COMPLETE - Real-time quote configurator with visual timeline presentation and immediate pricing feedback.

> **Current Implementation:**
> - Real-time component selection and pricing calculation ✅
> - Coverage-to-component mapping system ✅
> - Deliverable-to-component assembly logic ✅
> - Dynamic modifier application (seasonal, equipment, rush) ✅
> - Lead capture and quote generation ✅

**For detailed quote architecture, see [Quotes Architecture](../Architecture/Quotes%20Architecture.md).**

> **Quote Configurator Requirements:**
> - **Real-Time Pricing**: Price updates instantly (<200ms) as selections change
> - **Visual Component Selection**: Interactive component library with descriptions and examples
> - **Timeline-Based Quote Visualization**: Visual timeline showing selected components and timing
> - **Modifier Integration**: Automatic application of seasonal, equipment, and rush pricing modifiers
> - **Shareable Configuration URLs**: Quote configurations preserved in shareable URLs
> - **Lead Capture Integration**: Seamless transition from configuration to quote request

#### 3.6.2 Timeline-Based Quote Presentation

**Requirement:** ⏳ PLANNED - Visual timeline presentation of quote configurations for enhanced client understanding.

> **Timeline Quote Features:**
> - **Component Timeline Visualization**: Show component placement and timing in quote presentation
> - **Interactive Timeline Preview**: Allow clients to see how their deliverable will be structured
> - **Timeline Export for Clients**: Visual timeline PDF exports for client review and approval
> - **Duration Visualization**: Clear display of total deliverable duration and component breakdown

### 3.7 User Interface & Experience Features (🚧 Partially Implemented)

#### 3.7.1 Admin Command Center Interface

**Requirement:** 🚧 IN PROGRESS - Comprehensive admin interface for business management and project oversight.

> **Admin Interface Requirements:**
> - **Activity Feed**: Real-time notifications and team activity stream
> - **Performance Metrics Dashboard**: Revenue tracking, project health, productivity statistics
> - **Quick Actions Panel**: Rapid access to common tasks (new quote, project, client)
> - **Business Intelligence Dashboard**: Profitability analysis and trend visualization
> - **Project Management Interface**: High-level project summary with key metrics and task management
> - **Financial Dashboard**: Revenue vs cost analysis with invoice management integration

**For detailed UI architecture, see [User Interface Architecture](../Architecture/User%20Interface%20Architecture.md).**

#### 3.7.2 Real-Time Collaboration Features

**Requirement:** ⏳ PLANNED - Real-time collaboration and communication features for team coordination.

> **Collaboration Requirements:**
> - **Live Updates**: WebSocket-powered real-time data synchronization across all interfaces
> - **In-App Notification System**: Critical event notifications with activity streams
> - **Collaborative Template Editing**: Multi-user template and project editing capabilities
> - **Team Activity Tracking**: Comprehensive activity logs and communication integration

#### 3.7.3 Responsive Design System

**Requirement:** 🚧 IN PROGRESS - Mobile-first responsive design system with role-based interface adaptation.

> **Responsive Design Requirements:**
> - **Mobile Optimization**: Touch-optimized navigation and controls (320px - 767px)
> - **Tablet Hybrid Interface**: Touch/mouse hybrid interface (768px - 1023px)
> - **Desktop Full-Featured**: Complete feature set for desktop users (1024px+)
> - **Progressive Disclosure**: Complex features revealed as screen size increases
> - **WCAG 2.1 AA Compliance**: Full accessibility support with keyboard navigation and screen reader optimization

### 3.8 Analytics & Business Intelligence (⏳ Planned)

#### 3.8.1 Performance Analytics Dashboard

**Requirement:** ⏳ PLANNED - Comprehensive business analytics and performance monitoring system.

> **Analytics Requirements:**
> - **Revenue Dashboard**: Financial performance tracking and forecasting with trend analysis
> - **Project Timeline Visualization**: Gantt-style project scheduling and milestone tracking
> - **Resource Utilization Charts**: Team capacity and workload analysis with efficiency metrics
> - **Client Satisfaction Metrics**: Feedback collection and rating visualization system
> - **Component Performance Analysis**: Track which components drive the highest client satisfaction and profitability

**For detailed analytics architecture, see [Analytics Architecture](../Architecture/Analytics%20Architecture.md).**

#### 3.8.2 Interactive Data Visualization

**Requirement:** ⏳ PLANNED - Advanced data visualization components for business intelligence.

> **Data Visualization Requirements:**
> - **Filterable Data Tables**: Advanced filtering and sorting capabilities for large datasets
> - **Interactive Charts**: Drill-down capabilities for detailed analysis and insights
> - **Real-Time Metrics**: Live updating performance indicators and dashboards
> - **Multi-Format Export**: Data export functionality in CSV, PDF, and Excel formats

### 3.9 Integration & External Services (🚧 Partially Implemented)

#### 3.9.1 Time Tracking Integration

**Requirement:** 🚧 IN PROGRESS - Seamless integration with Clockify for automated time tracking and task management.

> **Current Implementation:**
> - Clockify API integration framework ✅
> - Automatic time entry synchronization ⏳ PLANNED
> - Task-based time tracking correlation ⏳ PLANNED

> **Time Tracking Requirements:**
> - **Automatic Time Sync**: Periodic polling of Clockify API for new time entries
> - **Task Correlation**: Match time entries with ProjectFlo tasks via task ID references
> - **Real-Time Time Updates**: Update `actual_duration_hours` field automatically from time logs
> - **Performance Benchmarking**: Compare contributor performance against task templates

#### 3.9.2 Asset Management Integration

**Requirement:** 🚧 IN PROGRESS - Integration with Frame.io for project asset management and collaboration.

> **Asset Management Requirements:**
> - **Direct Asset Links**: Frame.io project links embedded within task contexts
> - **Asset Organization**: Automatic project folder creation and organization
> - **Review Integration**: Client review workflows integrated with Frame.io approval system
> - **Version Control**: Asset version tracking and change management

#### 3.9.3 Payment Processing Integration

**Requirement:** ✅ COMPLETE - Stripe integration for secure online payment processing.

> **Current Implementation:**
> - Stripe Payment Intents API integration ✅
> - Automatic payment status updates ✅
> - Transaction logging in payments table ✅
> - Secure payment form implementation ✅

### 3.10 Advanced Template Management System 🎨

#### 3.9.1 Template Configuration Interface

**Requirement:** 🚧 IN PROGRESS - Administrators must have a comprehensive interface for managing deliverable templates with enhanced usability and organization.

> **Implementation Requirements:**
> - **Compact Detail View:** Deliverable detail pages must present information in a well-organized, space-efficient manner
> - **Grouped Statistics:** Template statistics grouped into logical sections (Overview, Workflow) for better comprehension
> - **Inline Editing:** Title, description, version, and category must be editable directly within the template header
> - **Collapsible Sections:** Component builder and other complex sections must be collapsible to reduce cognitive load
> - **Manual Component Persistence:** Component changes must only be saved when explicitly requested by the user (no auto-save)

#### 3.10.2 Category Management System

**Requirement:** 🚧 IN PROGRESS - The system must provide flexible category management for organizing deliverable templates.

> **Implementation Requirements:**
> - **Modal-Based Category Management:** Accessible from the main deliverables page via "Manage Categories" button
> - **Full CRUD Operations:** Create, read, update, and delete categories with proper validation
> - **Template Association:** Display and manage which templates are associated with each category
> - **Error Handling:** Robust error handling for category operations with user-friendly feedback
> - **Immediate UI Updates:** Category changes must be reflected immediately in the template interface

#### 3.10.3 Style Management Integration

**Requirement:** ⏳ PLANNED - Template management must integrate with editing styles through a dedicated style management section.

> **Implementation Requirements:**
> - **Style Selection Interface:** Intuitive interface for associating editing styles with deliverable templates
> - **Style Preview:** Visual representation of how different styles affect the deliverable
> - **Style Compatibility:** Validation to ensure selected styles are compatible with template components
> - **Default Style Configuration:** Ability to set default styles for new templates

#### 3.10.4 Enhanced User Experience

**Requirement:** 🚧 IN PROGRESS - The template management interface must prioritize user experience and workflow efficiency.

> **Implementation Requirements:**
> - **Responsive Design:** All template management interfaces must work seamlessly across desktop and tablet devices
> - **Keyboard Navigation:** Full keyboard navigation support for accessibility
> - **Loading States:** Clear loading indicators for all asynchronous operations
> - **Confirmation Dialogs:** User confirmation for destructive actions (delete, major changes)
> - **Breadcrumb Navigation:** Clear navigation context within the template management system
