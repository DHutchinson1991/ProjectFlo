import {
    IsString,
    IsOptional,
    MaxLength,
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
}
