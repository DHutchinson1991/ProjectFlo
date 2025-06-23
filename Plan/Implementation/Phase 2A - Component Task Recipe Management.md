# 🎯 Phase 2A: Entity Default Task Management System

## Immediate Next Implementation - Week 1

**Focus:** Create reusable default task management for Components, Deliverables, and Coverage Scenes  
**Goal:** Replace complex workflow templates with simple, intuitive default task systems

---

## 🎯 **IMPLEMENTATION OVERVIEW**

### **Current State:**

- ✅ Component detail pages exist with basic info
- ✅ Backend has task-related tables (`tasks`, `task_templates`)
- ✅ Legacy UniversalWorkflowManager removed from entity pages
- ✅ Component/Deliverable/Coverage Scene CRUD operations working
- ✅ New `entity_default_tasks` table created with Prisma schema
- ✅ Backend service (`EntityDefaultTaskService`) created for task management

### **Phase 2A Goals:**

- ✅ **Backend Default Task System** - Database schema and service layer complete
- [ ] **Reusable Frontend Component** - Shared `DefaultTaskManager` UI component for task management across entity types
- [ ] **Task Template Integration** - Drag-and-drop from existing task templates
- [ ] **Backend Controllers** - REST API endpoints for CRUD operations
- [ ] **Project Integration** - Copy default tasks to actual project tasks when triggered

---

## 🛠️ **ARCHITECTURE CHANGES**

### **Remove Complex Workflow System**

- [ ] Remove UniversalWorkflowManager from all entity detail pages
- [ ] Remove workflow template complexity from entity management
- [ ] Keep workflow system only for project-level task orchestration

### **New Default Task System**

Each entity (Component, Deliverable, Coverage Scene) will have:

- **Default Tasks**: Pre-defined task list with names, hours, order
- **Task Templates**: Ability to drag existing task templates into default tasks
- **Customization**: Add/edit/delete/reorder default tasks per entity
- **Project Copy**: When entity is used in project, copy default tasks to actual project tasks

---

## 🛠️ **BACKEND IMPLEMENTATION**

### **New Database Tables**

