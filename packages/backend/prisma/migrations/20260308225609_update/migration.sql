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
ALTER TABLE "project_film_subjects" ADD CONSTRAINT "project_film_subjects_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "subject_role_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
