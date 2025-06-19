# 🏛️ Technical Implementation Architecture

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

---

## 1. Purpose 🎯

This document provides a comprehensive overview of the technical implementation architecture for ProjectFlo v1.0. It defines the core architectural principles, the primary technologies chosen, and the high-level implementation strategy for core system logic.

> It is intended for all technical stakeholders—engineers, architects, and DevOps personnel—to establish a shared understanding of the system's technical design, de-risk the project by making key decisions upfront, and serve as a living document that guides development and prevents architectural drift.

### 1.1 Related Architecture Documentation 📚

This document is part of a comprehensive architecture documentation suite:

- **[System Architecture](System%20Architecture.md)** - High-level business logic and 4-layer system workflow
- **[Component Architecture](../Architecture/Component%20Architecture.md)** - Component creation and timeline integration
- **[Deliverables Architecture](Deliverables%20Architecture.md)** - Timeline-based template system and final product delivery
- **[Pricing Engine](Pricing%20Engine.md)** - Task-based pricing with modifier system
- **[Raw Footage Processing](Raw%20Footage%20Processing.md)** - Asset processing and delivery workflows

> **Implementation Status:** These documents reflect the current codebase as implemented in `packages/backend/src/` and provide detailed explanations of business logic, data flows, and system integration patterns.

---

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

### 2.5 Terminology Standards

**Principle:** Consistent use of key terms across UI and documentation.

> **Implementation:**
>
> - **Build:** The core data structure representing a creative project. Used in database (`builds` table) and client-facing UI ("Build Sheet").
> - **Quote:** A proposed Build before client approval. Has its own lifecycle in the `quotes` table but shares core schema with `builds`.
> - **Project:** The overarching term used in client/admin communication. Technically implemented as a Build, but used as a more accessible term in UI navigation and documentation.
>
> This alignment ensures that technical implementation (`builds` table) and user-facing language ("Build Sheet", "Project Dashboard") remain consistent while maintaining user-friendly terminology.

### 2.6 Frontend Application Separation

**Principle:** Clear separation between admin and client-facing applications.

> **Implementation:**
>
> - **Admin Application:** `/app-crm/` - Internal business management interface
> - **Client Portal:** `/app-portal/` (Future) - Client-facing project portal
> - Shared components and utilities in `/components/` and `/lib/`
> - Independent routing, styling, and feature sets per application type

**Rationale:** This separation allows for:
- Different authentication flows (JWT for admin, separate auth for clients)
- Distinct user experiences optimized for different user types
- Independent deployment and testing strategies
- Clear security boundaries between internal and external users

### 2.7 Project Structure Standards

**Principle:** Consistent file organization and naming conventions.

> **Implementation:**
>
> **Monorepo Structure:**
> ```
> ProjectFlo/
> ├── packages/
> │   ├── frontend/                 # Next.js Frontend Application
> │   │   ├── src/
> │   │   │   ├── app/
> │   │   │   │   ├── app-crm/      # Admin Application Routes
> │   │   │   │   │   ├── contacts/ # CRM Contact Management
> │   │   │   │   │   ├── settings/ # Business Configuration
> │   │   │   │   │   │   ├── team/     # Team Management
> │   │   │   │   │   │   └── services/ # Services Configuration
> │   │   │   │   │   └── layout.tsx    # Admin Layout
> │   │   │   │   └── app-portal/   # Client Portal (Future)
> │   │   │   ├── components/       # Shared UI Components
> │   │   │   └── lib/             # API Clients & Utilities
> │   │   └── ...
> │   └── backend/                  # NestJS Backend API
> │       ├── src/
> │       │   ├── auth/            # Authentication Module
> │       │   ├── contacts/        # Contact Management API
> │       │   ├── contributors/    # Team Management API
> │       │   ├── coverage-scenes/ # Wedding Services API
> │       │   ├── deliverables/    # Deliverable Types API
> │       │   ├── editing-styles/  # Editing Styles API
> │       │   └── ...
> │       └── prisma/              # Database Schema & Migrations
> └── Plan/                        # Project Documentation
>     ├── Architecture/
>     ├── Implementation/
>     └── ...
> ```
>
> **Frontend Applications:**
> - **Admin Application (`/app-crm/`)**: Internal business management interface
> - **Client Portal (`/app-portal/`)**: Future client-facing collaboration space
> - **Shared Resources**: Common components, API services, and utilities
>
> **Backend Modules:**
> - Feature-based module organization
> - Consistent controller, service, DTO, and module structure
> - Centralized database service and authentication guards

**Benefits:**
- Clear separation of concerns between applications
- Consistent development patterns
- Easy navigation and maintainability
- Scalable architecture for future growth

---

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

