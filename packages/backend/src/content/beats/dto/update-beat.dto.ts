import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateBeatDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    shot_count?: number | null;

    @IsNumber()
    @IsOptional()
    @Min(1)
    duration_seconds?: number | null;
}
