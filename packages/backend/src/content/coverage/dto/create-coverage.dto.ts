import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsObject,
    IsArray,
} from "class-validator";
import {
    CoverageType,
    AudioEquipment,
    CameraMovement,
    ShotType,
    VideoStyleType
} from "@prisma/client";

export class CreateCoverageDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(CoverageType)
    coverage_type: CoverageType;

    // Video specific
    @IsOptional()
    @IsEnum(ShotType)
    shot_type?: ShotType;

    @IsOptional()
    @IsEnum(CameraMovement)
    camera_movement?: CameraMovement;

    @IsOptional()
    @IsString()
    lens_focal_length?: string;

    @IsOptional()
    @IsString()
    aperture?: string;

    @IsOptional()
    @IsEnum(VideoStyleType)
    video_style_type?: VideoStyleType;

    // Audio specific
    @IsOptional()
    @IsEnum(AudioEquipment)
    audio_equipment?: AudioEquipment;

    @IsOptional()
    @IsString()
    audio_pattern?: string;

    @IsOptional()
    @IsString()
    frequency_response?: string;

    // Common
    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsBoolean()
    is_template?: boolean;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    // Relationships
    @IsOptional()
    @IsNumber()
    operator_id?: number;

    @IsOptional()
    @IsNumber()
    job_role_id?: number;

    @IsOptional()
    @IsNumber()
    workflow_template_id?: number;

    // JSON Fields
    @IsOptional()
    equipment_assignments?: any;

    @IsOptional()
    @IsArray()
    resource_requirements?: any;
    
    @IsOptional()
    recording_equipment?: any;
}
