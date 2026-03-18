import {
    IsString,
    IsOptional,
    MaxLength,
    IsInt,
    Min,
} from "class-validator";

/**
 * DTO for updating film details
 * Uses refactor v2 schema (Film model)
 */
export class UpdateFilmDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    film_type?: string;

    @IsOptional()
    @IsInt()
    montage_preset_id?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    target_duration_min?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    target_duration_max?: number | null;
}