````sql
-- Default tasks for each entity type
CREATE TABLE entity_default_tasks (
---

## 🛠️ **BACKEND IMPLEMENTATION**

### **Database Schema (COMPLETED)**
✅ **New `entity_default_tasks` Table Added:**
```prisma
model EntityDefaultTask {
  id              Int           @id @default(autoincrement())
  entityType      String        @map("entity_type")
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
````

✅ **Task Templates Model Updated:**

```prisma
model TaskTemplate {
  // ...existing fields...
  entityDefaultTasks EntityDefaultTask[]
}
```

### **Backend Service (COMPLETED)**

✅ **EntityDefaultTaskService Created:**

- `packages/backend/src/entity-default-tasks/entity-default-task.service.ts`
- Full CRUD operations for default tasks
- Reordering and template integration logic
- Support for all entity types (component, deliverable, coverage_scene)

### **API Endpoints (TO IMPLEMENT)**

```typescript
// Default Tasks for any entity
GET    /entities/:type/:id/default-tasks        // Get entity's default tasks
POST   /entities/:type/:id/default-tasks        // Add default task
PUT    /entities/:type/:id/default-tasks/:tid   // Update default task
DELETE /entities/:type/:id/default-tasks/:tid   // Delete default task
POST   /entities/:type/:id/default-tasks/reorder // Reorder default tasks

// Task Template Integration
GET    /task-templates/by-category              // Get templates by category for drag-drop
POST   /entities/:type/:id/default-tasks/from-template // Add task from template
```

### **Controller Implementation (TO IMPLEMENT)**

**Files to Create:**

- `packages/backend/src/entity-default-tasks/entity-default-task.controller.ts`
- Update main app module to include new controller

---

## 🎨 **FRONTEND IMPLEMENTATION**

### **Reusable Default Task Manager Component**

**File:** `packages/frontend/src/app/app-crm/_components/DefaultTaskManager.tsx`

**Purpose:** Shared component used by Components, Deliverables, and Coverage Scenes for managing their default task lists

**Key Features:**

- [ ] **Task List Display** - Show current default tasks with names, hours, order
- [ ] **Empty State** - Friendly empty list UI when no tasks exist
- [ ] **Add/Edit/Delete** - CRUD operations for default tasks
- [ ] **Drag-and-Drop Reordering** - Visual task reordering within the list
- [ ] **Task Template Integration** - Drag existing templates from category into default tasks
- [ ] **Category Filtering** - Filter task templates by entity type/category
- [ ] **Manual Task Creation** - Ability to add custom tasks not from templates

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
  // Features:
  // 1. Empty list with "Add Task" button
  // 2. Drag-and-drop from task templates filtered by category
  // 3. Manual task creation with name/hours input
  // 4. Reorder existing tasks via drag-and-drop
  // 5. Edit/delete existing default tasks
  // 6. Visual feedback for all operations
}
```

### **Updated Entity Detail Pages**

#### **Component Detail Page**

**File:** `packages/frontend/src/app/app-crm/components/[id]/page.tsx`

- ✅ Remove UniversalWorkflowManager from Workflow tab (COMPLETED)
- [ ] Replace with DefaultTaskManager component
- [ ] Tab name remains "Workflow" but shows only default tasks
- [ ] No project-specific task management here

#### **Deliverable Detail Page**

**File:** `packages/frontend/src/app/app-crm/settings/services/deliverables/[id]/page.tsx`

**Changes:**

- [ ] Remove UniversalWorkflowManager from Workflow tab
- [ ] Add DefaultTaskManager component to show deliverable default tasks
- [ ] Enable task template drag-and-drop from "Films" or "Assets" categories

#### **Coverage Scene Detail Page**

**File:** `packages/frontend/src/app/app-crm/settings/services/coverage-scenes/[id]/page.tsx`

**Changes:**

- [ ] Remove UniversalWorkflowManager from Workflow tab
- [ ] Add DefaultTaskManager component to show coverage scene default tasks
- [ ] Enable task template drag-and-drop from "Coverage" category

---

## 🎯 **DEFAULT TASK MANAGER COMPONENT REQUIREMENTS**

### **Core Features:**

1. **Empty State Management**
   - Friendly empty list UI when no default tasks exist
   - Clear "Add Task" call-to-action
2. **Task Template Integration**
   - Drag-and-drop from task templates filtered by category
   - Category filtering based on entity type:
     - Components: "Production", "Post-Production", "General"
     - Deliverables: "Films", "Assets", "Export"
     - Coverage Scenes: "Coverage", "Footage", "Processing"
3. **Manual Task Creation**
   - Add custom tasks not from templates
   - In-line editing of task names and hours
4. **Visual Task Management**
   - Drag-and-drop reordering within the default task list
   - Visual feedback for drag operations
   - Clean, minimal task cards with edit/delete actions
5. **CRUD Operations**
   - Add new default tasks (from template or manual)
   - Edit existing default task names and hours
   - Delete default tasks with confirmation
   - Reorder tasks via drag-and-drop

### **User Experience Flow:**

1. **Empty State**: User sees "No default tasks" with "Add Task" button
2. **Add Task Options**:
   - "Add from Template" - Opens filtered template selector
   - "Add Custom Task" - Opens inline task creation form
3. **Task Management**: User can reorder, edit, and delete existing default tasks
4. **Project Integration**: When entity is used in project, default tasks are copied to actual project tasks

---

## 🔄 **PROJECT INTEGRATION WORKFLOW**

### **When Entity Used in Project:**

1. **Component Added to Project** → Copy component's default tasks to project tasks
2. **Deliverable Added to Project** → Copy deliverable's default tasks to project tasks
3. **Coverage Scene Added to Project** → Copy coverage scene's default tasks to project tasks

### **Task Copying Logic:**

```typescript
// When adding entity to project
async copyDefaultTasksToProject(projectId: number, entityType: string, entityId: number) {
  const defaultTasks = await getDefaultTasks(entityType, entityId);

  for (const defaultTask of defaultTasks) {
    await createProjectTask({
      projectId,
      taskName: defaultTask.taskName,
      estimatedHours: defaultTask.estimatedHours,
      orderIndex: defaultTask.orderIndex,
      status: 'pending',
      // Copy from default task template
      templateId: defaultTask.taskTemplateId
    });
  }
}
```

---

## 📊 **ENHANCED ANALYTICS**

### **Default Task Analytics**

**New Metrics to Track:**

- **Default Task Count** - Number of default tasks per entity
- **Template Usage** - Most popular task templates
- **Entity Complexity Score** - Based on default task count/hours
- **Estimation Accuracy** - Compare default hours vs actual project hours

- **Task Usage Patterns** - Track which default tasks are most effective

---

## 🔄 **IMPLEMENTATION SEQUENCE**

### **Day 1-2: Backend Foundation**

1. ✅ **Database Schema** - `entity_default_tasks` table created
2. ✅ **Backend Service** - `EntityDefaultTaskService` implemented
3. [ ] **Create Backend Controller** - REST API endpoints for default tasks
4. [ ] **Create Task Template endpoints** - Enhanced template management
5. [ ] **Test all endpoints** - Verify CRUD operations and error handling

### **Day 3-4: Frontend Components**

1. [ ] **Create DefaultTaskManager component** - Reusable task management interface
2. [ ] **Create TaskTemplateSelector component** - Drag-and-drop template selection
3. [ ] **Integrate with entity detail pages** - Components, Deliverables, Coverage Scenes
4. [ ] **Empty state and manual task creation** - Full user experience flow

### **Day 5-6: Integration & Enhancement**

1. [ ] **Project Integration Logic** - Copy default tasks to project tasks
2. [ ] **Visual Polish** - Drag-and-drop animations and feedback
3. [ ] **Error Handling** - Comprehensive error states and recovery
4. [ ] **Testing and refinement** - User experience testing and bug fixes

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements:**

- [ ] **Default Task CRUD** - Can create, edit, delete default tasks for any entity
- [ ] **Task Template Integration** - Can drag task templates into default tasks
- [ ] **Manual Task Creation** - Can create custom tasks not from templates
- [ ] **Task Reordering** - Can drag-and-drop reorder default tasks
- [ ] **Empty State Management** - Clean empty state with clear call-to-action
- [ ] **Project Integration** - Default tasks copy to project tasks when entity is used

### **User Experience Requirements:**

- [ ] **Reusable Component** - Same interface works across Components, Deliverables, Coverage Scenes
- [ ] **Intuitive Interface** - Easy to understand and use
- [ ] **Fast Performance** - Responsive drag-and-drop and API interactions
- [ ] **Error Handling** - Clear error messages and recovery
- [ ] **Consistent Design** - Matches existing UI patterns

### **Technical Requirements:**

- [ ] **API Performance** - Sub-200ms response times
- [ ] **Data Validation** - Proper validation and error handling
- [ ] **Component Reusability** - Single component used across multiple pages
- [ ] **Testing Coverage** - Unit tests for new components
- [ ] **Documentation** - Updated API documentation

---

## 🚀 **NEXT PHASE PREPARATION**

### **Phase 2B: Enhanced Task Template System**

After default task management is complete, we'll enhance:

1. **Advanced Template Categories** - More granular categorization
2. **Template Analytics** - Usage patterns and effectiveness tracking
3. **Smart Recommendations** - AI-suggested tasks based on entity type
4. **Template Sharing** - Import/export templates between systems

### **Phase 3: Full Project Task Management**

With solid default task foundation, we can build:

1. **Task Generation** - Auto-create project tasks from entity defaults
2. **Task Board** - Kanban-style task management
3. **Time Tracking** - Actual hours vs estimates
4. **Team Assignment** - Resource allocation and workload management

This sequence ensures each phase builds on the solid foundation of the previous phase, creating a truly powerful and integrated system.