---

## 4. Core Logic & Service Implementation 🔌

### 4.1 Enhanced Service Architecture

#### **Timeline-Based Quoting Engine**
```typescript
// Enhanced QuotingService supports timeline-based deliverable pricing
class QuotingService {
  async calculateTimelineQuote(timelineConfiguration: TimelineConfiguration) {
    // Read timeline component placement and duration
    // Calculate complexity based on component interactions and timing
    // Apply pricing modifiers for timeline density and duration
    // Return real-time pricing with timeline breakdown
  }
}
```

#### **Component Timeline Integration**
```typescript
// ComponentService manages timeline-aware component properties
class ComponentService {
  async validateTimelinePlacement(componentId: string, timelinePosition: TimelinePosition) {
    // Validate component duration constraints
    // Check track compatibility
    // Verify snap position alignment (5-second intervals)
    // Return placement validation results
  }
}
```

#### **Visual Timeline Processing**
```typescript
// TimelineService handles timeline template creation and management
class TimelineService {
  async saveTimelineTemplate(deliverableId: string, timeline: TimelineTemplate) {
    // Store precise component timing (start/end in seconds)
    // Validate 5-second snap alignment
    // Calculate total deliverable duration
    // Generate editor specifications from timeline
  }
}
```

### 4.2 Task Generation & Automation Workflows 🤖

#### Task Generation Triggers

**Quote Approval → Timeline-Based Task Generation**
```typescript
async approveQuote(quoteId: string) {
  await this.prisma.$transaction(async (tx) => {
    // 1. Update build status
    await tx.builds.update({
      where: { id: quoteId },
      data: { status: 'BOOKED' }
    });
    
    // 2. Generate tasks from timeline component specifications
    const timeline = await tx.timelineTemplates.findUnique({
      where: { deliverable_id: quoteId },
      include: { timeline_components: { include: { component: true } } }
    });
    
    // 3. Create tasks with precise timing requirements
    for (const timelineComponent of timeline.timeline_components) {
      await tx.tasks.create({
        data: {
          build_id: quoteId,
          component_id: timelineComponent.component_id,
          timeline_start_time: timelineComponent.start_time,
          timeline_end_time: timelineComponent.end_time,
          timeline_specifications: timelineComponent,
          status: 'NOT_STARTED'
        }
      });
    }
  });
}
```

### 4.3 Data Access Patterns by User Role 🔐

**Client Portal Access**
- **Read Access**: Own builds, deliverables, timeline visualizations, invoices, payments
- **Write Access**: Timeline feedback, change order requests, payment processing
- **Restricted**: Internal tasks, contributor details, cost breakdowns, admin settings

**Contributor/Team Member Access**  
- **Read Access**: Assigned tasks, timeline specifications, asset links, time tracking data
- **Write Access**: Task status updates, time entries, progress notes, asset uploads
- **Restricted**: Client financial data, pricing details, other contributors' performance

**Administrator Access**
- **Full Read/Write**: All data across the system
- **Special Functions**: User management, system configuration, financial reporting, timeline template management
- **Audit Access**: Complete audit trail, system logs, performance metrics

### 4.4 Authentication & Authorization Strategy 🛡️

**Application-Layer Security**
- Role-based access control (RBAC) implemented in NestJS guards
- JWT tokens with role claims for API authentication
- Session-based authentication for client portal
- No database-level row security policies (handled in application logic)

**API Security Patterns**
```typescript
// Timeline-aware authorization guard implementation
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CONTRIBUTOR')
@Get('builds/:id/timeline')
async getBuildTimeline(@Param('id') buildId: string, @User() user: UserEntity) {
  // Application-layer filtering based on user role and timeline access
  if (user.role === 'CONTRIBUTOR') {
    return this.timelineService.findByContributor(buildId, user.id);
  }
  return this.timelineService.findByBuild(buildId);
}
```

---

## 5. External System Integrations 🔌

### 5.1 Time Tracking Integration (Clockify)

**Timeline-Based Time Sync Workflow**
```typescript
@Cron('0 * * * *') // Every hour
async syncTimeEntries() {
  const clockifyEntries = await this.clockifyApi.getRecentEntries();
  
  for (const entry of clockifyEntries) {
    // Parse task ID and timeline position from description
    const { taskId, timelineSegment } = this.parseTimelineTaskId(entry.description);
    if (taskId) {
      await this.tasksService.updateActualHours(taskId, entry.duration, timelineSegment);
    }
  }
}
```

### 5.2 Asset Management Integration (Frame.io)

