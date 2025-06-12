# 🗄️ Database Design: ProjectFlo

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ PROJECT METADATA ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

🏷️ Project Name - ProjectFlo - The Creative OS  
🔢 Version - 1.0  
🗓️ Date - 11 June 2025

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ INTRODUCTION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 1. Introduction 🚀

This document is the definitive technical specification for the ProjectFlo database. It serves as the ultimate source of truth, designed to align the business's operational logic with a robust and scalable technical implementation.

> This version incorporates significant enhancements in flexibility, data integrity, security, and long-term performance planning.

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ SCHEMA DEFINITION ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->

## 2. Schema Definition 📋

```sql
/* ━━━━━━━━━━ ENUMERATED TYPES ━━━━━━━━━━
   Definition of all custom enum types used throughout the database.
   These ensure data consistency by limiting values to predefined sets.
*/

-- contacts_type: Types of contacts in the system
CREATE TYPE contacts_type AS ENUM ('Client Lead', 'Client', 'Contributor', 'Vendor');

-- pricing_type_options: Available pricing models
CREATE TYPE pricing_type_options AS ENUM ('Hourly', 'Fixed');

-- billable_item_pricing_type: How items can be priced
CREATE TYPE billable_item_pricing_type AS ENUM ('Fixed', 'Unit');

-- inquiries_status: Stages of an inquiry in the sales process
CREATE TYPE inquiries_status AS ENUM ('New', 'Contacted', 'Proposal Sent', 'Booked', 'Closed-Lost');

-- contributors_type: Classification of contributors
CREATE TYPE contributors_type AS ENUM ('Internal', 'External', 'Freelance');

-- builds_status: Current status of a build in the system
CREATE TYPE builds_status AS ENUM ('Inquiry', 'Proposal Sent', 'Booked', 'Completed', 'Archived');

-- change_order_status: Approval status of a change order
CREATE TYPE change_order_status AS ENUM ('Pending Approval', 'Approved', 'Rejected');

-- discount_type_enum: Type of discounts that can be applied
CREATE TYPE discount_type_enum AS ENUM ('Percentage', 'Fixed');

-- tasks_status: Various states a task can be in
CREATE TYPE tasks_status AS ENUM ('To-Do', 'Ready to Start', 'In Progress', 'Completed', 'Archived');

-- calendar_event_type: Types of events in the calendar
CREATE TYPE calendar_event_type AS ENUM ('PROJECT_ASSIGNMENT', 'ABSENCE', 'HOLIDAY', 'EXTERNAL_SYNC', 'PERSONAL');

-- project_asset_type: Types of assets that can be associated with a project
CREATE TYPE project_asset_type AS ENUM ('Raw Footage', 'Audio File', 'Project File', 'Export');

-- activity_type: Different types of activities that can be logged
CREATE TYPE activity_type AS ENUM ('Call', 'Email', 'Meeting', 'To-Do');

-- activity_status: Current status of an activity
CREATE TYPE activity_status AS ENUM ('Pending', 'Completed');

-- document_status: Status of a document in the system
CREATE TYPE document_status AS ENUM ('Active', 'Archived');

-- task_comment_visibility: Visibility settings for task comments
CREATE TYPE task_comment_visibility AS ENUM ('Internal', 'Client-Visible');

-- calendar_sync_provider: External calendar providers for synchronization
CREATE TYPE calendar_sync_provider AS ENUM ('Google');

-- calendar_sync_status: Synchronization status with external calendars
CREATE TYPE calendar_sync_status AS ENUM ('Active', 'Error', 'Disabled');

/* ━━━━━━━━━━ CORE TABLES ━━━━━━━━━━
   The foundational tables that store primary entity data.
   These tables form the backbone of the system.
*/

-- contacts: The central registry of all persons in the system
-- Stores core identity information and serves as the single source of truth
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  company_name VARCHAR(255),
  type contacts_type NOT NULL,
  archived_at TIMESTAMPTZ NULL -- For soft deletes
);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(type);

/* ━━━━━━━━━━ LOOKUP TABLES ━━━━━━━━━━
   Reference tables containing standardized options and configurations.
   Used to maintain consistency across the application.
*/

-- coverage_scenes: Different types of events or scenes that can be filmed
-- deliverables: Final products that can be offered to clients
-- editing_styles: Available editing approaches and their characteristics
CREATE TABLE coverage_scenes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE deliverables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE editing_styles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);

/* ━━━━━━━━━━ OPERATIONAL TABLES ━━━━━━━━━━
   Tables that manage day-to-day business operations.
   These handle pricing, tasks, and operational configurations.
*/

-- operator_types: Types of service providers and their default rates
-- billable_items: Individual items that can be charged to clients
-- task_templates: Reusable task definitions with effort estimates
CREATE TABLE operator_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  default_hourly_rate DECIMAL(8,2) NULL,
  default_fixed_price DECIMAL(10,2) NULL,
  pricing_type pricing_type_options NOT NULL DEFAULT 'Hourly'
);
CREATE TABLE billable_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  pricing_type billable_item_pricing_type NOT NULL DEFAULT 'Fixed',
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  phase VARCHAR(255),
  effort_hours DECIMAL(8,2),
  effort_calculation_rules JSONB,
  pricing_type pricing_type_options NOT NULL DEFAULT 'Hourly',
  fixed_price DECIMAL(10,2),
  average_duration_hours DECIMAL(8,2)
);

/* ━━━━━━━━━━ ROLE-BASED ACCESS CONTROL ━━━━━━━━━━
   Security and permissions management tables.
   Implements a flexible RBAC system for granular access control.
*/

-- roles: Defined job functions with associated permissions
-- permissions: Individual actions that can be performed in the system
-- role_permissions: Maps roles to their allowed actions
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  action_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);

/* ━━━━━━━━━━ CRM & PROJECT MANAGEMENT ━━━━━━━━━━
   Customer relationship and project tracking tables.
   Manages the complete lifecycle from inquiry to project completion.
*/

-- inquiries: Initial client interactions and lead tracking
-- clients: Confirmed customers with active projects
-- projects: Active production work being executed
-- contributors: Internal and external team members
CREATE TABLE inquiries (
  id SERIAL PRIMARY KEY,
  contact_id INT NOT NULL,
  wedding_date DATE,
  status inquiries_status NOT NULL DEFAULT 'New',
  notes TEXT,
  venue_details TEXT,
  follow_up_due_date DATE,
  lead_source VARCHAR(255),
  lead_source_details TEXT,
  campaign_id VARCHAR(255),
  archived_at TIMESTAMPTZ NULL, -- For soft deletes
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  contact_id INT NOT NULL UNIQUE,
  inquiry_id INT NULL,
  archived_at TIMESTAMPTZ NULL, -- For soft deletes
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL
);

CREATE TABLE client_users (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login_date TIMESTAMPTZ,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL,
  project_name VARCHAR(255),
  wedding_date DATE NOT NULL,
  booking_date DATE,
  edit_start_date DATE,
  phase VARCHAR(255),
  archived_at TIMESTAMPTZ NULL, -- For soft deletes
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);
CREATE INDEX idx_projects_wedding_date ON projects(wedding_date);

CREATE TABLE contributors (
  id SERIAL PRIMARY KEY,
  contact_id INT NOT NULL UNIQUE,
  contributor_type contributors_type,
  default_hourly_rate DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  password_hash VARCHAR(255) NOT NULL, -- Added for application login
  role_id INT NULL, -- Added for optional default system-wide role
  archived_at TIMESTAMPTZ NULL, -- For soft deletes
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL -- Added FK for role_id
);

CREATE TABLE contributor_skill_rates (
  id SERIAL PRIMARY KEY,
  contributor_id INT NOT NULL,
  task_template_id INT NOT NULL,
  rate DECIMAL(8,2) NOT NULL,
  UNIQUE(contributor_id, task_template_id),
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
  FOREIGN KEY (task_template_id) REFERENCES task_templates(id) ON DELETE CASCADE
);

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE project_assignments (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  contributor_id INT NOT NULL,
  role_id INT NOT NULL,
  UNIQUE(project_id, contributor_id), -- A contributor can only have one role per project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

/* ━━━━━━━━━━ AUTOMATION ENGINE ━━━━━━━━━━
   Tables powering the automated workflow system.
   Handles task generation and process automation.
*/

-- deliverable_default_components: Standard parts of each deliverable type
-- editing_style_requirements: Resources needed for each editing style
-- component_task_recipes: Rules for generating tasks based on client choices
CREATE TABLE deliverable_default_components (
  id SERIAL PRIMARY KEY,
  deliverable_id INT NOT NULL,
  coverage_scene_id INT NULL,
  default_editing_style_id INT NOT NULL,
  default_target_minutes DECIMAL(8,2),
  default_is_included BOOLEAN NOT NULL DEFAULT true,
  FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (default_editing_style_id) REFERENCES editing_styles(id) ON DELETE RESTRICT
);
CREATE TABLE editing_style_requirements (
  id SERIAL PRIMARY KEY,
  editing_style_id INT NOT NULL,
  billable_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  CONSTRAINT idx_style_item_unique UNIQUE (editing_style_id, billable_item_id),
  FOREIGN KEY (editing_style_id) REFERENCES editing_styles(id) ON DELETE CASCADE,
  FOREIGN KEY (billable_item_id) REFERENCES billable_items(id) ON DELETE CASCADE
);
CREATE TABLE component_task_recipes (
  id SERIAL PRIMARY KEY,
  deliverable_id INT NULL,
  coverage_scene_id INT NULL,
  editing_style_id INT NULL,
  task_template_id INT NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (editing_style_id) REFERENCES editing_styles(id) ON DELETE CASCADE,
  FOREIGN KEY (task_template_id) REFERENCES task_templates(id) ON DELETE CASCADE
);

/* ━━━━━━━━━━ THE "BUILD & LEDGER" ENGINE ━━━━━━━━━━
   Financial and quote management system tables.
   Tracks all monetary aspects of projects and services.
*/

-- builds: The core quote and financial tracking entity
-- build_coverage_assignments: Crew and equipment assignments
-- build_deliverables: Products included in a quote
-- build_components: Detailed breakdown of deliverable components
CREATE TABLE builds (
  id SERIAL PRIMARY KEY,
  client_id INT NULL,
  inquiry_id INT NULL UNIQUE,
  project_id INT NULL UNIQUE,
  status builds_status NOT NULL,
  configuration_locked_at TIMESTAMPTZ NULL,
  approved_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  live_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  archived_at TIMESTAMPTZ NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE build_coverage_assignments (
  id SERIAL PRIMARY KEY,
  build_id INT NOT NULL,
  coverage_scene_id INT NOT NULL,
  operator_type_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  rate_at_time_of_add DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id) ON DELETE RESTRICT,
  FOREIGN KEY (operator_type_id) REFERENCES operator_types(id) ON DELETE RESTRICT
);
CREATE TABLE build_deliverables (
  id SERIAL PRIMARY KEY,
  build_id INT NOT NULL,
  deliverable_id INT NOT NULL,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
  FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE RESTRICT
);
CREATE TABLE build_components (
  id SERIAL PRIMARY KEY,
  build_deliverable_id INT NOT NULL,
  coverage_scene_id INT NOT NULL,
  editing_style_id INT NOT NULL,
  target_minutes DECIMAL(8,2),
  is_included BOOLEAN DEFAULT true,
  calculated_price DECIMAL(10,2),
  FOREIGN KEY (build_deliverable_id) REFERENCES build_deliverables(id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id) ON DELETE RESTRICT,
  FOREIGN KEY (editing_style_id) REFERENCES editing_styles(id) ON DELETE RESTRICT
);

/* ━━━━━━━━━━ BILLING & CHANGE ORDER MANAGEMENT ━━━━━━━━━━
   Financial transaction and modification tracking.
   Manages invoicing, payments, and service changes.
*/

-- build_billable_items: Additional items added to quotes
-- build_change_orders: Tracks changes to approved quotes
-- build_snapshots: Historical record of quote states
CREATE TABLE build_billable_items (
  id SERIAL PRIMARY KEY,
  build_id INT NOT NULL,
  billable_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_at_time_of_add DECIMAL(10,2) NOT NULL,
  notes TEXT,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
  FOREIGN KEY (billable_item_id) REFERENCES billable_items(id) ON DELETE RESTRICT
);

CREATE TABLE build_change_orders (
  id SERIAL PRIMARY KEY,
  build_id INT NOT NULL,
  version_number INT NOT NULL,
  price_delta DECIMAL(10,2) NOT NULL,
  new_total_approved_price DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status change_order_status NOT NULL,
  discount_type discount_type_enum,
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  discount_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE
);

CREATE TABLE build_snapshots (
  id SERIAL PRIMARY KEY,
  build_id INT NOT NULL,
  change_order_id INT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
  FOREIGN KEY (change_order_id) REFERENCES build_change_orders(id) ON DELETE CASCADE
);

/* ━━━━━━━━━━ EXECUTION LAYER ━━━━━━━━━━
   Task and resource management tables.
   Handles the actual delivery of services and project execution.
*/

-- tasks: Individual units of work to be completed
-- calendar_events: Schedule management for team members
-- project_assets: Files and resources associated with projects
-- contributor_task_benchmarks: Performance metrics for team members
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  build_component_id INT NOT NULL,
  task_template_id INT NOT NULL,
  planned_duration_hours DECIMAL(8,2),
  actual_duration_hours DECIMAL(8,2),
  status tasks_status DEFAULT 'To-Do',
  due_date DATE,
  assigned_to_contributor_id INT NULL,
  is_client_visible BOOLEAN DEFAULT false,
  rate_at_time_of_assignment DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (build_component_id) REFERENCES build_components(id) ON DELETE CASCADE,
  FOREIGN KEY (task_template_id) REFERENCES task_templates(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to_contributor_id) REFERENCES contributors(id) ON DELETE SET NULL
);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assignee ON tasks(assigned_to_contributor_id);

CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  contributor_id INT NOT NULL,
  project_id INT NULL,
  title VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  event_type calendar_event_type NOT NULL,
  description TEXT,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX idx_calendar_events_contributor_time ON calendar_events(contributor_id, start_time, end_time);

CREATE TABLE project_assets (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  coverage_scene_id INT NULL,
  file_name VARCHAR(255),
  storage_path VARCHAR(1024),
  asset_type project_asset_type,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_scene_id) REFERENCES coverage_scenes(id) ON DELETE SET NULL
);

CREATE TABLE contributor_task_benchmarks (
  contributor_id INT NOT NULL,
  task_template_id INT NOT NULL,
  contributor_default_hours DECIMAL(8,2) NULL,
  contributor_average_hours DECIMAL(8,2) NULL,
  PRIMARY KEY (contributor_id, task_template_id),
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
  FOREIGN KEY (task_template_id) REFERENCES task_templates(id) ON DELETE CASCADE
);

/* ━━━━━━━━━━ SUPPORTING SYSTEMS ━━━━━━━━━━
   Auxiliary functionality tables.
   Provides additional features like notifications and audit logging.
*/

-- invoices: Client billing records
-- payments: Financial transaction tracking
-- project_expenses: Cost tracking for projects
-- audit_log: System-wide change tracking
-- notifications: User alert management
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  invoice_number VARCHAR(255) UNIQUE,
  issue_date DATE,
  due_date DATE,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(255),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(255),
  transaction_id VARCHAR(255),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT
);
CREATE TABLE project_expenses (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  expense_date DATE,
  description VARCHAR(255),
  category VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  receipt_url VARCHAR(1024),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  contributor_id INT NULL,
  action VARCHAR(255) NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL
);
CREATE INDEX idx_audit_log_details_gin ON audit_log USING GIN (details);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_contributor_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  link_url VARCHAR(1024),
  FOREIGN KEY (recipient_contributor_id) REFERENCES contributors(id) ON DELETE CASCADE
);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_contributor_id, is_read);

/* ━━━━━━━━━━ WORKFLOW MANAGEMENT ━━━━━━━━━━
   Process and communication management tables.
   Handles task dependencies, activities, and client communication.
*/

-- task_dependencies: Relationships between dependent tasks
-- activities: Scheduled actions and follow-ups
-- communications_log: Record of client interactions
-- documents: File management and tracking
-- client_feedback_surveys: Customer satisfaction tracking
-- task_comments: Discussion threads on tasks
-- calendar_sync_tokens: External calendar integration
CREATE TABLE task_dependencies (
  id SERIAL PRIMARY KEY,
  blocking_task_id INT NOT NULL,
  dependent_task_id INT NOT NULL,
  FOREIGN KEY (blocking_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (dependent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  assigned_to_contributor_id INT NOT NULL,
  contact_id INT NULL,
  inquiry_id INT NULL,
  project_id INT NULL,
  due_date DATE,
  activity_type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  notes TEXT,
  status activity_status NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (assigned_to_contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE communications_log (
  id SERIAL PRIMARY KEY,
  project_id INT NULL,
  contact_id INT NOT NULL,
  communication_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(255),
  notes TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  project_id INT NULL,
  inquiry_id INT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(1024),
  document_type VARCHAR(255),
  status document_status DEFAULT 'Active',
  upload_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);

-- client_feedback_surveys: Surveys sent to clients for feedback
-- task_comments: Comments on tasks by contributors
-- calendar_sync_tokens: Tokens for syncing calendars with external providers
CREATE TABLE client_feedback_surveys (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  sent_date DATE,
  response_date DATE,
  satisfaction_rating INT,
  nps_score INT,
  feedback_text TEXT,
  CHECK (satisfaction_rating BETWEEN 1 AND 10),
  CHECK (nps_score BETWEEN 0 AND 10),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE task_comments (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  contributor_id INT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMTz DEFAULT CURRENT_TIMESTAMP,
  visibility task_comment_visibility,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL
);
CREATE TABLE calendar_sync_tokens (
    id SERIAL PRIMARY KEY,
    contributor_id INT NOT NULL UNIQUE,
    provider calendar_sync_provider NOT NULL,
    refresh_token TEXT NOT NULL, -- This MUST be encrypted at the application layer
    last_sync_at TIMESTAMPTZ NULL,
    sync_status calendar_sync_status NOT NULL DEFAULT 'Active',
    FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE
);
```

<!-- ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ END OF DOCUMENT ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ -->
