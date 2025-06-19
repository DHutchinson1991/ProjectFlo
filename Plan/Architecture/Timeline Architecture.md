# 🕒 Timeline Architecture

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 19 June 2025

---

## 1. Overview 🎯

The Timeline Architecture defines the structure and behavior of ProjectFlo's deliverable timeline builder - a **business configuration tool** for arranging video components within deliverable templates, not a real-time video editor.

### 1.1 Core Purpose

**Business Configuration:** Visual arrangement of components within deliverable templates  
**Timeline Visualization:** Clear representation of component timing and relationships  
**Component Placement:** Drag-and-drop interface for component positioning  
**Pricing Integration:** Real-time cost calculation based on component arrangement  
**Template Management:** Save and reuse timeline configurations across deliverables

### 1.2 Not a Video Editor

❌ **What This Is NOT:**
- Real-time video playback
- Frame-by-frame editing
- Video rendering or export
- Advanced video effects or transitions

✅ **What This IS:**
- Business template configuration
- Component arrangement visualization
- Timeline-based pricing calculation
- Deliverable structure planning

---

## 2. Timeline Interface Specification 🎨

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline Controls                                               │
│ [Zoom: 5s] [Zoom: 30s] [Zoom: 2m] [Reset] [Save Template]     │
├─────────────────────────────────────────────────────────────────┤
│                        Timeline Canvas                          │
│ ┌─────┬─────────────────────────────────────────────────────┐   │
│ │VIDEO│ [Component A] [Component B]     [Component C]      │   │
│ ├─────┼─────────────────────────────────────────────────────┤   │
│ │AUDIO│     [Music Track]           [Voiceover]            │   │
│ ├─────┼─────────────────────────────────────────────────────┤   │
│ │DLOGUE│                    [Vows]                         │   │
│ └─────┴─────────────────────────────────────────────────────┘   │
│ Time: 0:00    0:30    1:00    1:30    2:00    2:30    3:00    │
├─────────────────────────────────────────────────────────────────┤
│ Component Library                                               │
│ [Available Components to Drag]                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Timeline Layers

**Three Fixed Layers:**
- **VIDEO Layer:** Primary video components (ceremony edit, reception highlights, etc.)
- **AUDIO Layer:** Music tracks, audio enhancements, sound design
- **DIALOGUE Layer:** Speeches, vows, interviews, voiceovers

### 2.3 Component Representation

**Visual Design:**
```typescript
interface TimelineComponent {
  id: string;
  name: string;
  type: 'COVERAGE_LINKED' | 'EDIT_ONLY';
  layer: 'VIDEO' | 'AUDIO' | 'DIALOGUE';
  start_time: number;    // In seconds
  duration: number;      // In seconds
  color: string;         // Based on component type
  dependencies: string[]; // IDs of required components
}
```

