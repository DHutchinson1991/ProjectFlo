Database Technical Specification: ProjectFlo v1.0
Version: 2.0 (Definitive Charter Aligned)
Date: 07 June 2025
System: Postgres

1. System Overview
This document details the complete database architecture for ProjectFlo. The schema is designed with a "data-first" approach, ensuring not only transactional integrity but also providing a rich, structured foundation for future analytics, automation, and business intelligence. It manages the entire business lifecycle from initial lead capture through project execution to financial reconciliation.

A key addition in this version is a native calendar and scheduling system, which serves as the primary source of truth for contributor availability, with Google Calendar integration being an optional enhancement. This specification also outlines the required workflow for database migrations and developer database seeding, which are critical for ensuring a consistent and efficient development process.

2. Visual Database Schema (ERD via DBML)
The following DBML (Database Markup Language) code provides a complete and interactive visual representation of the entire schema.

(Note: This link points to the original schema and will need to be updated once the v2.0 changes are modeled and published.)
https://dbdocs.io/info-aa383142f8/ProjectFlo

3. PostgreSQL Implementation Script: ProjectFlo v1.0
This is the runnable SQL code to physically create the entire database structure in PostgreSQL.

Database Setup Instructions (PostgreSQL)
Follow these steps to set up your database. It's crucial to execute the batches in the specified order.

Open your preferred SQL client for PostgreSQL (e.g., psql, DBeaver, PgAdmin).
Create and connect to your database:
SQL

CREATE DATABASE projectflo;
\c projectflo
Execute each SQL batch one by one, in the specified order.
Batch 0: Enumerated Type Definitions
In PostgreSQL, we must first define all the custom ENUM types that will be used throughout the schema.

SQL

-- Batch 0: Enumerated Type Definitions
CREATE TYPE contacts_type AS ENUM ('Client Lead', 'Client', 'Contributor', 'Vendor');
CREATE TYPE pricing_type_options AS ENUM ('Hourly', 'Fixed');
CREATE TYPE billable_item_pricing_type AS ENUM ('Fixed', 'Unit');
CREATE TYPE inquiries_status AS ENUM ('New', 'Contacted', 'Proposal Sent', 'Booked', 'Closed-Lost');
CREATE TYPE contributors_type AS ENUM ('Internal', 'External', 'Freelance');
CREATE TYPE builds_status AS ENUM ('Inquiry', 'Proposal Sent', 'Booked', 'Completed');
CREATE TYPE change_order_status AS ENUM ('Pending Approval', 'Approved', 'Rejected');
CREATE TYPE tasks_status AS ENUM ('To-Do', 'Ready to Start', 'In Progress', 'Completed', 'Archived');
CREATE TYPE calendar_event_type AS ENUM ('PROJECT_ASSIGNMENT', 'ABSENCE', 'HOLIDAY', 'EXTERNAL_SYNC', 'PERSONAL');
CREATE TYPE project_asset_type AS ENUM ('Raw Footage', 'Audio File', 'Project File', 'Export');
CREATE TYPE activity_type AS ENUM ('Call', 'Email', 'Meeting', 'To-Do');
CREATE TYPE activity_status AS ENUM ('Pending', 'Completed');
CREATE TYPE document_status AS ENUM ('Active', 'Archived');
CREATE TYPE task_comment_visibility AS ENUM ('Internal', 'Client-Visible');
CREATE TYPE calendar_sync_provider AS ENUM ('Google');
CREATE TYPE calendar_sync_status AS ENUM ('Active', 'Error', 'Disabled');
Batch 1: The Foundation - Core Catalogs & Definitions
This batch creates the "lookup" tables. These tables contain the raw ingredients and definitions for your services. They don't depend on anything else, but almost everything else will depend on them.

SQL

-- Batch 1: Core Catalogs & Definitions
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  company_name VARCHAR(255),
  type contacts_type NOT NULL
);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(type);

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
Batch 2: The Frame - CRM Entities & User Management
This batch creates the core "container" entities (inquiries, clients, projects) and the tables needed for user administration (contributors, role_permissions, etc.). These tables link back to the catalogs created in Batch 1.

SQL

-- Batch 2: CRM Entities & User Management
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
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  contact_id INT NOT NULL UNIQUE,
  inquiry_id INT NULL,
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
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);
CREATE INDEX idx_projects_wedding_date ON projects(wedding_date);

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE contributors (
  id SERIAL PRIMARY KEY,
  contact_id INT NOT NULL UNIQUE,
  role_id INT NOT NULL,
  contributor_type contributors_type,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);
