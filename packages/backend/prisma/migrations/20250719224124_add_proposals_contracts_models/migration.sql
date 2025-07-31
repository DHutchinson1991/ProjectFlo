-- CreateEnum
CREATE TYPE "contacts_type" AS ENUM ('Client_Lead', 'Client', 'Contributor', 'Vendor');

-- CreateEnum
CREATE TYPE "pricing_type_options" AS ENUM ('Hourly', 'Fixed');

-- CreateEnum
CREATE TYPE "project_phase" AS ENUM ('Lead', 'Inquiry', 'Booking', 'Creative_Development', 'Pre_Production', 'Production', 'Post_Production', 'Delivery');

-- CreateEnum
CREATE TYPE "billable_item_pricing_type" AS ENUM ('Fixed', 'Unit');

-- CreateEnum
CREATE TYPE "inquiries_status" AS ENUM ('New', 'Contacted', 'Proposal_Sent', 'Booked', 'Closed_Lost');

-- CreateEnum
CREATE TYPE "contributors_type" AS ENUM ('Internal', 'External', 'Freelance');

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
CREATE TYPE "event_attendee_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "event_reminder_method" AS ENUM ('EMAIL', 'SMS', 'PUSH_NOTIFICATION', 'POPUP');

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

-- CreateEnum
CREATE TYPE "FilmType" AS ENUM ('STANDARD', 'RAW_FOOTAGE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'AUDIO', 'MUSIC');

-- CreateEnum
CREATE TYPE "MusicType" AS ENUM ('NONE', 'SCENE_MATCHED', 'ORCHESTRAL', 'PIANO', 'MODERN', 'VINTAGE');

-- CreateEnum
CREATE TYPE "ProcessingLevel" AS ENUM ('MINIMAL', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "DeliveryFormat" AS ENUM ('MP4_H264', 'PRORES_422', 'ORIGINAL_CODEC');

-- CreateEnum
CREATE TYPE "PricingModifierType" AS ENUM ('PEAK_SEASON', 'RUSH_JOB', 'DAY_OF_WEEK', 'LOCATION', 'VOLUME_DISCOUNT', 'TIMELINE_COMPLEXITY', 'COVERAGE_COMPLEXITY', 'SCENE_DEPENDENCY', 'FILM_OVERRIDE');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('CAMERA', 'LENS', 'AUDIO', 'LIGHTING', 'GRIP', 'POWER', 'STORAGE', 'STREAMING', 'ACCESSORIES', 'DECORATIVE', 'BACKGROUNDS', 'CABLES', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('MIRRORLESS', 'DSLR', 'ACTION_CAM', 'DRONE', 'SMARTPHONE', 'EF_MOUNT', 'EF_S_MOUNT', 'SONY_E_MOUNT', 'NIKON_AF_S', 'CANON_RF', 'RECORDER', 'LAVALIER', 'CONDENSER', 'HEADPHONES', 'PA_SPEAKER', 'MIXER', 'INTERFACE', 'CABLES_AUDIO', 'DECKS', 'LED', 'STAGE_LIGHTING', 'T_BARS', 'DIFFUSION', 'STANDS', 'TRIPOD', 'MONOPOD', 'GIMBAL', 'SLIDER', 'MOUNT', 'BATTERY', 'CHARGER', 'GENERATOR', 'MEMORY_CARD', 'STREAMING_DEVICE', 'AUTOCUE', 'SYNC_DEVICE', 'GREEN_SCREEN', 'SMOKE_MACHINE', 'OTHER_EQUIPMENT');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "EquipmentAvailability" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "equipment_rental_status" AS ENUM ('BOOKED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "equipment_maintenance_type" AS ENUM ('ROUTINE', 'REPAIR', 'UPGRADE', 'CALIBRATION', 'CLEANING', 'INSPECTION');

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "business_type" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "postal_code" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_settings" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_brands" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "company_name" TEXT,
    "type" "contacts_type" NOT NULL,
    "brand_id" INTEGER,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflow_template_id" INTEGER,

    CONSTRAINT "coverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflow_template_id" INTEGER,
    "brand_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default_music_type" "MusicType",
    "delivery_timeline" INTEGER,
    "includes_music" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "type" "FilmType" NOT NULL DEFAULT 'STANDARD',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "film_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editing_styles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflow_template_id" INTEGER,

    CONSTRAINT "editing_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MediaType" NOT NULL,
    "is_coverage_linked" BOOLEAN NOT NULL DEFAULT false,
    "workflow_template_id" INTEGER,
    "brand_id" INTEGER,
    "complexity_score" INTEGER NOT NULL DEFAULT 5,
    "estimated_duration" INTEGER,
    "default_editing_style" TEXT,
    "base_task_hours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usage_count" INTEGER DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "average_actual_duration" DECIMAL(8,2),
    "performance_score" DECIMAL(3,2) DEFAULT 5.0,
    "computed_task_count" INTEGER,
    "computed_total_hours" DECIMAL(8,2),

    CONSTRAINT "scenes_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_assigned_scenes" (
    "film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_assigned_scenes_pkey" PRIMARY KEY ("film_id","scene_id")
);

-- CreateTable
CREATE TABLE "film_local_scenes" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "original_scene_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "description" TEXT,
    "complexity_score" INTEGER DEFAULT 5,
    "estimated_duration" INTEGER DEFAULT 60,
    "default_editing_style" TEXT,
    "base_task_hours" DECIMAL(5,2),
    "order_index" INTEGER NOT NULL,
    "editing_style" TEXT,
    "duration_override" INTEGER,
    "calculated_task_hours" DECIMAL(5,2),
    "calculated_base_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_local_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_local_scene_media_components" (
    "id" SERIAL NOT NULL,
    "film_local_scene_id" INTEGER NOT NULL,
    "original_component_id" INTEGER,
    "media_type" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "music_type" "MusicType",
    "music_weight" INTEGER DEFAULT 5,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_local_scene_media_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_coverage" (
    "scene_id" INTEGER NOT NULL,
    "coverage_id" INTEGER NOT NULL,

    CONSTRAINT "scene_coverage_pkey" PRIMARY KEY ("scene_id","coverage_id")
);

-- CreateTable
CREATE TABLE "film_music_tracks" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "music_type" "MusicType" NOT NULL,
    "track_name" TEXT,
    "artist" TEXT,
    "duration" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "film_music_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_modifiers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PricingModifierType" NOT NULL,
    "multiplier" DECIMAL(4,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_versions" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "version_number" TEXT NOT NULL,
    "change_summary" TEXT NOT NULL,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenes_snapshot" JSONB NOT NULL,
    "pricing_snapshot" JSONB NOT NULL,

    CONSTRAINT "film_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_change_logs" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "change_type" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "film_change_logs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand_id" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "action_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "inquiry_id" INTEGER,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login_date" TIMESTAMP(3),

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "workflow_template_id" INTEGER,
    "brand_id" INTEGER,
    "project_name" TEXT,
    "wedding_date" TIMESTAMP(3) NOT NULL,
    "booking_date" TIMESTAMP(3),
    "edit_start_date" TIMESTAMP(3),
    "phase" TEXT,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributors" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "role_id" INTEGER,
    "contributor_type" "contributors_type",
    "password_hash" TEXT NOT NULL,
    "archived_at" TIMESTAMP(3),
    "default_hourly_rate" DECIMAL(8,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "scene_template_defaults" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "coverage_id" INTEGER,
    "default_editing_style_id" INTEGER NOT NULL,
    "default_target_minutes" DECIMAL(8,2),
    "default_is_included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scene_template_defaults_pkey" PRIMARY KEY ("id")
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
    "coverage_id" INTEGER NOT NULL,
    "operator_type_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rate_at_time_of_add" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "build_coverage_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_films" (
    "id" SERIAL NOT NULL,
    "build_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,

    CONSTRAINT "build_films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_scenes" (
    "id" SERIAL NOT NULL,
    "build_film_id" INTEGER NOT NULL,
    "coverage_id" INTEGER NOT NULL,
    "editing_style_id" INTEGER NOT NULL,
    "target_minutes" DECIMAL(8,2),
    "is_included" BOOLEAN DEFAULT true,
    "calculated_price" DECIMAL(10,2),

    CONSTRAINT "build_scenes_pkey" PRIMARY KEY ("id")
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
    "build_scene_id" INTEGER NOT NULL,
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
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tags" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "event_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "contributor_id" INTEGER,
    "contact_id" INTEGER,
    "email" TEXT,
    "name" TEXT,
    "status" "event_attendee_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "reminder_time" TIMESTAMP(3) NOT NULL,
    "method" "event_reminder_method" NOT NULL DEFAULT 'EMAIL',
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_settings" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "default_view" TEXT NOT NULL DEFAULT 'WEEK',
    "working_hours_start" TEXT NOT NULL DEFAULT '09:00',
    "working_hours_end" TEXT NOT NULL DEFAULT '17:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "show_weekends" BOOLEAN NOT NULL DEFAULT true,
    "first_day_of_week" INTEGER NOT NULL DEFAULT 0,
    "default_event_duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assets" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "coverage_id" INTEGER,
    "file_name" TEXT,
    "storage_path" TEXT,
    "asset_type" "project_asset_type",

    CONSTRAINT "project_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_task_benchmarks" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "task_template_id" INTEGER NOT NULL,
    "contributor_default_hours" DECIMAL(8,2),
    "contributor_average_hours" DECIMAL(8,2),
    "contributor_best_hours" DECIMAL(8,2),
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributor_task_benchmarks_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "proposals" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_date" TIMESTAMP(3),
    "signed_date" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "timeline_layers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "color_hex" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_scenes" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "layer_id" INTEGER NOT NULL,
    "start_time_seconds" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "timeline_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_dependencies" (
    "id" SERIAL NOT NULL,
    "parent_scene_id" INTEGER NOT NULL,
    "dependent_scene_id" INTEGER NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'REQUIRED',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER,

    CONSTRAINT "scene_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_usage_analytics" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "used_in_film_id" INTEGER,
    "used_in_build_id" INTEGER,
    "usage_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actual_duration_seconds" INTEGER,
    "estimated_duration_seconds" INTEGER,
    "variance_percentage" DECIMAL(5,2),
    "user_id" INTEGER,

    CONSTRAINT "scene_usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_editing_sessions" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_end" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "timeline_editing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_change_log" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "scene_id" INTEGER,
    "change_type" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_by_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" INTEGER,

    CONSTRAINT "timeline_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" SERIAL NOT NULL,
    "workflow_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_generation_rules" (
    "id" SERIAL NOT NULL,
    "workflow_stage_id" INTEGER NOT NULL,
    "task_template_id" INTEGER NOT NULL,
    "scene_type" "MediaType",
    "coverage_id" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "auto_assign_to_role" TEXT,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_generation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_task_log" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_generation_rule_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_task_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_default_tasks" (
    "id" SERIAL NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "task_template_id" INTEGER,
    "task_name" TEXT NOT NULL,
    "estimated_hours" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_default_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "project_phase" NOT NULL,
    "effort_hours" DECIMAL(8,2),
    "recorded_hours" DECIMAL(8,2),
    "skills_needed" TEXT[],
    "pricing_type" "pricing_type_options" NOT NULL DEFAULT 'Hourly',
    "fixed_price" DECIMAL(10,2),
    "hourly_rate" DECIMAL(8,2),
    "complexity_score" INTEGER DEFAULT 1,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "brand_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_library_benchmarks" (
    "id" SERIAL NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "contributor_default_hours" DECIMAL(8,2),
    "contributor_average_hours" DECIMAL(8,2),
    "contributor_best_hours" DECIMAL(8,2),
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_library_skill_rates" (
    "id" SERIAL NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "skill_name" TEXT NOT NULL,
    "skill_level" TEXT NOT NULL,
    "hourly_rate" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_skill_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_media_components" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "music_type" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_media_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_code" TEXT,
    "category" "EquipmentCategory" NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "brand_name" TEXT,
    "model" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "availability_status" "EquipmentAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "vendor" TEXT,
    "rental_price_per_day" DECIMAL(10,2),
    "purchase_price" DECIMAL(10,2),
    "purchase_date" TIMESTAMP(3),
    "weight_kg" DECIMAL(8,2),
    "power_usage_watts" INTEGER,
    "dimensions" TEXT,
    "specifications" JSONB,
    "attachment_type" TEXT,
    "compatibility" TEXT,
    "serial_number" TEXT,
    "warranty_expiry" TIMESTAMP(3),
    "last_maintenance" TIMESTAMP(3),
    "next_maintenance_due" TIMESTAMP(3),
    "location" TEXT,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_rentals" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "rented_by_id" INTEGER,
    "client_id" INTEGER,
    "rental_start_date" TIMESTAMP(3) NOT NULL,
    "rental_end_date" TIMESTAMP(3) NOT NULL,
    "actual_return_date" TIMESTAMP(3),
    "rental_rate" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "deposit_amount" DECIMAL(10,2),
    "status" "equipment_rental_status" NOT NULL DEFAULT 'BOOKED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_maintenance" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "maintenance_type" "equipment_maintenance_type" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(10,2),
    "performed_by" TEXT,
    "performed_date" TIMESTAMP(3) NOT NULL,
    "next_due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER,

    CONSTRAINT "equipment_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "brand_settings_brand_id_idx" ON "brand_settings"("brand_id");

-- CreateIndex
CREATE INDEX "brand_settings_category_idx" ON "brand_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "brand_settings_brand_id_key_key" ON "brand_settings"("brand_id", "key");

-- CreateIndex
CREATE INDEX "user_brands_user_id_idx" ON "user_brands"("user_id");

-- CreateIndex
CREATE INDEX "user_brands_brand_id_idx" ON "user_brands"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_brands_user_id_brand_id_key" ON "user_brands"("user_id", "brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_brand_id_idx" ON "contacts"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "coverage_name_key" ON "coverage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "film_categories_name_key" ON "film_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "film_categories_code_key" ON "film_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "film_library_name_key" ON "film_library"("name");

-- CreateIndex
CREATE INDEX "film_library_brand_id_idx" ON "film_library"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "editing_styles_name_key" ON "editing_styles"("name");

-- CreateIndex
CREATE INDEX "scenes_library_brand_id_idx" ON "scenes_library"("brand_id");

-- CreateIndex
CREATE INDEX "film_local_scenes_film_id_idx" ON "film_local_scenes"("film_id");

-- CreateIndex
CREATE INDEX "film_local_scenes_original_scene_id_idx" ON "film_local_scenes"("original_scene_id");

-- CreateIndex
CREATE INDEX "film_local_scene_media_components_film_local_scene_id_idx" ON "film_local_scene_media_components"("film_local_scene_id");

-- CreateIndex
CREATE INDEX "film_local_scene_media_components_original_component_id_idx" ON "film_local_scene_media_components"("original_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "operator_types_name_key" ON "operator_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "billable_items_name_key" ON "billable_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "task_templates_name_key" ON "task_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_brand_id_idx" ON "roles"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_name_key" ON "permissions"("action_name");

-- CreateIndex
CREATE UNIQUE INDEX "clients_contact_id_key" ON "clients"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_inquiry_id_key" ON "clients"("inquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_client_id_key" ON "client_users"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_email_key" ON "client_users"("email");

-- CreateIndex
CREATE INDEX "projects_wedding_date_idx" ON "projects"("wedding_date");

-- CreateIndex
CREATE INDEX "projects_brand_id_idx" ON "projects"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_client_id_wedding_date_key" ON "projects"("client_id", "wedding_date");

-- CreateIndex
CREATE UNIQUE INDEX "contributors_contact_id_key" ON "contributors"("contact_id");

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
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_tags_event_id_tag_id_key" ON "event_tags"("event_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_event_id_contributor_id_key" ON "event_attendees"("event_id", "contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_event_id_contact_id_key" ON "event_attendees"("event_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_event_id_email_key" ON "event_attendees"("event_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_settings_contributor_id_key" ON "calendar_settings"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_task_benchmarks_task_template_id_contributor_id_key" ON "contributor_task_benchmarks"("task_template_id", "contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "audit_log_details_idx" ON "audit_log" USING GIN ("details");

-- CreateIndex
CREATE INDEX "notifications_recipient_contributor_id_is_read_idx" ON "notifications"("recipient_contributor_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_tokens_contributor_id_key" ON "calendar_sync_tokens"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_layers_name_key" ON "timeline_layers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_scenes_film_id_layer_id_start_time_seconds_key" ON "timeline_scenes"("film_id", "layer_id", "start_time_seconds");

-- CreateIndex
CREATE UNIQUE INDEX "scene_dependencies_parent_scene_id_dependent_scene_id_key" ON "scene_dependencies"("parent_scene_id", "dependent_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_editing_sessions_film_id_user_id_session_start_key" ON "timeline_editing_sessions"("film_id", "user_id", "session_start");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_name_key" ON "workflow_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_workflow_template_id_order_index_key" ON "workflow_stages"("workflow_template_id", "order_index");

-- CreateIndex
CREATE INDEX "entity_default_tasks_entity_type_entity_id_idx" ON "entity_default_tasks"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_default_tasks_entity_type_entity_id_order_index_key" ON "entity_default_tasks"("entity_type", "entity_id", "order_index");

-- CreateIndex
CREATE INDEX "task_library_brand_id_idx" ON "task_library"("brand_id");

-- CreateIndex
CREATE INDEX "task_library_phase_idx" ON "task_library"("phase");

-- CreateIndex
CREATE INDEX "task_library_is_active_idx" ON "task_library"("is_active");

-- CreateIndex
CREATE INDEX "task_library_phase_order_index_idx" ON "task_library"("phase", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_benchmarks_task_library_id_contributor_id_key" ON "task_library_benchmarks"("task_library_id", "contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_skill_rates_task_library_id_skill_name_skill_l_key" ON "task_library_skill_rates"("task_library_id", "skill_name", "skill_level");

-- CreateIndex
CREATE INDEX "scene_media_components_scene_id_idx" ON "scene_media_components"("scene_id");

-- CreateIndex
CREATE INDEX "scene_media_components_media_type_idx" ON "scene_media_components"("media_type");

-- CreateIndex
CREATE INDEX "scene_media_components_music_type_idx" ON "scene_media_components"("music_type");

-- CreateIndex
CREATE INDEX "equipment_brand_id_idx" ON "equipment"("brand_id");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "equipment_type_idx" ON "equipment"("type");

-- CreateIndex
CREATE INDEX "equipment_availability_status_idx" ON "equipment"("availability_status");

-- CreateIndex
CREATE INDEX "equipment_item_code_idx" ON "equipment"("item_code");

-- CreateIndex
CREATE INDEX "equipment_rentals_equipment_id_idx" ON "equipment_rentals"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_rentals_project_id_idx" ON "equipment_rentals"("project_id");

-- CreateIndex
CREATE INDEX "equipment_rentals_rental_start_date_idx" ON "equipment_rentals"("rental_start_date");

-- CreateIndex
CREATE INDEX "equipment_rentals_status_idx" ON "equipment_rentals"("status");

-- CreateIndex
CREATE INDEX "equipment_maintenance_equipment_id_idx" ON "equipment_maintenance"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_maintenance_maintenance_type_idx" ON "equipment_maintenance"("maintenance_type");

-- CreateIndex
CREATE INDEX "equipment_maintenance_performed_date_idx" ON "equipment_maintenance"("performed_date");

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_styles" ADD CONSTRAINT "editing_styles_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes_library" ADD CONSTRAINT "scenes_library_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes_library" ADD CONSTRAINT "scenes_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_assigned_scenes" ADD CONSTRAINT "film_assigned_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_assigned_scenes" ADD CONSTRAINT "film_assigned_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scenes" ADD CONSTRAINT "film_local_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scenes" ADD CONSTRAINT "film_local_scenes_original_scene_id_fkey" FOREIGN KEY ("original_scene_id") REFERENCES "scenes_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scene_media_components" ADD CONSTRAINT "film_local_scene_media_components_film_local_scene_id_fkey" FOREIGN KEY ("film_local_scene_id") REFERENCES "film_local_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_local_scene_media_components" ADD CONSTRAINT "film_local_scene_media_components_original_component_id_fkey" FOREIGN KEY ("original_component_id") REFERENCES "scene_media_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_coverage" ADD CONSTRAINT "scene_coverage_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_coverage" ADD CONSTRAINT "scene_coverage_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_music_tracks" ADD CONSTRAINT "film_music_tracks_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_versions" ADD CONSTRAINT "film_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_versions" ADD CONSTRAINT "film_versions_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_change_logs" ADD CONSTRAINT "film_change_logs_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_change_logs" ADD CONSTRAINT "film_change_logs_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_skill_rates" ADD CONSTRAINT "contributor_skill_rates_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_skill_rates" ADD CONSTRAINT "contributor_skill_rates_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_default_editing_style_id_fkey" FOREIGN KEY ("default_editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_defaults" ADD CONSTRAINT "scene_template_defaults_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_style_requirements" ADD CONSTRAINT "editing_style_requirements_billable_item_id_fkey" FOREIGN KEY ("billable_item_id") REFERENCES "billable_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_style_requirements" ADD CONSTRAINT "editing_style_requirements_editing_style_id_fkey" FOREIGN KEY ("editing_style_id") REFERENCES "editing_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_coverage_assignments" ADD CONSTRAINT "build_coverage_assignments_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_coverage_assignments" ADD CONSTRAINT "build_coverage_assignments_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_coverage_assignments" ADD CONSTRAINT "build_coverage_assignments_operator_type_id_fkey" FOREIGN KEY ("operator_type_id") REFERENCES "operator_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_films" ADD CONSTRAINT "build_films_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_films" ADD CONSTRAINT "build_films_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_build_film_id_fkey" FOREIGN KEY ("build_film_id") REFERENCES "build_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_scenes" ADD CONSTRAINT "build_scenes_editing_style_id_fkey" FOREIGN KEY ("editing_style_id") REFERENCES "editing_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_billable_items" ADD CONSTRAINT "build_billable_items_billable_item_id_fkey" FOREIGN KEY ("billable_item_id") REFERENCES "billable_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_billable_items" ADD CONSTRAINT "build_billable_items_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_change_orders" ADD CONSTRAINT "build_change_orders_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_snapshots" ADD CONSTRAINT "build_snapshots_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_snapshots" ADD CONSTRAINT "build_snapshots_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "build_change_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_contributor_id_fkey" FOREIGN KEY ("assigned_to_contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_build_scene_id_fkey" FOREIGN KEY ("build_scene_id") REFERENCES "build_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_settings" ADD CONSTRAINT "calendar_settings_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications_log" ADD CONSTRAINT "communications_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_feedback_surveys" ADD CONSTRAINT "client_feedback_surveys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_tokens" ADD CONSTRAINT "calendar_sync_tokens_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_scenes" ADD CONSTRAINT "timeline_scenes_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "timeline_layers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_dependent_scene_id_fkey" FOREIGN KEY ("dependent_scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_dependencies" ADD CONSTRAINT "scene_dependencies_parent_scene_id_fkey" FOREIGN KEY ("parent_scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_used_in_build_id_fkey" FOREIGN KEY ("used_in_build_id") REFERENCES "builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_used_in_film_id_fkey" FOREIGN KEY ("used_in_film_id") REFERENCES "film_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_usage_analytics" ADD CONSTRAINT "scene_usage_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_change_log" ADD CONSTRAINT "timeline_change_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "timeline_editing_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_workflow_stage_id_fkey" FOREIGN KEY ("workflow_stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_task_log" ADD CONSTRAINT "generated_task_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_task_log" ADD CONSTRAINT "generated_task_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_default_tasks" ADD CONSTRAINT "entity_default_tasks_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_skill_rates" ADD CONSTRAINT "task_library_skill_rates_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_media_components" ADD CONSTRAINT "scene_media_components_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_rented_by_id_fkey" FOREIGN KEY ("rented_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
