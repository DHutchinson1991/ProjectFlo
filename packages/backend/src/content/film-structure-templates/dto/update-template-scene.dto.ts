import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateTemplateSceneDto {
    @IsNumber()
    @IsOptional()
    id?: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    mode?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    suggested_duration_seconds?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
