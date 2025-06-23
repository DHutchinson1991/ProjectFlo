# 🎯 Phase 2A: Unified Default Task Management System

## Cross-Entity Implementation Plan

**Focus:** Create a unified, reusable default task management system for Components, Deliverables, and Coverage Scenes  
**Goal:** Replace complex workflow templates with simple, intuitive default task systems across all entity types

---

## 🎯 **SYSTEM OVERVIEW**

### **Unified Architecture:**

- **Single Reusable Component**: `DefaultTaskManager` works across all entity types
- **Consistent User Experience**: Same interface for Components, Deliverables, and Coverage Scenes
- **Shared Backend Service**: `EntityDefaultTaskService` handles all entity types
- **Task Template Integration**: Drag-and-drop from categorized task templates
- **Project Integration**: Copy default tasks to project tasks when entities are used

### **Entity Types Supported:**

1. **Components** - Default tasks for creating specific video components
2. **Deliverables** - Default tasks for assembling and delivering final products
3. **Coverage Scenes** - Default tasks for filming and processing specific scenes

---

## 🛠️ **BACKEND IMPLEMENTATION**

### **Database Schema (COMPLETED)**

✅ **Unified `entity_default_tasks` Table:**

```prisma
model EntityDefaultTask {
  id              Int           @id @default(autoincrement())
  entityType      String        @map("entity_type")      // 'component', 'deliverable', 'coverage_scene'
  entityId        Int           @map("entity_id")
  taskTemplateId  Int?          @map("task_template_id")
  taskName        String        @map("task_name")
  estimatedHours  Float         @default(0) @map("estimated_hours")
  orderIndex      Int           @map("order_index")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @default(now()) @updatedAt @map("updated_at")

  taskTemplate    TaskTemplate? @relation(fields: [taskTemplateId], references: [id])

  @@map("entity_default_tasks")
}
```

### **Backend Service (COMPLETED)**

✅ **EntityDefaultTaskService Features:**

- Universal CRUD operations for all entity types
- Task reordering with drag-and-drop support
- Task template integration and copying
- Validation and error handling
- Support for manual task creation

### **API Endpoints (TO IMPLEMENT)**

```typescript
// Universal default task endpoints
GET    /api/entities/:type/:id/default-tasks           // Get entity's default tasks
POST   /api/entities/:type/:id/default-tasks           // Add default task
PUT    /api/entities/:type/:id/default-tasks/:taskId   // Update default task
DELETE /api/entities/:type/:id/default-tasks/:taskId   // Delete default task
POST   /api/entities/:type/:id/default-tasks/reorder   // Reorder default tasks

// Task template integration
GET    /api/task-templates/by-category/:category       // Get templates by category
POST   /api/entities/:type/:id/default-tasks/from-template // Add task from template

// Categories by entity type:
// - component: "Production", "Post-Production", "General"
// - deliverable: "Films", "Assets", "Export", "Delivery"
// - coverage_scene: "Coverage", "Footage", "Processing"
```

---

## 🎨 **FRONTEND IMPLEMENTATION**

### **Reusable DefaultTaskManager Component**

**File:** `packages/frontend/src/app/app-crm/_components/DefaultTaskManager.tsx`

**Universal Interface for All Entity Types:**

```tsx
interface DefaultTaskManagerProps {
  entityType: "component" | "deliverable" | "coverage_scene";
  entityId: number;
  entityName: string;
  readonly?: boolean;
}

export function DefaultTaskManager({
  entityType,
  entityId,
  entityName,
  readonly,
}: DefaultTaskManagerProps) {
  // Universal features that work across all entity types
}
```

### **Core Features:**

1. **Empty State Management**

   - Friendly empty list UI: "No default tasks for this {entityType}"
   - Clear "Add Task" call-to-action button
   - Contextual help text based on entity type

2. **Task Template Integration**

   - Category-based template filtering:
     - **Components**: Production, Post-Production, General templates
     - **Deliverables**: Films, Assets, Export, Delivery templates
     - **Coverage Scenes**: Coverage, Footage, Processing templates
   - Drag-and-drop from template library into default tasks
   - Visual template preview with hours and description

