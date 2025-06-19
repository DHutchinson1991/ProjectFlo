# 🗄️ Database Schema Updates: Component & Timeline Management

**Document:** Database Schema Updates for Phase 1 Implementation  
**Date:** June 19, 2025  
**Version:** 2.0 (Updated for comprehensive implementation)  

---

## 📋 Required Schema Updates

This document outlines the specific database schema changes required to implement the enhanced component library and timeline management system detailed in Phase 1.

### **1. Component Type Enum Updates** (CRITICAL MIGRATION)

```sql
-- CRITICAL: This will affect existing data!
-- Backup database before running this migration

-- Step 1: Check existing data
SELECT type, COUNT(*) FROM component_library GROUP BY type;

-- Step 2: Update enum values (requires careful migration)
-- Note: PostgreSQL enum updates require recreation
BEGIN;

-- Create new enum type
CREATE TYPE ComponentType_new AS ENUM ('COVERAGE_LINKED', 'EDIT');

-- Add temporary column with new type
ALTER TABLE component_library ADD COLUMN type_new ComponentType_new;

-- Migrate data to new column
UPDATE component_library 
SET type_new = CASE 
  WHEN type = 'COVERAGE_BASED' THEN 'COVERAGE_LINKED'::ComponentType_new
  WHEN type = 'PRODUCTION' THEN 'EDIT'::ComponentType_new
  ELSE 'EDIT'::ComponentType_new -- Default fallback
END;

-- Drop old column and rename new column
ALTER TABLE component_library DROP COLUMN type;
ALTER TABLE component_library RENAME COLUMN type_new TO type;

-- Drop old enum type and rename new one
DROP TYPE ComponentType;
ALTER TYPE ComponentType_new RENAME TO ComponentType;

-- Update not null constraint
ALTER TABLE component_library ALTER COLUMN type SET NOT NULL;

COMMIT;

-- Verify the migration
SELECT type, COUNT(*) FROM component_library GROUP BY type;
```

### **2. Deliverable Categories Enhancement**

```sql
-- Add category field to deliverables table for Films vs Assets classification
ALTER TABLE deliverables ADD COLUMN category VARCHAR(50) DEFAULT 'Films';

-- Update existing records to set appropriate categories
UPDATE deliverables SET category = 'Films' WHERE type = 'STANDARD';
UPDATE deliverables SET category = 'Assets' WHERE type = 'RAW_FOOTAGE';

-- Add constraint to ensure valid category values
ALTER TABLE deliverables ADD CONSTRAINT check_deliverable_category 
CHECK (category IN ('Films', 'Assets'));
```

### **3. Timeline Layer Management**

```sql
-- Create timeline layers table for Video, Audio, Dialogue organization
CREATE TABLE timeline_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    order_index INTEGER NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default layers
INSERT INTO timeline_layers (name, order_index, color_hex, description) VALUES
('Video', 1, '#3B82F6', 'Primary video content layer'),
('Audio', 2, '#10B981', 'Audio content and music layer'),
('Dialogue', 3, '#F59E0B', 'Dialogue and voice-over layer');

-- Create index for performance
CREATE INDEX idx_timeline_layers_order ON timeline_layers(order_index);
```

### **4. Timeline Component Positioning**

```sql
-- Create timeline components table for precise component positioning
CREATE TABLE timeline_components (
    id SERIAL PRIMARY KEY,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    layer_id INTEGER NOT NULL REFERENCES timeline_layers(id) ON DELETE RESTRICT,
    start_time_seconds INTEGER NOT NULL, -- Must be multiple of 5 for 5-second snapping
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    order_index INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER REFERENCES contributors(id),
    
    -- Ensure no overlaps on same layer within same deliverable
    UNIQUE(deliverable_id, layer_id, start_time_seconds),
    
    -- Ensure 5-second snapping
    CHECK (start_time_seconds % 5 = 0)
);

-- Create indexes for performance
CREATE INDEX idx_timeline_components_deliverable ON timeline_components(deliverable_id);
CREATE INDEX idx_timeline_components_layer ON timeline_components(layer_id);
CREATE INDEX idx_timeline_components_time ON timeline_components(start_time_seconds, duration_seconds);
CREATE INDEX idx_timeline_components_component ON timeline_components(component_id);
```

### **5. Component Dependencies System**

