# 💰 Pricing Engine

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

---

## 1. Overview 🎯

ProjectFlo's pricing engine calculates project costs based on task-level effort estimates, automatically applies business rule modifiers, and provides real-time pricing feedback during quote configuration. The engine integrates deeply with the component management system and deliverable timeline builder to provide accurate, per-component pricing for complex video production workflows.

### 1.1 Core Pricing Philosophy

**Bottom-Up Pricing:** Costs calculated from individual task requirements  
**Component-Based Pricing:** Each video component priced independently with task aggregation  
**Modifier-Based Adjustments:** Business rules automatically adjust base pricing  
**Real-Time Calculation:** Prices update instantly as configurations change in the component manager and timeline builder  
**Transparent Breakdown:** Full cost visibility for admin and client review with per-component insights

---

## 2. Pricing Architecture 🏗️

### 2.1 Three-Layer Pricing Model

```
📋 Task Level (Foundation)
   ↓ Individual work items with hour estimates
🧮 Component Level (Aggregation)  
   ↓ Sum of all tasks for each component
🎯 Project Level (Final Pricing)
   ↓ All components + modifiers + billable items
```

### 2.2 Data Flow

```
Component Selection → Task Recipe Lookup → Base Hour Calculation → Timeline Position Modifiers → Coverage Scene Modifiers → Dependency Complexity → Final Component Pricing
```

**Integration Points:**
- **Component Manager:** Real-time pricing updates during component editing and configuration
- **Timeline Builder:** Position-based pricing modifiers for component placement and duration
- **Coverage Scene Linking:** Coverage complexity modifiers for coverage-linked components
- **Deliverable Templates:** Per-deliverable component overrides and pricing aggregation

---

## 3. Implementation Details 💻

### 3.1 Core Service Structure

**File:** `packages/backend/src/pricing/pricing.service.ts`

**Key Configuration:**
```typescript
export class PricingService {
  private readonly DEFAULT_HOURLY_RATE = 75.00; // $75/hour base rate
  
  constructor(private prisma: PrismaService) {}
}
```

### 3.2 Main Pricing Method

**Input Parameters:**
```typescript
interface PricingCalculationParams {
  component_ids: number[];          // Components to price
  wedding_date?: Date;              // For seasonal modifiers
  delivery_deadline?: Date;         // For rush job detection
  component_count?: number;         // For volume discounts
  timeline_position?: {             // For timeline-based pricing
    layer: 'VIDEO' | 'AUDIO' | 'DIALOGUE';
    start_time: number;
    duration: number;
    overlap_count: number;
  }[];
  coverage_scenes?: number[];       // For coverage complexity modifiers
  deliverable_context?: {           // For deliverable-specific overrides
    deliverable_id: number;
    complexity_multiplier: number;
  };
}
```

**Return Structure:**
```typescript
interface ComponentPricingResult {
  component_id: number;
  component_name: string;
  component_type: 'COVERAGE_LINKED' | 'EDIT_ONLY';
  total_hours: number;              // Sum of all task hours
  base_price: number;               // Hours × base rate
  final_price: number;              // Base price + all modifiers
  timeline_position?: {             // Timeline placement info
    layer: string;
    start_time: number;
    duration: number;
  };
  coverage_scene_id?: number;       // Linked coverage scene
  applied_modifiers: {
    name: string;
    multiplier: number;
    type: PricingModifierType;
    source: 'TIMELINE' | 'COVERAGE' | 'SEASONAL' | 'VOLUME';
  }[];
  dependency_impact: {              // Component dependency effects
    depends_on: number[];
    complexity_increase: number;
  };
}
```

### 3.3 Pricing Calculation Algorithm

**Step 1: Component Task Aggregation**
```typescript
// Get components with their task recipes
const components = await this.prisma.componentLibrary.findMany({
  where: { id: { in: component_ids } },
  include: {
    component_tasks: {
      orderBy: { order_index: 'asc' }
    }
  }
});

// Calculate total hours per component
const totalHours = component.component_tasks.reduce(
  (sum, task) => sum + Number(task.hours_required),
  0
);
```

