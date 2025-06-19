# 🔄 Component Restructuring Plan

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

## 1. Overview 🎯

This document outlines the plan to restructure ProjectFlo's component system from single unified components to separate linked components for Video, Music, and Dialogue.

## 2. Current vs New Architecture 🏗️

### 2.1 Current Architecture
```
Single Component: "Ceremony Processional"
├── Contains: Video + Music + Dialogue
├── Tasks: All tasks for entire scene
└── Pricing: Single price for everything
```

### 2.2 New Architecture
```
Component Group: "Ceremony Processional Group"
├── Video Component: "Ceremony Processional Video"
│   ├── Tasks: Camera work, video editing
│   └── Pricing: Based on video tasks
├── Music Component: "Ceremony Processional Music" (DIAGETIC)
│   ├── Tasks: Audio capture, audio editing
│   └── Pricing: Based on audio tasks
└── Dialogue Component: "Ceremony Processional Vows"
    ├── Tasks: Audio capture, transcription
    └── Pricing: Based on dialogue tasks
```

## 3. Database Schema Changes 📊

### 3.1 New Tables Required

```sql
-- Component groups for linking related components
CREATE TABLE component_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  coverage_scene_id INT NULL,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id)
);

-- Link components to groups with roles
CREATE TABLE component_group_members (
  group_id INT NOT NULL,
  component_id INT NOT NULL,
  component_role component_role_enum NOT NULL,
  is_required BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  PRIMARY KEY (group_id, component_id),
  FOREIGN KEY (group_id) REFERENCES component_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES component_library(id) ON DELETE CASCADE
);

-- New enum for component roles
CREATE TYPE component_role_enum AS ENUM ('VIDEO', 'MUSIC', 'DIALOGUE');
```

### 3.2 Schema Updates Required

```sql
-- Add component role to existing component library
ALTER TABLE component_library ADD COLUMN component_role component_role_enum NOT NULL DEFAULT 'VIDEO';

-- Add timeline positioning to deliverable assignments
ALTER TABLE deliverable_assigned_components ADD COLUMN layer_type component_role_enum NOT NULL DEFAULT 'VIDEO';
ALTER TABLE deliverable_assigned_components ADD COLUMN start_timecode_seconds INT DEFAULT 0;
ALTER TABLE deliverable_assigned_components ADD COLUMN layer_order INT DEFAULT 0;

-- Update music type enum for new system
ALTER TYPE music_type_enum ADD VALUE 'DIAGETIC';
ALTER TYPE music_type_enum ADD VALUE 'ROYALTY_FREE'; 
ALTER TYPE music_type_enum ADD VALUE 'LICENSED_CHART';
```

## 4. Migration Strategy 🚚

### 4.1 Data Migration Steps

**Step 1: Create Component Groups for Existing Components**
```sql
-- Create groups for existing coverage-based components
INSERT INTO component_groups (name, description, coverage_scene_id)
SELECT 
  CONCAT(cs.name, ' Group') as name,
  CONCAT('Auto-created group for ', cs.name, ' components') as description,
  cs.id as coverage_scene_id
FROM coverage_scenes cs;
```

**Step 2: Break Down Existing Components**
```typescript
// Migration script to split existing components
async function migrateExistingComponents() {
  const existingComponents = await prisma.componentLibrary.findMany({
    include: { coverage_scenes: true }
  });
  
  for (const component of existingComponents) {
    // Create component group
    const group = await prisma.componentGroups.create({
      data: {
        name: `${component.name} Group`,
        coverage_scene_id: component.coverage_scenes[0]?.coverage_scene_id
      }
    });
    
    // Create video component (primary)
    const videoComponent = await prisma.componentLibrary.create({
      data: {
        name: `${component.name} Video`,
        description: component.description,
        component_role: 'VIDEO',
        estimated_duration: component.estimated_duration,
        complexity_score: component.complexity_score
      }
    });
    
    // Link to group
    await prisma.componentGroupMembers.create({
      data: {
        group_id: group.id,
        component_id: videoComponent.id,
        component_role: 'VIDEO',
        is_required: true
      }
    });
    
    // Create optional music/dialogue components if applicable
    if (hasMusicalElement(component)) {
      await createMusicComponent(component, group.id);
    }
    
    if (hasDialogueElement(component)) {
      await createDialogueComponent(component, group.id);
    }
  }
}
```

### 4.2 Rollback Plan

**Data Backup:**
- Full database backup before migration
- Component library export to JSON
- Deliverable configuration backup

**Rollback Procedure:**
1. Restore database from backup
2. Re-run old component assignment logic
3. Update frontend to use old single-component system
4. Notify team of rollback and issues

