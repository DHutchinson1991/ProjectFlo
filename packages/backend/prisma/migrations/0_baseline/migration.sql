-- CreateEnum
CREATE TYPE "LocationPrecision" AS ENUM ('EXACT', 'APPROXIMATE');

-- CreateEnum
CREATE TYPE "SubjectPriority" AS ENUM ('PRIMARY', 'SECONDARY', 'BACKGROUND');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "ShotType" AS ENUM ('ESTABLISHING_SHOT', 'WIDE_SHOT', 'MEDIUM_SHOT', 'TWO_SHOT', 'CLOSE_UP', 'EXTREME_CLOSE_UP', 'DETAIL_SHOT', 'REACTION_SHOT', 'OVER_SHOULDER', 'CUTAWAY', 'INSERT_SHOT', 'MASTER_SHOT');

-- CreateEnum
CREATE TYPE "CameraMovement" AS ENUM ('STATIC', 'PAN', 'TRACKING', 'GIMBAL_STABILIZED', 'HANDHELD', 'TILT', 'ZOOM', 'DOLLY', 'CRANE', 'DRONE', 'STEADICAM');

-- CreateEnum
CREATE TYPE "AudioEquipment" AS ENUM ('LAPEL_MIC', 'WIRELESS_MIC', 'AMBIENT_MIC', 'RECORDER', 'BOOM_MIC', 'MIXING_BOARD', 'HANDHELD_MIC', 'SHOTGUN_MIC');

-- CreateEnum
CREATE TYPE "VideoStyleType" AS ENUM ('FULL', 'MONTAGE', 'CINEMATIC');

-- CreateEnum
CREATE TYPE "contacts_type" AS ENUM ('Client_Lead', 'Client', 'Contributor', 'Vendor');

-- CreateEnum
CREATE TYPE "pricing_type_options" AS ENUM ('Hourly', 'Fixed');

-- CreateEnum
CREATE TYPE "project_phase" AS ENUM ('Lead', 'Inquiry', 'Booking', 'Creative_Development', 'Pre_Production', 'Production', 'Post_Production', 'Delivery');

-- CreateEnum
CREATE TYPE "task_trigger_type" AS ENUM ('always', 'per_project', 'per_film', 'per_film_with_music', 'per_film_with_graphics', 'per_event_day', 'per_crew_member', 'per_location', 'per_activity', 'per_activity_crew', 'per_film_scene');

-- CreateEnum
CREATE TYPE "billable_item_pricing_type" AS ENUM ('Fixed', 'Unit');

-- CreateEnum
CREATE TYPE "inquiries_status" AS ENUM ('New', 'Qualified', 'Contacted', 'Discovery_Call', 'Proposal_Sent', 'Booked', 'Closed_Lost');

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
CREATE TYPE "calendar_event_type" AS ENUM ('PROJECT_ASSIGNMENT', 'ABSENCE', 'HOLIDAY', 'EXTERNAL_SYNC', 'PERSONAL', 'DISCOVERY_CALL', 'PROPOSAL_REVIEW', 'WEDDING_DAY');

-- CreateEnum
CREATE TYPE "meeting_type" AS ENUM ('ONLINE', 'PHONE_CALL', 'IN_PERSON', 'VIDEO_CALL');

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
CREATE TYPE "EquipmentTemplateSlotType" AS ENUM ('CAMERA', 'AUDIO');

-- CreateEnum
CREATE TYPE "FilmType" AS ENUM ('ACTIVITY', 'FEATURE', 'MONTAGE', 'RAW_FOOTAGE');

-- CreateEnum
CREATE TYPE "AudioSourceType" AS ENUM ('MOMENT', 'BEAT', 'SCENE', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "AudioTrackType" AS ENUM ('SPEECH', 'AMBIENT', 'MUSIC');

-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('VIDEO', 'AUDIO', 'GRAPHICS', 'MUSIC');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('PEOPLE', 'OBJECTS', 'LOCATIONS');

-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('MOMENTS', 'MONTAGE');

-- CreateEnum
CREATE TYPE "MontageStyle" AS ENUM ('RHYTHMIC', 'IMPRESSIONISTIC', 'SEQUENTIAL', 'PARALLEL', 'HIGHLIGHTS', 'NARRATIVE_ARC');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'AUDIO', 'MUSIC', 'GRAPHICS');