**Step 2: Base Price Calculation**
```typescript
const basePrice = totalHours * this.DEFAULT_HOURLY_RATE;
```

**Step 3: Modifier Application**
```typescript
// Get applicable modifiers based on conditions
const applicableModifiers = await this.getApplicableModifiers(
  wedding_date,
  delivery_deadline,
  component_count
);

// Apply modifiers sequentially
let finalPrice = basePrice;
for (const modifier of applicableModifiers) {
  finalPrice *= Number(modifier.multiplier);
}
```

---

## 4. Pricing Modifiers System 🎛️

### 4.1 Modifier Architecture

**Schema:**
```sql
PricingModifier {
  id: PRIMARY KEY
  name: STRING                    -- Human-readable name
  type: PricingModifierType       -- Category of modifier
  multiplier: DECIMAL(4,2)        -- Price adjustment factor
  is_active: BOOLEAN              -- Enable/disable toggle
  conditions: JSON                -- Flexible rule conditions
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Modifier Types:**
```typescript
enum PricingModifierType {
  PEAK_SEASON        // Seasonal price adjustments
  RUSH_JOB           // Short-notice premiums
  DAY_OF_WEEK        // Weekend/weekday pricing
  LOCATION           // Geographic adjustments
  VOLUME_DISCOUNT    // Bulk pricing discounts
  TIMELINE_COMPLEXITY // Timeline position and overlap complexity
  COVERAGE_COMPLEXITY // Coverage scene complexity
  COMPONENT_DEPENDENCY // Dependency chain complexity
  DELIVERABLE_OVERRIDE // Per-deliverable pricing overrides
}
```

### 4.2 Modifier Logic Implementation

**Peak Season Modifier:**
```typescript
case 'PEAK_SEASON':
  if (!weddingDate) return false;
  const month = weddingDate.getMonth() + 1; // 1-12
  return conditions.months?.includes(month);