```sql
-- Create component dependencies table for component relationships
CREATE TABLE component_dependencies (
    id SERIAL PRIMARY KEY,
    parent_component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    dependent_component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'REQUIRED',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER REFERENCES contributors(id),
    
    -- Prevent self-references and duplicate dependencies
    CHECK (parent_component_id != dependent_component_id),
    UNIQUE(parent_component_id, dependent_component_id)
);

-- Add constraint for valid dependency types
ALTER TABLE component_dependencies ADD CONSTRAINT check_dependency_type 
CHECK (dependency_type IN ('REQUIRED', 'SUGGESTED', 'OPTIONAL'));

-- Create indexes for performance
CREATE INDEX idx_component_deps_parent ON component_dependencies(parent_component_id);
CREATE INDEX idx_component_deps_dependent ON component_dependencies(dependent_component_id);
```

### **6. Component Analytics Support**

```sql
-- Add analytics fields to component_library table
ALTER TABLE component_library ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE component_library ADD COLUMN last_used_at TIMESTAMP;
ALTER TABLE component_library ADD COLUMN average_actual_duration DECIMAL(8,2);
ALTER TABLE component_library ADD COLUMN performance_score DECIMAL(3,2) DEFAULT 5.0;

-- Create component usage tracking table
CREATE TABLE component_usage_analytics (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    used_in_deliverable_id INTEGER REFERENCES deliverables(id) ON DELETE SET NULL,
    used_in_build_id INTEGER REFERENCES builds(id) ON DELETE SET NULL,
    usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_duration_seconds INTEGER,
    estimated_duration_seconds INTEGER,
    variance_percentage DECIMAL(5,2),
    user_id INTEGER REFERENCES contributors(id)
);

-- Create indexes for analytics performance
CREATE INDEX idx_component_usage_component ON component_usage_analytics(component_id);
CREATE INDEX idx_component_usage_date ON component_usage_analytics(usage_date);
CREATE INDEX idx_component_usage_deliverable ON component_usage_analytics(used_in_deliverable_id);
```

### **7. Timeline Collaboration Support**

```sql
-- Create timeline editing sessions table for real-time collaboration
CREATE TABLE timeline_editing_sessions (
    id SERIAL PRIMARY KEY,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(deliverable_id, user_id, session_start)
);

-- Create timeline change log for audit trail
CREATE TABLE timeline_change_log (
    id SERIAL PRIMARY KEY,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES component_library(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL, -- 'ADD', 'REMOVE', 'MOVE', 'RESIZE', 'UPDATE'
    old_values JSONB,
    new_values JSONB,
    changed_by_id INTEGER NOT NULL REFERENCES contributors(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id INTEGER REFERENCES timeline_editing_sessions(id)
);

-- Create indexes for change tracking
CREATE INDEX idx_timeline_changes_deliverable ON timeline_change_log(deliverable_id);
CREATE INDEX idx_timeline_changes_date ON timeline_change_log(changed_at);
CREATE INDEX idx_timeline_changes_user ON timeline_change_log(changed_by_id);
```

### **8. Performance Optimization Indexes**

```sql
-- Add performance indexes for existing component operations
CREATE INDEX IF NOT EXISTS idx_component_library_type_active ON component_library(type) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_component_library_name_search ON component_library USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_component_library_updated ON component_library(updated_at);

-- Add performance indexes for deliverable operations
CREATE INDEX IF NOT EXISTS idx_deliverables_category ON deliverables(category);
CREATE INDEX IF NOT EXISTS idx_deliverables_type_active ON deliverables(type) WHERE is_active = true;

-- Add computed columns for performance
ALTER TABLE component_library ADD COLUMN computed_task_count INTEGER;
ALTER TABLE component_library ADD COLUMN computed_total_hours DECIMAL(8,2);

-- Create trigger to update computed columns
CREATE OR REPLACE FUNCTION update_component_computed_fields()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE component_library 
    SET 
        computed_task_count = (
            SELECT COUNT(*) 
            FROM video_component_tasks 
            WHERE component_id = NEW.component_id
        ),
        computed_total_hours = (
            SELECT COALESCE(SUM(hours_required), 0) 
            FROM video_component_tasks 
            WHERE component_id = NEW.component_id
        )
    WHERE id = NEW.component_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_component_computed_fields
    AFTER INSERT OR UPDATE OR DELETE ON video_component_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_component_computed_fields();
```

### **9. Enhanced Pricing Modifier Types** (UPDATE EXISTING ENUM)

```sql
-- Add new pricing modifier types for timeline and component features
-- Note: PostgreSQL allows adding enum values without recreation
ALTER TYPE PricingModifierType ADD VALUE 'TIMELINE_COMPLEXITY';
ALTER TYPE PricingModifierType ADD VALUE 'COVERAGE_COMPLEXITY';
ALTER TYPE PricingModifierType ADD VALUE 'COMPONENT_DEPENDENCY';
ALTER TYPE PricingModifierType ADD VALUE 'DELIVERABLE_OVERRIDE';

-- Verify updated enum
SELECT unnest(enum_range(NULL::PricingModifierType));
```

