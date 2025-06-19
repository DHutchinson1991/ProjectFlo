# 🏗️ System Architecture

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

---

## 1. Overview 🎯

ProjectFlo implements a sophisticated 4-layer architecture for video production management, creating an automated workflow from initial quote to final delivery.

### 1.1 The Four-Layer System

```
📋 Coverage Scenes ──→ 🧩 Components ──→ 📦 Deliverables ──→ ✅ Tasks
   (What to Film)      (How to Edit)     (What to Deliver)   (Work to Do)
```

**Coverage Scenes** define *what* content needs to be captured  
**Components** define *how* that content is processed and edited  
**Deliverables** define *what* final products the client receives  
**Tasks** define *who* does *what work* and *when* to make it happen

---

## 2. Coverage Scenes System 🎬

### 2.1 Purpose & Implementation

Coverage Scenes represent distinct parts of an event requiring video coverage. They serve as the foundation for linking client selections to actual production tasks.

**Schema Structure:**
```sql
coverage_scenes {
  id: PRIMARY KEY
  name: UNIQUE (e.g., "Ceremony", "Reception", "Couple's Sunset Session")
  description: TEXT
}
```

**Business Logic:**
- Maps to filming requirements (crew, equipment, time allocation)
- Links to components (defines editing/production work needed)
- Drives task generation (automatically creates work items)
- Influences pricing (different complexity and resource requirements)

**Current Seed Data:** Bridal Preparation, Ceremony Coverage, Reception Coverage, First Dance, Parent Dances, Cake Cutting, Open Dancing, Couple's Sunset Session

---

## 3. Components System 🧩

### 3.1 Architecture & Types

Components are reusable building blocks that define how raw footage becomes finished video products.

#### **COVERAGE_BASED Components**
- Directly tied to coverage scenes
- Examples: "Ceremony Edit", "Reception Highlights", "Sunset Sequence"
- Automatically included when related coverage scenes are selected

#### **PRODUCTION Components**  
- Standalone production elements
- Examples: "Color Grading", "Audio Enhancement", "Title Graphics"
- Can be added to any deliverable regardless of coverage selection

### 3.2 Schema Implementation

**Core Component Library:**
```sql
ComponentLibrary {
  id: PRIMARY KEY
  name: STRING
  type: ComponentType (COVERAGE_BASED | PRODUCTION)
  complexity_score: INT (1-10 difficulty rating)
  estimated_duration: INT (minutes of final content)
  base_task_hours: DECIMAL (default labor hours)
  default_editing_style: STRING
}
```

**Component Relationships:**
```sql
ComponentCoverageScene {
  component_id → ComponentLibrary.id
  coverage_scene_id → coverage_scenes.id
}

ComponentTaskRecipe {
  component_id → ComponentLibrary.id
  task_template_name: STRING
  hours_required: DECIMAL
  order_index: INT (execution sequence)
}
```

### 3.3 Component-to-Task Generation

Components use **Task Recipes** to automatically generate work items:

```typescript
// When project is booked, for each component:
const taskRecipes = await prisma.componentTaskRecipe.findMany({
  where: { component_id: componentId }
});

// Generate tasks from recipes
for (const recipe of taskRecipes) {
  await prisma.tasks.create({
    data: {
      project_id,
      build_component_id,
      task_template_id: recipe.task_template_id,
      planned_duration_hours: recipe.hours_required,
      status: 'To_Do'
    }
  });
}
```

---

## 5. Deliverables System 📦

### 5.1 Purpose & Architecture

Deliverables represent the final video products that clients receive. They serve as containers that combine multiple components into cohesive end products.

### 5.2 Schema Structure

**Deliverable Templates:**
```sql
deliverables {
  id: PRIMARY KEY
  name: STRING (e.g., "Feature Film (10-15 min)", "Highlight Reel (3-5 min)")
  description: TEXT
  type: DeliverableType (STANDARD | RAW_FOOTAGE)
  default_music_type: MusicType
  delivery_timeline: INT (days from completion)
  includes_music: BOOLEAN
  is_active: BOOLEAN
}
```

**Component Assignment:**
```sql
DeliverableAssignedComponents {
  deliverable_id → deliverables.id
  component_id → ComponentLibrary.id
  order_index: INT (assembly sequence)
  editing_style: STRING (override default)
  duration_override: INT (custom timing)
  calculated_task_hours: DECIMAL (computed effort)
  calculated_base_price: DECIMAL (computed cost)
}
```

### 5.3 Workflow Integration

**Template → Build Instance Flow:**
```
1. Admin creates deliverable template with default components
2. Client selects deliverable during quote configuration  
3. System creates build_deliverable instance
4. System creates build_components from template defaults
5. Components generate tasks when project is booked
6. Tasks drive actual production work
```

---

## 4. Timeline-Based Template System ⏱️

### 4.1 Visual Timeline Architecture

The Visual Timeline Builder serves as the primary interface for organizing components into deliverables, replacing traditional list-based ordering with precise timing specifications.

