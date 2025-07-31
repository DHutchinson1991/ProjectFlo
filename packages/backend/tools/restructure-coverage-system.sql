-- Migration: Restructure Coverage System for Production Shots
-- Date: 2025-07-23
-- Description: Transform coverage from event-specific items to actual production shots and audio techniques

BEGIN;

-- First, let's backup existing data if we need to preserve any relationships
CREATE TABLE coverage_backup AS SELECT * FROM coverage;
CREATE TABLE scene_coverage_backup AS SELECT * FROM scene_coverage;

-- Drop existing coverage-related foreign key constraints
ALTER TABLE scene_coverage DROP CONSTRAINT IF EXISTS scene_coverage_coverage_id_fkey;
ALTER TABLE build_coverage_assignments DROP CONSTRAINT IF EXISTS build_coverage_assignments_coverage_id_fkey;
ALTER TABLE project_assets DROP CONSTRAINT IF EXISTS project_assets_coverage_id_fkey;
ALTER TABLE task_generation_rules DROP CONSTRAINT IF EXISTS task_generation_rules_coverage_id_fkey;
ALTER TABLE build_scenes DROP CONSTRAINT IF EXISTS build_scenes_coverage_id_fkey;

-- Drop the old coverage table
DROP TABLE IF EXISTS coverage CASCADE;
DROP TABLE IF EXISTS scene_coverage CASCADE;

-- Create new enum types for the restructured coverage system
CREATE TYPE coverage_type_enum AS ENUM ('VIDEO', 'AUDIO');
CREATE TYPE shot_type_enum AS ENUM (
    'WIDE_SHOT', 'MEDIUM_SHOT', 'CLOSE_UP', 'EXTREME_CLOSE_UP', 
    'OVER_SHOULDER', 'TWO_SHOT', 'ESTABLISHING_SHOT', 'DETAIL_SHOT',
    'REACTION_SHOT', 'CUTAWAY', 'INSERT_SHOT', 'MASTER_SHOT'
);
CREATE TYPE camera_movement_enum AS ENUM (
    'STATIC', 'PAN', 'TILT', 'ZOOM', 'TRACKING', 'DOLLY', 
    'GIMBAL_STABILIZED', 'HANDHELD', 'CRANE', 'DRONE', 'STEADICAM'
);
CREATE TYPE audio_equipment_enum AS ENUM (
    'LAPEL_MIC', 'HANDHELD_MIC', 'BOOM_MIC', 'SHOTGUN_MIC', 
    'AMBIENT_MIC', 'WIRELESS_MIC', 'RECORDER', 'MIXING_BOARD'
);

-- Create the new coverage table with production-focused structure
CREATE TABLE coverage (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    coverage_type coverage_type_enum NOT NULL,
    
    -- Video-specific fields
    shot_type shot_type_enum NULL,
    camera_movement camera_movement_enum NULL,
    lens_focal_length VARCHAR(50) NULL, -- e.g., "24-70mm", "85mm", "50mm"
    aperture VARCHAR(20) NULL, -- e.g., "f/2.8", "f/1.4"
    
    -- Audio-specific fields
    audio_equipment audio_equipment_enum NULL,
    audio_pattern VARCHAR(100) NULL, -- e.g., "Cardioid", "Omnidirectional", "Shotgun"
    frequency_response VARCHAR(100) NULL, -- e.g., "20Hz-20kHz", "80Hz-18kHz"
    
    -- Common fields
    operator_id INT NULL, -- Reference to contributors table for assigned operator
    subject VARCHAR(255) NULL, -- e.g., "Bride", "Groom", "Both", "All Guests", "Officiant"
    notes TEXT NULL,
    
    -- Equipment assignments (JSON for flexibility)
    equipment_assignments JSONB NULL,
    
    -- Workflow and template integration
    workflow_template_id INT NULL,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create new scene_coverage relationship table
CREATE TABLE scene_coverage (
    scene_id INT NOT NULL,
    coverage_id INT NOT NULL,
    
    -- Override fields for scene-specific customization
    custom_subject VARCHAR(255) NULL, -- Override the default subject for this scene
    custom_operator_id INT NULL, -- Override the default operator for this scene
    custom_notes TEXT NULL, -- Additional notes specific to this scene
    priority_order INT DEFAULT 0, -- Order priority within the scene
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (scene_id, coverage_id)
);

-- Create indexes for performance
CREATE INDEX idx_coverage_type ON coverage(coverage_type);
CREATE INDEX idx_coverage_shot_type ON coverage(shot_type);
CREATE INDEX idx_coverage_audio_equipment ON coverage(audio_equipment);
CREATE INDEX idx_coverage_operator ON coverage(operator_id);
CREATE INDEX idx_scene_coverage_scene ON scene_coverage(scene_id);
CREATE INDEX idx_scene_coverage_coverage ON scene_coverage(coverage_id);
CREATE INDEX idx_scene_coverage_priority ON scene_coverage(priority_order);

-- Add foreign key constraints
ALTER TABLE coverage 
ADD CONSTRAINT fk_coverage_operator 
FOREIGN KEY (operator_id) REFERENCES contributors(id) ON DELETE SET NULL;

ALTER TABLE coverage 
ADD CONSTRAINT fk_coverage_workflow_template 
FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates(id) ON DELETE SET NULL;

ALTER TABLE scene_coverage 
ADD CONSTRAINT fk_scene_coverage_scene 
FOREIGN KEY (scene_id) REFERENCES scenes_library(id) ON DELETE CASCADE;

ALTER TABLE scene_coverage 
ADD CONSTRAINT fk_scene_coverage_coverage 
FOREIGN KEY (coverage_id) REFERENCES coverage(id) ON DELETE CASCADE;

ALTER TABLE scene_coverage 
ADD CONSTRAINT fk_scene_coverage_custom_operator 
FOREIGN KEY (custom_operator_id) REFERENCES contributors(id) ON DELETE SET NULL;

-- Add check constraints for data integrity
ALTER TABLE coverage 
ADD CONSTRAINT check_video_fields 
CHECK (
    (coverage_type = 'VIDEO' AND shot_type IS NOT NULL) OR 
    (coverage_type = 'AUDIO' AND audio_equipment IS NOT NULL)
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coverage_updated_at 
BEFORE UPDATE ON coverage 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scene_coverage_updated_at 
BEFORE UPDATE ON scene_coverage 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