**Timeline-Aware Asset Link Management**
```typescript
async linkFrameIoAsset(taskId: string, frameIoUrl: string, timelinePosition?: TimelinePosition) {
  await this.prisma.project_assets.create({
    data: {
      task_id: taskId,
      storage_path: frameIoUrl,
      asset_type: 'FRAME_IO_LINK',
      timeline_position: timelinePosition,
      status: 'ACTIVE'
    }
  });
}
```

### 5.3 Google Workspace Integration 📄

**Core Integration Points:**

1. **Storage & Asset Management:**
   - Google Drive API for secure asset storage
   - Timeline-based folder structure per project with component organization
   - Automated permission management based on RBAC
   - Enhanced folder structure for timeline assets and component exports

2. **Communication:**
   - Gmail API for automated notifications including timeline milestone alerts
   - Email templating system with timeline progress updates
   - Timeline visualization attachments via Drive links

3. **Calendar Integration:**
   - Google Calendar API for project timelines with component-based milestones
   - Two-way sync for team scheduling including timeline-specific tasks
   - Auto-population of deliverable deadlines based on timeline duration

4. **Authentication:**
   - Google OAuth 2.0 for client authentication
   - Service accounts for backend operations
   - SSO integration for internal users

**Implementation Notes:**
- All Google API interactions are wrapped in our own service layer
- Failures gracefully degrade to local alternatives
- Audit logging tracks all Google API operations
- Enhanced with timeline asset management and deliverable sharing

### 5.4 Graceful Degradation Policy

> **Policy:** Each integration must have a defined failure policy with timeline-aware fallbacks. For example, if the Clockify API is down, time-tracking requests will be added to the BullMQ queue and retried with an exponential backoff strategy. Timeline-specific retry logic ensures no timing data is lost and that a failure in an external service does not cascade into a failure of our core platform.

---

## 6. Performance & Optimization 🚀

### 6.1 Timeline Data Optimization

**Timeline Query Patterns**
```sql
-- Optimized timeline component retrieval
SELECT tc.*, c.name, c.type, c.estimated_duration
FROM timeline_components tc
JOIN component_library c ON tc.component_id = c.id
WHERE tc.timeline_id = ?
ORDER BY tc.start_time ASC;

-- Index requirements for timeline performance
CREATE INDEX idx_timeline_components_timeline_start ON timeline_components(timeline_id, start_time);
CREATE INDEX idx_timeline_components_snap_position ON timeline_components(snap_position);
```

**Frontend Timeline Rendering**
- Virtualized timeline rendering for large projects
- Component-based timeline caching with TanStack Query
- Optimistic UI updates for drag-and-drop operations
- Debounced timeline position updates to prevent excessive API calls

### 6.2 Real-Time Timeline Collaboration

**WebSocket Integration**
```typescript
// Real-time timeline updates for collaborative editing
@WebSocketGateway()
export class TimelineGateway {
  @SubscribeMessage('timeline-update')
  handleTimelineUpdate(client: Socket, payload: TimelineUpdatePayload) {
    // Broadcast timeline changes to all connected users
    // Validate timeline position changes
    // Handle conflict resolution for simultaneous edits
  }
}
```

---

## 7. System Integration Points 🔗

### 7.1 Timeline Integration with Business Logic

**Quote System Integration**
- Timeline visualization in public quote configurator
- Real-time pricing updates based on timeline duration and complexity
- Template-based package comparison with visual timeline differences

**Task System Integration**
- Timeline specifications translate directly to editor task requirements
- Precise timing requirements (00:03:30 - 00:04:30) for professional video editing
- Task hour calculation based on timeline complexity and component density

**Client Communication Integration**
- Visual timeline exports for client presentation and approval
- Timeline-based progress tracking and client updates
- Clear deliverable structure communication through timeline visualization

### 7.2 Implementation Status Summary

**Current Implementation:**
- Timeline-based template system fully integrated
- 5-second snap precision for professional timing
- Component placement with exact start/end time storage
- Visual timeline builder with drag-and-drop functionality
- Timeline validation and duration calculation

**Key Technical Notes:**
- Timeline data stored as seconds from start (e.g., 210 for 00:03:30)
- 5-second snap intervals ensure professional timing standards
- Multi-track timeline support (Video, Audio, Graphics, Notes)
- Timeline templates replace traditional component ordering
- Real-time timeline duration calculation and validation

---

## Related Documents 📚

- **[System Architecture](System%20Architecture.md)** - Overall business logic and 4-layer system
- **[Deliverables Architecture](Deliverables%20Architecture.md)** - Timeline-based template system details
- **[Component Architecture](../Architecture/Component%20Architecture.md)** - Component timeline integration
- **[Database Schema](../Data/Database%20Schema.md)** - Database implementation details
- **[DevOps Guide](Technical/DevOps%20Guide.md)** - Deployment and infrastructure
