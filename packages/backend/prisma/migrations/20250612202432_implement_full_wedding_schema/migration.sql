/*
  Warnings:

  - You are about to drop the `_permissionsToroles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[inquiry_id]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "pricing_type_options" AS ENUM ('Hourly', 'Fixed');

-- CreateEnum
CREATE TYPE "billable_item_pricing_type" AS ENUM ('Fixed', 'Unit');

-- CreateEnum
CREATE TYPE "inquiries_status" AS ENUM ('New', 'Contacted', 'Proposal_Sent', 'Booked', 'Closed_Lost');

-- CreateEnum
CREATE TYPE "builds_status" AS ENUM ('Inquiry', 'Proposal_Sent', 'Booked', 'Completed', 'Archived');

-- CreateEnum
CREATE TYPE "change_order_status" AS ENUM ('Pending_Approval', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "discount_type_enum" AS ENUM ('Percentage', 'Fixed');

-- CreateEnum
CREATE TYPE "tasks_status" AS ENUM ('To_Do', 'Ready_to_Start', 'In_Progress', 'Completed', 'Archived');

-- CreateEnum
CREATE TYPE "calendar_event_type" AS ENUM ('PROJECT_ASSIGNMENT', 'ABSENCE', 'HOLIDAY', 'EXTERNAL_SYNC', 'PERSONAL');

-- CreateEnum
CREATE TYPE "project_asset_type" AS ENUM ('Raw_Footage', 'Audio_File', 'Project_File', 'Export');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('Call', 'Email', 'Meeting', 'To_Do');

-- CreateEnum
CREATE TYPE "activity_status" AS ENUM ('Pending', 'Completed');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('Active', 'Archived');

-- CreateEnum
CREATE TYPE "task_comment_visibility" AS ENUM ('Internal', 'Client_Visible');

-- CreateEnum
CREATE TYPE "calendar_sync_provider" AS ENUM ('Google');

-- CreateEnum
CREATE TYPE "calendar_sync_status" AS ENUM ('Active', 'Error', 'Disabled');

-- DropForeignKey
ALTER TABLE "_permissionsToroles" DROP CONSTRAINT "_permissionsToroles_A_fkey";

-- DropForeignKey
ALTER TABLE "_permissionsToroles" DROP CONSTRAINT "_permissionsToroles_B_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "contributors" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "default_hourly_rate" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
ALTER COLUMN "role_id" DROP NOT NULL;

-- DropTable
DROP TABLE "_permissionsToroles";

-- CreateTable
CREATE TABLE "coverage_scenes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "coverage_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editing_styles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "editing_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "default_hourly_rate" DECIMAL(8,2),
    "default_fixed_price" DECIMAL(10,2),
    "pricing_type" "pricing_type_options" NOT NULL DEFAULT 'Hourly',

    CONSTRAINT "operator_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billable_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "pricing_type" "billable_item_pricing_type" NOT NULL DEFAULT 'Fixed',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "billable_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phase" TEXT,
    "effort_hours" DECIMAL(8,2),
    "effort_calculation_rules" JSONB,
    "pricing_type" "pricing_type_options" NOT NULL DEFAULT 'Hourly',
    "fixed_price" DECIMAL(10,2),
    "average_duration_hours" DECIMAL(8,2),

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "wedding_date" TIMESTAMP(3),
    "status" "inquiries_status" NOT NULL DEFAULT 'New',
    "notes" TEXT,
    "venue_details" TEXT,
    "follow_up_due_date" TIMESTAMP(3),
    "lead_source" TEXT,
    "lead_source_details" TEXT,
    "campaign_id" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "project_name" TEXT,
    "wedding_date" TIMESTAMP(3) NOT NULL,
    "booking_date" TIMESTAMP(3),
    "edit_start_date" TIMESTAMP(3),
    "phase" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_skill_rates" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "task_template_id" INTEGER NOT NULL,
    "rate" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "contributor_skill_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_default_components" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER NOT NULL,
    "coverage_scene_id" INTEGER,
    "default_editing_style_id" INTEGER NOT NULL,
    "default_target_minutes" DECIMAL(8,2),
    "default_is_included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "deliverable_default_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editing_style_requirements" (
    "id" SERIAL NOT NULL,
    "editing_style_id" INTEGER NOT NULL,
    "billable_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "editing_style_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_task_recipes" (
    "id" SERIAL NOT NULL,
    "deliverable_id" INTEGER,
    "coverage_scene_id" INTEGER,
    "editing_style_id" INTEGER,
    "task_template_id" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "component_task_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_id" INTEGER,
    "status" "builds_status" NOT NULL,
    "configuration_locked_at" TIMESTAMP(3),
    "approved_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "live_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_paid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_coverage_assignments" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "coverage_scene_id" INTEGER NOT NULL,
    "operator_type_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rate_at_time_of_add" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "build_coverage_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_deliverables" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "deliverable_id" INTEGER NOT NULL,

    CONSTRAINT "build_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_components" (
    "id" SERIAL NOT NULL,
    "build_deliverable_id" INTEGER NOT NULL,
    "coverage_scene_id" INTEGER NOT NULL,
    "editing_style_id" INTEGER NOT NULL,
    "target_minutes" DECIMAL(8,2),
    "is_included" BOOLEAN DEFAULT true,
    "calculated_price" DECIMAL(10,2),

    CONSTRAINT "build_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_billable_items" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "billable_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_at_time_of_add" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "build_billable_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_change_orders" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "price_delta" DECIMAL(10,2) NOT NULL,
    "new_total_approved_price" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "change_order_status" NOT NULL,
    "discount_type" "discount_type_enum",
    "discount_percentage" DECIMAL(5,2),
    "discount_amount" DECIMAL(10,2),
    "discount_reason" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_change_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_snapshots" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "change_order_id" INTEGER NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "build_component_id" INTEGER NOT NULL,
    "task_template_id" INTEGER NOT NULL,
    "planned_duration_hours" DECIMAL(8,2),
    "actual_duration_hours" DECIMAL(8,2),
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "due_date" TIMESTAMP(3),
    "assigned_to_contributor_id" INTEGER,
    "is_client_visible" BOOLEAN DEFAULT false,
    "rate_at_time_of_assignment" DECIMAL(8,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "event_type" "calendar_event_type" NOT NULL,
    "description" TEXT,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assets" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "coverage_scene_id" INTEGER,
    "file_name" TEXT,
    "storage_path" TEXT,
    "asset_type" "project_asset_type",

    CONSTRAINT "project_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_task_benchmarks" (
    "contributor_id" INTEGER NOT NULL,
    "task_template_id" INTEGER NOT NULL,
    "contributor_default_hours" DECIMAL(8,2),
    "contributor_average_hours" DECIMAL(8,2),

    CONSTRAINT "contributor_task_benchmarks_pkey" PRIMARY KEY ("contributor_id","task_template_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "invoice_number" TEXT,
    "issue_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "total_amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) DEFAULT 0.00,
    "status" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT,
    "transaction_id" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_expenses" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "expense_date" TIMESTAMP(3),
    "description" TEXT,
    "category" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "receipt_url" TEXT,

    CONSTRAINT "project_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "recipient_contributor_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "link_url" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" SERIAL NOT NULL,
    "blocking_task_id" INTEGER NOT NULL,
    "dependent_task_id" INTEGER NOT NULL,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "assigned_to_contributor_id" INTEGER NOT NULL,
    "contact_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_id" INTEGER,
    "due_date" TIMESTAMP(3),
    "activity_type" "activity_type" NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "activity_status" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications_log" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "contact_id" INTEGER NOT NULL,
    "communication_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT,
    "notes" TEXT,

    CONSTRAINT "communications_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "file_name" TEXT,
    "file_path" TEXT,
    "document_type" TEXT,
    "status" "document_status" NOT NULL DEFAULT 'Active',
    "upload_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_feedback_surveys" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "sent_date" TIMESTAMP(3),
    "response_date" TIMESTAMP(3),
    "satisfaction_rating" INTEGER,
    "nps_score" INTEGER,
    "feedback_text" TEXT,

    CONSTRAINT "client_feedback_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "contributor_id" INTEGER,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "visibility" "task_comment_visibility",

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_tokens" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "provider" "calendar_sync_provider" NOT NULL,
    "refresh_token" TEXT NOT NULL,

    CONSTRAINT "calendar_sync_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coverage_scenes_name_key" ON "coverage_scenes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "deliverables_name_key" ON "deliverables"("name");

-- CreateIndex
CREATE UNIQUE INDEX "editing_styles_name_key" ON "editing_styles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "operator_types_name_key" ON "operator_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "billable_items_name_key" ON "billable_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "task_templates_name_key" ON "task_templates"("name");

-- CreateIndex
CREATE INDEX "projects_wedding_date_idx" ON "projects"("wedding_date");

-- CreateIndex
CREATE UNIQUE INDEX "projects_client_id_wedding_date_key" ON "projects"("client_id", "wedding_date");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_skill_rates_contributor_id_task_template_id_key" ON "contributor_skill_rates"("contributor_id", "task_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_project_id_contributor_id_key" ON "project_assignments"("project_id", "contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_style_item_unique" ON "editing_style_requirements"("editing_style_id", "billable_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "builds_inquiry_id_key" ON "builds"("inquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "builds_project_id_key" ON "builds"("project_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_contributor_id_idx" ON "tasks"("assigned_to_contributor_id");

-- CreateIndex
CREATE INDEX "calendar_events_contributor_id_start_time_end_time_idx" ON "calendar_events"("contributor_id", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "audit_log_details_idx" ON "audit_log" USING GIN ("details");

-- CreateIndex
CREATE INDEX "notifications_recipient_contributor_id_is_read_idx" ON "notifications"("recipient_contributor_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_tokens_contributor_id_key" ON "calendar_sync_tokens"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_inquiry_id_key" ON "clients"("inquiry_id");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_skill_rates" ADD CONSTRAINT "contributor_skill_rates_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_skill_rates" ADD CONSTRAINT "contributor_skill_rates_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_default_components" ADD CONSTRAINT "deliverable_default_components_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_default_components" ADD CONSTRAINT "deliverable_default_components_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_default_components" ADD CONSTRAINT "deliverable_default_components_default_editing_style_id_fkey" FOREIGN KEY ("default_editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_style_requirements" ADD CONSTRAINT "editing_style_requirements_editing_style_id_fkey" FOREIGN KEY ("editing_style_id") REFERENCES "editing_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_style_requirements" ADD CONSTRAINT "editing_style_requirements_billable_item_id_fkey" FOREIGN KEY ("billable_item_id") REFERENCES "billable_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_task_recipes" ADD CONSTRAINT "component_task_recipes_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_task_recipes" ADD CONSTRAINT "component_task_recipes_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_task_recipes" ADD CONSTRAINT "component_task_recipes_editing_style_id_fkey" FOREIGN KEY ("editing_style_id") REFERENCES "editing_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_task_recipes" ADD CONSTRAINT "component_task_recipes_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_coverage_assignments" ADD CONSTRAINT "build_coverage_assignments_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_coverage_assignments" ADD CONSTRAINT "build_coverage_assignments_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_coverage_assignments" ADD CONSTRAINT "build_coverage_assignments_operator_type_id_fkey" FOREIGN KEY ("operator_type_id") REFERENCES "operator_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_deliverables" ADD CONSTRAINT "build_deliverables_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_deliverables" ADD CONSTRAINT "build_deliverables_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_components" ADD CONSTRAINT "build_components_build_deliverable_id_fkey" FOREIGN KEY ("build_deliverable_id") REFERENCES "build_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_components" ADD CONSTRAINT "build_components_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_components" ADD CONSTRAINT "build_components_editing_style_id_fkey" FOREIGN KEY ("editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_billable_items" ADD CONSTRAINT "build_billable_items_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_billable_items" ADD CONSTRAINT "build_billable_items_billable_item_id_fkey" FOREIGN KEY ("billable_item_id") REFERENCES "billable_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_change_orders" ADD CONSTRAINT "build_change_orders_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_snapshots" ADD CONSTRAINT "build_snapshots_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_snapshots" ADD CONSTRAINT "build_snapshots_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "build_change_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_build_component_id_fkey" FOREIGN KEY ("build_component_id") REFERENCES "build_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_contributor_id_fkey" FOREIGN KEY ("assigned_to_contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_coverage_scene_id_fkey" FOREIGN KEY ("coverage_scene_id") REFERENCES "coverage_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_task_benchmarks" ADD CONSTRAINT "contributor_task_benchmarks_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_task_benchmarks" ADD CONSTRAINT "contributor_task_benchmarks_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_contributor_id_fkey" FOREIGN KEY ("recipient_contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_blocking_task_id_fkey" FOREIGN KEY ("blocking_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependent_task_id_fkey" FOREIGN KEY ("dependent_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigned_to_contributor_id_fkey" FOREIGN KEY ("assigned_to_contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_feedback_surveys" ADD CONSTRAINT "client_feedback_surveys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_tokens" ADD CONSTRAINT "calendar_sync_tokens_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