3. **Manual Task Creation**

   - "Add Custom Task" option for entity-specific tasks
   - Inline editing: task name, estimated hours
   - Form validation and error handling

4. **Visual Task Management**

   - Clean task cards with drag handles
   - Drag-and-drop reordering within default task list
   - Visual feedback during drag operations
   - Edit/delete actions on each task card

5. **CRUD Operations**
   - Add tasks (from template or manual)
   - Edit existing task names and hours
   - Delete tasks with confirmation dialog
   - Reorder tasks via drag-and-drop
   - Auto-save with loading states

---

## 🎯 **ENTITY-SPECIFIC IMPLEMENTATIONS**

### **Components Default Tasks**

**Page:** `packages/frontend/src/app/app-crm/components/[id]/page.tsx`

**Integration:**

- ✅ UniversalWorkflowManager removed from Workflow tab
- [ ] Replace with `<DefaultTaskManager entityType="component" entityId={id} entityName={component.name} />`
- [ ] Tab name remains "Workflow" but shows only default tasks
- [ ] Task templates filtered to "Production", "Post-Production", "General" categories

**Example Default Tasks:**

- "Script review and planning" (2 hours)
- "Footage selection and organizing" (4 hours)
- "Initial edit and assembly" (8 hours)
- "Color correction and grading" (3 hours)
- "Audio mixing and enhancement" (2 hours)
- "Final review and export" (1 hour)

### **Deliverables Default Tasks**

**Page:** `packages/frontend/src/app/app-crm/settings/services/deliverables/[id]/page.tsx`

**Integration:**

- [ ] Remove UniversalWorkflowManager from Workflow tab
- [ ] Add `<DefaultTaskManager entityType="deliverable" entityId={id} entityName={deliverable.name} />`
- [ ] Task templates filtered to "Films", "Assets", "Export", "Delivery" categories

**Example Default Tasks:**

- "Component assembly and integration" (3 hours)
- "Quality control review" (1 hour)
- "Client preview preparation" (2 hours)
- "Final export and encoding" (2 hours)
- "Delivery package preparation" (1 hour)
- "Client delivery and handoff" (1 hour)

### **Coverage Scenes Default Tasks**

**Page:** `packages/frontend/src/app/app-crm/settings/services/coverage-scenes/[id]/page.tsx`

**Integration:**

- [ ] Remove UniversalWorkflowManager from Workflow tab
- [ ] Add `<DefaultTaskManager entityType="coverage_scene" entityId={id} entityName={scene.name} />`
- [ ] Task templates filtered to "Coverage", "Footage", "Processing" categories

**Example Default Tasks:**

- "Equipment setup and preparation" (0.5 hours)
- "Scene capture and filming" (2 hours)
- "Footage review and selection" (1 hour)
- "Basic color correction" (1 hour)
- "File organization and backup" (0.5 hours)

---

## 🔄 **PROJECT INTEGRATION WORKFLOW**

### **Copy Default Tasks to Project Tasks**

When an entity is added to a project, its default tasks are copied as actual project tasks:

```typescript
// Universal task copying logic
async function copyEntityDefaultTasksToProject(
  projectId: number,
  entityType: "component" | "deliverable" | "coverage_scene",
  entityId: number,
) {
  const defaultTasks = await getDefaultTasks(entityType, entityId);

  for (const defaultTask of defaultTasks) {
    await createProjectTask({
      projectId,
      taskName: defaultTask.taskName,
      estimatedHours: defaultTask.estimatedHours,
      orderIndex: defaultTask.orderIndex,
      status: "pending",
      assignedTo: null, // To be assigned later
      // Link back to original entity
      componentId: entityType === "component" ? entityId : null,
      deliverableId: entityType === "deliverable" ? entityId : null,
      coverageSceneId: entityType === "coverage_scene" ? entityId : null,
      // Optional template reference
      templateId: defaultTask.taskTemplateId,
    });
  }
}
```