#### **Timeline Template Structure**
```sql
timeline_templates {
  id: PRIMARY KEY
  deliverable_id: FOREIGN KEY
  total_duration: INT (seconds)
  snap_interval: INT (5 seconds default)
  tracks: JSON (Video, Audio, Graphics layers)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

timeline_components {
  id: PRIMARY KEY
  timeline_id: FOREIGN KEY
  component_id: FOREIGN KEY  
  start_time: INT (seconds from timeline start)
  end_time: INT (seconds from timeline start)
  duration: INT (auto-calculated seconds)
  track_id: STRING (which layer: video/audio/graphics)
  snap_position: INT (snapped to 5-second intervals)
  visual_order: INT (display order within track)
}

timeline_markers {
  id: PRIMARY KEY
  timeline_id: FOREIGN KEY
  time_position: INT (seconds)
  marker_type: ENUM (milestone, sync, note)
  label: STRING
  color: STRING
}
```

### 4.2 Timeline Integration Points

#### **With Quote System**
- Real-time pricing based on timeline duration and complexity
- Visual timeline preview in public quote configurator
- Template-based package comparison (Essential vs Premium timelines)

#### **With Component System**
- Components provide duration estimates for timeline placement
- Automatic validation of component placement and timing
- Track compatibility (Video components → Video track)

#### **With Task System**
- Timeline specifications translate directly to editor task requirements
- Precise timing requirements for professional video editing
- Task hour calculation based on timeline complexity and duration

#### **With Client Communication**
- Visual timeline exports for client presentation and approval
- Timeline-based progress tracking and client updates
- Clear deliverable structure communication

### 4.3 Timeline Data Flow

```
Client Quote Request → Timeline Template Selection → Component Placement → 
Timing Specification → Editor Task Generation → Professional Video Editing → 
Final Deliverable Assembly → Client Delivery
```

---

## 6. Tasks System ✅

### 6.1 Purpose & Implementation

Tasks represent individual units of work that team members must complete to deliver client projects. Tasks are automatically generated from component task recipes when builds are approved.

### 5.2 Schema Structure

**Core Task Entity:**
```sql
tasks {
  id: PRIMARY KEY
  project_id → projects.id
  build_component_id → build_components.id
  task_template_id → task_templates.id
  planned_duration_hours: DECIMAL (estimated effort)
  actual_duration_hours: DECIMAL (tracked time)
  status: tasks_status (To_Do | Ready_to_Start | In_Progress | Completed | Archived)
  due_date: DATE
  assigned_to_contributor_id → contributors.id
  is_client_visible: BOOLEAN
  rate_at_time_of_assignment: DECIMAL (hourly rate when assigned)
}
```

**Task Templates:**
```sql
task_templates {
  id: PRIMARY KEY
  name: STRING (e.g., "Ceremony Edit", "Color Correction", "Audio Sync")
  phase: STRING (Pre-Production | Production | Post-Production)
  effort_hours: DECIMAL (standard time estimate)
  pricing_type: pricing_type_options (Hourly | Fixed)
  fixed_price: DECIMAL (if fixed pricing)
  average_duration_hours: DECIMAL (historical average)
}
```

### 5.3 Task Generation Process

**Automatic Generation Flow:**
```typescript
// When build status changes to 'Booked'
async function generateTasksFromBuild(buildId: number) {
  // Get all build components
  const buildComponents = await prisma.build_components.findMany({
    where: { build_deliverable: { build_id: buildId } },
    include: { coverage_scene: true, editing_style: true }
  });

  // For each component, find matching task recipes
  for (const component of buildComponents) {
    const recipes = await prisma.component_task_recipes.findMany({
      where: {
        deliverable_id: component.build_deliverable.deliverable_id,
        coverage_scene_id: component.coverage_scene_id,
        editing_style_id: component.editing_style_id
      }
    });

    // Create tasks from recipes
    for (const recipe of recipes) {
      await prisma.tasks.create({
        data: {
          project_id: buildId,
          build_component_id: component.id,
          task_template_id: recipe.task_template_id,
          planned_duration_hours: recipe.effort_hours,
          status: 'To_Do'
        }
      });
    }
  }
}
```

---

## 7. Build & Quote Management System 📋

### 7.1 Build Entity Architecture

Builds are the core project configuration structure, serving as both quotes (pre-approval) and projects (post-approval).

**Schema Structure:**
```sql
builds {
  id: PRIMARY KEY
  client_id → clients.id
  inquiry_id → inquiries.id
  project_id → projects.id  
  status: builds_status (Inquiry | Proposal_Sent | Booked | Completed | Archived)
  configuration_locked_at: TIMESTAMP (price lock)
  approved_price: DECIMAL (locked pricing)
  live_price: DECIMAL (current configuration cost)
  total_paid: DECIMAL (payment tracking)
}
```

### 7.2 Configuration-to-Tasks Flow

```
1. Client/Admin configures build
   ├── Selects coverage scenes
   ├── Chooses deliverables  
   ├── Customizes components
   └── Reviews pricing

2. Build approved (status → 'Booked')
   ├── Configuration locked
   ├── Price locked
   ├── Project record created
   └── Task generation triggered

3. Tasks created from build_components
   ├── Each component finds matching task recipes
   ├── Tasks created with effort estimates
   ├── Dependencies established
   └── Initial assignments made

4. Production begins
   ├── Contributors see task assignments
   ├── Time tracking begins
   ├── Progress monitoring active
   └── Client visibility controlled
```

