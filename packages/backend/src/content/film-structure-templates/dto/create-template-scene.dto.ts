import { IsString, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateTemplateSceneDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    mode?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    suggested_duration_seconds?: number;

    @IsNumber()
    @Min(0)
    order_index: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