### **10. Complete Migration Script** (PRODUCTION READY)

```sql
-- COMPLETE MIGRATION SCRIPT FOR PHASE 1 IMPLEMENTATION
-- Run this script to update existing ProjectFlo database for new component/timeline system

-- STEP 0: BACKUP DATABASE
-- pg_dump projectflo_db > projectflo_backup_$(date +%Y%m%d_%H%M%S).sql

BEGIN;

-- STEP 1: Component Type Enum Migration (CRITICAL)
CREATE TYPE ComponentType_new AS ENUM ('COVERAGE_LINKED', 'EDIT');
ALTER TABLE component_library ADD COLUMN type_new ComponentType_new;
UPDATE component_library 
SET type_new = CASE 
  WHEN type = 'COVERAGE_BASED' THEN 'COVERAGE_LINKED'::ComponentType_new
  WHEN type = 'PRODUCTION' THEN 'EDIT'::ComponentType_new
  ELSE 'EDIT'::ComponentType_new
END;
ALTER TABLE component_library DROP COLUMN type;
ALTER TABLE component_library RENAME COLUMN type_new TO type;
DROP TYPE ComponentType;
ALTER TYPE ComponentType_new RENAME TO ComponentType;
ALTER TABLE component_library ALTER COLUMN type SET NOT NULL;

-- STEP 2: Add Timeline System Tables
CREATE TABLE timeline_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    order_index INTEGER NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO timeline_layers (name, order_index, color_hex, description) VALUES
('Video', 1, '#3B82F6', 'Primary video content layer'),
('Audio', 2, '#10B981', 'Audio content and music layer'),
('Dialogue', 3, '#F59E0B', 'Dialogue and voice-over layer');

CREATE TABLE timeline_components (
    id SERIAL PRIMARY KEY,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    layer_id INTEGER NOT NULL REFERENCES timeline_layers(id) ON DELETE RESTRICT,
    start_time_seconds INTEGER NOT NULL CHECK (start_time_seconds % 5 = 0),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    order_index INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER REFERENCES contributors(id),
    UNIQUE(deliverable_id, layer_id, start_time_seconds)
);

-- STEP 3: Add Component Dependencies
CREATE TABLE component_dependencies (
    id SERIAL PRIMARY KEY,
    parent_component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    dependent_component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'REQUIRED' CHECK (dependency_type IN ('REQUIRED', 'SUGGESTED', 'OPTIONAL')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER REFERENCES contributors(id),
    CHECK (parent_component_id != dependent_component_id),
    UNIQUE(parent_component_id, dependent_component_id)
);

-- STEP 4: Add Analytics Tables
ALTER TABLE component_library ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE component_library ADD COLUMN last_used_at TIMESTAMP;
ALTER TABLE component_library ADD COLUMN average_actual_duration DECIMAL(8,2);
ALTER TABLE component_library ADD COLUMN performance_score DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE component_library ADD COLUMN computed_task_count INTEGER;
ALTER TABLE component_library ADD COLUMN computed_total_hours DECIMAL(8,2);

CREATE TABLE component_usage_analytics (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES component_library(id) ON DELETE CASCADE,
    used_in_deliverable_id INTEGER REFERENCES deliverables(id) ON DELETE SET NULL,
    used_in_build_id INTEGER REFERENCES builds(id) ON DELETE SET NULL,
    usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_duration_seconds INTEGER,
    estimated_duration_seconds INTEGER,
    variance_percentage DECIMAL(5,2),
    user_id INTEGER REFERENCES contributors(id)
);

-- STEP 5: Add Collaboration Tables
CREATE TABLE timeline_editing_sessions (
    id SERIAL PRIMARY KEY,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(deliverable_id, user_id, session_start)
);

CREATE TABLE timeline_change_log (
    id SERIAL PRIMARY KEY,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES component_library(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by_id INTEGER NOT NULL REFERENCES contributors(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id INTEGER REFERENCES timeline_editing_sessions(id)
);

-- STEP 6: Update Pricing Modifier Types
ALTER TYPE PricingModifierType ADD VALUE 'TIMELINE_COMPLEXITY';
ALTER TYPE PricingModifierType ADD VALUE 'COVERAGE_COMPLEXITY';
ALTER TYPE PricingModifierType ADD VALUE 'COMPONENT_DEPENDENCY';
ALTER TYPE PricingModifierType ADD VALUE 'DELIVERABLE_OVERRIDE';

-- STEP 7: Add Performance Indexes
CREATE INDEX idx_timeline_layers_order ON timeline_layers(order_index);
CREATE INDEX idx_timeline_components_deliverable ON timeline_components(deliverable_id);
CREATE INDEX idx_timeline_components_layer ON timeline_components(layer_id);
CREATE INDEX idx_timeline_components_time ON timeline_components(start_time_seconds, duration_seconds);
CREATE INDEX idx_timeline_components_component ON timeline_components(component_id);
CREATE INDEX idx_component_deps_parent ON component_dependencies(parent_component_id);
CREATE INDEX idx_component_deps_dependent ON component_dependencies(dependent_component_id);
CREATE INDEX idx_component_usage_component ON component_usage_analytics(component_id);
CREATE INDEX idx_component_usage_date ON component_usage_analytics(usage_date);
CREATE INDEX idx_component_usage_deliverable ON component_usage_analytics(used_in_deliverable_id);
CREATE INDEX idx_timeline_changes_deliverable ON timeline_change_log(deliverable_id);
CREATE INDEX idx_timeline_changes_date ON timeline_change_log(changed_at);
CREATE INDEX idx_timeline_changes_user ON timeline_change_log(changed_by_id);

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_component_library_type_active ON component_library(type) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_component_library_name_search ON component_library USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_component_library_updated ON component_library(updated_at);
CREATE INDEX IF NOT EXISTS idx_deliverables_type_active ON deliverables(type) WHERE is_active = true;

-- STEP 8: Initialize Computed Fields
UPDATE component_library 
SET 
    computed_task_count = (
        SELECT COUNT(*) 
        FROM video_component_tasks 
        WHERE component_id = component_library.id
    ),
    computed_total_hours = (
        SELECT COALESCE(SUM(hours_required), 0) 
        FROM video_component_tasks 
        WHERE component_id = component_library.id
    ),
    usage_count = (
        SELECT COUNT(*) 
        FROM deliverable_assigned_components 
        WHERE component_id = component_library.id
    );

-- STEP 9: Create Computed Field Triggers
CREATE OR REPLACE FUNCTION update_component_computed_fields()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE component_library 
    SET 
        computed_task_count = (
            SELECT COUNT(*) 
            FROM video_component_tasks 
            WHERE component_id = COALESCE(NEW.component_id, OLD.component_id)
        ),
        computed_total_hours = (
            SELECT COALESCE(SUM(hours_required), 0) 
            FROM video_component_tasks 
            WHERE component_id = COALESCE(NEW.component_id, OLD.component_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.component_id, OLD.component_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_component_computed_fields
    AFTER INSERT OR UPDATE OR DELETE ON video_component_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_component_computed_fields();

COMMIT;

-- STEP 10: Verification Queries
SELECT 'Component Types' as table_name, type, COUNT(*) as count FROM component_library GROUP BY type
UNION ALL
SELECT 'Timeline Layers', name, id FROM timeline_layers
UNION ALL  
SELECT 'Pricing Modifiers', unnest(enum_range(NULL::PricingModifierType)), 0;

-- Final verification
SELECT 
    schemaname, 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('component_library', 'timeline_layers', 'timeline_components', 'component_dependencies')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔧 Implementation Notes

### **Database Transaction Requirements:**
- All timeline operations should be wrapped in transactions
- Component dependency changes require validation of existing timelines
- Real-time collaboration requires optimistic locking

### **Performance Considerations:**
- Timeline queries should use covering indexes
- Component search requires full-text search indexes
- Analytics queries should use time-based partitioning for large datasets

### **Security Requirements:**
- Timeline editing requires appropriate user permissions
- Component dependencies should validate user access to both components
- Change logs should include user audit information

### **Backup Strategy:**
- Timeline configurations should be backed up before major changes
- Component library changes should maintain version history
- Analytics data should be archived monthly for performance

---

## ✅ Validation Scripts

```sql
-- Verify component type updates
SELECT type, COUNT(*) FROM component_library GROUP BY type;

-- Verify timeline layer setup
SELECT * FROM timeline_layers ORDER BY order_index;

-- Test timeline component constraints
-- This should fail with constraint violation
-- INSERT INTO timeline_components (deliverable_id, component_id, layer_id, start_time_seconds, duration_seconds) 
-- VALUES (1, 1, 1, 7, 10); -- Should fail: start_time not multiple of 5

-- Verify computed fields are working
SELECT id, name, computed_task_count, computed_total_hours FROM component_library LIMIT 5;
```

This schema update provides the foundation for the enhanced component library and timeline management system outlined in Phase 1.
