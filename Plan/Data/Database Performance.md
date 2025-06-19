# 🔍 Database Performance & Query Patterns

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 18 June 2025

## 1. Purpose 🎯

This document outlines the expected database query patterns and performance considerations for ProjectFlo. It helps inform indexing strategies and identifies potential bottlenecks.

## 2. Critical Query Patterns 🔍

### 2.1 Client Portal Queries

**Client Project Dashboard**
```sql
-- Most frequent query: Client viewing their project
SELECT b.*, d.name as deliverable_name, dac.order_index,
       cl.name as component_name, cl.estimated_duration
FROM builds b
JOIN deliverables d ON d.build_id = b.id
JOIN deliverable_assigned_components dac ON dac.deliverable_id = d.id  
JOIN component_library cl ON cl.id = dac.component_id
WHERE b.client_id = ? AND b.status = 'Booked'
ORDER BY d.id, dac.order_index;
```

**Real-time Pricing Calculation**
```sql
-- Triggered on every component selection change
SELECT cl.base_task_hours, dac.calculated_base_price,
       es.pricing_multiplier
FROM component_library cl
JOIN deliverable_assigned_components dac ON dac.component_id = cl.id
LEFT JOIN editing_styles es ON es.name = dac.editing_style
WHERE dac.deliverable_id IN (?);
```

### 2.2 Admin Dashboard Queries

**Project Health Overview**
```sql
-- Dashboard showing all active projects
SELECT b.id, b.build_title, c.name as client_name,
       COUNT(t.id) as total_tasks,
       COUNT(CASE WHEN t.status = 'Complete' THEN 1 END) as completed_tasks,
       SUM(t.actual_duration_hours) as actual_hours,
       SUM(t.planned_duration_hours) as planned_hours
FROM builds b
JOIN clients c ON c.id = b.client_id
LEFT JOIN tasks t ON t.build_id = b.id
WHERE b.status IN ('Booked', 'In Progress')
GROUP BY b.id, b.build_title, c.name;
```

### 2.3 Contributor Dashboard Queries

**Personal Task List**
```sql
-- Most frequent query for team members
SELECT t.*, b.build_title, cl.name as component_name,
       tt.name as task_template_name
FROM tasks t
JOIN builds b ON b.id = t.build_id
LEFT JOIN component_library cl ON cl.id = t.component_id
LEFT JOIN task_templates tt ON tt.id = t.task_template_id
WHERE t.contributor_id = ? AND t.status != 'Complete'
ORDER BY t.due_date ASC NULLS LAST, t.priority DESC;
```

## 3. Recommended Indexes 📊

### 3.1 Critical Performance Indexes

```sql
-- Client portal performance
CREATE INDEX idx_builds_client_status ON builds(client_id, status);
CREATE INDEX idx_deliverable_assigned_components_deliverable ON deliverable_assigned_components(deliverable_id);

-- Task management performance  
CREATE INDEX idx_tasks_contributor_status ON tasks(contributor_id, status);
CREATE INDEX idx_tasks_build_component ON tasks(build_id, component_id);

-- Real-time pricing
CREATE INDEX idx_deliverable_assigned_components_lookup ON deliverable_assigned_components(deliverable_id, component_id);
```

### 3.2 Query Optimization Indexes

```sql
-- Dashboard aggregations
CREATE INDEX idx_tasks_build_status ON tasks(build_id, status);
CREATE INDEX idx_builds_status_created ON builds(status, created_at);

-- Date-based queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_builds_event_date ON builds(event_date) WHERE event_date IS NOT NULL;
```

## 4. Performance Considerations 🚀

### 4.1 Expected Load Patterns

**Read-Heavy Workload**
- Client portals: Frequent project status checks
- Admin dashboards: Real-time project health monitoring  
- Contributor dashboards: Task list refreshes

**Write Spikes**
- Quote approval: Batch task generation
- Time tracking sync: Hourly updates from Clockify
- Progress updates: Frequent task status changes

### 4.2 Scaling Considerations

**Data Growth Projections**
- Projects: ~100-200 per year
- Tasks: ~50-100 per project  
- Time entries: ~500-1000 per project
- Asset links: ~200-500 per project

**Potential Bottlenecks**
1. **Real-time pricing calculations** - Complex joins across component hierarchy
2. **Task generation** - Bulk inserts during quote approval
3. **Dashboard aggregations** - Cross-project statistics for admin views

### 4.3 Optimization Strategies

**Query Optimization**
- Use covering indexes for dashboard queries
- Consider materialized views for complex aggregations
- Implement query result caching for static reference data

**Data Management**
- Archive completed projects older than 2 years
- Implement soft deletes for audit trail preservation
- Consider partitioning for time-series data (time entries, audit logs)

## 5. Monitoring Recommendations 📈

### 5.1 Key Metrics to Track

**Query Performance**
- Dashboard load times (target: <200ms)
- Real-time pricing calculation speed (target: <100ms)
- Task list refresh performance (target: <150ms)

**Database Health**
- Connection pool utilization
- Slow query identification (>1 second)
- Index usage statistics

### 5.2 Alerting Thresholds

- Dashboard queries exceeding 500ms
- Pricing calculations exceeding 200ms
- Task generation processes exceeding 30 seconds
- Database connection pool above 80% utilization

This performance strategy should be reviewed quarterly and updated based on actual usage patterns.