### **Trigger Points:**

- **Component added to project** → Copy component default tasks
- **Deliverable added to project** → Copy deliverable default tasks
- **Coverage scene added to project** → Copy coverage scene default tasks

---

## 🎯 **USER EXPERIENCE FLOWS**

### **First-Time Setup (Empty State):**

1. User navigates to entity detail page → Workflow tab
2. Sees "No default tasks for this [entity type]" empty state
3. Clicks "Add Task" → Options: "From Template" or "Custom Task"
4. **From Template**: Opens filtered template library, drag to add
5. **Custom Task**: Inline form for name and hours

### **Managing Existing Tasks:**

1. User sees list of default tasks with names, hours, order
2. Can drag tasks to reorder
3. Can click edit icon to modify name/hours
4. Can click delete icon with confirmation
5. Can add more tasks via "Add Task" button

### **Template Integration:**

1. User clicks "Add from Template"
2. Template library opens, filtered by entity category
3. User can search/filter templates
4. Drag template into default task list
5. Template becomes new default task with template reference

---

## 🔄 **IMPLEMENTATION SEQUENCE**

### **Phase 1: Backend Controller (Day 1-2)**

- [ ] Create `EntityDefaultTaskController` with universal endpoints
- [ ] Implement category-based task template filtering
- [ ] Add validation and error handling
- [ ] Test all CRUD operations and edge cases

### **Phase 2: Frontend Component (Day 3-4)**

- [ ] Create reusable `DefaultTaskManager` component
- [ ] Implement drag-and-drop functionality
- [ ] Create template selection interface
- [ ] Add empty states and error handling

### **Phase 3: Entity Integration (Day 5-6)**

- [ ] Integrate `DefaultTaskManager` into component detail page
- [ ] Integrate into deliverable detail page
- [ ] Integrate into coverage scene detail page
- [ ] Test across all entity types

### **Phase 4: Project Integration (Day 7)**

- [ ] Implement default task copying logic
- [ ] Add trigger points in project management
- [ ] Test end-to-end workflow
- [ ] Performance optimization and polish

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements:**

- [ ] **Universal Interface** - Same component works for all entity types
- [ ] **Task Template Integration** - Can drag templates filtered by category
- [ ] **Manual Task Creation** - Can create custom tasks for any entity
- [ ] **Task Management** - Full CRUD and reordering capabilities
- [ ] **Project Integration** - Default tasks copy correctly to projects
- [ ] **Empty State Handling** - Clean, helpful empty states

### **User Experience Requirements:**

- [ ] **Consistent Design** - Same look and feel across all entity pages
- [ ] **Intuitive Interface** - Easy to understand regardless of entity type
- [ ] **Fast Performance** - Responsive drag-and-drop and API calls
- [ ] **Error Recovery** - Clear error messages and graceful handling
- [ ] **Visual Feedback** - Loading states, animations, confirmations

### **Technical Requirements:**

- [ ] **Component Reusability** - Single component, multiple use cases
- [ ] **API Performance** - Sub-200ms response times for all operations
- [ ] **Data Integrity** - Proper validation and constraint handling
- [ ] **Testing Coverage** - Unit tests for component and service
- [ ] **Documentation** - Clear API docs and component usage guide

---

## 🚀 **FUTURE ENHANCEMENTS**

### **Phase 2B: Advanced Features**

- **Smart Templates** - AI-suggested tasks based on entity type and complexity
- **Template Analytics** - Track which templates are most effective
- **Bulk Operations** - Add multiple templates or tasks at once
- **Task Dependencies** - Define relationships between default tasks

### **Phase 3: Project-Level Integration**

- **Task Generation** - Auto-create project tasks from all entity defaults
- **Resource Planning** - Estimate project workload from default tasks
- **Timeline Integration** - Schedule tasks based on project timeline
- **Team Assignment** - Auto-assign tasks based on contributor skills

This unified system creates a solid foundation for task management across all entity types while maintaining consistency and reusability throughout the application.