Batch 3: The Automation Engines - Rules & Defaults
This batch creates the "rulebook" tables that power your automation. They connect the catalogs from Batch 1 to create your intelligent pricing and task generation logic.

SQL

-- Batch 3: Automation Engines - Rules & Defaults
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
Batch 4: The Core System - The "Build & Ledger" Engine
This is the heart of your application. These tables manage the entire dynamic quoting and configuration process.

SQL

-- Batch 4: The "Build & Ledger" Engine
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
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  discount_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE
);
Batch 5: The Execution Layer - Tasks, Assets, Performance & Calendar
These tables are for managing the actual work once a project is booked. This batch includes the new native calendar system.

SQL

-- Batch 5: Execution Layer - Tasks, Assets, Performance & Calendar
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
Batch 6: The Supporting Systems - Comms, Financials, Logs & Sync
This final batch includes all the supporting tables for communication, detailed financials, feedback, logging, and third-party sync credentials.

SQL

-- Batch 6: Supporting Systems - Comms, Financials, Logs & Sync
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

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  contributor_id INT NULL,
  action VARCHAR(255) NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL
);

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

CREATE TABLE task_comments (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  contributor_id INT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  visibility task_comment_visibility,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL
);

CREATE TABLE task_dependencies (
  id SERIAL PRIMARY KEY,
  blocking_task_id INT NOT NULL,
  dependent_task_id INT NOT NULL,
  FOREIGN KEY (blocking_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (dependent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE calendar_sync_tokens (
    id SERIAL PRIMARY KEY,
    contributor_id INT NOT NULL UNIQUE,
    provider calendar_sync_provider NOT NULL,
    refresh_token TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ NULL,
    sync_status calendar_sync_status NOT NULL DEFAULT 'Active',
    FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE
);
4. Core Business Logic & Workflows
The entire process can be seen as a six-phase journey, where data flows logically from one stage to the next, building intelligence and automation at each step.

Phase 1: Pre-Contact Setup (The Admin's Foundation)
Before any client contacts you, an administrator sets up the "brain" of the system.

Defining Services & Costs: The admin populates master catalogs: coverage_scenes, deliverables, editing_styles, operator_types, billable_items.
Setting up Automation Rules:
editing_style_requirements: "Whenever a client chooses style X, automatically add billable item Y."
deliverable_default_components: "When a client adds deliverable X, its parts should default to style Y."
task_templates: Defines all possible work units (e.g., 'Cinematic Color Grade').
component_task_recipes: "If a component for deliverable X uses style Y, it requires task Z."
Phase 2: First Contact & CRM (The Lead Arrives)
A Lead Inquires: A new contacts record is created (type='Client Lead'). A new inquiries record is also created, linked to the contact.
Sales Management: An activities record is auto-created as a to-do for the sales team.
Phase 3: The "Build" Process (The Dynamic Quote)
Creating the Build: A master builds record is created, linked to the inquiry.
The "Scene-First" Configuration:
Coverage: Client selects scenes and operators, creating build_coverage_assignments.
Films: Client selects films, creating build_deliverables.
Auto-Generation: The system creates build_components based on default rules.
Client Customization: Client changes an editing_style_id on a component.
The Live Pricing Engine Reacts:
The system sees the style change, checks editing_style_requirements, and auto-adds a record to build_billable_items.
The backend calculates the total cost and updates the builds.live_price field in real-time.
Phase 4: Booking & Financial Agreement (The Contract)
Jane Books: A projects record and a clients record are created.
The builds record is updated: status becomes 'Booked', project_id is set, and approved_price is locked.
The first build_change_orders record is created to formalize the agreement.
invoices and payments are logged, and builds.total_paid is updated.
Phase 5: Project Execution & Performance Tracking (The Work)
Generating Tasks: The backend service iterates through build_components and uses component_task_recipes to create all the necessary tasks records for the project.
The Editor's Workflow:
An editor is assigned a task. The system calculates tasks.planned_duration_hours by checking contributor_task_benchmarks first, then falling back to the global task_templates.effort_hours.
Actual time is recorded in tasks.actual_duration_hours.
The System Learns (Nightly Job): A scheduled job updates performance benchmarks by calculating the average actual_duration_hours and updating both task_templates (global average) and contributor_task_benchmarks (personal average).
Phase 6: Delivery & Wrap-up (The End)
Delivery & Assets: Final files are logged in the project_assets table.
Closing the Loop: A survey is sent, and results are stored in client_feedback_surveys.
Reporting: You can now run comprehensive reports to analyze project profitability, team performance, and marketing ROI.