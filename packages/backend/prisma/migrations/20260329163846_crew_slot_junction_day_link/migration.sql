/*
  Warnings:

  - The values [Contributor] on the enum `contacts_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [per_crew_member] on the enum `task_trigger_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assigned_to_contributor_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `calendar_settings` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `calendar_sync_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `operator_id` on the `coverage` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `event_attendees` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `film_timeline_tracks_v2` table. All the data in the column will be lost.
  - You are about to drop the column `project_day_operator_equipment_id` on the `inquiry_equipment_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_contributor_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `project_film_timeline_tracks` table. All the data in the column will be lost.
  - You are about to drop the column `default_contributor_id` on the `task_library` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_average_hours` on the `task_library_benchmarks` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_best_hours` on the `task_library_benchmarks` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_default_hours` on the `task_library_benchmarks` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `task_library_benchmarks` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `timeline_editing_sessions` table. All the data in the column will be lost.
  - You are about to drop the `activity_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `billable_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build_billable_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build_change_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build_coverage_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build_films` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build_scenes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `build_snapshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `builds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contributor_job_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contributors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `editing_style_requirements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inquiry_availability_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `operator_activity_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `operator_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `package_day_operator_equipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `package_day_operators` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_day_operator_equipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_day_operators` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_operator_activity_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_brands` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[crew_id]` on the table `calendar_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[crew_id]` on the table `calendar_sync_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[event_id,crew_id]` on the table `event_attendees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inquiry_id,project_crew_slot_equipment_id]` on the table `inquiry_equipment_reservations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[task_library_id,crew_id]` on the table `task_library_benchmarks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[film_id,crew_id,session_start]` on the table `timeline_editing_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assigned_to_crew_id` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crew_id` to the `calendar_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crew_id` to the `calendar_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crew_id` to the `calendar_sync_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_crew_slot_equipment_id` to the `inquiry_equipment_reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_crew_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crew_id` to the `task_library_benchmarks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crew_id` to the `timeline_editing_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "contacts_type_new" AS ENUM ('Client_Lead', 'Client', 'Crew', 'Vendor');
ALTER TABLE "contacts" ALTER COLUMN "type" TYPE "contacts_type_new" USING ("type"::text::"contacts_type_new");
ALTER TYPE "contacts_type" RENAME TO "contacts_type_old";
ALTER TYPE "contacts_type_new" RENAME TO "contacts_type";
DROP TYPE "contacts_type_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "task_trigger_type_new" AS ENUM ('always', 'per_project', 'per_film', 'per_film_with_music', 'per_film_with_graphics', 'per_event_day', 'per_crew', 'per_location', 'per_activity', 'per_activity_crew', 'per_film_scene');
ALTER TABLE "inquiry_tasks" ALTER COLUMN "trigger_type" DROP DEFAULT;
ALTER TABLE "project_tasks" ALTER COLUMN "trigger_type" DROP DEFAULT;
ALTER TABLE "task_library" ALTER COLUMN "trigger_type" DROP DEFAULT;
ALTER TABLE "task_library" ALTER COLUMN "trigger_type" TYPE "task_trigger_type_new" USING ("trigger_type"::text::"task_trigger_type_new");
ALTER TABLE "project_tasks" ALTER COLUMN "trigger_type" TYPE "task_trigger_type_new" USING ("trigger_type"::text::"task_trigger_type_new");
ALTER TABLE "inquiry_tasks" ALTER COLUMN "trigger_type" TYPE "task_trigger_type_new" USING ("trigger_type"::text::"task_trigger_type_new");
ALTER TYPE "task_trigger_type" RENAME TO "task_trigger_type_old";
ALTER TYPE "task_trigger_type_new" RENAME TO "task_trigger_type";
DROP TYPE "task_trigger_type_old";
ALTER TABLE "inquiry_tasks" ALTER COLUMN "trigger_type" SET DEFAULT 'always';
ALTER TABLE "project_tasks" ALTER COLUMN "trigger_type" SET DEFAULT 'always';
ALTER TABLE "task_library" ALTER COLUMN "trigger_type" SET DEFAULT 'always';
COMMIT;

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_assigned_to_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_inquiry_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "build_billable_items" DROP CONSTRAINT "build_billable_items_billable_item_id_fkey";

-- DropForeignKey
ALTER TABLE "build_billable_items" DROP CONSTRAINT "build_billable_items_build_id_fkey";

-- DropForeignKey
ALTER TABLE "build_change_orders" DROP CONSTRAINT "build_change_orders_build_id_fkey";

-- DropForeignKey
ALTER TABLE "build_coverage_assignments" DROP CONSTRAINT "build_coverage_assignments_build_id_fkey";

-- DropForeignKey
ALTER TABLE "build_coverage_assignments" DROP CONSTRAINT "build_coverage_assignments_coverage_id_fkey";

-- DropForeignKey
ALTER TABLE "build_coverage_assignments" DROP CONSTRAINT "build_coverage_assignments_operator_type_id_fkey";

-- DropForeignKey
ALTER TABLE "build_films" DROP CONSTRAINT "build_films_build_id_fkey";

-- DropForeignKey
ALTER TABLE "build_films" DROP CONSTRAINT "build_films_film_id_fkey";

-- DropForeignKey
ALTER TABLE "build_scenes" DROP CONSTRAINT "build_scenes_build_film_id_fkey";

-- DropForeignKey
ALTER TABLE "build_scenes" DROP CONSTRAINT "build_scenes_coverage_id_fkey";

-- DropForeignKey
ALTER TABLE "build_scenes" DROP CONSTRAINT "build_scenes_editing_style_id_fkey";

-- DropForeignKey
ALTER TABLE "build_snapshots" DROP CONSTRAINT "build_snapshots_build_id_fkey";

-- DropForeignKey
ALTER TABLE "build_snapshots" DROP CONSTRAINT "build_snapshots_change_order_id_fkey";

-- DropForeignKey
ALTER TABLE "builds" DROP CONSTRAINT "builds_client_id_fkey";

-- DropForeignKey
ALTER TABLE "builds" DROP CONSTRAINT "builds_inquiry_id_fkey";

-- DropForeignKey
ALTER TABLE "builds" DROP CONSTRAINT "builds_project_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_settings" DROP CONSTRAINT "calendar_settings_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_sync_tokens" DROP CONSTRAINT "calendar_sync_tokens_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "contributor_job_roles" DROP CONSTRAINT "contributor_job_roles_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "contributor_job_roles" DROP CONSTRAINT "contributor_job_roles_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "contributor_job_roles" DROP CONSTRAINT "contributor_job_roles_job_role_id_fkey";

-- DropForeignKey
ALTER TABLE "contributor_job_roles" DROP CONSTRAINT "contributor_job_roles_payment_bracket_id_fkey";

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_default_camera_id_fkey";

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_role_id_fkey";

-- DropForeignKey
ALTER TABLE "coverage" DROP CONSTRAINT "coverage_operator_id_fkey";

-- DropForeignKey
ALTER TABLE "editing_style_requirements" DROP CONSTRAINT "editing_style_requirements_billable_item_id_fkey";

-- DropForeignKey
ALTER TABLE "editing_style_requirements" DROP CONSTRAINT "editing_style_requirements_editing_style_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_availability" DROP CONSTRAINT "equipment_availability_booked_by_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_availability" DROP CONSTRAINT "equipment_availability_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_maintenance" DROP CONSTRAINT "equipment_maintenance_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_rentals" DROP CONSTRAINT "equipment_rentals_rented_by_id_fkey";

-- DropForeignKey
ALTER TABLE "event_attendees" DROP CONSTRAINT "event_attendees_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "film_change_logs" DROP CONSTRAINT "film_change_logs_changed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "film_subjects" DROP CONSTRAINT "film_subjects_role_template_id_fkey";

-- DropForeignKey
ALTER TABLE "film_timeline_tracks_v2" DROP CONSTRAINT "film_timeline_tracks_v2_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "film_versions" DROP CONSTRAINT "film_versions_changed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "floor_plans" DROP CONSTRAINT "floor_plans_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiry_availability_requests" DROP CONSTRAINT "inquiry_availability_requests_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiry_availability_requests" DROP CONSTRAINT "inquiry_availability_requests_inquiry_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiry_task_subtasks" DROP CONSTRAINT "inquiry_task_subtasks_completed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiry_tasks" DROP CONSTRAINT "inquiry_tasks_assigned_to_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiry_tasks" DROP CONSTRAINT "inquiry_tasks_completed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "locations_library" DROP CONSTRAINT "locations_library_venue_floor_plan_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_recipient_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "operator_activity_assignments" DROP CONSTRAINT "operator_activity_assignments_package_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "operator_activity_assignments" DROP CONSTRAINT "operator_activity_assignments_package_day_operator_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operator_equipment" DROP CONSTRAINT "package_day_operator_equipment_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operator_equipment" DROP CONSTRAINT "package_day_operator_equipment_package_day_operator_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operators" DROP CONSTRAINT "package_day_operators_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operators" DROP CONSTRAINT "package_day_operators_event_day_template_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operators" DROP CONSTRAINT "package_day_operators_job_role_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operators" DROP CONSTRAINT "package_day_operators_package_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "package_day_operators" DROP CONSTRAINT "package_day_operators_package_id_fkey";

-- DropForeignKey
ALTER TABLE "project_assignments" DROP CONSTRAINT "project_assignments_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "project_assignments" DROP CONSTRAINT "project_assignments_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_assignments" DROP CONSTRAINT "project_assignments_role_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operator_equipment" DROP CONSTRAINT "project_day_operator_equipment_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operator_equipment" DROP CONSTRAINT "project_day_operator_equipment_project_day_operator_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operators" DROP CONSTRAINT "project_day_operators_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operators" DROP CONSTRAINT "project_day_operators_inquiry_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operators" DROP CONSTRAINT "project_day_operators_job_role_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operators" DROP CONSTRAINT "project_day_operators_project_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operators" DROP CONSTRAINT "project_day_operators_project_event_day_id_fkey";

-- DropForeignKey
ALTER TABLE "project_day_operators" DROP CONSTRAINT "project_day_operators_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_film_subjects" DROP CONSTRAINT "project_film_subjects_role_template_id_fkey";

-- DropForeignKey
ALTER TABLE "project_film_timeline_tracks" DROP CONSTRAINT "project_film_timeline_tracks_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "project_operator_activity_assignments" DROP CONSTRAINT "project_operator_activity_assignments_project_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "project_operator_activity_assignments" DROP CONSTRAINT "project_operator_activity_assignments_project_day_operator_fkey";

-- DropForeignKey
ALTER TABLE "project_tasks" DROP CONSTRAINT "project_tasks_assigned_to_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "task_library" DROP CONSTRAINT "task_library_default_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "task_library_benchmarks" DROP CONSTRAINT "task_library_benchmarks_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "timeline_editing_sessions" DROP CONSTRAINT "timeline_editing_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_brands" DROP CONSTRAINT "user_brands_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "user_brands" DROP CONSTRAINT "user_brands_user_id_fkey";

-- DropIndex
DROP INDEX "calendar_events_contributor_id_start_time_end_time_idx";

-- DropIndex
DROP INDEX "calendar_settings_contributor_id_key";

-- DropIndex
DROP INDEX "calendar_sync_tokens_contributor_id_key";

-- DropIndex
DROP INDEX "event_attendees_event_id_contributor_id_key";

-- DropIndex
DROP INDEX "film_timeline_tracks_v2_contributor_id_idx";

-- DropIndex
DROP INDEX "inquiry_equipment_reservations_inquiry_id_project_day_opera_key";

-- DropIndex
DROP INDEX "notifications_recipient_contributor_id_is_read_idx";

-- DropIndex
DROP INDEX "project_activities_project_id_idx";

-- DropIndex
DROP INDEX "project_film_timeline_tracks_contributor_id_idx";

-- DropIndex
DROP INDEX "task_library_default_contributor_id_idx";

-- DropIndex
DROP INDEX "task_library_benchmarks_task_library_id_contributor_id_key";

-- DropIndex
DROP INDEX "timeline_editing_sessions_film_id_user_id_session_start_key";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "assigned_to_contributor_id",
ADD COLUMN     "assigned_to_crew_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER;

-- AlterTable
ALTER TABLE "calendar_events" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "calendar_settings" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "calendar_sync_tokens" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "coverage" DROP COLUMN "operator_id",
ADD COLUMN     "crew_id" INTEGER;

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "photo_url" TEXT;

-- AlterTable
ALTER TABLE "event_attendees" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER;

-- AlterTable
ALTER TABLE "film_subjects" ALTER COLUMN "role_template_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "film_timeline_tracks_v2" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER;

-- AlterTable
ALTER TABLE "inquiry_equipment_reservations" DROP COLUMN "project_day_operator_equipment_id",
ADD COLUMN     "project_crew_slot_equipment_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "recipient_contributor_id",
ADD COLUMN     "recipient_crew_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "project_film_subjects" ALTER COLUMN "role_template_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project_film_timeline_tracks" DROP COLUMN "contributor_id",
ADD COLUMN     "crew_id" INTEGER;

-- AlterTable
ALTER TABLE "task_library" DROP COLUMN "default_contributor_id",
ADD COLUMN     "default_crew_id" INTEGER;

-- AlterTable
ALTER TABLE "task_library_benchmarks" DROP COLUMN "contributor_average_hours",
DROP COLUMN "contributor_best_hours",
DROP COLUMN "contributor_default_hours",
DROP COLUMN "contributor_id",
ADD COLUMN     "crew_average_hours" DECIMAL(8,2),
ADD COLUMN     "crew_best_hours" DECIMAL(8,2),
ADD COLUMN     "crew_default_hours" DECIMAL(8,2),
ADD COLUMN     "crew_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "timeline_editing_sessions" DROP COLUMN "user_id",
ADD COLUMN     "crew_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "activity_logs";

-- DropTable
DROP TABLE "billable_items";

-- DropTable
DROP TABLE "build_billable_items";

-- DropTable
DROP TABLE "build_change_orders";

-- DropTable
DROP TABLE "build_coverage_assignments";

-- DropTable
DROP TABLE "build_films";

-- DropTable
DROP TABLE "build_scenes";

-- DropTable
DROP TABLE "build_snapshots";

-- DropTable
DROP TABLE "builds";

-- DropTable
DROP TABLE "contributor_job_roles";

-- DropTable
DROP TABLE "contributors";

-- DropTable
DROP TABLE "editing_style_requirements";

-- DropTable
DROP TABLE "inquiry_availability_requests";

-- DropTable
DROP TABLE "operator_activity_assignments";

-- DropTable
DROP TABLE "operator_types";

-- DropTable
DROP TABLE "package_day_operator_equipment";

-- DropTable
DROP TABLE "package_day_operators";

-- DropTable
DROP TABLE "project_assignments";

-- DropTable
DROP TABLE "project_day_operator_equipment";

-- DropTable
DROP TABLE "project_day_operators";

-- DropTable
DROP TABLE "project_operator_activity_assignments";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "user_brands";

-- DropEnum
DROP TYPE "billable_item_pricing_type";

-- DropEnum
DROP TYPE "builds_status";

-- DropEnum
DROP TYPE "change_order_status";

-- DropEnum
DROP TYPE "contributors_type";

-- DropEnum
DROP TYPE "discount_type_enum";

-- DropEnum
DROP TYPE "inquiry_availability_request_status";

-- CreateTable
CREATE TABLE "brand_members" (
    "id" SERIAL NOT NULL,
    "crew_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "password_hash" TEXT NOT NULL,
    "system_role_id" INTEGER,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand_id" INTEGER,

    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "crew_color" TEXT,
    "bio" TEXT,

    CONSTRAINT "crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_job_roles" (
    "id" SERIAL NOT NULL,
    "crew_id" INTEGER NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "payment_bracket_id" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_unmanned" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,

    CONSTRAINT "crew_job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_crew_slots" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "package_event_day_id" INTEGER NOT NULL,
    "crew_id" INTEGER,
    "job_role_id" INTEGER NOT NULL,
    "hours" DECIMAL(4,1) NOT NULL DEFAULT 8,
    "label" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_crew_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_crew_slot_equipment" (
    "id" SERIAL NOT NULL,
    "package_crew_slot_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_crew_slot_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_crew_slots" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_event_day_id" INTEGER NOT NULL,
    "source_slot_id" INTEGER,
    "crew_id" INTEGER,
    "job_role_id" INTEGER NOT NULL,
    "hours" DECIMAL(4,1) NOT NULL DEFAULT 8,
    "label" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_crew_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_crew_slot_equipment" (
    "id" SERIAL NOT NULL,
    "project_crew_slot_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_crew_slot_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_crew_slot_activities" (
    "id" SERIAL NOT NULL,
    "project_crew_slot_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_crew_slot_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_crew_slot_activities" (
    "id" SERIAL NOT NULL,
    "package_crew_slot_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_crew_slot_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_members_crew_id_idx" ON "brand_members"("crew_id");

-- CreateIndex
CREATE INDEX "brand_members_brand_id_idx" ON "brand_members"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_members_crew_id_brand_id_key" ON "brand_members"("crew_id", "brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_contact_id_key" ON "user_accounts"("contact_id");

-- CreateIndex
CREATE INDEX "user_accounts_system_role_id_idx" ON "user_accounts"("system_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_name_key" ON "system_roles"("name");

-- CreateIndex
CREATE INDEX "system_roles_brand_id_idx" ON "system_roles"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "crew_contact_id_key" ON "crew"("contact_id");

-- CreateIndex
CREATE INDEX "crew_job_roles_crew_id_idx" ON "crew_job_roles"("crew_id");

-- CreateIndex
CREATE INDEX "crew_job_roles_job_role_id_idx" ON "crew_job_roles"("job_role_id");

-- CreateIndex
CREATE INDEX "crew_job_roles_payment_bracket_id_idx" ON "crew_job_roles"("payment_bracket_id");

-- CreateIndex
CREATE INDEX "crew_job_roles_is_primary_idx" ON "crew_job_roles"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "crew_job_roles_crew_id_job_role_id_key" ON "crew_job_roles"("crew_id", "job_role_id");

-- CreateIndex
CREATE INDEX "package_crew_slots_package_id_idx" ON "package_crew_slots"("package_id");

-- CreateIndex
CREATE INDEX "package_crew_slots_package_event_day_id_idx" ON "package_crew_slots"("package_event_day_id");

-- CreateIndex
CREATE INDEX "package_crew_slots_crew_id_idx" ON "package_crew_slots"("crew_id");

-- CreateIndex
CREATE INDEX "package_crew_slots_job_role_id_idx" ON "package_crew_slots"("job_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_crew_slots_package_id_package_event_day_id_job_role_key" ON "package_crew_slots"("package_id", "package_event_day_id", "job_role_id", "order_index");

-- CreateIndex
CREATE INDEX "package_crew_slot_equipment_package_crew_slot_id_idx" ON "package_crew_slot_equipment"("package_crew_slot_id");

-- CreateIndex
CREATE INDEX "package_crew_slot_equipment_equipment_id_idx" ON "package_crew_slot_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_crew_slot_equipment_package_crew_slot_id_equipment__key" ON "package_crew_slot_equipment"("package_crew_slot_id", "equipment_id");

-- CreateIndex
CREATE INDEX "project_crew_slots_project_id_idx" ON "project_crew_slots"("project_id");

-- CreateIndex
CREATE INDEX "project_crew_slots_inquiry_id_idx" ON "project_crew_slots"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_crew_slots_project_event_day_id_idx" ON "project_crew_slots"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_crew_slots_crew_id_idx" ON "project_crew_slots"("crew_id");

-- CreateIndex
CREATE INDEX "project_crew_slots_job_role_id_idx" ON "project_crew_slots"("job_role_id");

-- CreateIndex
CREATE INDEX "project_crew_slot_equipment_project_crew_slot_id_idx" ON "project_crew_slot_equipment"("project_crew_slot_id");

-- CreateIndex
CREATE INDEX "project_crew_slot_equipment_equipment_id_idx" ON "project_crew_slot_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_crew_slot_equipment_project_crew_slot_id_equipment__key" ON "project_crew_slot_equipment"("project_crew_slot_id", "equipment_id");

-- CreateIndex
CREATE INDEX "project_crew_slot_activities_project_crew_slot_id_idx" ON "project_crew_slot_activities"("project_crew_slot_id");

-- CreateIndex
CREATE INDEX "project_crew_slot_activities_project_activity_id_idx" ON "project_crew_slot_activities"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_crew_slot_activities_project_crew_slot_id_project_a_key" ON "project_crew_slot_activities"("project_crew_slot_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "package_crew_slot_activities_package_crew_slot_id_idx" ON "package_crew_slot_activities"("package_crew_slot_id");

-- CreateIndex
CREATE INDEX "package_crew_slot_activities_package_activity_id_idx" ON "package_crew_slot_activities"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_crew_slot_activities_package_crew_slot_id_package_a_key" ON "package_crew_slot_activities"("package_crew_slot_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "calendar_events_crew_id_start_time_end_time_idx" ON "calendar_events"("crew_id", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_settings_crew_id_key" ON "calendar_settings"("crew_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_tokens_crew_id_key" ON "calendar_sync_tokens"("crew_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_event_id_crew_id_key" ON "event_attendees"("event_id", "crew_id");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_crew_id_idx" ON "film_timeline_tracks_v2"("crew_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_equipment_reservations_inquiry_id_project_crew_slot_key" ON "inquiry_equipment_reservations"("inquiry_id", "project_crew_slot_equipment_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_crew_id_is_read_idx" ON "notifications"("recipient_crew_id", "is_read");

-- CreateIndex
CREATE INDEX "project_film_timeline_tracks_crew_id_idx" ON "project_film_timeline_tracks"("crew_id");

-- CreateIndex
CREATE INDEX "task_library_default_crew_id_idx" ON "task_library"("default_crew_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_benchmarks_task_library_id_crew_id_key" ON "task_library_benchmarks"("task_library_id", "crew_id");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_editing_sessions_film_id_crew_id_session_start_key" ON "timeline_editing_sessions"("film_id", "crew_id", "session_start");

-- AddForeignKey
ALTER TABLE "brand_members" ADD CONSTRAINT "brand_members_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_members" ADD CONSTRAINT "brand_members_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_system_role_id_fkey" FOREIGN KEY ("system_role_id") REFERENCES "system_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_versions" ADD CONSTRAINT "film_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_change_logs" ADD CONSTRAINT "film_change_logs_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_roles" ADD CONSTRAINT "system_roles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew" ADD CONSTRAINT "crew_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_job_roles" ADD CONSTRAINT "crew_job_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_job_roles" ADD CONSTRAINT "crew_job_roles_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_job_roles" ADD CONSTRAINT "crew_job_roles_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_job_roles" ADD CONSTRAINT "crew_job_roles_payment_bracket_id_fkey" FOREIGN KEY ("payment_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_settings" ADD CONSTRAINT "calendar_settings_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_crew_id_fkey" FOREIGN KEY ("recipient_crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigned_to_crew_id_fkey" FOREIGN KEY ("assigned_to_crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_tokens" ADD CONSTRAINT "calendar_sync_tokens_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_default_crew_id_fkey" FOREIGN KEY ("default_crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks" ADD CONSTRAINT "inquiry_task_subtasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_rented_by_id_fkey" FOREIGN KEY ("rented_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_booked_by_id_fkey" FOREIGN KEY ("booked_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations_library" ADD CONSTRAINT "locations_library_venue_floor_plan_updated_by_fkey" FOREIGN KEY ("venue_floor_plan_updated_by") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_timeline_tracks_v2" ADD CONSTRAINT "film_timeline_tracks_v2_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_subjects" ADD CONSTRAINT "film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slots" ADD CONSTRAINT "package_crew_slots_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slots" ADD CONSTRAINT "package_crew_slots_package_event_day_id_fkey" FOREIGN KEY ("package_event_day_id") REFERENCES "package_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slots" ADD CONSTRAINT "package_crew_slots_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slots" ADD CONSTRAINT "package_crew_slots_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slot_equipment" ADD CONSTRAINT "package_crew_slot_equipment_package_crew_slot_id_fkey" FOREIGN KEY ("package_crew_slot_id") REFERENCES "package_crew_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slot_equipment" ADD CONSTRAINT "package_crew_slot_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_timeline_tracks" ADD CONSTRAINT "project_film_timeline_tracks_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slots" ADD CONSTRAINT "project_crew_slots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slots" ADD CONSTRAINT "project_crew_slots_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slots" ADD CONSTRAINT "project_crew_slots_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slots" ADD CONSTRAINT "project_crew_slots_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slots" ADD CONSTRAINT "project_crew_slots_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slot_equipment" ADD CONSTRAINT "project_crew_slot_equipment_project_crew_slot_id_fkey" FOREIGN KEY ("project_crew_slot_id") REFERENCES "project_crew_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slot_equipment" ADD CONSTRAINT "project_crew_slot_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slot_activities" ADD CONSTRAINT "project_crew_slot_activities_project_crew_slot_id_fkey" FOREIGN KEY ("project_crew_slot_id") REFERENCES "project_crew_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crew_slot_activities" ADD CONSTRAINT "project_crew_slot_activities_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slot_activities" ADD CONSTRAINT "package_crew_slot_activities_package_crew_slot_id_fkey" FOREIGN KEY ("package_crew_slot_id") REFERENCES "package_crew_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_crew_slot_activities" ADD CONSTRAINT "package_crew_slot_activities_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