---

## 7. Change Order & Versioning System 🔄

### 7.1 Change Order Management

**Schema Structure:**
```sql
build_change_orders {
  id: PRIMARY KEY
  build_id → builds.id
  version_number: INT
  price_delta: DECIMAL (change in cost)
  new_total_approved_price: DECIMAL
  description: TEXT
  status: change_order_status (Pending_Approval | Approved | Rejected)
  discount_type: discount_type_enum (Percentage | Fixed)
  discount_percentage: DECIMAL
  discount_amount: DECIMAL
  discount_reason: TEXT
}
```

### 7.2 Versioning Workflow

```
1. Client requests changes to approved build
2. Admin creates change order
3. System calculates price delta
4. Snapshot of current state saved
5. New configuration applied (live_price updated)
6. Change order sent for approval
7. If approved: approved_price updated, tasks regenerated
8. If rejected: configuration reverted to last snapshot
```

---

## 8. Data Flow & System Integration 🔄

### 8.1 Complete System Data Flow

```
Inquiry → Quote Configuration → Build Creation → Approval → Task Generation → Production → Delivery

Coverage Scenes ─┐
                 ├─→ Components ─→ Task Recipes ─→ Tasks ─→ Completed Work
Deliverables ────┘
```

### 8.2 Service Layer Architecture

**Backend Services:**
- `ComponentsService` - Component library and coverage scene management
- `DeliverablesService` - Deliverable templates and build instances  
- `PricingService` - Cost calculation and modifier application
- `AuditService` - Change tracking and version history
- `BuildsService` - Quote and project management

**External Integrations:**
- **Time Tracking (Clockify):** Automatic time sync to update `actual_duration_hours`
- **Asset Management (Frame.io):** Direct links from tasks to relevant project assets
- **Communication:** Automated notifications and client portal updates

---

## 9. Performance & Optimization 🚀

### 9.1 Database Performance

**Key Indexes:**
```sql
-- Task management
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_contributor ON tasks(assigned_to_contributor_id);

-- Build management  
CREATE INDEX idx_builds_status ON builds(status);
CREATE INDEX idx_builds_client ON builds(client_id);

-- Component relationships
CREATE INDEX idx_component_coverage ON ComponentCoverageScene(component_id, coverage_scene_id);
CREATE INDEX idx_component_recipes ON component_task_recipes(deliverable_id, coverage_scene_id);
```

### 9.2 Business Intelligence

**Audit Trail:**
```sql
audit_log {
  id: PRIMARY KEY
  contributor_id → contributors.id
  action: STRING
  timestamp: TIMESTAMP
  details: JSON
}
```

**Performance Metrics:**
- Task completion time vs. estimates
- Contributor efficiency benchmarks
- Project profitability analysis
- Resource utilization tracking

---

## 10. Implementation Status ✅

### 10.1 Current Implementation

**✅ Completed:**
- Core schema with all relationships
- Component library with task recipes
- Deliverable templates with default components
- Build management with change orders
- Basic task generation framework

**🚧 In Progress:**
- Frontend component management interface
- Advanced task assignment algorithms
- Client portal integration
- External service integrations

**⏳ Planned:**
- AI-powered estimation
- Mobile applications
- Advanced analytics dashboard
- Multi-tenant architecture

This architecture provides the foundation for a scalable, automated video production management system. The four-layer approach creates clear separation of concerns while maintaining the flexibility needed for custom client requirements and evolving business needs.

---

## 11. Related Architecture Documents 📚

### 11.1 Core Domain Architecture
- [Coverage Architecture](Coverage Architecture.md) - Wedding coverage and scene management
- [Tasks Architecture](Tasks Architecture.md) - Work orchestration and resource management  
- [Component Architecture](Component Architecture.md) - Video component creation and configuration
- [Deliverables Architecture](Deliverables Architecture.md) - Final product assembly and delivery
- [Quotes Architecture](Quotes Architecture.md) - Quote generation, pricing, and approval workflows
- [Pricing Engine](Pricing Engine.md) - Pricing calculation and cost management

### 11.2 System Architecture
- [User Interface Architecture](User Interface Architecture.md) - Frontend interfaces and user experience
- [Integration Architecture](Integration Architecture.md) - External system integrations and APIs
- [Analytics Architecture](Analytics Architecture.md) - Business intelligence and performance monitoring

### 11.3 Technical Implementation
- [Implementation Guide](../Technical%20Reference/Implementation%20Guide.md) - Core architectural principles and technology stack
- [API Design](../Technical%20Reference/Technical/API%20Design%20Spec.md) - API specifications and endpoints
- [Security Design](../Technical%20Reference/Technical/Security%20Design.md) - Security architecture and protocols
- [DevOps Guide](../Technical%20Reference/Technical/DevOps%20Guide.md) - Infrastructure and deployment specifications
- [Non-Functional Requirements](../Technical%20Reference/Technical/NFRS.md) - Performance, scalability, and reliability requirements
