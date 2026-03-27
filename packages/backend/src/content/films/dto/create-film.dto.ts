import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsInt,
    Min,
} from "class-validator";

// Re-export for backwards compatibility
export { UpdateEquipmentDto } from './update-equipment.dto';

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