## 5. Frontend Changes Required 🖥️

### 5.1 Component Library Interface

**New Component Group View:**
```typescript
interface ComponentGroupDisplay {
  group: ComponentGroup;
  videoComponent?: ComponentLibrary;
  musicComponent?: ComponentLibrary;
  dialogueComponent?: ComponentLibrary;
  totalEstimatedCost: number;
  requiredComponents: ComponentLibrary[];
  optionalComponents: ComponentLibrary[];
}

// Component selection interface
function ComponentGroupSelector({ 
  group, 
  onSelectGroup, 
  onSelectIndividual 
}: ComponentGroupSelectorProps) {
  return (
    <div className="component-group">
      <h3>{group.name}</h3>
      <button onClick={() => onSelectGroup(group)}>
        Add Entire Group
      </button>
      
      <div className="individual-components">
        {group.members.map(member => (
          <ComponentCard 
            key={member.component_id}
            component={member.component}
            role={member.component_role}
            isRequired={member.is_required}
            onSelect={() => onSelectIndividual(member.component)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 5.2 Timeline Interface Updates

**Multi-Layer Component Handling:**
```typescript
interface TimelineComponent {
  assignmentId: string;
  component: ComponentLibrary;
  layerType: ComponentRole;
  startTimecode: number;
  duration: number;
  layerOrder: number;
  groupId?: string; // For visual grouping of related components
}

function TimelineLayer({ 
  layerType, 
  components, 
  onComponentDrop 
}: TimelineLayerProps) {
  const layerComponents = components.filter(c => c.layerType === layerType);
  
  return (
    <div 
      className={`timeline-layer timeline-layer--${layerType.toLowerCase()}`}
      onDrop={(e) => handleComponentDrop(e, layerType)}
    >
      {layerComponents.map(component => (
        <TimelineComponentBlock 
          key={component.assignmentId}
          component={component}
          onDurationChange={handleDurationChange}
          onPositionChange={handlePositionChange}
        />
      ))}
    </div>
  );
}
```

## 6. Implementation Timeline 📅

### Phase 1: Database Migration (Week 1-2)
- [ ] Create new tables and enums
- [ ] Write migration scripts
- [ ] Test migration on development data
- [ ] Backup production database
- [ ] Execute migration

### Phase 2: Backend API Updates (Week 3-4)
- [ ] Update component library API endpoints
- [ ] Create component group management endpoints
- [ ] Update deliverable assignment logic
- [ ] Add timeline positioning endpoints
- [ ] Update task generation for separated components

### Phase 3: Frontend Component Library (Week 5-6)
- [ ] Build component group selection interface
- [ ] Update component library browsing
- [ ] Add individual component selection options
- [ ] Update pricing calculations for grouped components

### Phase 4: Timeline Interface (Week 7-8)
- [ ] Implement multi-layer timeline editor
- [ ] Add drag-and-drop for different component types
- [ ] Build timeline positioning controls
- [ ] Add visual grouping indicators for related components

### Phase 5: Testing & Polish (Week 9-10)
- [ ] End-to-end testing of new workflow
- [ ] Performance testing with complex timelines
- [ ] User acceptance testing with admin users
- [ ] Bug fixes and polish

## 7. Risk Mitigation 🛡️

### 7.1 Technical Risks

**Database Migration Complexity**
- Risk: Data loss or corruption during migration
- Mitigation: Comprehensive backups, staged migration, rollback plan

**Performance Impact**
- Risk: More complex queries with component groups
- Mitigation: Proper indexing, query optimization, performance testing

**Timeline Complexity**
- Risk: UI becomes too complex for users
- Mitigation: Progressive disclosure, user testing, training materials

### 7.2 Business Risks

**User Workflow Disruption**
- Risk: Admins struggle with new component system
- Mitigation: Training sessions, documentation, gradual rollout

**Pricing Model Changes**
- Risk: Existing quotes become invalid
- Mitigation: Legacy pricing support, quote conversion tools

**Development Timeline**
- Risk: Implementation takes longer than expected
- Mitigation: Buffer time, MVP approach, phased delivery

## 8. Success Metrics 📊

**Technical Metrics:**
- Migration completes without data loss
- Timeline interface loads within 2 seconds
- Component selection time reduced by 30%

**User Experience Metrics:**
- Admin user training completion rate > 90%
- User satisfaction score > 4/5 after 2 weeks
- Support ticket volume remains stable

**Business Metrics:**
- Quote creation time reduced by 20%
- Pricing accuracy improved (fewer change orders)
- Timeline visualization improves client satisfaction

This restructuring will provide the foundation for more flexible deliverable configuration while maintaining the system's ease of use.
