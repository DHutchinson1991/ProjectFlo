-- Migration: Add Subjects System
-- This adds project-level subjects with scene assignments and coverage integration

-- Create subjects table for project-level subject management
CREATE TABLE "subjects" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "role_context" VARCHAR(255), -- e.g., "Father of the Bride", "Maid of Honor"
  "priority_level" INTEGER NOT NULL DEFAULT 3, -- 1 = highest (bride/groom), 5 = lowest (background)
  "appearance_notes" TEXT, -- Hair color, style, skin tone, distinguishing features
  "additional_notes" TEXT, -- Any other relevant information
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT "fk_subjects_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

-- Create scene_subjects junction table for many-to-many relationship
CREATE TABLE "scene_subjects" (
  "id" SERIAL PRIMARY KEY,
  "scene_id" INTEGER NOT NULL,
  "subject_id" INTEGER NOT NULL,
  "is_primary_focus" BOOLEAN NOT NULL DEFAULT false, -- Is this subject the main focus in this scene?
  "scene_importance" INTEGER DEFAULT 3, -- Subject importance specific to this scene
  "scene_notes" TEXT, -- Scene-specific notes about this subject
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT "fk_scene_subjects_scene" FOREIGN KEY ("scene_id") REFERENCES "scenes_library"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_scene_subjects_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE,
  
  -- Ensure unique combinations
  CONSTRAINT "uk_scene_subjects" UNIQUE ("scene_id", "subject_id")
);

-- Add indexes for performance
CREATE INDEX "idx_subjects_project_id" ON "subjects"("project_id");
CREATE INDEX "idx_subjects_priority" ON "subjects"("priority_level");
CREATE INDEX "idx_subjects_active" ON "subjects"("is_active");
CREATE INDEX "idx_scene_subjects_scene_id" ON "scene_subjects"("scene_id");
CREATE INDEX "idx_scene_subjects_subject_id" ON "scene_subjects"("subject_id");
CREATE INDEX "idx_scene_subjects_primary_focus" ON "scene_subjects"("is_primary_focus");

-- Add a subject_id foreign key to coverage table to link coverage to specific subjects
-- First, let's see what the coverage table is called by checking existing foreign keys
-- This will be added in the schema.prisma update

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_subjects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subjects_timestamp
  BEFORE UPDATE ON "subjects"
  FOR EACH ROW
  EXECUTE FUNCTION update_subjects_timestamp();

CREATE OR REPLACE FUNCTION update_scene_subjects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scene_subjects_timestamp
  BEFORE UPDATE ON "scene_subjects"
  FOR EACH ROW
  EXECUTE FUNCTION update_scene_subjects_timestamp();
