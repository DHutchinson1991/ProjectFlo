import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsInt,
    Min,
    IsBoolean,
} from "class-validator";

/**
 * DTO for creating a new film with equipment configuration
 * Uses refactor v2 schema (Film + FilmTimelineTrack models)
 */
export class CreateFilmDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsInt()
    @IsNotEmpty()
    brand_id: number;

    @IsOptional()
    @IsString()
    film_type?: string; // FilmType: ACTIVITY | FEATURE | MONTAGE | RAW_FOOTAGE

    @IsOptional()
    @IsInt()
    montage_preset_id?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    target_duration_min?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    target_duration_max?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    num_cameras?: number; // Auto-generates Camera 1, 2, 3...

    @IsOptional()
    @IsInt()
    @Min(0)
    num_audio?: number; // Auto-generates Audio 1, 2...
}

/**
 * DTO for updating equipment configuration on existing film
 */
export class UpdateEquipmentDto {
    @IsOptional()
    @IsInt()
    @Min(0)
    num_cameras?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    num_audio?: number;

    @IsOptional()
    @IsBoolean()
    allow_removal?: boolean;
}
