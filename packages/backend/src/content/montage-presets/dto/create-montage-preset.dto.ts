import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean, Min } from 'class-validator';

export class CreateMontagePresetDto {
    @IsNumber()
    @IsOptional()
    brand_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(1)
    min_duration_seconds: number;

    @IsNumber()
    @Min(1)
    max_duration_seconds: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