**Component Colors:**
- **Coverage Components:** Blue (#1976D2)
- **Edit Components:** Green (#388E3C)
- **Music Components:** Purple (#7B1FA2)
- **Dialogue Components:** Orange (#F57C00)

### 2.4 Interaction Patterns

**Drag and Drop:**
```typescript
// Component drag behavior
const onComponentDrag = (component: Component, targetLayer: Layer, targetTime: number) => {
  // Snap to 5-second grid
  const snappedTime = Math.round(targetTime / 5) * 5;
  
  // Validate layer compatibility
  if (!isValidLayer(component.type, targetLayer)) {
    showError("Component cannot be placed on this layer");
    return;
  }
  
  // Check for conflicts
  const conflicts = checkTimelineConflicts(component, targetLayer, snappedTime);
  if (conflicts.length > 0) {
    showWarning("Component overlaps with existing components");
  }
  
  // Update timeline and recalculate pricing
  updateTimeline(component, targetLayer, snappedTime);
  recalculatePricing();
};
```

**Selection and Editing:**
```typescript
// Component selection and properties
const onComponentSelect = (componentId: string) => {
  setSelectedComponent(componentId);
  showComponentProperties(componentId);
  highlightDependencies(componentId);
};
```

---

## 3. Data Architecture 🏗️

### 3.1 Timeline Data Structure

```typescript
interface DeliverableTimeline {
  id: string;
  deliverable_id: string;
  name: string;
  total_duration: number;    // In seconds
  layers: {
    VIDEO: TimelineComponent[];
    AUDIO: TimelineComponent[];
    DIALOGUE: TimelineComponent[];
  };
  pricing_summary: {
    base_cost: number;
    complexity_multiplier: number;
    final_cost: number;
  };
  created_at: Date;
  updated_at: Date;
}
```

### 3.2 Database Schema Extensions

**New Tables Required:**
```sql
-- Timeline configurations for deliverable templates
CREATE TABLE deliverable_timelines (
  id UUID PRIMARY KEY,
  deliverable_id UUID REFERENCES deliverable_library(id),
  name VARCHAR(255) NOT NULL,
  total_duration INTEGER NOT NULL, -- In seconds
  pricing_multiplier DECIMAL(4,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual component placements within timelines
CREATE TABLE timeline_components (
  id UUID PRIMARY KEY,
  timeline_id UUID REFERENCES deliverable_timelines(id),
  component_id UUID REFERENCES component_library(id),
  layer VARCHAR(20) NOT NULL CHECK (layer IN ('VIDEO', 'AUDIO', 'DIALOGUE')),
  start_time INTEGER NOT NULL, -- In seconds
  duration INTEGER NOT NULL,   -- In seconds
  position_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Component dependencies within timeline context
CREATE TABLE timeline_component_dependencies (
  id UUID PRIMARY KEY,
  timeline_id UUID REFERENCES deliverable_timelines(id),
  dependent_component_id UUID REFERENCES timeline_components(id),
  required_component_id UUID REFERENCES timeline_components(id),
  dependency_type VARCHAR(50) NOT NULL -- 'SEQUENCE', 'OVERLAP', 'SYNC'
);
```

### 3.3 API Endpoints

**Timeline Management:**
```typescript
// Get timeline for deliverable
GET /api/deliverables/{id}/timeline
Response: DeliverableTimeline

// Update timeline configuration
PUT /api/deliverables/{id}/timeline
Body: DeliverableTimeline

// Add component to timeline
POST /api/timelines/{id}/components
Body: { component_id, layer, start_time, duration }

// Remove component from timeline
DELETE /api/timelines/{id}/components/{component_id}

// Get pricing for timeline configuration
GET /api/timelines/{id}/pricing
Response: PricingBreakdown
```

---

## 4. Component Placement Logic 📐

### 4.1 Layer Validation Rules

```typescript
const LAYER_RULES = {
  VIDEO: ['COVERAGE_LINKED', 'EDIT_ONLY'], // All component types
  AUDIO: ['MUSIC', 'AUDIO_ENHANCEMENT'],   // Audio-specific only
  DIALOGUE: ['SPEECH', 'VOICEOVER', 'INTERVIEW'] // Dialogue-specific only
};

const validateComponentLayer = (component: Component, layer: Layer): boolean => {
  return LAYER_RULES[layer].includes(component.type);
};
```

### 4.2 Overlap Detection

```typescript
const checkTimelineConflicts = (
  newComponent: TimelineComponent, 
  layer: Layer, 
  startTime: number
): Conflict[] => {
  const existingComponents = timeline.layers[layer];
  const newEndTime = startTime + newComponent.duration;
  
  return existingComponents.filter(existing => {
    const existingEndTime = existing.start_time + existing.duration;
    
    // Check for overlap
    return !(newEndTime <= existing.start_time || startTime >= existingEndTime);
  });
};
```

### 4.3 Dependency Management

```typescript
const validateDependencies = (component: Component, timeline: Timeline): ValidationResult => {
  const missingDependencies = component.dependencies.filter(depId => 
    !timeline.components.some(tc => tc.component_id === depId)
  );
  
  if (missingDependencies.length > 0) {
    return {
      valid: false,
      message: `Missing required components: ${missingDependencies.join(', ')}`,
      severity: 'ERROR'
    };
  }
  
  return { valid: true };
};
```

---

## 5. Pricing Integration 💰

### 5.1 Timeline-Based Pricing Modifiers

```typescript
const calculateTimelinePricing = (timeline: DeliverableTimeline): PricingResult => {
  let totalCost = 0;
  let complexityMultiplier = 1.0;
  
  // Base component costs
  timeline.layers.forEach(layer => {
    layer.components.forEach(component => {
      totalCost += component.base_price;
    });
  });
  
  // Timeline complexity modifiers
  const overlaps = detectOverlaps(timeline);
  if (overlaps.length > 0) {
    complexityMultiplier += (overlaps.length * 0.1); // 10% per overlap
  }
  
  const dependencies = countDependencies(timeline);
  if (dependencies > 5) {
    complexityMultiplier += 0.2; // 20% for complex dependencies
  }
  
  return {
    base_cost: totalCost,
    complexity_multiplier: complexityMultiplier,
    final_cost: totalCost * complexityMultiplier
  };
};
```

### 5.2 Real-Time Pricing Updates

```typescript
// Update pricing when timeline changes
const onTimelineChange = debounce(async (timeline: DeliverableTimeline) => {
  const pricingResult = await fetch('/api/timelines/pricing', {
    method: 'POST',
    body: JSON.stringify(timeline)
  });
  
  updatePricingDisplay(pricingResult);
  notifyPricingChange(pricingResult.final_cost);
}, 300); // 300ms debounce
```

---

## 6. User Experience Flow 🎭

### 6.1 Timeline Building Workflow

**Step 1: Template Selection**
```
Admin selects deliverable template → Opens timeline builder → Sees empty timeline with 3 layers
```

**Step 2: Component Addition**
```
Admin drags components from library → Timeline validates placement → Shows pricing update
```

**Step 3: Component Arrangement**
```
Admin adjusts timing/positioning → System checks dependencies → Updates complexity pricing
```

**Step 4: Template Saving**
```
Admin saves timeline configuration → Template becomes available for quotes → Pricing locked
```

### 6.2 Error Handling and Feedback

```typescript
const TIMELINE_ERRORS = {
  INVALID_LAYER: "Component cannot be placed on this layer",
  MISSING_DEPENDENCY: "Required component missing from timeline",
  OVERLAP_CONFLICT: "Component overlaps with existing component",
  DURATION_INVALID: "Component duration must be at least 5 seconds"
};

const showTimelineError = (error: TimelineError) => {
  // Show user-friendly error message
  // Highlight problematic components
  // Suggest corrective actions
};
```

---

## 7. Technical Implementation 💻

### 7.1 Technology Stack

**Frontend:**
- **React** with TypeScript for component architecture
- **@hello-pangea/dnd** for drag-and-drop functionality
- **Material-UI** for consistent design system
- **Canvas API** for timeline rendering (simple 2D graphics)
- **Zustand** for timeline state management

**Backend:**
- **NestJS** for timeline API endpoints
- **Prisma** for database operations
- **PostgreSQL** for timeline data storage
- **WebSocket** for real-time collaboration (future)

### 7.2 Performance Considerations

**Timeline Rendering:**
- Virtualization for timelines with 50+ components
- Canvas optimization for smooth dragging
- Debounced pricing calculations

**Data Management:**
- Optimistic updates for drag operations
- Background auto-save for timeline changes
- Efficient database queries for component loading

---

## 8. Future Enhancements 🚀

### 8.1 Advanced Features (Phase 2+)

**Timeline Templates:**
- Save commonly used timeline configurations
- Template marketplace for sharing configurations
- Timeline versioning and rollback

**Enhanced Collaboration:**
- Real-time multi-user editing
- Change tracking and conflict resolution
- Comments and annotations on timeline

**Integration Features:**
- Export timeline for client presentation
- Integration with project management tools
- Timeline-based task generation

### 8.2 Mobile Considerations

**Responsive Design:**
- Touch-friendly drag and drop
- Simplified timeline view for mobile
- Component selection optimized for touch

---

## 9. Implementation Priority ⏰

**Phase 1 (Core Timeline):**
- ✅ Basic timeline interface with 3 layers
- ✅ Component drag-and-drop functionality
- ✅ 5-second snapping grid
- ✅ Basic pricing integration

**Phase 1.1 (Enhancement):**
- 🚧 Dependency validation and visualization
- 🚧 Overlap detection and warnings
- 🚧 Timeline template saving
- 🚧 Component property editing

**Phase 2 (Advanced):**
- ⏳ Real-time collaboration
- ⏳ Timeline templates marketplace
- ⏳ Mobile optimization
- ⏳ Advanced dependency management

This timeline architecture provides a solid foundation for the deliverable configuration system while maintaining focus on business needs rather than video editing complexity.
