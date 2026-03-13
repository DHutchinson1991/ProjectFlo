import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateMontagePresetDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    min_duration_seconds?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    max_duration_seconds?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