```

**Example Conditions:**
```json
{
  "months": [5, 6, 7, 8, 9, 10]  // May through October
}
```

**Rush Job Modifier:**
```typescript
case 'RUSH_JOB':
  if (!weddingDate || !deliveryDeadline) return false;
  const daysNotice = Math.ceil(
    (weddingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysNotice < (conditions.days_notice?.lt || Infinity);
```

**Volume Discount Modifier:**
```typescript
case 'VOLUME_DISCOUNT':
  if (!componentCount) return false;
  return componentCount >= (conditions.component_count?.gte || Infinity);
```

**Timeline Complexity Modifier:**
```typescript
case 'TIMELINE_COMPLEXITY':
  if (!timelinePosition) return false;
  const overlapComplexity = timelinePosition.overlap_count > 0;
  const longDuration = timelinePosition.duration > (conditions.duration_threshold || 300); // 5 minutes
  return overlapComplexity || longDuration;
```

**Coverage Complexity Modifier:**
```typescript
case 'COVERAGE_COMPLEXITY':
  if (!coverageScenes) return false;
  const sceneCount = coverageScenes.length;
  const multiSceneComplexity = sceneCount > (conditions.scene_count?.gt || 1);
  return multiSceneComplexity;
```

**Component Dependency Modifier:**
```typescript
case 'COMPONENT_DEPENDENCY':
  if (!componentDependencies) return false;
  const dependencyCount = componentDependencies.length;
  return dependencyCount > (conditions.dependency_threshold || 0);
```

---

## 5. Task-Based Pricing Foundation 📋

### 5.1 Component Task Recipes

**Schema:**
```sql
ComponentTaskRecipe {
  id: PRIMARY KEY
  component_id → ComponentLibrary.id
  task_template_name: STRING
  hours_required: DECIMAL(4,2)
  order_index: INT
}
```

**Purpose:** Defines the exact work required for each component, enabling accurate bottom-up pricing.

### 5.2 Pricing Calculation Examples

**Example Component: "Ceremony Edit"**
```typescript
// Task recipes for ceremony edit component
const taskRecipes = [
  { task_template_name: "Footage Review", hours_required: 2.0 },
  { task_template_name: "Multi-Camera Sync", hours_required: 1.5 },
  { task_template_name: "Ceremony Edit", hours_required: 8.0 },
  { task_template_name: "Color Correction", hours_required: 3.0 },
  { task_template_name: "Audio Enhancement", hours_required: 2.0 },
  { task_template_name: "Final Review", hours_required: 1.0 }
];

// Total hours: 17.5
// Base price: 17.5 × $75 = $1,312.50
```

**With Modifiers Applied:**
```typescript
// Peak season (June wedding): 1.2x multiplier
// Weekend (Saturday): 1.1x multiplier
// Final price: $1,312.50 × 1.2 × 1.1 = $1,732.50
```

---

## 6. Build & Quote Integration 💼

### 6.1 Build-Level Pricing

**Schema Integration:**
```sql
builds {
  approved_price: DECIMAL(10,2)   -- Locked price when approved
  live_price: DECIMAL(10,2)       -- Current configuration price
  total_paid: DECIMAL(10,2)       -- Payment tracking
}

build_components {
  calculated_price: DECIMAL(10,2) -- Component-level pricing
}
```

### 6.2 Pricing Lock Mechanism

**Configuration Lock:**
```typescript
// When build is approved
await prisma.builds.update({
  where: { id: buildId },
  data: {
    status: 'Booked',
    approved_price: currentLivePrice,
    configuration_locked_at: new Date()
  }
});
```

**Change Order Pricing:**
```typescript
// When client requests changes
const priceDelta = newLivePrice - currentApprovedPrice;

await prisma.build_change_orders.create({
  data: {
    build_id: buildId,
    price_delta: priceDelta,
    new_total_approved_price: newLivePrice,
    status: 'Pending_Approval'
  }
});
```

---

## 7. Preview & Analytics 📊

### 7.1 Preview Functionality

**Method:** `previewPricing()`

**Returns:**
```typescript
interface PricingPreview {
  total_components: number;
  total_base_price: number;
  total_final_price: number;
  total_hours: number;
  modifiers_applied: {
    name: string;
    multiplier: number;
    type: PricingModifierType;
  }[];
  component_breakdown: Record<number, ComponentPricingResult>;
}
```

### 7.2 Frontend Integration

**Component Manager Real-Time Pricing:**
```typescript
// When admin edits component properties in full-page component manager
const componentPricingUpdate = await fetch('/api/pricing/component-preview', {
  method: 'POST',
  body: JSON.stringify({
    component_id: editedComponentId,
    task_hours: updatedTaskHours,
    dependencies: componentDependencies,
    coverage_scene_id: linkedCoverageScene
  })
});

// Update component pricing display in real-time
updateComponentPricingInTable(componentPricingUpdate);
```

**Timeline Builder Integration:**
```typescript
// When dragging components in deliverable timeline builder
const timelinePricingUpdate = await fetch('/api/pricing/timeline-preview', {
  method: 'POST',
  body: JSON.stringify({
    component_ids: selectedComponents,
    timeline_positions: droppedPositions,
    deliverable_id: currentDeliverableId,
    layer_overlaps: calculateOverlaps(droppedPositions)
  })
});

// Update deliverable pricing with timeline complexity
updateDeliverablePricingPreview(timelinePricingUpdate);
```

**Quote Configuration Pricing:**
```typescript
// When client changes component selection in quote configurator
const pricingUpdate = await fetch('/api/pricing/preview', {
  method: 'POST',
  body: JSON.stringify({
    component_ids: selectedComponents,
    wedding_date: formData.weddingDate,
    delivery_deadline: formData.deliveryDate,
    component_count: selectedComponents.length,
    deliverable_overrides: appliedOverrides
  })
});

// Update UI with new pricing breakdown
updatePricingDisplay(pricingUpdate.total_final_price);
updateComponentBreakdown(pricingUpdate.component_breakdown);
```

---

## 8. Advanced Pricing Features 🚀

### 8.1 Tiered Pricing

**Volume Discount Tiers:**
```json
{
  "tiers": [
    { "min_components": 1, "max_components": 2, "multiplier": 1.0 },
    { "min_components": 3, "max_components": 5, "multiplier": 0.95 },
    { "min_components": 6, "max_components": 10, "multiplier": 0.90 },
    { "min_components": 11, "max_components": null, "multiplier": 0.85 }
  ]
}
```

### 8.2 Seasonal Pricing Curves

**Monthly Pricing Adjustments:**
```json
{
  "pricing_curve": {
    "1": 0.85,  // January - 15% discount
    "2": 0.85,  // February - 15% discount
    "3": 0.90,  // March - 10% discount
    "4": 0.95,  // April - 5% discount
    "5": 1.10,  // May - 10% premium
    "6": 1.20,  // June - 20% premium
    "7": 1.20,  // July - 20% premium
    "8": 1.20,  // August - 20% premium
    "9": 1.15,  // September - 15% premium
    "10": 1.10, // October - 10% premium
    "11": 0.95, // November - 5% discount
    "12": 0.90  // December - 10% discount
  }
}
```

---

## 9. Performance & Optimization ⚡

### 9.1 Database Optimization

**Indexes for Fast Pricing Queries:**
```sql
CREATE INDEX idx_component_tasks_component_id ON ComponentTaskRecipe(component_id);
CREATE INDEX idx_pricing_modifiers_active ON PricingModifier(is_active);
CREATE INDEX idx_pricing_modifiers_type ON PricingModifier(type);
```

### 9.2 Caching Strategy

```typescript
// Cache frequently accessed pricing data
const PRICING_CACHE_TTL = 300; // 5 minutes

const getCachedPricing = async (cacheKey: string) => {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  return null;
};
```

---

## 10. Error Handling & Validation 🛡️

### 10.1 Input Validation

```typescript
const validatePricingParams = (params: PricingCalculationParams) => {
  if (!params.component_ids || params.component_ids.length === 0) {
    throw new BadRequestException('At least one component ID is required');
  }
  
  if (params.wedding_date && isNaN(params.wedding_date.getTime())) {
    throw new BadRequestException('Invalid wedding date format');
  }
};
```

### 10.2 Fallback Pricing

```typescript
const calculateWithFallback = async (params: PricingCalculationParams) => {
  try {
    return await this.calculateComponentPricing(params);
  } catch (error) {
    console.error('Pricing calculation failed:', error);
    return this.calculateBasicPricing(params);
  }
};
```

---

## 11. Implementation Status ✅

**✅ Completed:**
- Task-based pricing calculation with component aggregation
- Modifier system with flexible conditions and business rules
- Real-time pricing preview across all interfaces
- Build integration with price locking and change orders
- Change order pricing workflow with delta calculations

**🚧 In Progress:**
- **Component manager pricing integration** for real-time component cost updates
- **Timeline builder pricing modifiers** for position-based complexity pricing
- **Coverage scene complexity pricing** for coverage-linked components
- **Component dependency pricing** for dependency chain complexity
- Advanced modifier conditions and business rule engine
- Performance optimization for real-time pricing calculations

**⏳ Planned:**
- AI-powered pricing suggestions based on component complexity
- Dynamic market-based adjustments and competitive pricing
- Advanced reporting and analytics with profitability insights
- Mobile pricing tools for field estimates
- **Integration with deliverable template pricing** for comprehensive cost modeling

This pricing engine provides accurate, flexible, and transparent pricing capabilities while maintaining the sophistication needed for a professional video production business with complex component-based deliverables and timeline management.