-- CreateEnum
CREATE TYPE "MusicType" AS ENUM ('NONE', 'SCENE_MATCHED', 'ORCHESTRAL', 'PIANO', 'MODERN', 'VINTAGE', 'CLASSICAL', 'JAZZ', 'ACOUSTIC', 'ELECTRONIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProcessingLevel" AS ENUM ('MINIMAL', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "DeliveryFormat" AS ENUM ('MP4_H264', 'PRORES_422', 'ORIGINAL_CODEC');

-- CreateEnum
CREATE TYPE "PricingModifierType" AS ENUM ('PEAK_SEASON', 'RUSH_JOB', 'DAY_OF_WEEK', 'LOCATION', 'VOLUME_DISCOUNT', 'TIMELINE_COMPLEXITY', 'COVERAGE_COMPLEXITY', 'SCENE_DEPENDENCY', 'FILM_OVERRIDE');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('CAMERA', 'LENS', 'AUDIO', 'LIGHTING', 'GRIP', 'POWER', 'STORAGE', 'STREAMING', 'ACCESSORIES', 'DECORATIVE', 'BACKGROUNDS', 'CABLES', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('MIRRORLESS', 'DSLR', 'CAMCORDER', 'ACTION_CAM', 'DRONE', 'SMARTPHONE', 'EF_MOUNT', 'EF_S_MOUNT', 'SONY_E_MOUNT', 'NIKON_AF_S', 'CANON_RF', 'RECORDER', 'LAVALIER', 'CONDENSER', 'HEADPHONES', 'PA_SPEAKER', 'MIXER', 'INTERFACE', 'CABLES_AUDIO', 'DECKS', 'LED', 'STAGE_LIGHTING', 'T_BARS', 'DIFFUSION', 'STANDS', 'TRIPOD', 'MONOPOD', 'GIMBAL', 'SLIDER', 'MOUNT', 'BATTERY', 'CHARGER', 'GENERATOR', 'MEMORY_CARD', 'STREAMING_DEVICE', 'AUTOCUE', 'SYNC_DEVICE', 'GREEN_SCREEN', 'SMOKE_MACHINE', 'OTHER_EQUIPMENT');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "EquipmentAvailability" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "equipment_rental_status" AS ENUM ('BOOKED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "equipment_maintenance_type" AS ENUM ('ROUTINE', 'REPAIR', 'UPGRADE', 'CALIBRATION', 'CLEANING', 'INSPECTION');

-- CreateEnum
CREATE TYPE "equipment_availability_status" AS ENUM ('AVAILABLE', 'BOOKED', 'IN_USE', 'UNAVAILABLE', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "inquiry_availability_request_status" AS ENUM ('pending', 'confirmed', 'declined', 'cancelled');

-- CreateEnum
CREATE TYPE "inquiry_equipment_reservation_status" AS ENUM ('reserved', 'confirmed', 'cancelled');

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
    "default_tax_rate" DECIMAL(5,2) DEFAULT 0,
    "tax_number" TEXT,
    "default_payment_method" TEXT DEFAULT 'Bank Transfer',
    "payment_terms_days" INTEGER DEFAULT 30,
    "bank_name" TEXT,
    "bank_account_name" TEXT,
    "bank_sort_code" TEXT,
    "bank_account_number" TEXT,
    "crew_payment_terms" TEXT DEFAULT '50% on booking confirmation, 50% within 7 days of delivery',
    "crew_response_deadline_days" INTEGER DEFAULT 5,
    "service_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inquiry_validity_days" INTEGER DEFAULT 14,
    "late_fee_percent" DECIMAL(5,2) DEFAULT 2,
    "cancellation_tier1_days" INTEGER DEFAULT 90,
    "cancellation_tier2_days" INTEGER DEFAULT 30,
    "cancellation_tier1_percent" DECIMAL(5,2) DEFAULT 50,
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
    "recording_equipment" JSONB,
    "aperture" TEXT,
    "audio_equipment" "AudioEquipment",
    "camera_movement" "CameraMovement",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "lens_focal_length" TEXT,
    "notes" TEXT,
    "shot_type" "ShotType",
    "subject" TEXT,
    "coverage_type" "CoverageType",
    "audio_pattern" TEXT,
    "frequency_response" TEXT,
    "equipment_assignments" JSONB,
    "operator_id" INTEGER,
    "job_role_id" INTEGER,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "video_style_type" "VideoStyleType",
    "resource_requirements" JSONB,

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
    "type" "FilmType" NOT NULL DEFAULT 'FEATURE',
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
CREATE TABLE "film_equipment" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_timeline_tracks" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "track_type" "MediaType" NOT NULL,
    "track_label" TEXT,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_timeline_tracks_pkey" PRIMARY KEY ("id")
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
    "follow_up_due_date" TIMESTAMP(3),
    "lead_source" TEXT,
    "lead_source_details" TEXT,
    "campaign_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "workflow_status" JSONB,
    "selected_package_id" INTEGER,
    "source_package_id" INTEGER,
    "package_contents_snapshot" JSONB,
    "guest_count" TEXT,
    "event_type_id" INTEGER,
    "portal_token" TEXT,
    "preferred_payment_schedule_template_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "welcome_sent_at" TIMESTAMP(3),

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs_assessment_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "published_at" TIMESTAMP(3),
    "steps_config" JSONB,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_assessment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs_assessment_questions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "field_key" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "condition_json" JSONB,
    "help_text" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs_assessment_submissions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "inquiry_id" INTEGER,
    "contact_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "responses" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "review_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_checklist_state" JSONB,

    CONSTRAINT "needs_assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_questionnaire_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_questionnaire_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_questionnaire_questions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "section" TEXT,
    "prompt" TEXT NOT NULL,
    "script_hint" TEXT,
    "field_type" TEXT NOT NULL,
    "field_key" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'both',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_questionnaire_submissions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "inquiry_id" INTEGER,
    "responses" JSONB NOT NULL,
    "call_notes" TEXT,
    "transcript" TEXT,
    "sentiment" JSONB,
    "call_duration_seconds" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_questionnaire_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
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
    "source_package_id" INTEGER,
    "project_name" TEXT,
    "wedding_date" TIMESTAMP(3) NOT NULL,
    "booking_date" TIMESTAMP(3),
    "edit_start_date" TIMESTAMP(3),
    "phase" TEXT,
    "package_contents_snapshot" JSONB,
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
    "is_crew" BOOLEAN NOT NULL DEFAULT false,
    "crew_color" TEXT,
    "bio" TEXT,
    "default_camera_id" INTEGER,

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
CREATE TABLE "job_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_name" TEXT,
    "category" TEXT,
    "on_site" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_brackets" (
    "id" SERIAL NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hourly_rate" DECIMAL(8,2) NOT NULL,
    "day_rate" DECIMAL(8,2),
    "overtime_rate" DECIMAL(8,2),
    "description" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_job_roles" (
    "id" SERIAL NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "payment_bracket_id" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_unmanned" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,

    CONSTRAINT "contributor_job_roles_pkey" PRIMARY KEY ("id")
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
    "inquiry_id" INTEGER,
    "meeting_type" "meeting_type",
    "meeting_url" TEXT,
    "outcome_notes" TEXT,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,

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
    "project_id" INTEGER,
    "quote_id" INTEGER,
    "proposal_id" INTEGER,
    "invoice_number" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount_paid" DECIMAL(10,2) DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "amount" DECIMAL(10,2) NOT NULL,
    "inquiry_id" INTEGER NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "estimates" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "estimate_number" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) DEFAULT 0,
    "deposit_required" DECIMAL(10,2),
    "notes" TEXT,
    "terms" TEXT,
    "payment_method" TEXT DEFAULT 'Bank Transfer',
    "installments" INTEGER DEFAULT 1,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "schedule_template_id" INTEGER,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_items" (
    "id" SERIAL NOT NULL,
    "estimate_id" INTEGER NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "service_date" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "estimate_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_snapshots" (
    "id" SERIAL NOT NULL,
    "estimate_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshotted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "items_snapshot" JSONB NOT NULL,
    "label" TEXT,

    CONSTRAINT "estimate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "quote_number" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) DEFAULT 0,
    "deposit_required" DECIMAL(10,2),
    "notes" TEXT,
    "terms" TEXT,
    "payment_method" TEXT DEFAULT 'Bank Transfer',
    "installments" INTEGER DEFAULT 1,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "consultation_notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "schedule_template_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "service_date" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_payment_milestones" (
    "id" SERIAL NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_payment_milestones_pkey" PRIMARY KEY ("id")
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
    "project_id" INTEGER,
    "title" TEXT NOT NULL DEFAULT 'New Proposal',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "content" JSONB,
    "inquiry_id" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "share_token" TEXT,
    "client_response" TEXT,
    "client_response_at" TIMESTAMP(3),
    "client_response_message" TEXT,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "title" TEXT NOT NULL DEFAULT 'New Contract',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "signed_date" TIMESTAMP(3),
    "content" JSONB,
    "inquiry_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "signing_token" TEXT,
    "rendered_html" TEXT,
    "template_id" INTEGER,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signers" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signed_at" TIMESTAMP(3),
    "signature_text" TEXT,
    "signer_ip" TEXT,
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signers_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "workflow_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "workflow_template_tasks" (
    "id" SERIAL NOT NULL,
    "workflow_template_id" INTEGER NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "phase" "project_phase" NOT NULL,
    "override_hours" DECIMAL(8,2),
    "override_assignee_role" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_template_tasks_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "skill_role_mappings" (
    "id" SERIAL NOT NULL,
    "skill_name" TEXT NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "payment_bracket_id" INTEGER,
    "brand_id" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_role_mappings_pkey" PRIMARY KEY ("id")
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
    "default_job_role_id" INTEGER,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "brand_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger_type" "task_trigger_type" NOT NULL DEFAULT 'always',
    "due_date_offset_days" INTEGER,
    "parent_task_id" INTEGER,
    "is_stage" BOOLEAN NOT NULL DEFAULT false,
    "is_auto_only" BOOLEAN NOT NULL DEFAULT false,
    "stage_color" TEXT,
    "default_contributor_id" INTEGER,
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
CREATE TABLE "task_library_subtask_templates" (
    "id" SERIAL NOT NULL,
    "task_library_id" INTEGER NOT NULL,
    "subtask_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_auto_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_library_subtask_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_library_id" INTEGER,
    "package_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "project_phase" NOT NULL,
    "trigger_type" "task_trigger_type" NOT NULL DEFAULT 'always',
    "trigger_context" TEXT,
    "estimated_hours" DECIMAL(8,2),
    "actual_hours" DECIMAL(8,2),
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "due_date" TIMESTAMP(3),
    "assigned_to_id" INTEGER,
    "pricing_type" "pricing_type_options" NOT NULL DEFAULT 'Hourly',
    "fixed_price" DECIMAL(10,2),
    "hourly_rate" DECIMAL(8,2),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "resolved_job_role_id" INTEGER,
    "resolved_bracket_id" INTEGER,
    "resolved_rate" DECIMAL(8,2),
    "resolved_skill" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_tasks" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "task_library_id" INTEGER,
    "parent_inquiry_task_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "project_phase" NOT NULL,
    "trigger_type" "task_trigger_type" NOT NULL DEFAULT 'always',
    "estimated_hours" DECIMAL(8,2),
    "due_date" TIMESTAMP(3),
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "completed_by_id" INTEGER,
    "assigned_to_id" INTEGER,
    "job_role_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_stage" BOOLEAN NOT NULL DEFAULT false,
    "stage_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_task_subtasks" (
    "id" SERIAL NOT NULL,
    "inquiry_task_id" INTEGER NOT NULL,
    "subtask_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "tasks_status" NOT NULL DEFAULT 'To_Do',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_auto_only" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by_id" INTEGER,
    "job_role_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_task_subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_task_events" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "triggered_by" TEXT,
    "description" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_task_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_availability_requests" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "contributor_id" INTEGER NOT NULL,
    "project_day_operator_id" INTEGER,
    "status" "inquiry_availability_request_status" NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_availability_requests_pkey" PRIMARY KEY ("id")
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
    "is_unmanned" BOOLEAN NOT NULL DEFAULT false,
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
    "owner_id" INTEGER,

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

-- CreateTable
CREATE TABLE "equipment_availability" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT true,
    "status" "equipment_availability_status" NOT NULL DEFAULT 'AVAILABLE',
    "title" TEXT,
    "description" TEXT,
    "project_id" INTEGER,
    "booked_by_id" INTEGER,
    "client_id" INTEGER,
    "booking_notes" TEXT,
    "internal_notes" TEXT,
    "recurring_rule" TEXT,
    "recurring_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,
    "inquiry_id" INTEGER,

    CONSTRAINT "equipment_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations_library" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "postal_code" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "precision" "LocationPrecision" NOT NULL DEFAULT 'EXACT',
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "capacity" INTEGER,
    "notes" TEXT,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "venue_floor_plan_data" JSONB,
    "venue_floor_plan_updated_at" TIMESTAMP(3),
    "venue_floor_plan_updated_by" INTEGER,
    "venue_floor_plan_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "locations_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_spaces" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "space_type" TEXT NOT NULL,
    "capacity" INTEGER,
    "dimensions_length" DECIMAL(8,2),
    "dimensions_width" DECIMAL(8,2),
    "dimensions_height" DECIMAL(8,2),
    "metadata" JSONB,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" SERIAL NOT NULL,
    "space_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fabric_data" JSONB NOT NULL,
    "layers_data" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plan_objects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "fabric_template" JSONB NOT NULL,
    "thumbnail_url" TEXT,
    "brand_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_plan_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "films" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "film_type" "FilmType" NOT NULL DEFAULT 'FEATURE',
    "montage_preset_id" INTEGER,
    "target_duration_min" INTEGER,
    "target_duration_max" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_equipment_assignments" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "film_equipment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "camera_count" INTEGER NOT NULL DEFAULT 1,
    "audio_count" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_template_items" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "slot_type" "EquipmentTemplateSlotType" NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "track_name" TEXT,
    "operator" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_timeline_tracks_v2" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TrackType" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_unmanned" BOOLEAN NOT NULL DEFAULT false,
    "contributor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_timeline_tracks_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_roles" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "never_group" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_subjects" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "role_template_id" INTEGER,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_locations" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" "SceneType",
    "recording_setup" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_template_suggested_subjects" (
    "id" SERIAL NOT NULL,
    "scene_template_id" INTEGER NOT NULL,
    "subject_template_id" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scene_template_suggested_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_moment_templates" (
    "id" SERIAL NOT NULL,
    "scene_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "estimated_duration" INTEGER DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_moment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scenes" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "scene_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "mode" "SceneType" NOT NULL DEFAULT 'MOMENTS',
    "montage_style" "MontageStyle",
    "montage_bpm" INTEGER,
    "shot_count" INTEGER,
    "duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_locations" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_recording_setups" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_subjects" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "priority" "SubjectPriority" NOT NULL DEFAULT 'BACKGROUND',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_moment_subjects" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "priority" "SubjectPriority" NOT NULL DEFAULT 'BACKGROUND',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_moment_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_camera_assignments" (
    "id" SERIAL NOT NULL,
    "recording_setup_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "subject_ids" INTEGER[],

    CONSTRAINT "scene_camera_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_moments" (
    "id" SERIAL NOT NULL,
    "film_scene_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "source_activity_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_beats" (
    "id" SERIAL NOT NULL,
    "film_scene_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "shot_count" INTEGER,
    "duration_seconds" INTEGER NOT NULL DEFAULT 10,
    "source_activity_id" INTEGER,
    "source_moment_id" INTEGER,
    "source_scene_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_beats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beat_recording_setups" (
    "id" SERIAL NOT NULL,
    "beat_id" INTEGER NOT NULL,
    "camera_track_ids" INTEGER[],
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beat_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_recording_setups" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "graphics_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_subject_assignments" (
    "id" SERIAL NOT NULL,
    "recording_setup_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "subject_ids" INTEGER[],
    "shot_type" "ShotType",

    CONSTRAINT "camera_subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_music" (
    "id" SERIAL NOT NULL,
    "film_scene_id" INTEGER NOT NULL,
    "music_name" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER,
    "music_type" "MusicType" NOT NULL DEFAULT 'MODERN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_music" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "music_name" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER,
    "music_type" "MusicType" NOT NULL DEFAULT 'MODERN',
    "overrides_scene_music" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "montage_presets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "min_duration_seconds" INTEGER NOT NULL,
    "max_duration_seconds" INTEGER NOT NULL,
    "is_system_seeded" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "montage_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_structure_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "film_type" "FilmType" NOT NULL DEFAULT 'MONTAGE',
    "is_system_seeded" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_structure_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_structure_template_scenes" (
    "id" SERIAL NOT NULL,
    "film_structure_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "SceneType" NOT NULL DEFAULT 'MONTAGE',
    "suggested_duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_structure_template_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_audio_sources" (
    "id" SERIAL NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "source_type" "AudioSourceType" NOT NULL,
    "source_activity_id" INTEGER,
    "source_moment_id" INTEGER,
    "source_scene_id" INTEGER,
    "track_type" "AudioTrackType" NOT NULL DEFAULT 'SPEECH',
    "start_offset_seconds" INTEGER,
    "duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_audio_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_packages" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "wedding_type_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "category_id" INTEGER,
    "base_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "contents" JSONB,
    "workflow_template_id" INTEGER,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_package_categories" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "event_type_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_package_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_presets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "schedule_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "default_duration_hours" INTEGER,
    "default_start_time" TEXT,
    "typical_guest_count" INTEGER,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type_days" (
    "id" SERIAL NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "event_subtype_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_type_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type_subjects" (
    "id" SERIAL NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "subject_role_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_type_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_days" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_start_time" TEXT,
    "default_duration_hours" INTEGER,
    "icon" TEXT,
    "color" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_day_activities" (
    "id" SERIAL NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "default_start_time" TEXT,
    "default_duration_minutes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_day_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_day_activity_moments" (
    "id" SERIAL NOT NULL,
    "event_day_activity_preset_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_key_moment" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_day_activity_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_day_subject_roles" (
    "id" SERIAL NOT NULL,
    "event_day_id" INTEGER NOT NULL,
    "subject_role_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_day_subject_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtypes" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER,
    "event_type_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_duration_hours" INTEGER NOT NULL,
    "event_start_time" TEXT NOT NULL,
    "typical_guest_count" INTEGER,
    "is_system_seeded" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtype_activities" (
    "id" SERIAL NOT NULL,
    "wedding_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "start_time_offset_minutes" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtype_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtype_activity_moments" (
    "id" SERIAL NOT NULL,
    "wedding_type_activity_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_key_moment" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtype_activity_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtype_locations" (
    "id" SERIAL NOT NULL,
    "wedding_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtype_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtype_subjects" (
    "id" SERIAL NOT NULL,
    "wedding_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject_type" TEXT,
    "subject_role_id" INTEGER,
    "typical_count" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtype_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtype_activity_locations" (
    "id" SERIAL NOT NULL,
    "wedding_type_activity_id" INTEGER NOT NULL,
    "wedding_type_location_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtype_activity_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_subtype_activity_subjects" (
    "id" SERIAL NOT NULL,
    "wedding_type_activity_id" INTEGER NOT NULL,
    "wedding_type_subject_id" INTEGER NOT NULL,
    "presence_percentage" INTEGER,
    "is_primary_focus" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_subtype_activity_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_scene_schedules" (
    "id" SERIAL NOT NULL,
    "film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER,
    "scheduled_start_time" TEXT,
    "scheduled_duration_minutes" INTEGER,
    "moment_schedules" JSONB,
    "beat_schedules" JSONB,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_scene_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_event_days" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_event_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_activities" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "package_event_day_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration_minutes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_activity_moments" (
    "id" SERIAL NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_activity_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_day_operators" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "contributor_id" INTEGER,
    "package_activity_id" INTEGER,
    "position_name" TEXT NOT NULL,
    "position_color" TEXT,
    "job_role_id" INTEGER,
    "hours" DECIMAL(4,1) NOT NULL DEFAULT 8,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_day_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_day_operator_equipment" (
    "id" SERIAL NOT NULL,
    "package_day_operator_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_day_operator_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_day_subjects" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "role_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "count" INTEGER,
    "category" "SubjectCategory" NOT NULL DEFAULT 'PEOPLE',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_day_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_event_day_locations" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER,
    "location_id" INTEGER NOT NULL,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_event_day_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_films" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_film_scene_schedules" (
    "id" SERIAL NOT NULL,
    "package_film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER,
    "package_activity_id" INTEGER,
    "scheduled_start_time" TEXT,
    "scheduled_duration_minutes" INTEGER,
    "moment_schedules" JSONB,
    "beat_schedules" JSONB,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_film_scene_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_event_days" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "event_day_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_event_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activities" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_event_day_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration_minutes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_films" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "film_id" INTEGER NOT NULL,
    "package_film_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_schedules" (
    "id" SERIAL NOT NULL,
    "project_film_id" INTEGER NOT NULL,
    "scene_id" INTEGER NOT NULL,
    "project_event_day_id" INTEGER,
    "project_activity_id" INTEGER,
    "scheduled_start_time" TEXT,
    "scheduled_duration_minutes" INTEGER,
    "moment_schedules" JSONB,
    "beat_schedules" JSONB,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_timeline_tracks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_film_id" INTEGER NOT NULL,
    "source_track_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" "TrackType" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_unmanned" BOOLEAN NOT NULL DEFAULT false,
    "contributor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_timeline_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_subjects" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_film_id" INTEGER NOT NULL,
    "source_subject_id" INTEGER,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "role_template_id" INTEGER,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_locations" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_film_id" INTEGER NOT NULL,
    "source_location_id" INTEGER,
    "location_id" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scenes" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_film_id" INTEGER NOT NULL,
    "source_scene_id" INTEGER,
    "scene_template_id" INTEGER,
    "name" TEXT NOT NULL,
    "mode" "SceneType" NOT NULL DEFAULT 'MOMENTS',
    "shot_count" INTEGER,
    "duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_moments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_scene_id" INTEGER NOT NULL,
    "source_moment_id" INTEGER,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_beats" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_scene_id" INTEGER NOT NULL,
    "source_beat_id" INTEGER,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "shot_count" INTEGER,
    "duration_seconds" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_beats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_subjects" (
    "id" SERIAL NOT NULL,
    "project_scene_id" INTEGER NOT NULL,
    "project_film_subject_id" INTEGER NOT NULL,
    "source_scene_subject_id" INTEGER,
    "priority" "SubjectPriority" NOT NULL DEFAULT 'BACKGROUND',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_moment_subjects" (
    "id" SERIAL NOT NULL,
    "project_moment_id" INTEGER NOT NULL,
    "project_film_subject_id" INTEGER NOT NULL,
    "priority" "SubjectPriority" NOT NULL DEFAULT 'BACKGROUND',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_moment_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_scene_locations" (
    "id" SERIAL NOT NULL,
    "project_scene_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "source_scene_location_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_film_scene_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_film_equipment_assignments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_film_id" INTEGER NOT NULL,
    "source_assignment_id" INTEGER,
    "equipment_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_film_equipment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_scene_recording_setups" (
    "id" SERIAL NOT NULL,
    "project_scene_id" INTEGER NOT NULL,
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_scene_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_scene_camera_assignments" (
    "id" SERIAL NOT NULL,
    "recording_setup_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "subject_ids" INTEGER[],
    "project_scene_id" INTEGER,

    CONSTRAINT "project_scene_camera_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_moment_recording_setups" (
    "id" SERIAL NOT NULL,
    "project_moment_id" INTEGER NOT NULL,
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "graphics_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_moment_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_camera_subject_assignments" (
    "id" SERIAL NOT NULL,
    "recording_setup_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "subject_ids" INTEGER[],
    "shot_type" "ShotType",

    CONSTRAINT "project_camera_subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_beat_recording_setups" (
    "id" SERIAL NOT NULL,
    "project_beat_id" INTEGER NOT NULL,
    "camera_track_ids" INTEGER[],
    "audio_track_ids" INTEGER[],
    "graphics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_beat_recording_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activity_moments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_activity_id" INTEGER NOT NULL,
    "source_package_moment_id" INTEGER,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_activity_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_day_subjects" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_event_day_id" INTEGER NOT NULL,
    "source_package_subject_id" INTEGER,
    "role_template_id" INTEGER,
    "contact_id" INTEGER,
    "name" TEXT NOT NULL,
    "real_name" TEXT,
    "count" INTEGER,
    "member_names" JSONB,
    "category" "SubjectCategory" NOT NULL DEFAULT 'PEOPLE',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_day_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_location_slots" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_event_day_id" INTEGER NOT NULL,
    "source_package_location_slot_id" INTEGER,
    "location_number" INTEGER NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "location_id" INTEGER,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_location_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_day_operators" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "inquiry_id" INTEGER,
    "project_event_day_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER,
    "source_package_operator_id" INTEGER,
    "contributor_id" INTEGER,
    "position_name" TEXT NOT NULL,
    "position_color" TEXT,
    "job_role_id" INTEGER,
    "hours" DECIMAL(4,1) NOT NULL DEFAULT 8,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_day_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_day_operator_equipment" (
    "id" SERIAL NOT NULL,
    "project_day_operator_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_day_operator_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_operator_activity_assignments" (
    "id" SERIAL NOT NULL,
    "project_day_operator_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_operator_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_day_subject_activities" (
    "id" SERIAL NOT NULL,
    "project_day_subject_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_day_subject_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_location_activity_assignments" (
    "id" SERIAL NOT NULL,
    "project_location_slot_id" INTEGER NOT NULL,
    "project_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_location_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_activity_assignments" (
    "id" SERIAL NOT NULL,
    "package_day_operator_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_day_subject_activities" (
    "id" SERIAL NOT NULL,
    "package_day_subject_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_day_subject_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_location_slots" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "event_day_template_id" INTEGER NOT NULL,
    "location_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_location_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_activity_assignments" (
    "id" SERIAL NOT NULL,
    "package_location_slot_id" INTEGER NOT NULL,
    "package_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_versions" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_task_overrides" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "task_generation_rule_id" INTEGER,
    "task_library_id" INTEGER,
    "action" TEXT NOT NULL DEFAULT 'include',
    "override_name" TEXT,
    "override_hours" DECIMAL(8,2),
    "override_assignee_role" TEXT,
    "phase" "project_phase",
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_task_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_sets" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT DEFAULT '📦',
    "category_id" INTEGER,
    "event_type_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_set_slots" (
    "id" SERIAL NOT NULL,
    "package_set_id" INTEGER NOT NULL,
    "service_package_id" INTEGER,
    "slot_label" TEXT NOT NULL DEFAULT 'Package',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_set_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedule_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedule_rules" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount_type" TEXT NOT NULL DEFAULT 'PERCENT',
    "amount_value" DECIMAL(10,2) NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "trigger_days" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_payment_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role_type" TEXT NOT NULL,
    "payment_terms" TEXT DEFAULT 'DUE_ON_RECEIPT',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crew_payment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_payment_rules" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount_type" TEXT NOT NULL DEFAULT 'PERCENT',
    "amount_value" DECIMAL(10,2) NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "trigger_days" INTEGER,
    "task_library_id" INTEGER,
    "frequency" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crew_payment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_payment_milestones" (
    "id" SERIAL NOT NULL,
    "estimate_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_payment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_clause_categories" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "country_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_clause_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_clauses" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clause_type" TEXT NOT NULL DEFAULT 'STANDARD',
    "country_code" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "payment_schedule_template_id" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_template_clauses" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "clause_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "override_body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_template_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_requests" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "selected_package_id" INTEGER,
    "customisations" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_equipment_reservations" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "project_day_operator_equipment_id" INTEGER NOT NULL,
    "equipment_availability_id" INTEGER,
    "status" "inquiry_equipment_reservation_status" NOT NULL DEFAULT 'reserved',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_equipment_reservations_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "film_equipment_film_id_idx" ON "film_equipment"("film_id");

-- CreateIndex
CREATE INDEX "film_equipment_equipment_type_idx" ON "film_equipment"("equipment_type");

-- CreateIndex
CREATE UNIQUE INDEX "film_equipment_film_id_equipment_type_key" ON "film_equipment"("film_id", "equipment_type");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_film_id_idx" ON "film_timeline_tracks"("film_id");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_track_type_idx" ON "film_timeline_tracks"("track_type");

-- CreateIndex
CREATE UNIQUE INDEX "film_timeline_tracks_film_id_order_index_key" ON "film_timeline_tracks"("film_id", "order_index");

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
CREATE UNIQUE INDEX "inquiries_portal_token_key" ON "inquiries"("portal_token");

-- CreateIndex
CREATE INDEX "inquiries_source_package_id_idx" ON "inquiries"("source_package_id");

-- CreateIndex
CREATE INDEX "inquiries_preferred_payment_schedule_template_id_idx" ON "inquiries"("preferred_payment_schedule_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "needs_assessment_templates_share_token_key" ON "needs_assessment_templates"("share_token");

-- CreateIndex
CREATE INDEX "needs_assessment_templates_brand_id_idx" ON "needs_assessment_templates"("brand_id");

-- CreateIndex
CREATE INDEX "needs_assessment_questions_template_id_idx" ON "needs_assessment_questions"("template_id");

-- CreateIndex
CREATE INDEX "needs_assessment_submissions_brand_id_idx" ON "needs_assessment_submissions"("brand_id");

-- CreateIndex
CREATE INDEX "needs_assessment_submissions_inquiry_id_idx" ON "needs_assessment_submissions"("inquiry_id");

-- CreateIndex
CREATE INDEX "discovery_questionnaire_templates_brand_id_idx" ON "discovery_questionnaire_templates"("brand_id");

-- CreateIndex
CREATE INDEX "discovery_questionnaire_questions_template_id_idx" ON "discovery_questionnaire_questions"("template_id");

-- CreateIndex
CREATE INDEX "discovery_questionnaire_submissions_brand_id_idx" ON "discovery_questionnaire_submissions"("brand_id");

-- CreateIndex
CREATE INDEX "discovery_questionnaire_submissions_inquiry_id_idx" ON "discovery_questionnaire_submissions"("inquiry_id");

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
CREATE INDEX "projects_source_package_id_idx" ON "projects"("source_package_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_client_id_wedding_date_key" ON "projects"("client_id", "wedding_date");

-- CreateIndex
CREATE UNIQUE INDEX "contributors_contact_id_key" ON "contributors"("contact_id");

-- CreateIndex
CREATE INDEX "contributors_is_crew_idx" ON "contributors"("is_crew");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_skill_rates_contributor_id_task_template_id_key" ON "contributor_skill_rates"("contributor_id", "task_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_name_key" ON "job_roles"("name");

-- CreateIndex
CREATE INDEX "job_roles_category_idx" ON "job_roles"("category");

-- CreateIndex
CREATE INDEX "job_roles_is_active_idx" ON "job_roles"("is_active");

-- CreateIndex
CREATE INDEX "payment_brackets_job_role_id_idx" ON "payment_brackets"("job_role_id");

-- CreateIndex
CREATE INDEX "payment_brackets_is_active_idx" ON "payment_brackets"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_brackets_job_role_id_name_key" ON "payment_brackets"("job_role_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_brackets_job_role_id_level_key" ON "payment_brackets"("job_role_id", "level");

-- CreateIndex
CREATE INDEX "contributor_job_roles_contributor_id_idx" ON "contributor_job_roles"("contributor_id");

-- CreateIndex
CREATE INDEX "contributor_job_roles_job_role_id_idx" ON "contributor_job_roles"("job_role_id");

-- CreateIndex
CREATE INDEX "contributor_job_roles_payment_bracket_id_idx" ON "contributor_job_roles"("payment_bracket_id");

-- CreateIndex
CREATE INDEX "contributor_job_roles_is_primary_idx" ON "contributor_job_roles"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_job_roles_contributor_id_job_role_id_key" ON "contributor_job_roles"("contributor_id", "job_role_id");

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
CREATE UNIQUE INDEX "estimates_estimate_number_key" ON "estimates"("estimate_number");

-- CreateIndex
CREATE INDEX "estimate_snapshots_estimate_id_idx" ON "estimate_snapshots"("estimate_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quote_number_key" ON "quotes"("quote_number");

-- CreateIndex
CREATE INDEX "quote_payment_milestones_quote_id_idx" ON "quote_payment_milestones"("quote_id");

-- CreateIndex
CREATE INDEX "audit_log_details_idx" ON "audit_log" USING GIN ("details");

-- CreateIndex
CREATE INDEX "notifications_recipient_contributor_id_is_read_idx" ON "notifications"("recipient_contributor_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_share_token_key" ON "proposals"("share_token");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_signing_token_key" ON "contracts"("signing_token");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signers_token_key" ON "contract_signers"("token");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_tokens_contributor_id_key" ON "calendar_sync_tokens"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_layers_name_key" ON "timeline_layers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_editing_sessions_film_id_user_id_session_start_key" ON "timeline_editing_sessions"("film_id", "user_id", "session_start");

-- CreateIndex
CREATE INDEX "workflow_templates_brand_id_idx" ON "workflow_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_brand_id_name_key" ON "workflow_templates"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_workflow_template_id_order_index_key" ON "workflow_stages"("workflow_template_id", "order_index");

-- CreateIndex
CREATE INDEX "workflow_template_tasks_workflow_template_id_idx" ON "workflow_template_tasks"("workflow_template_id");

-- CreateIndex
CREATE INDEX "workflow_template_tasks_workflow_template_id_phase_idx" ON "workflow_template_tasks"("workflow_template_id", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_template_tasks_workflow_template_id_task_library_i_key" ON "workflow_template_tasks"("workflow_template_id", "task_library_id");

-- CreateIndex
CREATE INDEX "entity_default_tasks_entity_type_entity_id_idx" ON "entity_default_tasks"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_default_tasks_entity_type_entity_id_order_index_key" ON "entity_default_tasks"("entity_type", "entity_id", "order_index");

-- CreateIndex
CREATE INDEX "skill_role_mappings_skill_name_idx" ON "skill_role_mappings"("skill_name");

-- CreateIndex
CREATE INDEX "skill_role_mappings_job_role_id_idx" ON "skill_role_mappings"("job_role_id");

-- CreateIndex
CREATE INDEX "skill_role_mappings_payment_bracket_id_idx" ON "skill_role_mappings"("payment_bracket_id");

-- CreateIndex
CREATE INDEX "skill_role_mappings_brand_id_idx" ON "skill_role_mappings"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_role_mappings_skill_name_job_role_id_payment_bracket__key" ON "skill_role_mappings"("skill_name", "job_role_id", "payment_bracket_id", "brand_id");

-- CreateIndex
CREATE INDEX "task_library_brand_id_idx" ON "task_library"("brand_id");

-- CreateIndex
CREATE INDEX "task_library_phase_idx" ON "task_library"("phase");

-- CreateIndex
CREATE INDEX "task_library_is_active_idx" ON "task_library"("is_active");

-- CreateIndex
CREATE INDEX "task_library_phase_order_index_idx" ON "task_library"("phase", "order_index");

-- CreateIndex
CREATE INDEX "task_library_default_job_role_id_idx" ON "task_library"("default_job_role_id");

-- CreateIndex
CREATE INDEX "task_library_default_contributor_id_idx" ON "task_library"("default_contributor_id");

-- CreateIndex
CREATE INDEX "task_library_parent_task_id_idx" ON "task_library"("parent_task_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_benchmarks_task_library_id_contributor_id_key" ON "task_library_benchmarks"("task_library_id", "contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_skill_rates_task_library_id_skill_name_skill_l_key" ON "task_library_skill_rates"("task_library_id", "skill_name", "skill_level");

-- CreateIndex
CREATE INDEX "task_library_subtask_templates_task_library_id_order_index_idx" ON "task_library_subtask_templates"("task_library_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "task_library_subtask_templates_task_library_id_subtask_key_key" ON "task_library_subtask_templates"("task_library_id", "subtask_key");

-- CreateIndex
CREATE INDEX "project_tasks_project_id_idx" ON "project_tasks"("project_id");

-- CreateIndex
CREATE INDEX "project_tasks_task_library_id_idx" ON "project_tasks"("task_library_id");

-- CreateIndex
CREATE INDEX "project_tasks_package_id_idx" ON "project_tasks"("package_id");

-- CreateIndex
CREATE INDEX "project_tasks_assigned_to_id_idx" ON "project_tasks"("assigned_to_id");

-- CreateIndex
CREATE INDEX "project_tasks_resolved_job_role_id_idx" ON "project_tasks"("resolved_job_role_id");

-- CreateIndex
CREATE INDEX "project_tasks_resolved_bracket_id_idx" ON "project_tasks"("resolved_bracket_id");

-- CreateIndex
CREATE INDEX "project_tasks_phase_idx" ON "project_tasks"("phase");

-- CreateIndex
CREATE INDEX "project_tasks_status_idx" ON "project_tasks"("status");

-- CreateIndex
CREATE INDEX "inquiry_tasks_inquiry_id_idx" ON "inquiry_tasks"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_tasks_task_library_id_idx" ON "inquiry_tasks"("task_library_id");

-- CreateIndex
CREATE INDEX "inquiry_tasks_inquiry_id_order_index_idx" ON "inquiry_tasks"("inquiry_id", "order_index");

-- CreateIndex
CREATE INDEX "inquiry_tasks_status_idx" ON "inquiry_tasks"("status");

-- CreateIndex
CREATE INDEX "inquiry_tasks_parent_inquiry_task_id_idx" ON "inquiry_tasks"("parent_inquiry_task_id");

-- CreateIndex
CREATE INDEX "inquiry_tasks_assigned_to_id_idx" ON "inquiry_tasks"("assigned_to_id");

-- CreateIndex
CREATE INDEX "inquiry_tasks_job_role_id_idx" ON "inquiry_tasks"("job_role_id");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_inquiry_task_id_order_index_idx" ON "inquiry_task_subtasks"("inquiry_task_id", "order_index");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_status_idx" ON "inquiry_task_subtasks"("status");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_completed_by_id_idx" ON "inquiry_task_subtasks"("completed_by_id");

-- CreateIndex
CREATE INDEX "inquiry_task_subtasks_job_role_id_idx" ON "inquiry_task_subtasks"("job_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_task_subtasks_inquiry_task_id_subtask_key_key" ON "inquiry_task_subtasks"("inquiry_task_id", "subtask_key");

-- CreateIndex
CREATE INDEX "inquiry_task_events_task_id_idx" ON "inquiry_task_events"("task_id");

-- CreateIndex
CREATE INDEX "inquiry_availability_requests_inquiry_id_idx" ON "inquiry_availability_requests"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_availability_requests_contributor_id_idx" ON "inquiry_availability_requests"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_availability_requests_inquiry_id_contributor_id_key" ON "inquiry_availability_requests"("inquiry_id", "contributor_id");

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
CREATE INDEX "equipment_owner_id_idx" ON "equipment"("owner_id");

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

-- CreateIndex
CREATE INDEX "equipment_availability_equipment_id_idx" ON "equipment_availability"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_availability_start_date_idx" ON "equipment_availability"("start_date");

-- CreateIndex
CREATE INDEX "equipment_availability_end_date_idx" ON "equipment_availability"("end_date");

-- CreateIndex
CREATE INDEX "equipment_availability_slots_status_idx" ON "equipment_availability"("status");

-- CreateIndex
CREATE INDEX "equipment_availability_project_id_idx" ON "equipment_availability"("project_id");

-- CreateIndex
CREATE INDEX "equipment_availability_inquiry_id_idx" ON "equipment_availability"("inquiry_id");

-- CreateIndex
CREATE INDEX "locations_library_brand_id_idx" ON "locations_library"("brand_id");

-- CreateIndex
CREATE INDEX "location_spaces_location_id_idx" ON "location_spaces"("location_id");

-- CreateIndex
CREATE INDEX "floor_plans_space_id_idx" ON "floor_plans"("space_id");

-- CreateIndex
CREATE INDEX "floor_plans_project_id_idx" ON "floor_plans"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "floor_plans_space_id_project_id_version_key" ON "floor_plans"("space_id", "project_id", "version");

-- CreateIndex
CREATE INDEX "floor_plan_objects_brand_id_idx" ON "floor_plan_objects"("brand_id");

-- CreateIndex
CREATE INDEX "floor_plan_objects_category_idx" ON "floor_plan_objects"("category");

-- CreateIndex
CREATE INDEX "films_brand_id_idx" ON "films"("brand_id");

-- CreateIndex
CREATE INDEX "films_montage_preset_id_idx" ON "films"("montage_preset_id");

-- CreateIndex
CREATE INDEX "film_equipment_assignments_film_id_idx" ON "film_equipment_assignments"("film_id");

-- CreateIndex
CREATE INDEX "film_equipment_assignments_equipment_id_idx" ON "film_equipment_assignments"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_equipment_assignments_film_id_equipment_id_key" ON "film_equipment_assignments"("film_id", "equipment_id");

-- CreateIndex
CREATE INDEX "equipment_templates_brand_id_idx" ON "equipment_templates"("brand_id");

-- CreateIndex
CREATE INDEX "equipment_template_items_template_id_idx" ON "equipment_template_items"("template_id");

-- CreateIndex
CREATE INDEX "equipment_template_items_equipment_id_idx" ON "equipment_template_items"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_template_items_template_id_slot_type_slot_index_key" ON "equipment_template_items"("template_id", "slot_type", "slot_index");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_film_id_idx" ON "film_timeline_tracks_v2"("film_id");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_type_idx" ON "film_timeline_tracks_v2"("type");

-- CreateIndex
CREATE INDEX "film_timeline_tracks_v2_contributor_id_idx" ON "film_timeline_tracks_v2"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_timeline_tracks_v2_film_id_name_key" ON "film_timeline_tracks_v2"("film_id", "name");

-- CreateIndex
CREATE INDEX "subject_templates_brand_id_idx" ON "subject_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_templates_brand_id_name_key" ON "subject_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "subject_roles_brand_id_idx" ON "subject_roles"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_roles_brand_id_role_name_key" ON "subject_roles"("brand_id", "role_name");

-- CreateIndex
CREATE INDEX "film_subjects_film_id_idx" ON "film_subjects"("film_id");

-- CreateIndex
CREATE INDEX "film_subjects_role_template_id_idx" ON "film_subjects"("role_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_subjects_film_id_name_key" ON "film_subjects"("film_id", "name");

-- CreateIndex
CREATE INDEX "film_locations_film_id_idx" ON "film_locations"("film_id");

-- CreateIndex
CREATE INDEX "film_locations_location_id_idx" ON "film_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_locations_film_id_location_id_key" ON "film_locations"("film_id", "location_id");

-- CreateIndex
CREATE INDEX "scene_templates_brand_id_idx" ON "scene_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_templates_brand_id_name_key" ON "scene_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "scene_template_suggested_subjects_scene_template_id_idx" ON "scene_template_suggested_subjects"("scene_template_id");

-- CreateIndex
CREATE INDEX "scene_template_suggested_subjects_subject_template_id_idx" ON "scene_template_suggested_subjects"("subject_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_template_suggested_subjects_scene_template_id_subject_key" ON "scene_template_suggested_subjects"("scene_template_id", "subject_template_id");

-- CreateIndex
CREATE INDEX "scene_moment_templates_scene_template_id_idx" ON "scene_moment_templates"("scene_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_moment_templates_scene_template_id_order_index_key" ON "scene_moment_templates"("scene_template_id", "order_index");

-- CreateIndex
CREATE INDEX "film_scenes_film_id_idx" ON "film_scenes"("film_id");

-- CreateIndex
CREATE INDEX "film_scenes_scene_template_id_idx" ON "film_scenes"("scene_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_locations_scene_id_key" ON "film_scene_locations"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_locations_scene_id_idx" ON "film_scene_locations"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_locations_location_id_idx" ON "film_scene_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_recording_setups_scene_id_key" ON "scene_recording_setups"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_subjects_scene_id_idx" ON "film_scene_subjects"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_subjects_subject_id_idx" ON "film_scene_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_subjects_scene_id_subject_id_key" ON "film_scene_subjects"("scene_id", "subject_id");

-- CreateIndex
CREATE INDEX "film_scene_moment_subjects_moment_id_idx" ON "film_scene_moment_subjects"("moment_id");

-- CreateIndex
CREATE INDEX "film_scene_moment_subjects_subject_id_idx" ON "film_scene_moment_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_moment_subjects_moment_id_subject_id_key" ON "film_scene_moment_subjects"("moment_id", "subject_id");

-- CreateIndex
CREATE INDEX "scene_camera_assignments_recording_setup_id_idx" ON "scene_camera_assignments"("recording_setup_id");

-- CreateIndex
CREATE INDEX "scene_camera_assignments_track_id_idx" ON "scene_camera_assignments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_camera_assignments_recording_setup_id_track_id_key" ON "scene_camera_assignments"("recording_setup_id", "track_id");

-- CreateIndex
CREATE INDEX "film_scene_moments_film_scene_id_idx" ON "film_scene_moments"("film_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_moments_film_scene_id_order_index_key" ON "film_scene_moments"("film_scene_id", "order_index");

-- CreateIndex
CREATE INDEX "film_scene_beats_film_scene_id_idx" ON "film_scene_beats"("film_scene_id");

-- CreateIndex
CREATE INDEX "film_scene_beats_source_activity_id_idx" ON "film_scene_beats"("source_activity_id");

-- CreateIndex
CREATE INDEX "film_scene_beats_source_moment_id_idx" ON "film_scene_beats"("source_moment_id");

-- CreateIndex
CREATE INDEX "film_scene_beats_source_scene_id_idx" ON "film_scene_beats"("source_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_beats_film_scene_id_order_index_key" ON "film_scene_beats"("film_scene_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "beat_recording_setups_beat_id_key" ON "beat_recording_setups"("beat_id");

-- CreateIndex
CREATE INDEX "beat_recording_setups_beat_id_idx" ON "beat_recording_setups"("beat_id");

-- CreateIndex
CREATE UNIQUE INDEX "moment_recording_setups_moment_id_key" ON "moment_recording_setups"("moment_id");

-- CreateIndex
CREATE INDEX "camera_subject_assignments_recording_setup_id_idx" ON "camera_subject_assignments"("recording_setup_id");

-- CreateIndex
CREATE INDEX "camera_subject_assignments_track_id_idx" ON "camera_subject_assignments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "camera_subject_assignments_recording_setup_id_track_id_key" ON "camera_subject_assignments"("recording_setup_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_music_film_scene_id_key" ON "scene_music"("film_scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "moment_music_moment_id_key" ON "moment_music"("moment_id");

-- CreateIndex
CREATE INDEX "montage_presets_brand_id_idx" ON "montage_presets"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "montage_presets_brand_id_name_key" ON "montage_presets"("brand_id", "name");

-- CreateIndex
CREATE INDEX "film_structure_templates_brand_id_idx" ON "film_structure_templates"("brand_id");

-- CreateIndex
CREATE INDEX "film_structure_templates_film_type_idx" ON "film_structure_templates"("film_type");

-- CreateIndex
CREATE UNIQUE INDEX "film_structure_templates_brand_id_name_key" ON "film_structure_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "film_structure_template_scenes_film_structure_template_id_idx" ON "film_structure_template_scenes"("film_structure_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_structure_template_scenes_film_structure_template_id_o_key" ON "film_structure_template_scenes"("film_structure_template_id", "order_index");

-- CreateIndex
CREATE INDEX "scene_audio_sources_scene_id_idx" ON "scene_audio_sources"("scene_id");

-- CreateIndex
CREATE INDEX "scene_audio_sources_source_activity_id_idx" ON "scene_audio_sources"("source_activity_id");

-- CreateIndex
CREATE INDEX "scene_audio_sources_source_moment_id_idx" ON "scene_audio_sources"("source_moment_id");

-- CreateIndex
CREATE INDEX "scene_audio_sources_source_scene_id_idx" ON "scene_audio_sources"("source_scene_id");

-- CreateIndex
CREATE INDEX "service_packages_brand_id_idx" ON "service_packages"("brand_id");

-- CreateIndex
CREATE INDEX "service_packages_category_id_idx" ON "service_packages"("category_id");

-- CreateIndex
CREATE INDEX "service_packages_wedding_type_id_idx" ON "service_packages"("wedding_type_id");

-- CreateIndex
CREATE INDEX "service_packages_workflow_template_id_idx" ON "service_packages"("workflow_template_id");

-- CreateIndex
CREATE INDEX "service_package_categories_brand_id_idx" ON "service_package_categories"("brand_id");

-- CreateIndex
CREATE INDEX "service_package_categories_event_type_id_idx" ON "service_package_categories"("event_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_categories_brand_id_name_key" ON "service_package_categories"("brand_id", "name");

-- CreateIndex
CREATE INDEX "schedule_presets_brand_id_idx" ON "schedule_presets"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_presets_brand_id_name_key" ON "schedule_presets"("brand_id", "name");

-- CreateIndex
CREATE INDEX "event_types_brand_id_idx" ON "event_types"("brand_id");

-- CreateIndex
CREATE INDEX "event_types_is_system_idx" ON "event_types"("is_system");

-- CreateIndex
CREATE INDEX "event_types_is_active_idx" ON "event_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_brand_id_name_key" ON "event_types"("brand_id", "name");

-- CreateIndex
CREATE INDEX "event_type_days_event_type_id_idx" ON "event_type_days"("event_type_id");

-- CreateIndex
CREATE INDEX "event_type_days_event_day_template_id_idx" ON "event_type_days"("event_day_template_id");

-- CreateIndex
CREATE INDEX "event_type_days_event_subtype_id_idx" ON "event_type_days"("event_subtype_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_days_event_type_id_event_day_template_id_key" ON "event_type_days"("event_type_id", "event_day_template_id");

-- CreateIndex
CREATE INDEX "event_type_subjects_event_type_id_idx" ON "event_type_subjects"("event_type_id");

-- CreateIndex
CREATE INDEX "event_type_subjects_subject_role_id_idx" ON "event_type_subjects"("subject_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_subjects_event_type_id_subject_role_id_key" ON "event_type_subjects"("event_type_id", "subject_role_id");

-- CreateIndex
CREATE INDEX "event_days_brand_id_idx" ON "event_days"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_days_brand_id_name_key" ON "event_days"("brand_id", "name");

-- CreateIndex
CREATE INDEX "event_day_activities_event_day_template_id_idx" ON "event_day_activities"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_day_activities_event_day_template_id_name_key" ON "event_day_activities"("event_day_template_id", "name");

-- CreateIndex
CREATE INDEX "event_day_activity_moments_event_day_activity_preset_id_idx" ON "event_day_activity_moments"("event_day_activity_preset_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_day_activity_moments_event_day_activity_preset_id_ord_key" ON "event_day_activity_moments"("event_day_activity_preset_id", "order_index");

-- CreateIndex
CREATE INDEX "event_day_subject_roles_event_day_id_idx" ON "event_day_subject_roles"("event_day_id");

-- CreateIndex
CREATE INDEX "event_day_subject_roles_subject_role_id_idx" ON "event_day_subject_roles"("subject_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_day_subject_roles_event_day_id_subject_role_id_key" ON "event_day_subject_roles"("event_day_id", "subject_role_id");

-- CreateIndex
CREATE INDEX "event_subtypes_brand_id_idx" ON "event_subtypes"("brand_id");

-- CreateIndex
CREATE INDEX "event_subtypes_event_type_id_idx" ON "event_subtypes"("event_type_id");

-- CreateIndex
CREATE INDEX "event_subtypes_is_system_seeded_idx" ON "event_subtypes"("is_system_seeded");

-- CreateIndex
CREATE INDEX "event_subtypes_is_active_idx" ON "event_subtypes"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtypes_brand_id_name_key" ON "event_subtypes"("brand_id", "name");

-- CreateIndex
CREATE INDEX "event_subtype_activities_wedding_type_id_idx" ON "event_subtype_activities"("wedding_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtype_activities_wedding_type_id_order_index_key" ON "event_subtype_activities"("wedding_type_id", "order_index");

-- CreateIndex
CREATE INDEX "event_subtype_activity_moments_wedding_type_activity_id_idx" ON "event_subtype_activity_moments"("wedding_type_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtype_activity_moments_wedding_type_activity_id_ord_key" ON "event_subtype_activity_moments"("wedding_type_activity_id", "order_index");

-- CreateIndex
CREATE INDEX "event_subtype_locations_wedding_type_id_idx" ON "event_subtype_locations"("wedding_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtype_locations_wedding_type_id_order_index_key" ON "event_subtype_locations"("wedding_type_id", "order_index");

-- CreateIndex
CREATE INDEX "event_subtype_subjects_wedding_type_id_idx" ON "event_subtype_subjects"("wedding_type_id");

-- CreateIndex
CREATE INDEX "event_subtype_subjects_subject_role_id_idx" ON "event_subtype_subjects"("subject_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtype_subjects_wedding_type_id_order_index_key" ON "event_subtype_subjects"("wedding_type_id", "order_index");

-- CreateIndex
CREATE INDEX "event_subtype_activity_locations_wedding_type_activity_id_idx" ON "event_subtype_activity_locations"("wedding_type_activity_id");

-- CreateIndex
CREATE INDEX "event_subtype_activity_locations_wedding_type_location_id_idx" ON "event_subtype_activity_locations"("wedding_type_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtype_activity_locations_wedding_type_activity_id_w_key" ON "event_subtype_activity_locations"("wedding_type_activity_id", "wedding_type_location_id");

-- CreateIndex
CREATE INDEX "event_subtype_activity_subjects_wedding_type_activity_id_idx" ON "event_subtype_activity_subjects"("wedding_type_activity_id");

-- CreateIndex
CREATE INDEX "event_subtype_activity_subjects_wedding_type_subject_id_idx" ON "event_subtype_activity_subjects"("wedding_type_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_subtype_activity_subjects_wedding_type_activity_id_we_key" ON "event_subtype_activity_subjects"("wedding_type_activity_id", "wedding_type_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "film_scene_schedules_scene_id_key" ON "film_scene_schedules"("scene_id");

-- CreateIndex
CREATE INDEX "film_scene_schedules_film_id_idx" ON "film_scene_schedules"("film_id");

-- CreateIndex
CREATE INDEX "film_scene_schedules_event_day_template_id_idx" ON "film_scene_schedules"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_event_days_package_id_idx" ON "package_event_days"("package_id");

-- CreateIndex
CREATE INDEX "package_event_days_event_day_template_id_idx" ON "package_event_days"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_event_days_package_id_event_day_template_id_key" ON "package_event_days"("package_id", "event_day_template_id");

-- CreateIndex
CREATE INDEX "package_activities_package_id_idx" ON "package_activities"("package_id");

-- CreateIndex
CREATE INDEX "package_activities_package_event_day_id_idx" ON "package_activities"("package_event_day_id");

-- CreateIndex
CREATE INDEX "package_activity_moments_package_activity_id_idx" ON "package_activity_moments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_activity_moments_package_activity_id_order_index_key" ON "package_activity_moments"("package_activity_id", "order_index");

-- CreateIndex
CREATE INDEX "package_day_operators_package_id_idx" ON "package_day_operators"("package_id");

-- CreateIndex
CREATE INDEX "package_day_operators_event_day_template_id_idx" ON "package_day_operators"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_day_operators_contributor_id_idx" ON "package_day_operators"("contributor_id");

-- CreateIndex
CREATE INDEX "package_day_operators_package_activity_id_idx" ON "package_day_operators"("package_activity_id");

-- CreateIndex
CREATE INDEX "package_day_operators_job_role_id_idx" ON "package_day_operators"("job_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_day_operators_package_id_event_day_template_id_posi_key" ON "package_day_operators"("package_id", "event_day_template_id", "position_name");

-- CreateIndex
CREATE INDEX "package_day_operator_equipment_package_day_operator_id_idx" ON "package_day_operator_equipment"("package_day_operator_id");

-- CreateIndex
CREATE INDEX "package_day_operator_equipment_equipment_id_idx" ON "package_day_operator_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_day_operator_equipment_package_day_operator_id_equi_key" ON "package_day_operator_equipment"("package_day_operator_id", "equipment_id");

-- CreateIndex
CREATE INDEX "package_day_subjects_package_id_idx" ON "package_day_subjects"("package_id");

-- CreateIndex
CREATE INDEX "package_day_subjects_event_day_template_id_idx" ON "package_day_subjects"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_day_subjects_role_template_id_idx" ON "package_day_subjects"("role_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_day_subjects_package_id_event_day_template_id_name_key" ON "package_day_subjects"("package_id", "event_day_template_id", "name");

-- CreateIndex
CREATE INDEX "package_event_day_locations_package_id_idx" ON "package_event_day_locations"("package_id");

-- CreateIndex
CREATE INDEX "package_event_day_locations_event_day_template_id_idx" ON "package_event_day_locations"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_event_day_locations_package_activity_id_idx" ON "package_event_day_locations"("package_activity_id");

-- CreateIndex
CREATE INDEX "package_event_day_locations_location_id_idx" ON "package_event_day_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_event_day_locations_package_id_event_day_template_i_key" ON "package_event_day_locations"("package_id", "event_day_template_id", "location_id");

-- CreateIndex
CREATE INDEX "package_films_package_id_idx" ON "package_films"("package_id");

-- CreateIndex
CREATE INDEX "package_films_film_id_idx" ON "package_films"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_films_package_id_film_id_key" ON "package_films"("package_id", "film_id");

-- CreateIndex
CREATE INDEX "package_film_scene_schedules_package_film_id_idx" ON "package_film_scene_schedules"("package_film_id");

-- CreateIndex
CREATE INDEX "package_film_scene_schedules_event_day_template_id_idx" ON "package_film_scene_schedules"("event_day_template_id");

-- CreateIndex
CREATE INDEX "package_film_scene_schedules_package_activity_id_idx" ON "package_film_scene_schedules"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_film_scene_schedules_package_film_id_scene_id_key" ON "package_film_scene_schedules"("package_film_id", "scene_id");

-- CreateIndex
CREATE INDEX "project_event_days_project_id_idx" ON "project_event_days"("project_id");

-- CreateIndex
CREATE INDEX "project_event_days_inquiry_id_idx" ON "project_event_days"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_event_days_event_day_template_id_idx" ON "project_event_days"("event_day_template_id");

-- CreateIndex
CREATE INDEX "project_activities_project_id_idx" ON "project_activities"("project_id");

-- CreateIndex
CREATE INDEX "project_activities_inquiry_id_idx" ON "project_activities"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_activities_project_event_day_id_idx" ON "project_activities"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_activities_package_activity_id_idx" ON "project_activities"("package_activity_id");

-- CreateIndex
CREATE INDEX "project_films_project_id_idx" ON "project_films"("project_id");

-- CreateIndex
CREATE INDEX "project_films_inquiry_id_idx" ON "project_films"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_films_film_id_idx" ON "project_films"("film_id");

-- CreateIndex
CREATE INDEX "project_films_package_film_id_idx" ON "project_films"("package_film_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_films_project_id_film_id_key" ON "project_films"("project_id", "film_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_films_inquiry_id_film_id_key" ON "project_films"("inquiry_id", "film_id");

-- CreateIndex
CREATE INDEX "project_film_scene_schedules_project_film_id_idx" ON "project_film_scene_schedules"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_scene_schedules_project_event_day_id_idx" ON "project_film_scene_schedules"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_film_scene_schedules_project_activity_id_idx" ON "project_film_scene_schedules"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_film_scene_schedules_project_film_id_scene_id_key" ON "project_film_scene_schedules"("project_film_id", "scene_id");

-- CreateIndex
CREATE INDEX "project_film_timeline_tracks_project_id_idx" ON "project_film_timeline_tracks"("project_id");

-- CreateIndex
CREATE INDEX "project_film_timeline_tracks_inquiry_id_idx" ON "project_film_timeline_tracks"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_timeline_tracks_project_film_id_idx" ON "project_film_timeline_tracks"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_timeline_tracks_source_track_id_idx" ON "project_film_timeline_tracks"("source_track_id");

-- CreateIndex
CREATE INDEX "project_film_timeline_tracks_contributor_id_idx" ON "project_film_timeline_tracks"("contributor_id");

-- CreateIndex
CREATE INDEX "project_film_subjects_project_id_idx" ON "project_film_subjects"("project_id");

-- CreateIndex
CREATE INDEX "project_film_subjects_inquiry_id_idx" ON "project_film_subjects"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_subjects_project_film_id_idx" ON "project_film_subjects"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_subjects_source_subject_id_idx" ON "project_film_subjects"("source_subject_id");

-- CreateIndex
CREATE INDEX "project_film_subjects_role_template_id_idx" ON "project_film_subjects"("role_template_id");

-- CreateIndex
CREATE INDEX "project_film_locations_project_id_idx" ON "project_film_locations"("project_id");

-- CreateIndex
CREATE INDEX "project_film_locations_inquiry_id_idx" ON "project_film_locations"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_locations_project_film_id_idx" ON "project_film_locations"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_locations_source_location_id_idx" ON "project_film_locations"("source_location_id");

-- CreateIndex
CREATE INDEX "project_film_locations_location_id_idx" ON "project_film_locations"("location_id");

-- CreateIndex
CREATE INDEX "project_film_scenes_project_id_idx" ON "project_film_scenes"("project_id");

-- CreateIndex
CREATE INDEX "project_film_scenes_inquiry_id_idx" ON "project_film_scenes"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_scenes_project_film_id_idx" ON "project_film_scenes"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_scenes_source_scene_id_idx" ON "project_film_scenes"("source_scene_id");

-- CreateIndex
CREATE INDEX "project_film_scenes_scene_template_id_idx" ON "project_film_scenes"("scene_template_id");

-- CreateIndex
CREATE INDEX "project_film_scene_moments_project_id_idx" ON "project_film_scene_moments"("project_id");

-- CreateIndex
CREATE INDEX "project_film_scene_moments_inquiry_id_idx" ON "project_film_scene_moments"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_scene_moments_project_scene_id_idx" ON "project_film_scene_moments"("project_scene_id");

-- CreateIndex
CREATE INDEX "project_film_scene_moments_source_moment_id_idx" ON "project_film_scene_moments"("source_moment_id");

-- CreateIndex
CREATE INDEX "project_film_scene_beats_project_id_idx" ON "project_film_scene_beats"("project_id");

-- CreateIndex
CREATE INDEX "project_film_scene_beats_inquiry_id_idx" ON "project_film_scene_beats"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_scene_beats_project_scene_id_idx" ON "project_film_scene_beats"("project_scene_id");

-- CreateIndex
CREATE INDEX "project_film_scene_beats_source_beat_id_idx" ON "project_film_scene_beats"("source_beat_id");

-- CreateIndex
CREATE INDEX "project_film_scene_subjects_project_scene_id_idx" ON "project_film_scene_subjects"("project_scene_id");

-- CreateIndex
CREATE INDEX "project_film_scene_subjects_project_film_subject_id_idx" ON "project_film_scene_subjects"("project_film_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_film_scene_subjects_project_scene_id_project_film_s_key" ON "project_film_scene_subjects"("project_scene_id", "project_film_subject_id");

-- CreateIndex
CREATE INDEX "project_film_scene_moment_subjects_project_moment_id_idx" ON "project_film_scene_moment_subjects"("project_moment_id");

-- CreateIndex
CREATE INDEX "project_film_scene_moment_subjects_project_film_subject_id_idx" ON "project_film_scene_moment_subjects"("project_film_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_film_scene_moment_subjects_project_moment_id_projec_key" ON "project_film_scene_moment_subjects"("project_moment_id", "project_film_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_film_scene_locations_project_scene_id_key" ON "project_film_scene_locations"("project_scene_id");

-- CreateIndex
CREATE INDEX "project_film_scene_locations_project_scene_id_idx" ON "project_film_scene_locations"("project_scene_id");

-- CreateIndex
CREATE INDEX "project_film_scene_locations_location_id_idx" ON "project_film_scene_locations"("location_id");

-- CreateIndex
CREATE INDEX "project_film_equipment_assignments_project_id_idx" ON "project_film_equipment_assignments"("project_id");

-- CreateIndex
CREATE INDEX "project_film_equipment_assignments_inquiry_id_idx" ON "project_film_equipment_assignments"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_film_equipment_assignments_project_film_id_idx" ON "project_film_equipment_assignments"("project_film_id");

-- CreateIndex
CREATE INDEX "project_film_equipment_assignments_equipment_id_idx" ON "project_film_equipment_assignments"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_film_equipment_assignments_project_film_id_equipmen_key" ON "project_film_equipment_assignments"("project_film_id", "equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_scene_recording_setups_project_scene_id_key" ON "project_scene_recording_setups"("project_scene_id");

-- CreateIndex
CREATE INDEX "project_scene_camera_assignments_recording_setup_id_idx" ON "project_scene_camera_assignments"("recording_setup_id");

-- CreateIndex
CREATE INDEX "project_scene_camera_assignments_track_id_idx" ON "project_scene_camera_assignments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_scene_camera_assignments_recording_setup_id_track_i_key" ON "project_scene_camera_assignments"("recording_setup_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_moment_recording_setups_project_moment_id_key" ON "project_moment_recording_setups"("project_moment_id");

-- CreateIndex
CREATE INDEX "project_camera_subject_assignments_recording_setup_id_idx" ON "project_camera_subject_assignments"("recording_setup_id");

-- CreateIndex
CREATE INDEX "project_camera_subject_assignments_track_id_idx" ON "project_camera_subject_assignments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_camera_subject_assignments_recording_setup_id_track_key" ON "project_camera_subject_assignments"("recording_setup_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_beat_recording_setups_project_beat_id_key" ON "project_beat_recording_setups"("project_beat_id");

-- CreateIndex
CREATE INDEX "project_beat_recording_setups_project_beat_id_idx" ON "project_beat_recording_setups"("project_beat_id");

-- CreateIndex
CREATE INDEX "project_activity_moments_project_id_idx" ON "project_activity_moments"("project_id");

-- CreateIndex
CREATE INDEX "project_activity_moments_inquiry_id_idx" ON "project_activity_moments"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_activity_moments_project_activity_id_idx" ON "project_activity_moments"("project_activity_id");

-- CreateIndex
CREATE INDEX "project_day_subjects_project_id_idx" ON "project_day_subjects"("project_id");

-- CreateIndex
CREATE INDEX "project_day_subjects_inquiry_id_idx" ON "project_day_subjects"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_day_subjects_project_event_day_id_idx" ON "project_day_subjects"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_day_subjects_role_template_id_idx" ON "project_day_subjects"("role_template_id");

-- CreateIndex
CREATE INDEX "project_day_subjects_contact_id_idx" ON "project_day_subjects"("contact_id");

-- CreateIndex
CREATE INDEX "project_location_slots_project_id_idx" ON "project_location_slots"("project_id");

-- CreateIndex
CREATE INDEX "project_location_slots_inquiry_id_idx" ON "project_location_slots"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_location_slots_project_event_day_id_idx" ON "project_location_slots"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_location_slots_location_id_idx" ON "project_location_slots"("location_id");

-- CreateIndex
CREATE INDEX "project_day_operators_project_id_idx" ON "project_day_operators"("project_id");

-- CreateIndex
CREATE INDEX "project_day_operators_inquiry_id_idx" ON "project_day_operators"("inquiry_id");

-- CreateIndex
CREATE INDEX "project_day_operators_project_event_day_id_idx" ON "project_day_operators"("project_event_day_id");

-- CreateIndex
CREATE INDEX "project_day_operators_project_activity_id_idx" ON "project_day_operators"("project_activity_id");

-- CreateIndex
CREATE INDEX "project_day_operators_contributor_id_idx" ON "project_day_operators"("contributor_id");

-- CreateIndex
CREATE INDEX "project_day_operators_job_role_id_idx" ON "project_day_operators"("job_role_id");

-- CreateIndex
CREATE INDEX "project_day_operator_equipment_project_day_operator_id_idx" ON "project_day_operator_equipment"("project_day_operator_id");

-- CreateIndex
CREATE INDEX "project_day_operator_equipment_equipment_id_idx" ON "project_day_operator_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_day_operator_equipment_project_day_operator_id_equi_key" ON "project_day_operator_equipment"("project_day_operator_id", "equipment_id");

-- CreateIndex
CREATE INDEX "project_operator_activity_assignments_project_day_operator__idx" ON "project_operator_activity_assignments"("project_day_operator_id");

-- CreateIndex
CREATE INDEX "project_operator_activity_assignments_project_activity_id_idx" ON "project_operator_activity_assignments"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_operator_activity_assignments_project_day_operator__key" ON "project_operator_activity_assignments"("project_day_operator_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "project_day_subject_activities_project_day_subject_id_idx" ON "project_day_subject_activities"("project_day_subject_id");

-- CreateIndex
CREATE INDEX "project_day_subject_activities_project_activity_id_idx" ON "project_day_subject_activities"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_day_subject_activities_project_day_subject_id_proje_key" ON "project_day_subject_activities"("project_day_subject_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "project_location_activity_assignments_project_location_slot_idx" ON "project_location_activity_assignments"("project_location_slot_id");

-- CreateIndex
CREATE INDEX "project_location_activity_assignments_project_activity_id_idx" ON "project_location_activity_assignments"("project_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_location_activity_assignments_project_location_slot_key" ON "project_location_activity_assignments"("project_location_slot_id", "project_activity_id");

-- CreateIndex
CREATE INDEX "operator_activity_assignments_package_day_operator_id_idx" ON "operator_activity_assignments"("package_day_operator_id");

-- CreateIndex
CREATE INDEX "operator_activity_assignments_package_activity_id_idx" ON "operator_activity_assignments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "operator_activity_assignments_package_day_operator_id_packa_key" ON "operator_activity_assignments"("package_day_operator_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "package_day_subject_activities_package_day_subject_id_idx" ON "package_day_subject_activities"("package_day_subject_id");

-- CreateIndex
CREATE INDEX "package_day_subject_activities_package_activity_id_idx" ON "package_day_subject_activities"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_day_subject_activities_package_day_subject_id_packa_key" ON "package_day_subject_activities"("package_day_subject_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "package_location_slots_package_id_idx" ON "package_location_slots"("package_id");

-- CreateIndex
CREATE INDEX "package_location_slots_event_day_template_id_idx" ON "package_location_slots"("event_day_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_location_slots_package_id_event_day_template_id_loc_key" ON "package_location_slots"("package_id", "event_day_template_id", "location_number");

-- CreateIndex
CREATE INDEX "location_activity_assignments_package_location_slot_id_idx" ON "location_activity_assignments"("package_location_slot_id");

-- CreateIndex
CREATE INDEX "location_activity_assignments_package_activity_id_idx" ON "location_activity_assignments"("package_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_activity_assignments_package_location_slot_id_pack_key" ON "location_activity_assignments"("package_location_slot_id", "package_activity_id");

-- CreateIndex
CREATE INDEX "package_versions_package_id_idx" ON "package_versions"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_versions_package_id_version_number_key" ON "package_versions"("package_id", "version_number");

-- CreateIndex
CREATE INDEX "package_task_overrides_package_id_idx" ON "package_task_overrides"("package_id");

-- CreateIndex
CREATE INDEX "package_sets_brand_id_idx" ON "package_sets"("brand_id");

-- CreateIndex
CREATE INDEX "package_sets_category_id_idx" ON "package_sets"("category_id");

-- CreateIndex
CREATE INDEX "package_sets_event_type_id_idx" ON "package_sets"("event_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_sets_brand_id_name_key" ON "package_sets"("brand_id", "name");

-- CreateIndex
CREATE INDEX "package_set_slots_package_set_id_idx" ON "package_set_slots"("package_set_id");

-- CreateIndex
CREATE INDEX "package_set_slots_service_package_id_idx" ON "package_set_slots"("service_package_id");

-- CreateIndex
CREATE INDEX "payment_schedule_templates_brand_id_idx" ON "payment_schedule_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedule_templates_brand_id_name_key" ON "payment_schedule_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "payment_schedule_rules_template_id_idx" ON "payment_schedule_rules"("template_id");

-- CreateIndex
CREATE INDEX "crew_payment_templates_brand_id_idx" ON "crew_payment_templates"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "crew_payment_templates_brand_id_name_key" ON "crew_payment_templates"("brand_id", "name");

-- CreateIndex
CREATE INDEX "crew_payment_rules_template_id_idx" ON "crew_payment_rules"("template_id");

-- CreateIndex
CREATE INDEX "crew_payment_rules_task_library_id_idx" ON "crew_payment_rules"("task_library_id");

-- CreateIndex
CREATE INDEX "estimate_payment_milestones_estimate_id_idx" ON "estimate_payment_milestones"("estimate_id");

-- CreateIndex
CREATE INDEX "contract_clause_categories_brand_id_idx" ON "contract_clause_categories"("brand_id");

-- CreateIndex
CREATE INDEX "contract_clause_categories_brand_id_country_code_idx" ON "contract_clause_categories"("brand_id", "country_code");

-- CreateIndex
CREATE INDEX "contract_clauses_category_id_idx" ON "contract_clauses"("category_id");

-- CreateIndex
CREATE INDEX "contract_clauses_brand_id_idx" ON "contract_clauses"("brand_id");

-- CreateIndex
CREATE INDEX "contract_clauses_brand_id_clause_type_idx" ON "contract_clauses"("brand_id", "clause_type");

-- CreateIndex
CREATE INDEX "contract_templates_brand_id_idx" ON "contract_templates"("brand_id");

-- CreateIndex
CREATE INDEX "tmpl_clauses_template_id_idx" ON "contract_template_clauses"("template_id");

-- CreateIndex
CREATE INDEX "tmpl_clauses_clause_id_idx" ON "contract_template_clauses"("clause_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_template_clauses_template_id_clause_id_key" ON "contract_template_clauses"("template_id", "clause_id");

-- CreateIndex
CREATE INDEX "package_requests_inquiry_id_idx" ON "package_requests"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_equipment_reservations_inquiry_id_idx" ON "inquiry_equipment_reservations"("inquiry_id");

-- CreateIndex
CREATE INDEX "inquiry_equipment_reservations_equipment_id_idx" ON "inquiry_equipment_reservations"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_equipment_reservations_inquiry_id_project_day_opera_key" ON "inquiry_equipment_reservations"("inquiry_id", "project_day_operator_equipment_id");

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brands" ADD CONSTRAINT "user_brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage" ADD CONSTRAINT "coverage_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_library" ADD CONSTRAINT "film_library_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editing_styles" ADD CONSTRAINT "editing_styles_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_music_tracks" ADD CONSTRAINT "film_music_tracks_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_equipment" ADD CONSTRAINT "film_equipment_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_timeline_tracks" ADD CONSTRAINT "film_timeline_tracks_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_selected_package_id_fkey" FOREIGN KEY ("selected_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_source_package_id_fkey" FOREIGN KEY ("source_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_preferred_payment_schedule_template_id_fkey" FOREIGN KEY ("preferred_payment_schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_templates" ADD CONSTRAINT "needs_assessment_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_questions" ADD CONSTRAINT "needs_assessment_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "needs_assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "needs_assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs_assessment_submissions" ADD CONSTRAINT "needs_assessment_submissions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_templates" ADD CONSTRAINT "discovery_questionnaire_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_questions" ADD CONSTRAINT "discovery_questionnaire_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "discovery_questionnaire_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_submissions" ADD CONSTRAINT "discovery_questionnaire_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "discovery_questionnaire_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_submissions" ADD CONSTRAINT "discovery_questionnaire_submissions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_questionnaire_submissions" ADD CONSTRAINT "discovery_questionnaire_submissions_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_source_package_id_fkey" FOREIGN KEY ("source_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_default_camera_id_fkey" FOREIGN KEY ("default_camera_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_skill_rates" ADD CONSTRAINT "contributor_skill_rates_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_skill_rates" ADD CONSTRAINT "contributor_skill_rates_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_brackets" ADD CONSTRAINT "payment_brackets_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_job_roles" ADD CONSTRAINT "contributor_job_roles_payment_bracket_id_fkey" FOREIGN KEY ("payment_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_schedule_template_id_fkey" FOREIGN KEY ("schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_snapshots" ADD CONSTRAINT "estimate_snapshots_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_schedule_template_id_fkey" FOREIGN KEY ("schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_payment_milestones" ADD CONSTRAINT "quote_payment_milestones_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signers" ADD CONSTRAINT "contract_signers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_feedback_surveys" ADD CONSTRAINT "client_feedback_surveys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_tokens" ADD CONSTRAINT "calendar_sync_tokens_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "film_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_editing_sessions" ADD CONSTRAINT "timeline_editing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "coverage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_generation_rules" ADD CONSTRAINT "task_generation_rules_workflow_stage_id_fkey" FOREIGN KEY ("workflow_stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template_tasks" ADD CONSTRAINT "workflow_template_tasks_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template_tasks" ADD CONSTRAINT "workflow_template_tasks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_task_log" ADD CONSTRAINT "generated_task_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_task_log" ADD CONSTRAINT "generated_task_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_default_tasks" ADD CONSTRAINT "entity_default_tasks_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_payment_bracket_id_fkey" FOREIGN KEY ("payment_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_role_mappings" ADD CONSTRAINT "skill_role_mappings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_default_job_role_id_fkey" FOREIGN KEY ("default_job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_default_contributor_id_fkey" FOREIGN KEY ("default_contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library" ADD CONSTRAINT "task_library_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_benchmarks" ADD CONSTRAINT "task_library_benchmarks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_skill_rates" ADD CONSTRAINT "task_library_skill_rates_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_library_subtask_templates" ADD CONSTRAINT "task_library_subtask_templates_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_resolved_job_role_id_fkey" FOREIGN KEY ("resolved_job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_resolved_bracket_id_fkey" FOREIGN KEY ("resolved_bracket_id") REFERENCES "payment_brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_tasks" ADD CONSTRAINT "inquiry_tasks_parent_inquiry_task_id_fkey" FOREIGN KEY ("parent_inquiry_task_id") REFERENCES "inquiry_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks" ADD CONSTRAINT "inquiry_task_subtasks_inquiry_task_id_fkey" FOREIGN KEY ("inquiry_task_id") REFERENCES "inquiry_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks" ADD CONSTRAINT "inquiry_task_subtasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_subtasks" ADD CONSTRAINT "inquiry_task_subtasks_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_task_events" ADD CONSTRAINT "inquiry_task_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "inquiry_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_availability_requests" ADD CONSTRAINT "inquiry_availability_requests_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_availability_requests" ADD CONSTRAINT "inquiry_availability_requests_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_rented_by_id_fkey" FOREIGN KEY ("rented_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_booked_by_id_fkey" FOREIGN KEY ("booked_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_availability" ADD CONSTRAINT "equipment_availability_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations_library" ADD CONSTRAINT "locations_library_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations_library" ADD CONSTRAINT "locations_library_venue_floor_plan_updated_by_fkey" FOREIGN KEY ("venue_floor_plan_updated_by") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_spaces" ADD CONSTRAINT "location_spaces_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "location_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_objects" ADD CONSTRAINT "floor_plan_objects_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "films" ADD CONSTRAINT "films_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "films" ADD CONSTRAINT "films_montage_preset_id_fkey" FOREIGN KEY ("montage_preset_id") REFERENCES "montage_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_equipment_assignments" ADD CONSTRAINT "film_equipment_assignments_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_equipment_assignments" ADD CONSTRAINT "film_equipment_assignments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_templates" ADD CONSTRAINT "equipment_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "equipment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_template_items" ADD CONSTRAINT "equipment_template_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_timeline_tracks_v2" ADD CONSTRAINT "film_timeline_tracks_v2_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_timeline_tracks_v2" ADD CONSTRAINT "film_timeline_tracks_v2_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_templates" ADD CONSTRAINT "subject_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_roles" ADD CONSTRAINT "subject_roles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_subjects" ADD CONSTRAINT "film_subjects_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_subjects" ADD CONSTRAINT "film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_locations" ADD CONSTRAINT "film_locations_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_locations" ADD CONSTRAINT "film_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_templates" ADD CONSTRAINT "scene_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_suggested_subjects" ADD CONSTRAINT "scene_template_suggested_subjects_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_template_suggested_subjects" ADD CONSTRAINT "scene_template_suggested_subjects_subject_template_id_fkey" FOREIGN KEY ("subject_template_id") REFERENCES "subject_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_moment_templates" ADD CONSTRAINT "scene_moment_templates_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scenes" ADD CONSTRAINT "film_scenes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scenes" ADD CONSTRAINT "film_scenes_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_locations" ADD CONSTRAINT "film_scene_locations_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_locations" ADD CONSTRAINT "film_scene_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_recording_setups" ADD CONSTRAINT "scene_recording_setups_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_subjects" ADD CONSTRAINT "film_scene_subjects_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_subjects" ADD CONSTRAINT "film_scene_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "film_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_moment_subjects" ADD CONSTRAINT "film_scene_moment_subjects_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_moment_subjects" ADD CONSTRAINT "film_scene_moment_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "film_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_camera_assignments" ADD CONSTRAINT "scene_camera_assignments_recording_setup_id_fkey" FOREIGN KEY ("recording_setup_id") REFERENCES "scene_recording_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_camera_assignments" ADD CONSTRAINT "scene_camera_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "film_timeline_tracks_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_moments" ADD CONSTRAINT "film_scene_moments_film_scene_id_fkey" FOREIGN KEY ("film_scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_film_scene_id_fkey" FOREIGN KEY ("film_scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_source_activity_id_fkey" FOREIGN KEY ("source_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_source_moment_id_fkey" FOREIGN KEY ("source_moment_id") REFERENCES "package_activity_moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_beats" ADD CONSTRAINT "film_scene_beats_source_scene_id_fkey" FOREIGN KEY ("source_scene_id") REFERENCES "film_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beat_recording_setups" ADD CONSTRAINT "beat_recording_setups_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "film_scene_beats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_recording_setups" ADD CONSTRAINT "moment_recording_setups_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_subject_assignments" ADD CONSTRAINT "camera_subject_assignments_recording_setup_id_fkey" FOREIGN KEY ("recording_setup_id") REFERENCES "moment_recording_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_subject_assignments" ADD CONSTRAINT "camera_subject_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "film_timeline_tracks_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_music" ADD CONSTRAINT "scene_music_film_scene_id_fkey" FOREIGN KEY ("film_scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_music" ADD CONSTRAINT "moment_music_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montage_presets" ADD CONSTRAINT "montage_presets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_structure_templates" ADD CONSTRAINT "film_structure_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_structure_template_scenes" ADD CONSTRAINT "film_structure_template_scenes_film_structure_template_id_fkey" FOREIGN KEY ("film_structure_template_id") REFERENCES "film_structure_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_source_activity_id_fkey" FOREIGN KEY ("source_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_source_moment_id_fkey" FOREIGN KEY ("source_moment_id") REFERENCES "package_activity_moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_audio_sources" ADD CONSTRAINT "scene_audio_sources_source_scene_id_fkey" FOREIGN KEY ("source_scene_id") REFERENCES "film_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_package_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "event_subtypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_categories" ADD CONSTRAINT "service_package_categories_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_categories" ADD CONSTRAINT "service_package_categories_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_presets" ADD CONSTRAINT "schedule_presets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_days" ADD CONSTRAINT "event_type_days_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_days" ADD CONSTRAINT "event_type_days_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_days" ADD CONSTRAINT "event_type_days_event_subtype_id_fkey" FOREIGN KEY ("event_subtype_id") REFERENCES "event_subtypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_subjects" ADD CONSTRAINT "event_type_subjects_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_subjects" ADD CONSTRAINT "event_type_subjects_subject_role_id_fkey" FOREIGN KEY ("subject_role_id") REFERENCES "subject_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_days" ADD CONSTRAINT "event_days_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_day_activities" ADD CONSTRAINT "event_day_activities_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_day_activity_moments" ADD CONSTRAINT "event_day_activity_moments_event_day_activity_preset_id_fkey" FOREIGN KEY ("event_day_activity_preset_id") REFERENCES "event_day_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_day_subject_roles" ADD CONSTRAINT "event_day_subject_roles_event_day_id_fkey" FOREIGN KEY ("event_day_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_day_subject_roles" ADD CONSTRAINT "event_day_subject_roles_subject_role_id_fkey" FOREIGN KEY ("subject_role_id") REFERENCES "subject_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtypes" ADD CONSTRAINT "event_subtypes_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtypes" ADD CONSTRAINT "event_subtypes_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_activities" ADD CONSTRAINT "event_subtype_activities_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "event_subtypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_activity_moments" ADD CONSTRAINT "event_subtype_activity_moments_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "event_subtype_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_locations" ADD CONSTRAINT "event_subtype_locations_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "event_subtypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_subjects" ADD CONSTRAINT "event_subtype_subjects_wedding_type_id_fkey" FOREIGN KEY ("wedding_type_id") REFERENCES "event_subtypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_subjects" ADD CONSTRAINT "event_subtype_subjects_subject_role_id_fkey" FOREIGN KEY ("subject_role_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_activity_locations" ADD CONSTRAINT "event_subtype_activity_locations_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "event_subtype_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_activity_locations" ADD CONSTRAINT "event_subtype_activity_locations_wedding_type_location_id_fkey" FOREIGN KEY ("wedding_type_location_id") REFERENCES "event_subtype_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_activity_subjects" ADD CONSTRAINT "event_subtype_activity_subjects_wedding_type_activity_id_fkey" FOREIGN KEY ("wedding_type_activity_id") REFERENCES "event_subtype_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_subtype_activity_subjects" ADD CONSTRAINT "event_subtype_activity_subjects_wedding_type_subject_id_fkey" FOREIGN KEY ("wedding_type_subject_id") REFERENCES "event_subtype_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_schedules" ADD CONSTRAINT "film_scene_schedules_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_schedules" ADD CONSTRAINT "film_scene_schedules_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_scene_schedules" ADD CONSTRAINT "film_scene_schedules_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_days" ADD CONSTRAINT "package_event_days_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_days" ADD CONSTRAINT "package_event_days_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_activities" ADD CONSTRAINT "package_activities_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_activities" ADD CONSTRAINT "package_activities_package_event_day_id_fkey" FOREIGN KEY ("package_event_day_id") REFERENCES "package_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_activity_moments" ADD CONSTRAINT "package_activity_moments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operators" ADD CONSTRAINT "package_day_operators_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operator_equipment" ADD CONSTRAINT "package_day_operator_equipment_package_day_operator_id_fkey" FOREIGN KEY ("package_day_operator_id") REFERENCES "package_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_operator_equipment" ADD CONSTRAINT "package_day_operator_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_subjects" ADD CONSTRAINT "package_day_subjects_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_subjects" ADD CONSTRAINT "package_day_subjects_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_subjects" ADD CONSTRAINT "package_day_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_event_day_locations" ADD CONSTRAINT "package_event_day_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_films" ADD CONSTRAINT "package_films_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_films" ADD CONSTRAINT "package_films_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_package_film_id_fkey" FOREIGN KEY ("package_film_id") REFERENCES "package_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_film_scene_schedules" ADD CONSTRAINT "package_film_scene_schedules_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_days" ADD CONSTRAINT "project_event_days_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_days" ADD CONSTRAINT "project_event_days_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_event_days" ADD CONSTRAINT "project_event_days_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_films" ADD CONSTRAINT "project_films_package_film_id_fkey" FOREIGN KEY ("package_film_id") REFERENCES "package_films"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_schedules" ADD CONSTRAINT "project_film_scene_schedules_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_timeline_tracks" ADD CONSTRAINT "project_film_timeline_tracks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_timeline_tracks" ADD CONSTRAINT "project_film_timeline_tracks_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_timeline_tracks" ADD CONSTRAINT "project_film_timeline_tracks_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_timeline_tracks" ADD CONSTRAINT "project_film_timeline_tracks_source_track_id_fkey" FOREIGN KEY ("source_track_id") REFERENCES "film_timeline_tracks_v2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_timeline_tracks" ADD CONSTRAINT "project_film_timeline_tracks_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_source_subject_id_fkey" FOREIGN KEY ("source_subject_id") REFERENCES "film_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_locations" ADD CONSTRAINT "project_film_locations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_locations" ADD CONSTRAINT "project_film_locations_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_locations" ADD CONSTRAINT "project_film_locations_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_locations" ADD CONSTRAINT "project_film_locations_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "film_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_locations" ADD CONSTRAINT "project_film_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scenes" ADD CONSTRAINT "project_film_scenes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scenes" ADD CONSTRAINT "project_film_scenes_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scenes" ADD CONSTRAINT "project_film_scenes_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scenes" ADD CONSTRAINT "project_film_scenes_source_scene_id_fkey" FOREIGN KEY ("source_scene_id") REFERENCES "film_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scenes" ADD CONSTRAINT "project_film_scenes_scene_template_id_fkey" FOREIGN KEY ("scene_template_id") REFERENCES "scene_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_moments" ADD CONSTRAINT "project_film_scene_moments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_moments" ADD CONSTRAINT "project_film_scene_moments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_moments" ADD CONSTRAINT "project_film_scene_moments_project_scene_id_fkey" FOREIGN KEY ("project_scene_id") REFERENCES "project_film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_moments" ADD CONSTRAINT "project_film_scene_moments_source_moment_id_fkey" FOREIGN KEY ("source_moment_id") REFERENCES "film_scene_moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_beats" ADD CONSTRAINT "project_film_scene_beats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_beats" ADD CONSTRAINT "project_film_scene_beats_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_beats" ADD CONSTRAINT "project_film_scene_beats_project_scene_id_fkey" FOREIGN KEY ("project_scene_id") REFERENCES "project_film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_beats" ADD CONSTRAINT "project_film_scene_beats_source_beat_id_fkey" FOREIGN KEY ("source_beat_id") REFERENCES "film_scene_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_subjects" ADD CONSTRAINT "project_film_scene_subjects_project_scene_id_fkey" FOREIGN KEY ("project_scene_id") REFERENCES "project_film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_subjects" ADD CONSTRAINT "project_film_scene_subjects_project_film_subject_id_fkey" FOREIGN KEY ("project_film_subject_id") REFERENCES "project_film_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_moment_subjects" ADD CONSTRAINT "project_film_scene_moment_subjects_project_moment_id_fkey" FOREIGN KEY ("project_moment_id") REFERENCES "project_film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_moment_subjects" ADD CONSTRAINT "project_film_scene_moment_subjects_project_film_subject_id_fkey" FOREIGN KEY ("project_film_subject_id") REFERENCES "project_film_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_locations" ADD CONSTRAINT "project_film_scene_locations_project_scene_id_fkey" FOREIGN KEY ("project_scene_id") REFERENCES "project_film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_scene_locations" ADD CONSTRAINT "project_film_scene_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_equipment_assignments" ADD CONSTRAINT "project_film_equipment_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_equipment_assignments" ADD CONSTRAINT "project_film_equipment_assignments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_equipment_assignments" ADD CONSTRAINT "project_film_equipment_assignments_project_film_id_fkey" FOREIGN KEY ("project_film_id") REFERENCES "project_films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_equipment_assignments" ADD CONSTRAINT "project_film_equipment_assignments_source_assignment_id_fkey" FOREIGN KEY ("source_assignment_id") REFERENCES "film_equipment_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_film_equipment_assignments" ADD CONSTRAINT "project_film_equipment_assignments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scene_recording_setups" ADD CONSTRAINT "project_scene_recording_setups_project_scene_id_fkey" FOREIGN KEY ("project_scene_id") REFERENCES "project_film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scene_camera_assignments" ADD CONSTRAINT "project_scene_camera_assignments_recording_setup_id_fkey" FOREIGN KEY ("recording_setup_id") REFERENCES "project_scene_recording_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scene_camera_assignments" ADD CONSTRAINT "project_scene_camera_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "project_film_timeline_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scene_camera_assignments" ADD CONSTRAINT "project_scene_camera_assignments_project_scene_id_fkey" FOREIGN KEY ("project_scene_id") REFERENCES "project_film_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_moment_recording_setups" ADD CONSTRAINT "project_moment_recording_setups_project_moment_id_fkey" FOREIGN KEY ("project_moment_id") REFERENCES "project_film_scene_moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_camera_subject_assignments" ADD CONSTRAINT "project_camera_subject_assignments_recording_setup_id_fkey" FOREIGN KEY ("recording_setup_id") REFERENCES "project_moment_recording_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_camera_subject_assignments" ADD CONSTRAINT "project_camera_subject_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "project_film_timeline_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_beat_recording_setups" ADD CONSTRAINT "project_beat_recording_setups_project_beat_id_fkey" FOREIGN KEY ("project_beat_id") REFERENCES "project_film_scene_beats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "project_activity_moments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "project_activity_moments_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_moments" ADD CONSTRAINT "project_activity_moments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subjects" ADD CONSTRAINT "project_day_subjects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subjects" ADD CONSTRAINT "project_day_subjects_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subjects" ADD CONSTRAINT "project_day_subjects_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subjects" ADD CONSTRAINT "project_day_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subjects" ADD CONSTRAINT "project_day_subjects_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_slots" ADD CONSTRAINT "project_location_slots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_project_event_day_id_fkey" FOREIGN KEY ("project_event_day_id") REFERENCES "project_event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operators" ADD CONSTRAINT "project_day_operators_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operator_equipment" ADD CONSTRAINT "project_day_operator_equipment_project_day_operator_id_fkey" FOREIGN KEY ("project_day_operator_id") REFERENCES "project_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_operator_equipment" ADD CONSTRAINT "project_day_operator_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_operator_activity_assignments" ADD CONSTRAINT "project_operator_activity_assignments_project_day_operator_fkey" FOREIGN KEY ("project_day_operator_id") REFERENCES "project_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_operator_activity_assignments" ADD CONSTRAINT "project_operator_activity_assignments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subject_activities" ADD CONSTRAINT "project_day_subject_activities_project_day_subject_id_fkey" FOREIGN KEY ("project_day_subject_id") REFERENCES "project_day_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_day_subject_activities" ADD CONSTRAINT "project_day_subject_activities_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_activity_assignments" ADD CONSTRAINT "project_location_activity_assignments_project_location_slo_fkey" FOREIGN KEY ("project_location_slot_id") REFERENCES "project_location_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_location_activity_assignments" ADD CONSTRAINT "project_location_activity_assignments_project_activity_id_fkey" FOREIGN KEY ("project_activity_id") REFERENCES "project_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_activity_assignments" ADD CONSTRAINT "operator_activity_assignments_package_day_operator_id_fkey" FOREIGN KEY ("package_day_operator_id") REFERENCES "package_day_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_activity_assignments" ADD CONSTRAINT "operator_activity_assignments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_subject_activities" ADD CONSTRAINT "package_day_subject_activities_package_day_subject_id_fkey" FOREIGN KEY ("package_day_subject_id") REFERENCES "package_day_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_day_subject_activities" ADD CONSTRAINT "package_day_subject_activities_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_location_slots" ADD CONSTRAINT "package_location_slots_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_location_slots" ADD CONSTRAINT "package_location_slots_event_day_template_id_fkey" FOREIGN KEY ("event_day_template_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_activity_assignments" ADD CONSTRAINT "location_activity_assignments_package_location_slot_id_fkey" FOREIGN KEY ("package_location_slot_id") REFERENCES "package_location_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_activity_assignments" ADD CONSTRAINT "location_activity_assignments_package_activity_id_fkey" FOREIGN KEY ("package_activity_id") REFERENCES "package_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_versions" ADD CONSTRAINT "package_versions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_task_overrides" ADD CONSTRAINT "package_task_overrides_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_sets" ADD CONSTRAINT "package_sets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_sets" ADD CONSTRAINT "package_sets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_package_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_sets" ADD CONSTRAINT "package_sets_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_set_slots" ADD CONSTRAINT "package_set_slots_package_set_id_fkey" FOREIGN KEY ("package_set_id") REFERENCES "package_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_set_slots" ADD CONSTRAINT "package_set_slots_service_package_id_fkey" FOREIGN KEY ("service_package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedule_templates" ADD CONSTRAINT "payment_schedule_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedule_rules" ADD CONSTRAINT "payment_schedule_rules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_payment_templates" ADD CONSTRAINT "crew_payment_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_payment_rules" ADD CONSTRAINT "crew_payment_rules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "crew_payment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_payment_rules" ADD CONSTRAINT "crew_payment_rules_task_library_id_fkey" FOREIGN KEY ("task_library_id") REFERENCES "task_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_payment_milestones" ADD CONSTRAINT "estimate_payment_milestones_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_categories" ADD CONSTRAINT "contract_clause_categories_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "contract_clause_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_payment_schedule_template_id_fkey" FOREIGN KEY ("payment_schedule_template_id") REFERENCES "payment_schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_clauses" ADD CONSTRAINT "contract_template_clauses_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_clauses" ADD CONSTRAINT "contract_template_clauses_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "contract_clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_requests" ADD CONSTRAINT "package_requests_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_equipment_reservations" ADD CONSTRAINT "inquiry_equipment_reservations_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_equipment_reservations" ADD CONSTRAINT "inquiry_equipment_reservations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

